import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import router from './clueGame.js'
test('five-clue playthroughs exhaust instead of repeating, with independent sessions',async()=>{
 const original=pool.query
 pool.query=async sql=>[sql.includes('movie_puzzles')?[{id:1,movie:'Test Movie',aliases:[],clues:['1','2','3','4','5']}]:[]]
 const app=express();app.use(express.json());app.use('/clue-game',router)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 async function start(session){const response=await fetch(`http://127.0.0.1:${server.address().port}/clue-game/start`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session})});return response.json()}
 try{assert.equal((await start('first')).status,'active');assert.equal((await start('first')).status,'exhausted');assert.equal((await start('second')).status,'active')}finally{pool.query=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})
