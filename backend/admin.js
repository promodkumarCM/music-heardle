import {validateDialogueVariants} from './dialogueVariants.js'
import {imageBody,uploadImage,uploadError} from './pictureUploads.js'
import express from 'express'
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto'
import {pool} from './db.js'
const router=express.Router(), sessions=new Map(), attempts=new Map()
const username=process.env.ADMIN_USERNAME||'admin', passwordHash=scryptSync(process.env.ADMIN_PASSWORD||'admin','padam-admin',32)
const definitions={characters:{table:'character_puzzles',fields:['movie','actor_name','actor_image_url','character_name','character_english','role','aliases','source_url']},pictures:{table:'picture_puzzles',fields:['movie','aliases','image_url','mobile_image_url']},songs:{table:'songs',fields:['title','movie','youtube_id','release_year']},dialogues:{table:'dialogues',fields:['movie','dialogue','dialogue_english','aliases','source_url','dialogue_variants']},clues:{table:'movie_puzzles',fields:['movie','aliases','clues']},lyrics:{table:'lyric_songs',fields:['title','sections']}}
const parse=value=>typeof value==='string'?JSON.parse(value):value
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next()})
router.post('/login',(req,res)=>{
 const ip=req.ip,now=Date.now(),recent=(attempts.get(ip)||[]).filter(t=>now-t<15*60*1000)
 if(recent.length>=10)return res.status(429).json({error:'Too many login attempts. Try again in 15 minutes.'})
 attempts.set(ip,[...recent,now])
 if(process.env.NODE_ENV==='production'&&(!process.env.ADMIN_PASSWORD||process.env.ADMIN_PASSWORD==='admin'))return res.status(503).json({error:'Set a private ADMIN_PASSWORD on the server before enabling public admin access.'})
 if(typeof req.body.password!=='string'||req.body.password.length>200||req.body.username!==username||!timingSafeEqual(scryptSync(req.body.password,'padam-admin',32),passwordHash))return res.status(401).json({error:'Invalid username or password.'})
 attempts.delete(ip);const token=randomBytes(32).toString('hex');sessions.set(token,now+2*60*60*1000);res.json({token})
})
router.use((req,res,next)=>{const token=req.get('Authorization')?.replace(/^Bearer /,'');if(!token||!sessions.has(token)||sessions.get(token)<Date.now()){if(token)sessions.delete(token);return res.status(401).json({error:'Please sign in.'})}req.adminToken=token;next()})
router.post('/picture-upload',imageBody,uploadImage,uploadError)
router.post('/logout',(req,res)=>{sessions.delete(req.adminToken);res.json({ok:true})})
router.get('/session',(req,res)=>res.json({username}))
router.get('/contributions',async(req,res)=>{try{const [rows]=await pool.query("SELECT id,kind,content,created_at FROM contributions WHERE status='pending' ORDER BY id DESC");res.json(rows)}catch{res.status(503).json({error:'Could not load contributions.'})}})
router.post('/contributions/:id/resolve',async(req,res)=>{try{const [result]=await pool.query("UPDATE contributions SET status='resolved',reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND kind='bug' AND status='pending'",[req.params.id]);if(!result.affectedRows)return res.status(409).json({error:'Bug report already closed or missing.'});res.json({ok:true})}catch{res.status(503).json({error:'Could not close bug report.'})}})
router.post('/contributions/:id/reject',async(req,res)=>{try{const [result]=await pool.query("UPDATE contributions SET status='rejected',reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'",[req.params.id]);if(!result.affectedRows)return res.status(409).json({error:'Contribution already reviewed or missing.'});res.json({ok:true})}catch{res.status(503).json({error:'Could not reject contribution.'})}})
function validate(kind,input){
 if(kind==='dialogues'){
  const pairs=validateDialogueVariants(input.dialogue_variants??[{dialogue:input.dialogue,dialogue_english:input.dialogue_english}])
  input={...input,...pairs[0],dialogue_variants:pairs}
 }
 const d=definitions[kind],out={}
 for(const field of d.fields){const value=['mobile_image_url','dialogue_english','character_english','actor_image_url'].includes(field)?(input[field]??''):input[field]
  if(field==='dialogue_variants'){out[field]=JSON.stringify(value)}
  else if(['aliases','clues','sections'].includes(field)){
   if(!Array.isArray(value)||value.length>100||value.some(s=>typeof s!=='string'||!s.trim()||s.length>20000))throw Error(`${field}: enter a valid list of text values.`)
   if(field==='clues'&&value.length!==5)throw Error('Exactly five clues are required.')
   if(field==='sections'){
    if(value.length<2)throw Error('Provide at least two lyric sections.')
    const norm=s=>s.normalize('NFC').replace(/[\u200c\u200d]/g,'').replace(/[^\p{L}\p{M}\p{N}]/gu,'')
    const counts=new Map();for(const word of value.flatMap(s=>s.split(/\s+/))){const n=norm(word);counts.set(n,(counts.get(n)||0)+1)}
    if(value.filter(s=>s.split(/\s+/).filter(w=>/[\u0d00-\u0d7f]/u.test(w)&&!/[()]/.test(w)&&counts.get(norm(w))===1).length>=2).length<2)throw Error('At least two sections need two unique Malayalam words each for blanks.')
   }
   out[field]=JSON.stringify(value.map(s=>s.trim()))
  }else if(field==='release_year'){if(value!==null&&(!Number.isInteger(value)||value<1900||value>2100))throw Error('Release year must be 1900–2100 or blank.');out[field]=value}
  else{if(typeof value!=='string'||(!['source_url','mobile_image_url','dialogue_english','character_english','actor_image_url'].includes(field)&&!value.trim())||value.length>(['dialogue','dialogue_english'].includes(field)?10000:['source_url','image_url','mobile_image_url','actor_image_url'].includes(field)?600:255))throw Error(`Enter a valid ${field}.`);out[field]=value.trim()}
 }
 if(out.actor_image_url&&!/^(https?:\/\/|\/uploads\/picture-clues\/|\/picture-clues\/)/i.test(out.actor_image_url))throw Error('Use a valid actor image URL or /picture-clues/ path.')
 if(kind==='characters'&&!['hero','villain'].includes(out.role))throw Error('Role must be hero or villain.')
 if(kind==='songs'&&!/^[A-Za-z0-9_-]{11}$/.test(out.youtube_id))throw Error('YouTube ID must contain 11 characters.')
 if(out.source_url&&!/^https?:\/\//i.test(out.source_url))throw Error('Source URL must begin with https:// or http://.')
 if(out.mobile_image_url&&!/^(https?:\/\/|\/uploads\/picture-clues\/|\/picture-clues\/)/i.test(out.mobile_image_url))throw Error('Use an image URL or /picture-clues/ path.')
 if(out.image_url&&!/^(https?:\/\/|\/uploads\/picture-clues\/|\/picture-clues\/)/i.test(out.image_url))throw Error('Use an HTTPS image URL or /picture-clues/ path.')
 return out
}
router.post('/contributions/:id/approve',async(req,res)=>{
 let connection
 try {
  connection=await pool.getConnection();await connection.beginTransaction()
  const [rows]=await connection.query('SELECT kind,status FROM contributions WHERE id=? FOR UPDATE',[req.params.id])
  const entry=rows[0]
  if(entry?.kind==='bug'){await connection.rollback();return res.status(400).json({error:'Bug reports cannot be added to the game catalog.'})}
  if(!entry||entry.status!=='pending'){await connection.rollback();return res.status(409).json({error:'Contribution already reviewed or missing.'})}
  let data
  try{data=validate(entry.kind,req.body)}catch(error){await connection.rollback();return res.status(400).json({error:error.message})}
  const d=definitions[entry.kind]
  const [result]=await connection.query(`INSERT INTO ${d.table} (${d.fields.join(',')}) VALUES (${d.fields.map(()=>'?').join(',')})`,d.fields.map(field=>data[field]))
  await connection.query("UPDATE contributions SET status='approved',catalog_id=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?",[result.insertId,req.params.id])
  await connection.commit();res.status(201).json({id:result.insertId})
 }catch(error){if(connection)await connection.rollback();res.status(error.code==='ER_DUP_ENTRY'?409:503).json({error:error.code==='ER_DUP_ENTRY'?'This movie already exists. Edit its existing catalog entry instead.':'Could not approve contribution.'})}finally{connection?.release()}
})
router.use('/:kind',(req,res,next)=>{if(!Object.hasOwn(definitions,req.params.kind))return res.status(404).json({error:'Unknown catalog.'});const d=definitions[req.params.kind];req.definition=d;req.kind=req.params.kind;next()})
router.get('/:kind',async(req,res)=>{try{const d=req.definition;const [rows]=await pool.query(`SELECT id, ${d.fields.join(',')} FROM ${d.table} ORDER BY id DESC`);res.json(rows.map(row=>{for(const f of ['aliases','clues','sections','dialogue_variants'])if(row[f]!==undefined)row[f]=parse(row[f]);return row}))}catch{res.status(503).json({error:'Could not load catalog.'})}})
async function save(req,res){
 let data;try{data=validate(req.kind,req.body)}catch(e){return res.status(400).json({error:e.message})}
 const d=req.definition,id=Number(req.params.id)
 if(req.params.id&&(!Number.isSafeInteger(id)||id<1))return res.status(400).json({error:'Invalid ID.'})
 try{let result;if(req.params.id){[result]=await pool.query(`UPDATE ${d.table} SET ${d.fields.map(f=>f+'=?').join(',')} WHERE id=?`,[...d.fields.map(f=>data[f]),id]);if(!result.affectedRows)return res.status(404).json({error:'Entry not found.'})}else{[result]=await pool.query(`INSERT INTO ${d.table} (${d.fields.join(',')}) VALUES (${d.fields.map(()=>'?').join(',')})`,d.fields.map(f=>data[f]))}res.status(req.params.id?200:201).json({id:req.params.id?id:result.insertId})}catch(e){res.status(e.code==='ER_DUP_ENTRY'?409:503).json({error:e.code==='ER_DUP_ENTRY'?'This movie already exists.':'Could not save entry.'})}
}
router.post('/:kind',save);router.put('/:kind/:id',save)
router.delete('/:kind/:id',async(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:'Invalid ID.'});try{const [r]=await pool.query(`DELETE FROM ${req.definition.table} WHERE id=?`,[id]);if(!r.affectedRows)return res.status(404).json({error:'Entry not found.'});res.json({ok:true})}catch{res.status(503).json({error:'Could not delete entry.'})}})
setInterval(()=>{const now=Date.now();for(const [token,expiry] of sessions)if(expiry<now)sessions.delete(token);for(const [ip,list] of attempts)if(list.every(t=>now-t>900000))attempts.delete(ip)},60000).unref()
export default router
