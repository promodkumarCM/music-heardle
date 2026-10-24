import {test} from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {createTransliterationRouter} from './transliteration.js'

async function serve(router,run) {
 const app=express();app.use(express.json());app.use('/transliteration',router)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const post=async body=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/transliteration`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()}}
 try {await run(post)}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
}
test('dictionary proxy validates words, filters suggestions, caches, and preserves phonetic case',async()=>{
 const calls=[];let clock=1000
 const router=createTransliterationRouter({now:()=>clock,fetcher:async(url,options)=>{
  calls.push({url,options});return {ok:true,json:async()=>({success:true,result:['മഴ','മഴ','മഴയും','English','<script>bad</script>',null,'മഴ കാലം']})}
 }})
 await serve(router,async post=>{
  for(const text of ['',null,12,'../secret','a b','a&track=answer','a'.repeat(81),'മഴ'])assert.equal((await post({text})).status,400)
  assert.equal(calls.length,0)
  assert.deepEqual(await post({text:' mazha '}),{status:200,body:{suggestions:['മഴ','മഴയും']}})
  assert.equal(calls[0].url,'https://api.varnamproject.com/tl/ml/mazha')
  assert.ok(calls[0].options.signal instanceof AbortSignal)
  await post({text:'mazha'});assert.equal(calls.length,1)
  await post({text:'Mazha'});assert.equal(calls.length,2)
  clock+=3600001;await post({text:'mazha'});assert.equal(calls.length,3)
 })
})
test('simultaneous requests for the same word share one upstream lookup',async()=>{
 let release,calls=0
 const router=createTransliterationRouter({fetcher:async()=>{calls++;await new Promise(resolve=>release=resolve);return {ok:true,json:async()=>({success:true,result:['മഴ']})}}})
 await serve(router,async post=>{
  const first=post({text:'mazha'}),second=post({text:'mazha'})
  while(!release)await new Promise(resolve=>setImmediate(resolve))
  await new Promise(resolve=>setTimeout(resolve,20));assert.equal(calls,1)
  release();assert.equal((await first).status,200);assert.equal((await second).status,200)
 })
})
test('provider errors are recoverable and never cached as successful suggestions',async()=>{
 let calls=0
 const router=createTransliterationRouter({fetcher:async()=>{calls++;if(calls===1)throw Error('offline');return {ok:true,json:async()=>({success:true,result:['മഴ']})}}})
 await serve(router,async post=>{
  const first=await post({text:'mazha'});assert.equal(first.status,503);assert.match(first.body.error,/type Malayalam directly/)
  assert.deepEqual((await post({text:'mazha'})).body,{suggestions:['മഴ']});assert.equal(calls,2)
 })
})
