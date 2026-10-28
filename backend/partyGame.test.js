import {test} from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import router from './partyGame.js'

test('room API supports all games, host scoring, creator participation, and score-preserving game changes',async()=>{
  const original=pool.query
  const lines=[{speaker:1,dialogue:'Question',dialogue_english:'Question'},{speaker:2,dialogue:'Reply',dialogue_english:'Reply'}]
  const lyric=Array.from({length:4},(_,s)=>Array.from({length:12},(_,w)=>'വാക്ക്'+String.fromCharCode(0x0d15+s)+String.fromCharCode(0x0d15+w)).join(' '))
  pool.query=async sql=>[sql.includes('SELECT movie,aliases')?[]:sql.includes('picture_puzzles')?[{id:1,movie:'Movie',image_url:'/image.png'}]:sql.includes('lyric_songs')?[{id:1,sections:lyric}]:sql.includes('movie_puzzles')?[{id:1,movie:'Movie',clues:['1','2','3','4','5']}]:sql.includes('dialogues')?[{id:1,movie:'Movie',dialogue:'A line',dialogue_english:'An English line',dialogue_variants:[{dialogue:'A line',dialogue_english:'An English line',dialogue_lines:lines}]}]:[{id:1,title:'Song',movie:'Movie',youtube_id:'abc'}]]
  const app=express();app.use(express.json());app.use('/party-game',router)
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
  const base=`http://127.0.0.1:${server.address().port}/party-game`
  async function post(path,body,token){const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return {status:response.status,data:await response.json()}}
  try {
    for(const game of ['pictures','song','dialogue','clues','lyrics']) {
      const {status,data:r}=await post('/rooms',{mode:'host',game,teams:['A','B','C','D'],difficulty:'hard'})
      assert.equal(status,201);assert.equal(r.phase,'closed');assert.equal(r.teams.length,4)
      if(game==='dialogue'){assert.equal(r.dialogueEnglish,'An English line');assert.deepEqual(r.dialogueLines,lines)}
      if(game==='lyrics')assert.equal(r.content.flat().filter(w=>w.id!==undefined).length,10)
    }
    let {data:host}=await post('/rooms',{mode:'host',game:'pictures',teams:['A','B']})
    const ht=host.token
    host=(await post(`/rooms/${host.code}/action`,{action:'mark',version:host.version,team:1},ht)).data
    host=(await post(`/rooms/${host.code}/action`,{action:'game',version:host.version,game:'dialogue'},ht)).data
    assert.equal(host.game,'dialogue');assert.equal(host.teams[1].score,100)
    let {data:r}=await post('/rooms',{mode:'buzzer',game:'pictures',name:'Creator'})
    const creatorToken=r.token,code=r.code
    assert.equal(r.players[0].id,r.me);assert.equal(r.phase,'lobby');assert.equal(r.content,null)
    const joined=await post(`/rooms/${code}/join`,{name:'Second'})
    assert.equal(joined.status,200);const playerToken=joined.data.token
    r=joined.data
    assert.equal((await post(`/rooms/${code}/action`,{action:'start',version:r.version},playerToken)).status,409)
    r=(await post(`/rooms/${code}/action`,{action:'start',version:r.version},creatorToken)).data
    assert.equal(r.answer,undefined);assert.equal(r.phase,'open')
    assert.equal((await post(`/rooms/${code}/join`,{name:'Late'})).status,409)
    r=(await post(`/rooms/${code}/action`,{action:'buzz',version:r.version},creatorToken)).data
    assert.equal((await post(`/rooms/${code}/action`,{action:'guess',guess:'Movie',version:r.version},playerToken)).status,409)
    r=(await post(`/rooms/${code}/action`,{action:'guess',guess:'Movie',version:r.version},creatorToken)).data
    assert.equal(r.teams[0].score,100);assert.equal(r.phase,'settled')
    r=(await post(`/rooms/${code}/action`,{action:'next',version:r.version},playerToken)).data
    assert.equal(r.phase,'exhausted');assert.equal(r.teams[0].score,100)
    r=(await post(`/rooms/${code}/action`,{action:'game',version:r.version,game:'dialogue'},creatorToken)).data
    assert.equal(r.game,'dialogue');assert.deepEqual(r.dialogueLines,lines);assert.equal(r.phase,'open');assert.equal(r.teams[0].score,100)
    const {status,data:solo}=await post('/rooms',{mode:'solo',game:'lyrics',difficulty:'medium'})
    assert.equal(status,201);assert.equal(solo.phase,'answering');assert.equal(solo.answer,undefined)
    assert.equal((await post('/rooms',{mode:'host',game:'pictures',teams:['Same','same']})).status,400)
  }finally{pool.query=original;await new Promise(resolve=>server.close(resolve))}
})
