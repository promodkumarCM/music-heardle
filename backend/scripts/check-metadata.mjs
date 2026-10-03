import fs from 'node:fs'
const path=new URL('../data/verified-songs.json',import.meta.url)
const accepted=JSON.parse(fs.readFileSync(path)).map(song=>({...song,verification:'YouTube watch metadata: OK and playableInEmbed'}))
const remaining=JSON.parse(fs.readFileSync(new URL('../data/rejected-songs.json',import.meta.url))).filter(song=>song.reason==='No player metadata')
for(const song of remaining) {
  if(accepted.length>=250) break
  const response=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+song.youtubeId),{signal:AbortSignal.timeout(15000)})
  if(!response.ok) {console.log('Rejected metadata',song.title,response.status);continue}
  const metadata=await response.json()
  if(metadata.type!=='video') continue
  const {reason,...entry}=song
  accepted.push({...entry,verifiedTitle:metadata.title,channel:metadata.author_name,verification:'YouTube oEmbed metadata only; playback not checked',verifiedAt:new Date().toISOString()})
  fs.writeFileSync(path,JSON.stringify(accepted,null,2))
  console.log('Accepted',accepted.length,song.title)
}
