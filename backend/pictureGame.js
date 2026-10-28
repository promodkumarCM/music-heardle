import {createHash} from 'node:crypto'
import {Router} from 'express'
import {pool} from './db.js'
import {matchMovie} from './movieMatching.js'
const router=Router()
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next()})
router.get('/',async(req,res)=>{
 try{const [rows]=await pool.query('SELECT id,movie,image_url,mobile_image_url FROM picture_puzzles ORDER BY id');res.json(rows.map(({movie,...row})=>({...row,group:createHash('sha256').update(String(movie||row.id)).digest('hex')})))}
 catch{res.status(503).json({error:'Could not load picture clues.'})}
})
router.post('/:id/guess',async(req,res)=>{
 const id=Number(req.params.id),{guess,reveal}=req.body||{}
 if(!Number.isSafeInteger(id)||id<1||(!reveal&&(typeof guess!=='string'||!guess.trim()||guess.length>255)))return res.status(400).json({error:'Enter a movie name.'})
 try{
 const [rows]=await pool.query('SELECT id,movie,aliases FROM picture_puzzles')
 const row=rows.find(r=>r.id===id)
 if(!row)return res.status(404).json({error:'Picture not found.'})
 const catalog=rows.map(r=>({...r,aliases:typeof r.aliases==='string'?JSON.parse(r.aliases):r.aliases}))
 const result=reveal===true?{correct:false}:matchMovie(guess,row.movie,catalog)
 res.json({...result,...(result.correct||reveal===true?{movie:row.movie}:{})})
 }catch{res.status(503).json({error:'Could not check the answer.'})}
})
export default router
