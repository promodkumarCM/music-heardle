import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { pool } from './db.js'
import { matchMovie } from './movieMatching.js'
const router = Router()
const rounds = new Map()
const parse = value => typeof value === 'string' ? JSON.parse(value) : value
const snapshot = round => ({ token: round.token, puzzleId: round.id, clues: round.clues.slice(0, round.count), availablePoints: (6-round.count)*20, status: round.status, ...(round.status !== 'active' ? {movie: round.movie, points: round.points} : {}) })
router.post('/start', async (req,res) => {
  try {
    for (const [key,value] of rounds) if(value.expires < Date.now()) rounds.delete(key)
    if(rounds.size >= 5000) return res.status(503).json({error:'Please try again shortly.'})
    const [rows] = await pool.query('SELECT id, movie, aliases, clues FROM movie_puzzles')
    const valid = rows.map(row=>({...row,clues:parse(row.clues),aliases:parse(row.aliases)})).filter(row=>row.clues.length===5)
    const candidates=valid.filter(row=>row.id!==req.body?.previousId)
    const list=candidates.length?candidates:valid
    if(!list.length) return res.status(503).json({error:'No movie puzzles available yet.'})
    const [other] = await pool.query('SELECT DISTINCT movie FROM songs')
    const row=list[Math.floor(Math.random()*list.length)]
    const catalog=[...valid,...other.filter(s=>!valid.some(v=>v.movie===s.movie)).map(s=>({...s,aliases:[]}))]
    const round={...row,token:randomUUID(),count:1,status:'active',points:0,catalog,expires:Date.now()+2*60*60*1000}
    rounds.set(round.token,round)
    res.json(snapshot(round))
  } catch(error) { console.error(error.message);res.status(503).json({error:'Could not start a puzzle. Please try again.'}) }
})
router.post('/:token/:action', (req,res) => {
  const round=rounds.get(req.params.token)
  if(!round||round.expires<Date.now()) return res.status(410).json({error:'This round expired. Start a new movie.'})
  const action=req.params.action
  if(!['next','guess','reveal'].includes(action)) return res.status(404).json({error:'Unknown action.'})
  if(round.status!=='active') return res.json(snapshot(round))
  if(action==='next') round.count=Math.min(5,round.count+1)
  if(action==='reveal') {
    if(round.count<5) return res.status(400).json({error:'Open all five clues before revealing the movie.'})
    round.status='revealed'
  }
  if(action==='guess') {
    const guess=req.body?.guess
    if(typeof guess!=='string'||!guess.trim()||guess.length>255) return res.status(400).json({error:'Enter a movie name.'})
    if(matchMovie(guess,round.movie,round.catalog).correct) {round.status='correct';round.points=(6-round.count)*20}
    else return res.json({...snapshot(round),incorrect:true})
  }
  res.json(snapshot(round))
})
export default router
