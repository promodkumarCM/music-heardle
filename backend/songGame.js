import {drawStock,stockKey} from './stock.js'
import {Router} from 'express'
import {randomUUID} from 'node:crypto'
import {pool} from './db.js'
import {normalizeMovie} from './movieMatching.js'
const router=Router(),rounds=new Map(),limits=new Map(),stocks=new Map()
const durations={9:1,7:3,5:5,3:8,1:12}
router.use((req,res,next)=>{res.set('Cache-Control','no-store');const now=Date.now(),key=req.ip;let rate=limits.get(key);if(!rate||now-rate.start>60000){rate={start:now,n:0};limits.set(key,rate)}if(++rate.n>120)return res.status(429).json({error:'Too many requests. Please wait a minute.'});next()})
const view=r=>({id:r.token,youtubeId:r.youtube_id,status:r.status,...(r.status!=='active'?{title:r.title,movie:r.movie,points:r.points,timeMs:r.timeMs,scoreSaved:r.scoreSaved}: {})})
router.post('/queue',async(req,res)=>{
 const year=Number(req.body.afterYear||0)
 if(![0,1990,1995,2000,2005,2010,2015,2020,2025].includes(year))return res.status(400).json({error:'Invalid year filter.'})
 if(rounds.size>10000)return res.status(503).json({error:'Please try again later.'})
 try{
  const [rows]=await pool.query('SELECT id,title,movie,youtube_id FROM songs WHERE (? = 0 OR release_year > ?)',[year,year])
  const excluded=new Set((Array.isArray(req.body.exclude)?req.body.exclude.slice(0,30):[]).map(t=>rounds.get(t)?.id))
  const session=typeof req.body.session==='string'?req.body.session.slice(0,100):null
  if(session&&!stocks.has(session)&&stocks.size>=5000)return res.status(503).json({error:'Please try again shortly.'})
  const stock=(session&&stocks.get(session))||{used:new Set()}
  for(const row of rows)if(excluded.has(row.id))stock.used.add(stockKey(row))
  stock.expires=Date.now()+7200000
  if(session)stocks.set(session,stock)
  const limit=Number.isInteger(req.body.limit)&&req.body.limit>=1&&req.body.limit<=6?req.body.limit:6
  stock.tokens??=[]
  const excludedTokens=new Set(Array.isArray(req.body.exclude)?req.body.exclude:[])
  const pending=stock.tokens.map(token=>rounds.get(token)).filter(round=>round&&round.status==='active'&&!round.started&&!excludedTokens.has(round.token))
  const result=pending.slice(0,limit).map(view)
  while(result.length<limit){const row=drawStock(rows,stock);if(!row)break;const r={...row,afterYear:year,token:randomUUID(),status:'active',points:0,timeMs:0,started:null,weight:9,expires:Date.now()+7200000,scoreSaved:false};rounds.set(r.token,r);stock.tokens.push(r.token);result.push(view(r))}
  res.json(result)
 }catch{res.status(503).json({error:'Could not load songs.'})}
})
router.post('/:token/suggestions',async(req,res)=>{
 const round=rounds.get(req.params.token)
 if(!round||round.expires<Date.now())return res.status(410).json({error:'This round expired. Start another song.'})
 const query=req.body?.query
 if(typeof query!=='string'||query.length>255)return res.status(400).json({error:'Enter a song name.'})
 const q=query.trim().normalize('NFKC')
 if(q.length<2)return res.json({titles:[]})
 try {
  // Suggestions depend on the typed query and year filter, never the answer.
  const [rows]=await pool.query('SELECT DISTINCT title FROM songs WHERE (? = 0 OR release_year > ?) AND LOCATE(LOWER(?), LOWER(title)) > 0 ORDER BY (LOCATE(LOWER(?), LOWER(title)) = 1) DESC, title LIMIT 8',[round.afterYear,round.afterYear,q,q])
  res.json({titles:rows.map(row=>row.title)})
 }catch{res.status(503).json({error:'Song suggestions unavailable. You can still type an answer.'})}
})
router.post('/:token/:action',async(req,res)=>{
 const r=rounds.get(req.params.token),action=req.params.action
 if(!r||r.expires<Date.now())return res.status(410).json({error:'This round expired. Start another song.'})
 if(!['play','guess','reveal','skip'].includes(action))return res.sendStatus(404)
 if(r.status==='settling')return res.status(409).json({error:'Answer is being saved. Please wait.'})
 if(r.status!=='active')return res.json(view(r))
 if(action==='play'){
  const weight=Number(req.body.weight);if(!Object.hasOwn(durations,weight))return res.status(400).json({error:'Invalid difficulty.'})
  r.started??=Date.now();r.weight=Math.min(r.weight,weight)
  return res.json({...view(r),seconds:durations[weight]})
 }
 if(action==='skip'){r.status='skipped';return res.json({id:r.token,status:r.status,points:0})}
 const guess=req.body.guess
 if(action==='guess'&&(typeof guess!=='string'||!guess.trim()||guess.length>255))return res.status(400).json({error:'Enter a song name.'})
 if(action==='guess'&&!r.started)return res.status(400).json({error:'Play the clip before guessing.'})
 const correct=action==='guess'&&normalizeMovie(guess)===normalizeMovie(r.title)
 r.timeMs=r.started?Date.now()-r.started:0;r.points=correct?r.weight*20:0
 const status=action==='reveal'?'revealed':correct?'correct':'wrong'
 r.status='settling'
 if(correct&&typeof req.body.playerName==='string'&&req.body.playerName.trim()){
  try{await pool.query('INSERT INTO scores (player_name,level,time_ms) VALUES (?,?,?)',[req.body.playerName.trim().slice(0,24),r.weight,r.timeMs]);r.scoreSaved=true}catch{r.scoreSaved=false}
 }
 r.status=status;res.json(view(r))
})
setInterval(()=>{const now=Date.now();for(const [key,r] of rounds)if(r.expires<now)rounds.delete(key);for(const [key,r] of limits)if(now-r.start>60000)limits.delete(key);for(const [key,r] of stocks)if(r.expires<now)stocks.delete(key)},60000).unref()
export default router
