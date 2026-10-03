import fs from 'node:fs'
import { pool } from '../db.js'
const discovered=JSON.parse(fs.readFileSync(new URL('../data/discovered-songs.json',import.meta.url)))
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'')
const [existing]=await pool.query('SELECT title, youtube_id FROM songs')
await pool.end()
const titles=new Set(existing.map(s=>normalize(s.title)))
const ids=new Set(existing.map(s=>s.youtube_id))
ids.add('xmVITsClKvw')
const candidates=[]
for(const line of fs.readFileSync(new URL('../data/curated-songs.txt',import.meta.url),'utf8').trim().split(/\r?\n/)) {
  const [index,title,movie]=line.split('|')
  const source=discovered[Number(index)]
  if(titles.has(normalize(title))||ids.has(source.youtubeId)) continue
  titles.add(normalize(title));ids.add(source.youtubeId)
  candidates.push({...source,title,movie})
}
const verified=[], rejected=[]
for(let i=0;i<candidates.length;i+=3) {
  await Promise.all(candidates.slice(i,i+3).map(async song=>{
    try {
      const html=await fetch('https://www.youtube.com/watch?v='+song.youtubeId,{signal:AbortSignal.timeout(20000)}).then(r=>r.text())
      const match=html.match(/var ytInitialPlayerResponse = (.*?);(?:var |<\/script>)/)
      if(!match) throw Error('No player metadata')
      const data=JSON.parse(match[1])
      if(data.playabilityStatus?.status!=='OK'||data.playabilityStatus.playableInEmbed!==true) throw Error(data.playabilityStatus?.reason||data.playabilityStatus?.status)
      const seconds=Number(data.videoDetails?.lengthSeconds)
      if(seconds<60||seconds>900||data.videoDetails?.isLiveContent) throw Error('Not a single song length')
      verified.push({...song,verifiedTitle:data.videoDetails.title,durationSeconds:seconds,verifiedAt:new Date().toISOString()})
    } catch(error) {rejected.push({...song,reason:error.message})}
  }))
  fs.writeFileSync(new URL('../data/verified-songs.json',import.meta.url),JSON.stringify(verified,null,2))
  fs.writeFileSync(new URL('../data/rejected-songs.json',import.meta.url),JSON.stringify(rejected,null,2))
  if(i%15===0) console.log('Checked',Math.min(i+3,candidates.length),'of',candidates.length,'verified',verified.length,'rejected',rejected.length)
}
console.log('Final:',verified.length,'verified;',rejected.length,'rejected')
