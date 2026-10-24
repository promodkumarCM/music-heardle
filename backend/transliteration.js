import {Router} from 'express'

// Dictionary suggestions depend only on the typed word, never the game catalog or answer.
export function createTransliterationRouter({fetcher=fetch,now=Date.now,timeoutMs=4000}={}) {
 const router=Router(),cache=new Map(),pending=new Map()
 const maxEntries=512,ttl=60*60*1000
 router.post('/',async(req,res)=>{
  res.set('Cache-Control','no-store')
  const text=req.body?.text
  if(typeof text!=='string'||text.length>80||!text.trim()||!/^[a-z]+$/i.test(text.trim()))return res.status(400).json({error:'Type one word using English letters.'})
  const word=text.trim(),cached=cache.get(word)
  if(cached&&cached.expires>now())return res.json({suggestions:cached.suggestions})
  if(!pending.has(word)) {
   if(pending.size>=16)return res.status(429).json({error:'Typing suggestions are busy. Please try again.'})
   const task=(async()=>{
    const response=await fetcher(`https://api.varnamproject.com/tl/ml/${encodeURIComponent(word)}`,{signal:AbortSignal.timeout(timeoutMs)})
    if(!response.ok)throw Error('Transliteration service unavailable')
    const data=await response.json()
    if(data.success!==true||!Array.isArray(data.result))throw Error('Invalid transliteration response')
    const suggestions=[...new Set(data.result.filter(s=>typeof s==='string'&&s.length<=150&&/^[\u0d00-\u0d7f\u200c\u200d]+$/u.test(s)).map(s=>s.normalize('NFC')))].slice(0,12)
    if(suggestions.length) {
     cache.delete(word)
     cache.set(word,{suggestions,expires:now()+ttl})
     if(cache.size>maxEntries)cache.delete(cache.keys().next().value)
    }
    return suggestions
   })()
   pending.set(word,task)
  }
  const task=pending.get(word)
  try {res.json({suggestions:await task})}
  catch {res.status(503).json({error:'Manglish conversion is unavailable. Try again or type Malayalam directly.'})}
  finally {if(pending.get(word)===task)pending.delete(word)}
 })
 return router
}

export default createTransliterationRouter()
