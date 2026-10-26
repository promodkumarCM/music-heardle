import {expandDialogues} from './dialogueVariants.js'
import express from 'express'
import {randomBytes,randomUUID,randomInt} from 'node:crypto'
import {pool} from './db.js'
import {puzzle} from './lyricsGame.js'

const rooms=new Map(), router=express.Router()
const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status})}
const parse=x=>typeof x==='string'?JSON.parse(x):x
export function expireAnswer(room,now=Date.now()){
 if(room.phase==='answering'&&now>=room.deadline){room.blocked.push(room.winner.team);room.phase='closed';room.winner=null;room.deadline=null;room.notice='Time expired. Reopen for remaining teams or reveal.';room.version++}
}
export function action(room,host,player,body,now=Date.now()){
 expireAnswer(room,now)
 if(body.version!==room.version)fail('The room changed. Please try again.')
 const a=body.action
 if(a==='buzz'){
  if(host||!player||player.team===null||room.phase!=='open'||room.blocked.includes(player.team))fail('Buzzer is not available.')
  room.winner={team:player.team,name:player.name};room.phase='answering';room.deadline=now+room.seconds*1000
 }else{
  if(!host)fail('Host only.',403)
  if(a==='start'){
   if(room.phase!=='lobby'||room.players.some(p=>p.team===null)||!room.teams.every((_,i)=>room.players.some(p=>p.team===i)))fail('Assign all players; each team needs at least one player.')
   room.phase='closed';room.locked=true
  }else if(a==='lock'){room.locked=!room.locked}
  else if(a==='assign'||a==='remove'){
   if(room.phase!=='lobby')fail('Teams can only change in the lobby.')
   const p=room.players.find(p=>p.id===body.player);if(!p)fail('Player not found.')
   if(a==='remove')room.players=room.players.filter(x=>x!==p)
   else{if(!Number.isInteger(body.team)||body.team<0||body.team>=room.teams.length)fail('Choose a team.');if(room.players.filter(x=>x!==p&&x.team===body.team).length>=room.limit)fail('Team is full.');p.team=body.team}
  }else if(a==='select'){
   if(room.game!=='lyrics'||!['closed','settled'].includes(room.phase))fail('Close the current question first.')
   if(room.phase==='closed'&&room.active!==null&&!room.settled[room.active])fail('Finish or reveal the current word first.')
   if(!room.content.flat().some(w=>w.id===body.id)||room.settled[body.id])fail('Choose an unanswered word.')
   room.active=body.id;room.blocked=[];room.phase='closed';room.undo=null
  }else if(a==='open'){
   if(room.phase!=='closed'||(room.game==='lyrics'&&room.active===null)||room.blocked.length>=room.teams.length)fail('Select a question with eligible teams.')
   room.phase='open'
  }else if(a==='close'){
   if(room.phase!=='open')fail('Buzzer is not open.');room.phase='closed'
  }else if(a==='mark'){
   if(room.phase!=='answering'||typeof body.correct!=='boolean')fail('There is no answer to mark.')
   room.undo=structuredClone({teams:room.teams,settled:room.settled,blocked:room.blocked,phase:'closed',winner:null,deadline:null})
   if(body.correct){room.teams[room.winner.team].score+=room.game==='lyrics'?10:room.game==='clues'?120-room.clue*20:100;room.settled[room.active??0]=true;room.phase='settled'}
   else{room.blocked.push(room.winner.team);room.phase='closed'}
   room.winner=null;room.deadline=null
  }else if(a==='reveal'){
   if(!['closed','open'].includes(room.phase)||(room.game==='lyrics'&&room.active===null))fail('Finish the current answer first.')
   room.undo=structuredClone({teams:room.teams,settled:room.settled,blocked:room.blocked,phase:'closed',winner:null,deadline:null})
   room.settled[room.active??0]=true;room.phase='settled'
  }else if(a==='undo'){
   if(!room.undo||!['closed','settled'].includes(room.phase))fail('No decision to undo.');Object.assign(room,room.undo);room.undo=null
  }else if(a==='clue'){
   if(room.game!=='clues'||room.phase!=='closed'||room.clue>=5)fail('Close buzzing before opening the next clue.')
   room.clue++;room.undo=null
  }else fail('Unknown action.',400)
 }
 room.notice=a==='mark'?(body.correct?'Correct answer!':'Wrong answer. Reopen for remaining teams.'):'';room.version++
}
async function catalog(game){
 if(game==='buzzer')return [{id:0}]
 const queries={pictures:'SELECT id,movie,image_url,mobile_image_url FROM picture_puzzles',lyrics:'SELECT id,title,sections FROM lyric_songs',dialogue:'SELECT id,movie,dialogue,dialogue_english,dialogue_variants FROM dialogues',clues:'SELECT id,movie,clues FROM movie_puzzles',song:'SELECT id,title,movie,youtube_id,release_year FROM songs'}
 if(!Object.hasOwn(queries,game))fail('Choose a game.',400)
 const [rows]=await pool.query(queries[game]);if(!rows.length)fail('This catalog is empty.',503);return game==='dialogue'?expandDialogues(rows):rows
}
function next(room){
 room.index=(room.index+1)%room.catalog.length;const row=room.catalog[room.index]
 room.content=room.game==='pictures'?row.image_url:room.game==='lyrics'?puzzle(parse(row.sections)):room.game==='clues'?parse(row.clues):room.game==='dialogue'?row.dialogue:row.youtube_id
 if(room.game==='buzzer')room.content='Listen to your host’s question, then buzz when the buzzer opens.'
 room.answer=room.game==='song'?`${row.title} — ${row.movie}`:row.movie
 room.mobileImage=room.game==='pictures'?row.mobile_image_url:null;
 room.dialogueEnglish=room.game==='dialogue'?(row.dialogue_english||''):'';room.active=null;room.settled={};room.blocked=[];room.winner=null;room.deadline=null;room.undo=null;room.clue=1;room.phase='closed';room.round++;room.notice=''
}
function view(room,host,player){
 expireAnswer(room)
 const answer=room.game==='lyrics'?room.content.flat().find(w=>w.id===room.active)?.text:room.answer
 const content=room.game==='lyrics'?room.content.map(s=>s.map(w=>w.id===undefined?w:{id:w.id,text:room.settled[w.id]?w.text:null})):room.game==='clues'?room.content.slice(0,room.clue):room.game==='song'?(host?room.content:null):room.content
 return {code:room.code,host,game:room.game,afterYear:room.afterYear||0,phase:room.phase,version:room.version,round:room.round,locked:room.locked,limit:room.limit,seconds:room.seconds,teams:room.teams.map(({name,score,invite})=>({name,score,...(host?{invite}:{})})),players:room.players.map(({id,name,team})=>({id,name,team})),me:player?.id,team:player?.team,mobileImage:room.mobileImage||null,dialogueEnglish:room.game==='dialogue'?room.dialogueEnglish:undefined,content,active:room.active,settled:room.settled,blocked:room.blocked,winner:room.winner,deadline:room.deadline,serverNow:Date.now(),notice:room.notice,clue:room.clue,canUndo:host&&!!room.undo,...(host||room.phase==='settled'?{answer}:{})}
}
const wrap=fn=>async(req,res)=>{try{await fn(req,res)}catch(e){res.status(e.status||503).json({error:e.status?e.message:'Room service unavailable.'})}}
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next()})
router.post('/rooms',wrap(async(req,res)=>{
 const {game,teams,limit=4,seconds=10}=req.body
 if(!Array.isArray(teams)||teams.length<2||teams.length>8||teams.some(n=>typeof n!=='string'||!n.trim()||n.length>30)||new Set(teams.map(n=>n.trim().toLowerCase())).size!==teams.length||!Number.isInteger(limit)||limit<1||limit>20||!Number.isInteger(seconds)||seconds<5||seconds>120)fail('Use 2–8 unique team names, 1–20 players per team, and 5–120 seconds.',400)
 if(rooms.size>=500)fail('Too many rooms.',503)
 const rows=await catalog(game);let code;do{code=randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(code))
 const room={code,game,catalog:rows,index:randomInt(rows.length)-1,hostToken:randomUUID(),players:[],teams:teams.map(name=>({name:name.trim(),score:0,invite:randomBytes(16).toString('hex')})),limit,seconds,round:0,version:0,locked:false,expires:Date.now()+21600000}
 next(room);room.phase='lobby';rooms.set(code,room);res.status(201).json({token:room.hostToken,...view(room,true)})
}))
router.post('/rooms/:code/join',wrap(async(req,res)=>{
 const room=rooms.get(req.params.code.toUpperCase());if(!room||room.expires<Date.now())fail('Room not found.',404)
 if(room.locked||room.phase!=='lobby')fail('Joining is closed. Ask the host.')
 const {name,invite}=req.body;if(typeof name!=='string'||!name.trim()||name.length>30)fail('Enter a name up to 30 characters.',400)
 if(room.players.some(p=>p.name.toLowerCase()===name.trim().toLowerCase()))fail('That name is already in the room.')
 let team=null;if(invite){team=room.teams.findIndex(t=>t.invite===invite);if(team<0)fail('Invalid team invitation.',403);if(room.players.filter(p=>p.team===team).length>=room.limit)fail('Team is full.')}
 if(room.players.length>=room.teams.length*room.limit)fail('Room is full.')
 const p={id:randomUUID(),token:randomUUID(),name:name.trim(),team};room.players.push(p);room.version++;res.json({token:p.token,...view(room,false,p)})
}))
router.use('/rooms/:code',(req,res,nextMiddleware)=>{
 const r=rooms.get(req.params.code.toUpperCase()),token=req.get('Authorization')?.replace(/^Bearer /,'')
 if(!r||r.expires<Date.now())return res.status(404).json({error:'Room expired. Create a new room.'})
 const host=token===r.hostToken,p=r.players.find(p=>p.token===token)
 if(!host&&!p)return res.status(403).json({error:'Join the room first, or you were removed.'})
 req.room=r;req.isBuzzerHost=host;req.player=p;nextMiddleware()
})
router.get('/rooms/:code',(req,res)=>res.json(view(req.room,req.isBuzzerHost,req.player)))
router.post('/rooms/:code/action',wrap(async(req,res)=>{
 const r=req.room
 if(req.body.action==='year'){
  if(!req.isBuzzerHost)fail('Host only.',403)
  if(req.body.version!==r.version)fail('Room changed. Try again.')
  if(r.game!=='song'||!['lobby','settled'].includes(r.phase))fail('Change the year before starting or after finishing a round.')
  const year=req.body.afterYear
  if(![0,1990,1995,2000,2005,2010,2015,2020,2025].includes(year))fail('Choose a year.',400)
  const rows=await catalog('song'),filtered=year?rows.filter(row=>row.release_year>year):rows
  if(req.body.version!==r.version)fail('Room changed. Try again.')
  if(!filtered.length)fail('No songs after that year.')
  const lobby=r.phase==='lobby';r.catalog=filtered;r.afterYear=year;r.index=-1;next(r);if(lobby){r.phase='lobby';r.round=1}r.version++
 }else if(req.body.action==='next'){
  expireAnswer(r)
  if(!req.isBuzzerHost)fail('Host only.',403)
  if(req.body.version!==r.version)fail('Room changed. Try again.')
  if(r.phase==='lobby')fail('Start the game first.')
  next(r);r.version++
 }else action(r,req.isBuzzerHost,req.player,req.body)
 res.json(view(r,req.isBuzzerHost,req.player))
}))
setInterval(()=>{for(const [code,r] of rooms){if(r.expires<Date.now())rooms.delete(code);else expireAnswer(r)}},250).unref()
export default router

