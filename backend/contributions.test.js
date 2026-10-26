import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import contributions from './contributions.js'
import admin from './admin.js'

test('submissions remain pending until authenticated, validated approval; repeated approvals cannot insert twice',async()=>{
 const originalQuery=pool.query,originalConnection=pool.getConnection
 let status='pending',kind='dialogues',insertions=0,commits=0,rollbacks=0
 pool.query=async(sql,params)=>{if(sql.startsWith('UPDATE contributions')){assert.match(sql,/kind='bug'/);return [{affectedRows:1}]}assert.match(sql,/INSERT INTO contributions/);assert.ok(['dialogues','bug'].includes(params[0]));return [{insertId:1}]}
 pool.getConnection=async()=>({beginTransaction:async()=>{},rollback:async()=>{rollbacks++},release(){},commit:async()=>{commits++},query:async(sql)=>{
  if(sql.startsWith('SELECT kind'))return [[{kind,status}]]
  if(sql.startsWith('INSERT INTO dialogues')){insertions++;return [{insertId:42}]}
  if(sql.startsWith('UPDATE contributions')){status='approved';return [{affectedRows:1}]}
  throw Error('Unexpected query: '+sql)
 }})
 const app=express();app.use(express.json());app.use('/contributions',contributions);app.use('/admin',admin)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base=`http://127.0.0.1:${server.address().port}`
 const request=(path,body,token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)})
 try{
  assert.equal((await request('/contributions',{kind:'invalid',content:'Some content'})).status,400)
  assert.equal((await request('/contributions',{kind:'dialogues',content:'Movie and a suggested dialogue'})).status,201)
  assert.equal(insertions,0)
  assert.equal((await request('/admin/contributions/1/approve',{})).status,401)
  const login=await request('/admin/login',{username:'admin',password:'admin'});const {token}=await login.json();assert.ok(token)
  assert.equal((await request('/admin/contributions/1/approve',{},token)).status,400)
  assert.equal(insertions,0);assert.equal(rollbacks,1)
  const entry={movie:'Test film',dialogue:'ഒരു സംഭാഷണം',dialogue_english:'A dialogue',aliases:[],source_url:''}
  assert.equal((await request('/admin/contributions/1/approve',entry,token)).status,201)
  assert.equal(insertions,1);assert.equal(commits,1)
  assert.equal((await request('/admin/contributions/1/approve',entry,token)).status,409)
  assert.equal(insertions,1)
  kind='bug';status='pending'
  assert.equal((await request('/contributions',{kind:'bug',content:'The song player stops unexpectedly.'})).status,201)
  assert.equal((await request('/admin/contributions/2/approve',entry,token)).status,400)
  assert.equal(insertions,1)
  assert.equal((await request('/admin/contributions/2/resolve',{})).status,401)
  assert.equal((await request('/admin/contributions/2/resolve',{},token)).status,200)
 }finally{pool.query=originalQuery;pool.getConnection=originalConnection;server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})
