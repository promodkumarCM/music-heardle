import express from 'express'
import { randomBytes, randomUUID, randomInt } from 'node:crypto'

// Lyrics supplied by the user. Each entry is a section, not a generated lyric.
import { pool } from './db.js'
import { puzzle, canMakePuzzle, difficulties } from './lyricsPuzzle.js'
export { puzzle } from './lyricsPuzzle.js'
const rooms = new Map()
const normalize = value => value.normalize('NFC').replace(/[\u200c\u200d]/g, '').replace(/[^\p{L}\p{M}\p{N}]/gu, '')
function blanks(room) { return room.sections.flat().filter(word => word.id !== undefined) }
function score(team) { return Object.values(team.answers).filter(answer => answer.correct).length * 10 }
function pendingReveal(room) { return room.mode==='host' ? blanks(room).find(w=>room.revealed.has(w.id)&&room.teams.some(t=>!t.answers[w.id]))?.id : undefined }
function view(room, identity) {
  const host = room.mode === 'host'
  const team = room.teams[identity.team]
  const answers = team?.answers || {}
  return { code: room.code, mode: room.mode, team: identity.team, round: room.round, difficulty: room.difficulty,
    sections: room.sections.map(section => section.map(word => word.id === undefined ? word : { id: word.id, text: host ? (room.revealed.has(word.id) ? word.text : null) : answers[word.id] ? word.text : null })),
    teams: room.teams.map(t => ({ name: t.name, joined: !!t.token, score: score(t), finished: Object.keys(t.answers).length === blanks(room).length })),
    answers: host ? room.teams.map(t => t.answers) : answers,
    maxPoints: blanks(room).length * 10,
    pendingWord: pendingReveal(room) ?? null,
    skipVotes: room.skipVotes || [],
    ready: host || room.teams.every(t => t.token),
  }
}
const router = express.Router()
router.use(async (req,res,next)=>{
  if(req.method!=='POST'||!((req.path==='/rooms')||req.body?.action==='next'||req.body?.action==='skip'))return next()
  try { const [rows]=await pool.query('SELECT id, sections FROM lyric_songs ORDER BY id'); req.catalog=rows.map(row=>({...row,sections:typeof row.sections==='string'?JSON.parse(row.sections):row.sections})).filter(song=>canMakePuzzle(song.sections)); if(!req.catalog.length)return res.status(503).json({error:'No songs with 10 unique Malayalam words available. Add lyrics in Admin.'}); next() } catch {res.status(503).json({error:'Lyrics catalog unavailable.'})}
})
router.use((req,res,next) => { res.set('Cache-Control','no-store'); next() })
router.post('/rooms', (req,res) => {
  if (rooms.size >= 500) return res.status(503).json({error:'Rooms are full. Try later.'})
  const difficulty = req.body.difficulty ?? 'easy'
  if (!difficulties.includes(difficulty)) return res.status(400).json({error:'Choose Easy, Medium, or Hard.'})
  const mode = req.body.mode === 'host' ? 'host' : 'online'
  let code
  do { code = randomBytes(3).toString('hex').toUpperCase() } while (rooms.has(code))
  const token = randomUUID()
  const selectedSong=req.catalog[randomInt(req.catalog.length)]
  const songIndex=selectedSong.id
  const room = { code, mode, difficulty, songIndex, hostToken: mode === 'host' ? token : null, sections:puzzle(selectedSong.sections,difficulty), revealed:new Set(), round:1, expires:Date.now()+6*60*60*1000,
    teams: ['Team A','Team B'].map((name,i)=>({name, answers:{}, tokens:mode==='online'&&i===0?[token]:[], token:mode==='online'&&i===0?token:null})) }
  rooms.set(code,room)
  res.status(201).json({token, ...view(room,{team:0})})
})
router.post('/rooms/:code/join',(req,res)=>{
  const room=rooms.get(req.params.code.toUpperCase())
  if(!room||room.expires<Date.now())return res.status(404).json({error:'Room not found or expired.'})
  if(room.mode!=='online')return res.status(409).json({error:'This room is not available to join.'})
  const team=req.body.team===0?0:1
  const token=randomUUID();room.teams[team].tokens.push(token);room.teams[team].token ||= token
  res.json({token,...view(room,{team})})
})
router.use('/rooms/:code',(req,res,next)=>{
  const room=rooms.get(req.params.code.toUpperCase())
  if(!room||room.expires<Date.now())return res.status(404).json({error:'Room expired. Create a new room.'})
  const token=req.get('Authorization')?.replace(/^Bearer /,'')
  const team=room.teams.findIndex(t=>t.tokens.includes(token))
  if(!(room.mode==='host'&&token===room.hostToken)&&team<0)return res.status(403).json({error:'Join this room first.'})
  req.room=room;req.identity={team:Math.max(0,team)};next()
})
router.get('/rooms/:code',(req,res)=>res.json(view(req.room,req.identity)))
router.post('/rooms/:code/action',(req,res)=>{
  const room=req.room, {action,id,guess,team:teamIndex,correct,round}=req.body
  if(round!==room.round)return res.status(409).json({error:'The round changed. Try again.'})
  if(action==='next'||action==='skip') {
    if(action==='skip'&&room.mode==='online') {
      if(!room.teams.every(t=>t.token))return res.status(409).json({error:'Wait for both teams to join.'})
      room.skipVotes ||= []
      if(!room.skipVotes.includes(req.identity.team))room.skipVotes.push(req.identity.team)
      if(room.skipVotes.length<2)return res.json(view(room,req.identity))
    }
    if(action==='next'&&!room.teams.every(t=>Object.keys(t.answers).length===blanks(room).length))return res.status(409).json({error:'Both teams must finish first.'})
    room.skipVotes=[]
    const selectedSong=req.catalog.find(song=>song.id>room.songIndex)||req.catalog[0]
    room.songIndex=selectedSong.id
    room.sections=puzzle(selectedSong.sections,room.difficulty);room.revealed.clear();room.teams.forEach(t=>t.answers={});room.round++
  } else {
    const pending=pendingReveal(room)
    if(room.mode==='host' && pending!==undefined && !['mark','neither'].includes(action))return res.status(409).json({error:'Choose who answered the revealed word first.'})
    if(room.mode==='host' && ['mark','neither'].includes(action) && id!==pending)return res.status(409).json({error:'Reveal a word first, then choose its winner.'})
    if(room.mode==='online'&&!room.teams.every(t=>t.token))return res.status(409).json({error:'Wait for the other team to join.'})
    const team=room.teams[room.mode==='host'?teamIndex:req.identity.team]
    if(action==='neither') {
      if(room.mode!=='host')return res.status(403).json({error:'Host only.'})
      room.teams.forEach(t=>{t.answers[id] ||= {correct:false,kind:'missed'}})
    } else if(action==='guess'||action==='mark') {
      const word=blanks(room).find(w=>w.id===id)
      if(!word||!team||team.answers[id])return res.status(409).json({error:'This word has already been settled or is invalid.'})
      if(action==='mark'&&room.mode!=='host')return res.status(403).json({error:'Manual marking is only for host mode.'})
      if(action==='guess'&&(typeof guess!=='string'||!normalize(guess)||guess.length>150))return res.status(400).json({error:'Enter a word.'})
      team.answers[id]={correct:action==='mark'?correct===true:normalize(guess)===normalize(word.text),kind:action}
      if(room.mode==='host' && team.answers[id].correct) {
        room.revealed.add(id)
        room.teams.forEach(other=>{if(other!==team)other.answers[id] ||= {correct:false,kind:'claimed'}})
      }
    } else if(action==='revealWord') {
      if(room.mode!=='host')return res.status(403).json({error:'Host preview only.'})
      if(!blanks(room).some(word=>word.id===id))return res.status(400).json({error:'Unknown word.'})
      room.revealed.add(id)
    } else if(action==='reveal'||action==='revealAll') {
      if(room.mode==='host'&&action==='revealAll')return res.status(400).json({error:'Reveal one word and choose its winner before continuing.'})
      const pending=blanks(room).filter(w=>room.mode==='host'?!room.revealed.has(w.id):!team.answers[w.id])
      for(const word of action==='reveal'?pending.slice(0,1):pending) {
        if(room.mode==='host'){room.revealed.add(word.id)}
        else team.answers[word.id]={correct:false,kind:'reveal'}
      }
    } else return res.status(400).json({error:'Unknown action.'})
  }
  res.json(view(room,req.identity))
})
setInterval(()=>{for(const [code,room] of rooms)if(room.expires<Date.now())rooms.delete(code)},60000).unref()
export default router
