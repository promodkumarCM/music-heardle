import {expandDialogues} from './dialogueVariants.js'
import express from 'express'
import {randomBytes,randomUUID,randomInt} from 'node:crypto'
import {pool} from './db.js'
import {puzzle,canMakePuzzle,difficulties} from './lyricsPuzzle.js'
import {fail,partyAction,partyView,expireParty,chooseWord,beginQuestion} from './partyEngine.js'

const router=express.Router(),rooms=new Map()
const parse=x=>typeof x==='string'?JSON.parse(x):x
async function catalog(game) {
  const queries={characters:'SELECT id,movie,actor_name,actor_image_url,character_name,character_english,role,aliases FROM character_puzzles',pictures:'SELECT id,movie,image_url,mobile_image_url FROM picture_puzzles',lyrics:'SELECT id,title,sections FROM lyric_songs',dialogue:'SELECT id,movie,dialogue,dialogue_english,dialogue_variants FROM dialogues',clues:'SELECT id,movie,clues FROM movie_puzzles',song:'SELECT id,title,movie,youtube_id FROM songs'}
  if(!Object.hasOwn(queries,game))fail('Choose a game.',400)
  let rows
  try{[rows]=await pool.query(queries[game])}catch(error){if(game==='characters'&&error.code==='ER_NO_SUCH_TABLE')fail('Character Files is not set up yet. Ask the admin to finish setting up this game.',503);throw error}
  const usable=game==='lyrics'?rows.filter(r=>canMakePuzzle(parse(r.sections))):game==='dialogue'?expandDialogues(rows):rows
  if(!usable.length)fail('No content available for this game.',503)
  return usable
}
function next(room) {
  room.actorRevealed=false
  room.index=(room.index+1)%room.catalog.length
  const row=room.catalog[room.index]
  room.content=room.game==='characters'?{actor:row.actor_name||'',actorImage:row.actor_image_url||'',name:row.character_name,english:row.character_english||'',role:row.role}:room.game==='lyrics'?puzzle(parse(row.sections),room.difficulty):room.game==='pictures'?row.image_url:room.game==='clues'?parse(row.clues):room.game==='dialogue'?row.dialogue:row.youtube_id
  room.answer=room.game==='song'?`${row.title} — ${row.movie}`:row.movie
  room.target=room.game==='song'?row.title:row.movie
  room.mobileImage=row.mobile_image_url||null;room.dialogueEnglish=room.game==='dialogue'?(row.dialogue_english||''):'';room.active=null;room.settled={};room.clue=1;room.notice='';room.round++
  if(room.game==='lyrics')chooseWord(room)
  beginQuestion(room)
}
const wrap=fn=>async(req,res)=>{try{await fn(req,res)}catch(e){res.status(e.status||503).json({error:e.status?e.message:'Game service unavailable.'})}}
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next()})
router.post('/rooms',wrap(async(req,res)=>{
  const {mode,game,teams,seconds=15,difficulty='easy',name='Player 1'}=req.body
  if(!['host','buzzer','solo'].includes(mode)||!difficulties.includes(difficulty)||!Number.isInteger(seconds)||seconds<5||seconds>120)fail('Choose a valid mode, difficulty, and 5–120 second timer.',400)
  if(game==='characters'&&!['easy','hard'].includes(difficulty))fail('Choose Easy or Hard for Character Files.',400)
  if(typeof name!=='string'||!name.trim()||name.length>30)fail('Enter your name (up to 30 characters).',400)
  if(mode==='host'&&(!Array.isArray(teams)||teams.length<2||teams.length>8||teams.some(n=>typeof n!=='string'||!n.trim()||n.length>30)||new Set(teams.map(n=>n.trim().toLowerCase())).size!==teams.length))fail('Enter 2–8 unique team names.',400)
  if(rooms.size>=500)fail('Rooms are full. Try later.',503)
  const rows=await catalog(game)
  const [aliases]=await pool.query('SELECT movie,aliases FROM dialogues')
  const movieCatalog=[...new Set(rows.map(r=>r.movie).filter(Boolean))].map(movie=>({movie,aliases:[...aliases.filter(r=>r.movie===movie).flatMap(r=>parse(r.aliases)||[]),...rows.filter(r=>r.movie===movie).flatMap(r=>parse(r.aliases)||[])]}))
  let code;do{code=randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(code))
  const player={id:randomUUID(),token:randomUUID(),name:name.trim(),team:0}
  const room={code,mode,game,difficulty,seconds,catalog:rows,movieCatalog,index:randomInt(rows.length)-1,round:0,version:0,creator:player.id,players:[player],teams:(mode==='host'?teams:[player.name]).map(name=>({name:name.trim(),score:0})),expires:Date.now()+21600000}
  next(room);if(mode==='buzzer')room.phase='lobby'
  rooms.set(code,room);res.status(201).json({token:player.token,...partyView(room,player)})
}))
router.post('/rooms/:code/join',wrap(async(req,res)=>{
  const room=rooms.get(req.params.code.toUpperCase())
  if(!room||room.expires<Date.now())fail('Room expired or not found.',404)
  if(room.mode!=='buzzer'||room.phase!=='lobby')fail('This room is not accepting players.')
  const {name}=req.body
  if(typeof name!=='string'||!name.trim()||name.length>30)fail('Enter your name (up to 30 characters).',400)
  if(room.players.some(p=>p.name.toLowerCase()===name.trim().toLowerCase()))fail('That name is already in use.')
  if(room.players.length>=20)fail('Room is full.')
  const player={id:randomUUID(),token:randomUUID(),name:name.trim(),team:room.teams.length}
  room.players.push(player);room.teams.push({name:player.name,score:0});room.version++
  res.json({token:player.token,...partyView(room,player)})
}))
router.use('/rooms/:code',(req,res,nextMiddleware)=>{
  const room=rooms.get(req.params.code.toUpperCase()),token=req.get('Authorization')?.replace(/^Bearer /,'')
  if(!room||room.expires<Date.now())return res.status(404).json({error:'Room expired. Start a new game.'})
  const player=room.players.find(p=>p.token===token)
  if(!player)return res.status(403).json({error:'Join this room first.'})
  req.room=room;req.player=player;nextMiddleware()
})
router.get('/rooms/:code',(req,res)=>res.json(partyView(req.room,req.player)))
router.post('/rooms/:code/action',wrap(async(req,res)=>{
  const r=req.room,p=req.player,{action,version}=req.body
  if(action==='next'||action==='game') {
    expireParty(r)
    if(version!==r.version)fail('The round changed. Try again.')
    if(r.mode==='host'&&p.id!==r.creator)fail('Host only.',403)
    if(r.phase!=='settled'||r.game==='lyrics'&&Object.keys(r.settled).length!==10)fail('Finish the round first.')
    if(action==='game') {
      if(p.id!==r.creator)fail('Only the room creator can change games.',403)
      const rows=await catalog(req.body.game)
      if(version!==r.version)fail('The round changed. Try again.')
      r.game=req.body.game;r.catalog=rows;r.movieCatalog=[...new Set(rows.map(row=>row.movie).filter(Boolean))].map(movie=>({movie,aliases:rows.filter(row=>row.movie===movie).flatMap(row=>parse(row.aliases)||[])}));r.index=-1
    }
    next(r);r.version++
  } else partyAction(r,p,req.body)
  res.json(partyView(r,p))
}))
setInterval(()=>{for(const [code,r] of rooms){if(r.expires<Date.now())rooms.delete(code);else expireParty(r)}},250).unref()
export default router
