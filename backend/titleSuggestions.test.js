import {test} from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import router from './titleSuggestions.js'
import {pool} from './db.js'

test('autocomplete validates input, uses the right catalog, and only returns matching titles',async()=>{
  const original=pool.query;const queries=[]
  pool.query=async(sql,args)=>{queries.push({sql,args});return [[{title:'Matching Title',movie:'Hidden',id:99}]]}
  const app=express();app.use(express.json());app.use(router)
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r))
  const base=`http://127.0.0.1:${server.address().port}`
  async function post(body){const response=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,data:await response.json()}}
  try{
    assert.deepEqual((await post({game:'pictures',query:'M'})).data,{titles:[]});assert.equal(queries.length,0)
    for(const [game,table] of [['pictures','picture_puzzles'],['dialogue','dialogues'],['clues','movie_puzzles'],['song','songs']]) {
      assert.deepEqual((await post({game,query:'Ma'})).data,{titles:['Matching Title']})
      assert.ok(queries.at(-1).sql.includes(`FROM ${table}`));assert.deepEqual(queries.at(-1).args,['Ma','Ma'])
    }
    for(const body of [{game:'lyrics',query:'Ma'},{game:'invalid',query:'Ma'},{game:'song',query:3},{game:'song',query:'a'.repeat(256)}])assert.equal((await post(body)).status,400)
    await post({game:'pictures',query:"%' OR 1=1 --"});assert.equal(queries.at(-1).sql.includes('OR 1=1'),false)
    assert.equal(queries.at(-1).args[0],"%' OR 1=1 --")
  }finally{pool.query=original;await new Promise(r=>server.close(r))}
})
