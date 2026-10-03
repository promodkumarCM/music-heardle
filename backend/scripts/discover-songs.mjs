import fs from 'node:fs'
const queries = ['Malayalam Satyam Audios video song', 'Malayalam Sony Music video song', 'Malayalam Muzik247 video song', 'Malayalam Saregama video song', 'Malayalam Manorama Music video song', ...['1990','1995','2000','2005','2010','2015','2018','2020','2022','2023','2024','2025','Yesudas','Chithra','Sujatha','Vidyasagar','Johnson','Raveendran','Mohanlal','Mammootty','Dileep','Prithviraj','Dulquer','Nivin Pauly','Jayaram','Fahadh','Shaan Rahman','Gopi Sundar','Sushin Shyam','Deepak Dev','M Jayachandran','Ouseppachan','Bijibal'].map(s => `Malayalam ${s} official video song`)]
const rows = new Map()
function walk(x) {
  if (!x || typeof x !== 'object') return
  if (x.videoRenderer) {
    const v = x.videoRenderer
    rows.set(v.videoId, {youtubeId:v.videoId, sourceTitle:v.title?.runs?.map(r=>r.text).join(''), channel:v.ownerText?.runs?.map(r=>r.text).join('')})
  }
  if (x.lockupViewModel?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
    const v=x.lockupViewModel
    rows.set(v.contentId,{youtubeId:v.contentId,sourceTitle:v.metadata?.lockupMetadataViewModel?.title?.content})
  }
  for (const v of Object.values(x)) walk(v)
}
for(let i=0;i<queries.length;i+=3) {
  await Promise.allSettled(queries.slice(i,i+3).map(async q=>{
    const html=await fetch('https://www.youtube.com/results?search_query='+encodeURIComponent(q)).then(r=>r.text())
    const match=html.match(/var ytInitialData = (.*?);<\/script>/)
    if(match) walk(JSON.parse(match[1]))
  }))
  console.log(i+3, 'queries:', rows.size, 'videos')
  fs.writeFileSync(new URL('../data/discovered-songs.json',import.meta.url),JSON.stringify([...rows.values()],null,2))
}
