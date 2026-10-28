import {test} from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import router from './songGame.js'
import {pool} from './db.js'

test('opaque song rounds, single-use answers and server-authoritative scoring',async()=>{
 const original=pool.query;let writes=0,values
 pool.query=async(sql,args)=>{
  if(sql.startsWith('SELECT DISTINCT title'))return [[{title:'Secret Song'},{title:'Second Song'}]]
  if(sql.startsWith('SELECT'))return [[{id:42,title:'Secret Song',movie:'Secret Movie',youtube_id:'abcdefghijk'}]]
  writes++;values=args;return [{insertId:1}]
 }
 const app=express();app.use(express.json());app.use(router)
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r))
 const base=`http://127.0.0.1:${server.address().port}`
 async function post(path,body={}){const res=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:res.status,data:await res.json()}}
 try{
  const {data:[round]}=await post('/queue');assert.equal(round.title,undefined);assert.equal(round.movie,undefined);assert.notEqual(round.id,42)
  assert.deepEqual((await post(`/${round.id}/suggestions`,{query:'S'})).data,{titles:[]})
  assert.deepEqual((await post(`/${round.id}/suggestions`,{query:'Se'})).data,{titles:['Secret Song','Second Song']})
  assert.equal(writes,0)
  assert.equal((await post('/unknown/suggestions',{query:'Se'})).status,410)
  assert.equal((await post(`/${round.id}/suggestions`,{query:123})).status,400)
  assert.equal((await post('/42/reveal')).status,410)
  assert.equal((await post(`/${round.id}/guess`,{guess:'Secret Song'})).status,400)
  await post(`/${round.id}/play`,{weight:1});await post(`/${round.id}/play`,{weight:9})
  const results=await Promise.all([1,2].map(()=>post(`/${round.id}/guess`,{guess:'Secret Song',playerName:'Tester',level:9,timeMs:0})))
  const answer=results.find(r=>r.status===200).data;assert.equal(answer.points,20);assert.equal(answer.movie,'Secret Movie');assert.equal(writes,1);assert.equal(values[1],1)
  await post(`/${round.id}/guess`,{guess:'Secret Song',playerName:'Tester'});assert.equal(writes,1)
  const {data:[second]}=await post('/queue');await post(`/${second.id}/reveal`);assert.equal((await post(`/${second.id}/guess`,{guess:'Secret Song',playerName:'Tester'})).data.points,0);assert.equal(writes,1)
  const {data:[third]}=await post('/queue');await post(`/${third.id}/play`,{weight:5});const wrong=await post(`/${third.id}/guess`,{guess:'Wrong'});assert.equal(wrong.data.status,'wrong');assert.equal(wrong.data.title,'Secret Song')
  const {data:sessionStock}=await post('/queue',{session:'stock-test',limit:1});assert.equal(sessionStock.length,1)
  assert.equal((await post('/queue',{session:'stock-test',limit:1})).data[0].id,sessionStock[0].id)
  assert.deepEqual((await post('/queue',{session:'stock-test',exclude:[sessionStock[0].id]})).data,[])
  assert.equal((await post('/queue',{afterYear:123})).status,400)
  const {data:[skip]}=await post('/queue');const skipped=await post(`/${skip.id}/skip`);assert.equal(skipped.data.status,'skipped');assert.equal(skipped.data.title,undefined)
  assert.equal((await post(`/${skip.id}/guess`,{guess:'Secret Song',playerName:'Tester'})).data.points,0);assert.equal(writes,1)
 }finally{pool.query=original;await new Promise(r=>server.close(r));await pool.end()}
})
