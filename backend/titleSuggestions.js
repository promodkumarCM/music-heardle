import {Router} from 'express'
import {pool} from './db.js'

const sources={characters:['character_puzzles','movie'],pictures:['picture_puzzles','movie'],dialogue:['dialogues','movie'],clues:['movie_puzzles','movie'],song:['songs','title']}
const router=Router()
router.post('/',async(req,res)=>{
  res.set('Cache-Control','no-store')
  const {game,query}=req.body||{}
  if(!Object.hasOwn(sources,game)||typeof query!=='string'||query.length>255)return res.status(400).json({error:'Enter a song or movie name.'})
  const q=query.trim().normalize('NFKC')
  if(q.length<2)return res.json({titles:[]})
  const [table,column]=sources[game]
  try {
    // Table/column names come only from the fixed map; user text is parameterized.
    // The current puzzle and its hidden answer never affect these results.
    const [rows]=await pool.query(`SELECT DISTINCT ${column} AS title FROM ${table} WHERE LOCATE(LOWER(?), LOWER(${column})) > 0 ORDER BY (LOCATE(LOWER(?), LOWER(${column})) = 1) DESC, ${column} LIMIT 8`,[q,q])
    res.json({titles:rows.map(row=>row.title)})
  }catch{res.status(503).json({error:'Suggestions unavailable. You can still type your answer.'})}
})
export default router
