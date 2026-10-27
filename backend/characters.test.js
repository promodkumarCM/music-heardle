import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import party from './partyGame.js'
import admin from './admin.js'

test('character catalog validates roles and supports private solo, host, and buzzer rounds',async()=>{
 const original=pool.query,queries=[]
 const entry={id:1,movie:'Test Movie',character_name:'The Shadow',character_english:'Shadow',role:'villain',aliases:['Alternate Title'],source_url:''}
 pool.query=async(sql,params)=>{queries.push({sql,params});return [sql.startsWith('INSERT')?{insertId:1}:sql.startsWith('UPDATE')?{affectedRows:1}:sql.includes('character_puzzles')?[entry]:[]]}
 const app=express();app.use(express.json());app.use('/party-game',party);app.use('/admin',admin)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base=`http://127.0.0.1:${server.address().port}`
 async function send(path,body,token,method='POST'){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(method==='GET'?{}:{body:JSON.stringify(body)})});return {status:r.status,data:await r.json()}}
 try{
  assert.equal((await send('/admin/characters',entry)).status,401)
  const {data:login}=await send('/admin/login',{username:'admin',password:'admin'})
  assert.equal((await send('/admin/characters',{...entry,role:'actor'},login.token)).status,400)
  assert.equal((await send('/admin/characters',entry,login.token)).status,201)
  assert.equal((await send('/admin/characters/1',{...entry,role:'hero'},login.token,'PUT')).status,200)
  const {data:solo,status}=await send('/party-game/rooms',{game:'characters',mode:'solo'})
  assert.equal(status,201);assert.equal(solo.answer,undefined);assert.equal(solo.content.name,'The Shadow');assert.equal(solo.content.role,'villain');assert.equal(solo.content.movie,undefined)
  const {data:win}=await send(`/party-game/rooms/${solo.code}/action`,{action:'guess',version:solo.version,guess:'Alternate Title'},solo.token)
  assert.equal(win.phase,'settled');assert.equal(win.answer,'Test Movie');assert.equal(win.teams[0].score,100)
  const {data:host}=await send('/party-game/rooms',{game:'characters',mode:'host',teams:['A','B']})
  assert.equal(host.answer,'Test Movie')
  const {data:marked}=await send(`/party-game/rooms/${host.code}/action`,{action:'mark',version:host.version,team:1},host.token)
  assert.equal(marked.teams[1].score,100)
  const {data:buzzer}=await send('/party-game/rooms',{game:'characters',mode:'buzzer',name:'First',seconds:20})
  assert.equal(buzzer.content,null);assert.equal(buzzer.answer,undefined)
  const {data:joined}=await send(`/party-game/rooms/${buzzer.code}/join`,{name:'Second'})
  const {data:started}=await send(`/party-game/rooms/${buzzer.code}/action`,{action:'start',version:joined.version},buzzer.token)
  assert.equal(started.answer,undefined);assert.equal(started.content.name,'The Shadow')
  const {data:buzzed}=await send(`/party-game/rooms/${buzzer.code}/action`,{action:'buzz',version:started.version},buzzer.token)
  const {data:won}=await send(`/party-game/rooms/${buzzer.code}/action`,{action:'guess',guess:'Test Movie',version:buzzed.version},buzzer.token)
  assert.equal(won.phase,'settled');assert.equal(won.teams[0].score,100)
 }finally{pool.query=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})
