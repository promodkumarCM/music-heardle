import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import admin from './admin.js'
test('actor batches share metadata, validate every pair, protect IDs and roll back on conflicts',async()=>{
 const original=pool.getConnection
 let existing=[],queries=[],commits=0,rollbacks=0,failInsert=false
 pool.getConnection=async()=>({beginTransaction:async()=>{},release(){},commit:async()=>{commits++},rollback:async()=>{rollbacks++},query:async(sql,params)=>{
  queries.push({sql,params})
  if(sql.startsWith('SELECT'))return [existing]
  if(sql.startsWith('INSERT')){if(failInsert)throw Object.assign(Error('Duplicate'),{code:'ER_DUP_ENTRY'});return [{insertId:queries.length}]}
  if(sql.startsWith('UPDATE'))return [{affectedRows:1}]
  throw Error('Unexpected query')
 }})
 const app=express();app.use(express.json());app.use('/admin',admin)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base=`http://127.0.0.1:${server.address().port}/admin`
 async function post(path,body,token){const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return {status:response.status,data:await response.json()}}
 const batch={actor_name:'Test Actor',actor_image_url:'/picture-clues/actor.png',entries:[{character_name:'First Character',character_english:'First',movie:'First Movie',aliases:[]},{character_name:'Second Character',movie:'Second Movie',aliases:['Other Title']}]}
 try{
  assert.equal((await post('/characters/batch',batch)).status,401)
  const {data:{token}}=await post('/login',{username:'admin',password:'admin'})
  assert.equal((await post('/characters/batch',{...batch,entries:[batch.entries[0],{...batch.entries[1],movie:''}]},token)).status,400)
  assert.equal(commits,0)
  const result=await post('/characters/batch',batch,token)
  assert.equal(result.status,201);assert.equal(result.data.ids.length,2);assert.equal(commits,1)
  const inserts=queries.filter(row=>row.sql.startsWith('INSERT'));assert.equal(inserts.length,2)
  for(const row of inserts){assert.ok(row.params.includes('Test Actor'));assert.ok(row.params.includes('/picture-clues/actor.png'))}
  assert.equal((await post('/characters/batch',{...batch,entries:[batch.entries[0],batch.entries[0]]},token)).status,400)
  existing=[{id:1}];queries=[]
  const update=await post('/characters/batch',{...batch,original_actor:'Test Actor',entries:[{...batch.entries[0],id:1},batch.entries[1]]},token)
  assert.equal(update.status,201);assert.equal(queries.filter(row=>row.sql.startsWith('INSERT')).length,1);assert.ok(queries.some(row=>row.sql.startsWith('UPDATE')))
  assert.equal((await post('/characters/batch',{...batch,original_actor:'Test Actor',entries:[{...batch.entries[0],id:999}]},token)).status,409)
  existing=[];failInsert=true;const before=commits
  assert.equal((await post('/characters/batch',batch,token)).status,409);assert.equal(commits,before);assert.ok(rollbacks>=2)
 }finally{pool.getConnection=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})
