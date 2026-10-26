import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import router from './admin.js'

test('dialogue admin saves both languages and accepts omitted English',async()=>{
 const original=pool.query,queries=[]
 pool.query=async(sql,params)=>{queries.push({sql,params});return [{insertId:9,affectedRows:1}]}
 const app=express();app.use(express.json());app.use('/admin',router)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base=`http://127.0.0.1:${server.address().port}/admin`
 let token
 const request=async(path,method,body)=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return {status:r.status,body:await r.json()}}
 try {
  const login=await request('/login','POST',{username:'admin',password:'admin'});assert.equal(login.status,200);token=login.body.token
  const row={movie:'Hallo',dialogue:'നീ സാബു അല്ലേടാ?',dialogue_english:'Are you Sabu?',aliases:[],source_url:''}
  assert.equal((await request('/dialogues','POST',row)).status,201)
  assert.ok(queries.at(-1).sql.includes('dialogue_english'))
  assert.equal(queries.at(-1).params[1],row.dialogue)
  assert.equal(queries.at(-1).params[2],row.dialogue_english)
  const pairs=[{dialogue:row.dialogue,dialogue_english:row.dialogue_english},{dialogue:'മറ്റൊരു സംഭാഷണം',dialogue_english:'Another dialogue'}]
  assert.equal((await request('/dialogues/9','PUT',{...row,dialogue_variants:pairs})).status,200)
  assert.deepEqual(JSON.parse(queries.at(-1).params[5]),pairs)
  assert.equal((await request('/dialogues/9','PUT',{...row,dialogue_variants:[]})).status,400)
  const {dialogue_english,...legacy}=row
  assert.equal((await request('/dialogues/9','PUT',legacy)).status,200)
  assert.equal(queries.at(-1).params[2],'')
  assert.equal((await request('/dialogues','POST',{...row,dialogue_english:123})).status,400)
  assert.equal((await request('/dialogues','POST',{...row,dialogue_english:'a'.repeat(10001)})).status,400)
 } finally {pool.query=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})
