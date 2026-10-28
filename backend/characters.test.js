import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import party from './partyGame.js'
import admin from './admin.js'

test('character catalog validates roles and supports private solo, host, and buzzer rounds',async()=>{
 const original=pool.query,queries=[]
 const entry={id:1,movie:'Test Movie',actor_name:'Test Actor',actor_image_url:'https://example.com/actor.jpg',character_name:'The Shadow',character_english:'Shadow',role:'villain',aliases:['Alternate Title'],source_url:''}
 pool.query=async(sql,params)=>{queries.push({sql,params});return [sql.startsWith('INSERT')?{insertId:1}:sql.startsWith('UPDATE')?{affectedRows:1}:sql.includes('character_puzzles')?[entry]:[]]}
 const app=express();app.use(express.json());app.use('/party-game',party);app.use('/admin',admin)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base=`http://127.0.0.1:${server.address().port}`
 async function send(path,body,token,method='POST'){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(method==='GET'?{}:{body:JSON.stringify(body)})});return {status:r.status,data:await r.json()}}
 try{
  assert.equal((await send('/admin/characters',entry)).status,401)
  const {data:login}=await send('/admin/login',{username:'admin',password:'admin'})
  assert.equal((await send('/admin/characters',{...entry,actor_name:''},login.token)).status,400)
  assert.equal((await send('/admin/characters',{...entry,actor_image_url:'javascript:alert(1)'},login.token)).status,400)
  assert.equal((await send('/admin/characters',{...entry,actor_image_url:''},login.token)).status,201)
  const {role,source_url,...simpleEntry}=entry
  assert.equal((await send('/admin/characters',simpleEntry,login.token)).status,201)
  assert.equal((await send('/admin/characters/1',{...entry,role:'hero'},login.token,'PUT')).status,200)
  const {data:solo,status}=await send('/party-game/rooms',{game:'characters',mode:'solo'})
  assert.equal(status,201);assert.equal(solo.answer,undefined);assert.equal(solo.content.name,'The Shadow');assert.equal(solo.content.actor,undefined);assert.equal(solo.content.actorImage,entry.actor_image_url);assert.equal(solo.content.role,'villain');assert.equal(solo.content.movie,undefined)
  const {data:win}=await send(`/party-game/rooms/${solo.code}/action`,{action:'guess',version:solo.version,guess:'Alternate Title'},solo.token)
  assert.equal(win.phase,'settled');assert.equal(win.answer,'Test Movie');assert.equal(win.teams[0].score,100)
  const {data:hard}=await send('/party-game/rooms',{game:'characters',mode:'solo',difficulty:'hard'})
  assert.equal(hard.content.actor,undefined);assert.equal(hard.availablePoints,100)
  const {data:hint}=await send(`/party-game/rooms/${hard.code}/action`,{action:'actor',version:hard.version},hard.token)
  assert.equal(hint.content.actor,'Test Actor');assert.equal(hint.content.actorImage,entry.actor_image_url);assert.equal(hint.availablePoints,60)
  assert.equal((await send(`/party-game/rooms/${hard.code}/action`,{action:'actor',version:hint.version},hard.token)).status,409)
  const {data:hintWin}=await send(`/party-game/rooms/${hard.code}/action`,{action:'guess',guess:'Test Movie',version:hint.version},hard.token)
  assert.equal(hintWin.teams[0].score,60)
  const {data:reset}=await send(`/party-game/rooms/${hard.code}/action`,{action:'next',version:hintWin.version},hard.token)
  assert.equal(reset.phase,'exhausted');assert.equal(reset.content,null)
  const {data:fresh}=await send('/party-game/rooms',{game:'characters',mode:'solo'})
  const {data:noHintWin}=await send(`/party-game/rooms/${fresh.code}/action`,{action:'guess',guess:'Test Movie',version:fresh.version},fresh.token)
  assert.equal(noHintWin.teams[0].score,100);assert.equal(noHintWin.content.actor,'Test Actor')
  const {data:host}=await send('/party-game/rooms',{game:'characters',mode:'host',teams:['A','B']})
  assert.equal(host.answer,'Test Movie');assert.equal(host.content.actor,undefined);assert.equal(host.content.actorImage,entry.actor_image_url)
  const {data:marked}=await send(`/party-game/rooms/${host.code}/action`,{action:'mark',version:host.version,team:1},host.token)
  assert.equal(marked.teams[1].score,100)
  const {data:hardHost}=await send('/party-game/rooms',{game:'characters',mode:'host',difficulty:'hard',teams:['A','B']})
  assert.equal(hardHost.content.actor,undefined)
  const {data:hostHint}=await send(`/party-game/rooms/${hardHost.code}/action`,{action:'actor',version:hardHost.version},hardHost.token)
  const {data:hostHintWin}=await send(`/party-game/rooms/${hardHost.code}/action`,{action:'mark',team:0,version:hostHint.version},hardHost.token)
  assert.equal(hostHintWin.teams[0].score,60)
  const {data:buzzer}=await send('/party-game/rooms',{game:'characters',mode:'buzzer',difficulty:'hard',name:'First',seconds:20})
  assert.equal(buzzer.content,null);assert.equal(buzzer.answer,undefined)
  const {data:joined}=await send(`/party-game/rooms/${buzzer.code}/join`,{name:'Second'})
  const {data:started}=await send(`/party-game/rooms/${buzzer.code}/action`,{action:'start',version:joined.version},buzzer.token)
  assert.equal(started.answer,undefined);assert.equal(started.content.name,'The Shadow')
  assert.equal(started.content.actor,undefined);assert.equal(started.content.actorImage,entry.actor_image_url)
  assert.equal((await send(`/party-game/rooms/${buzzer.code}/action`,{action:'actor',version:started.version},joined.token)).status,409)
  const {data:sharedHint}=await send(`/party-game/rooms/${buzzer.code}/action`,{action:'actor',version:started.version},buzzer.token)
  const {data:otherView}=await send(`/party-game/rooms/${buzzer.code}`,null,joined.token,'GET')
  assert.equal(otherView.content.actor,'Test Actor');assert.equal(otherView.availablePoints,60)
  const {data:buzzed}=await send(`/party-game/rooms/${buzzer.code}/action`,{action:'buzz',version:sharedHint.version},buzzer.token)
  const {data:won}=await send(`/party-game/rooms/${buzzer.code}/action`,{action:'guess',guess:'Test Movie',version:buzzed.version},buzzer.token)
  assert.equal(won.phase,'settled');assert.equal(won.teams[0].score,60)
 }finally{pool.query=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})
