import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {pool} from './db.js'

// Additive import: preserve existing clues and photos, and skip existing pairs.
const catalog=JSON.parse(await readFile(new URL('./data/character-filmographies.json',import.meta.url),'utf8'))
const apply=process.argv.includes('--apply')
const key=row=>JSON.stringify([row.movie.normalize('NFC').toLowerCase(),row.character_name.normalize('NFC').toLowerCase()])
const seen=new Set()
for(const row of catalog.entries){
 for(const field of ['movie','actor_name','character_name','character_english']){
  if(typeof row[field]!=='string'||!row[field].trim()||row[field].length>255)throw Error(`Invalid ${field}`)
 }
 if(seen.has(key(row)))throw Error('Duplicate source pair')
 seen.add(key(row))
 const source=new URL(row.source_url)
 if(source.protocol!=='https:'||source.username||source.password||row.source_url.length>600)throw Error('Invalid source')
}
let connection
try{
 connection=await pool.getConnection()
 await connection.beginTransaction()
 const [existing]=await connection.query('SELECT * FROM character_puzzles FOR UPDATE')
 const pairs=new Map(existing.map(row=>[key(row),row]))
 const photos=new Map(existing.filter(row=>row.actor_image_url).map(row=>[row.actor_name,row.actor_image_url]))
 const report={applied:apply,sourceDate:catalog.retrieved,inserted:0,existing:0,conflicts:[],byActor:{},excluded:catalog.excluded.length}
 if(apply){
  const backup=new URL('../output/character-import/',import.meta.url)
  await mkdir(backup,{recursive:true})
  await writeFile(new URL(`backup-${Date.now()}.json`,backup),JSON.stringify(existing,null,2))
 }
 for(const row of catalog.entries){
  const match=pairs.get(key(row))
  if(match){report.existing++;if(match.actor_name!==row.actor_name)report.conflicts.push({movie:row.movie,character:row.character_name,existingActor:match.actor_name,sourceActor:row.actor_name});continue}
  if(apply)await connection.query('INSERT INTO character_puzzles (movie,actor_name,actor_image_url,character_name,character_english,role,aliases,source_url) VALUES (?,?,?,?,?,?,?,?)',[row.movie,row.actor_name,photos.get(row.actor_name)||'',row.character_name,row.character_english,'character','[]',row.source_url])
  report.inserted++;report.byActor[row.actor_name]=(report.byActor[row.actor_name]||0)+1
 }
 if(apply)await connection.commit();else await connection.rollback()
 console.log(JSON.stringify(report,null,2))
 if(apply)await writeFile(new URL('../output/character-import/import-report.json',import.meta.url),JSON.stringify(report,null,2))
}catch(error){if(connection)await connection.rollback();console.error(error.code||error.message);process.exitCode=1}
finally{connection?.release();await pool.end()}
