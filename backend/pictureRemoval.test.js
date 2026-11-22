import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import {pool} from './db.js'
import admin from './admin.js'

test('removing an image preserves the entry and updates only the chosen ID',async()=>{
 const original=pool.query,queries=[]
 pool.query=async(sql,params)=>{queries.push({sql,params});return [{affectedRows:1}]}
 const app=express();app.use(express.json());app.use('/admin',admin)
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve))
 const base=`http://127.0.0.1:${server.address().port}/admin`
 try{
  assert.equal((await fetch(base+'/pictures/7/image',{method:'DELETE'})).status,401)
  const login=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'admin'})})
  const {token}=await login.json(),headers={Authorization:`Bearer ${token}`}
  assert.equal((await fetch(base+'/pictures/7/image',{method:'DELETE',headers})).status,200)
  assert.deepEqual(queries,[{sql:"UPDATE picture_puzzles SET image_url='',mobile_image_url='' WHERE id=?",params:[7]}])
  assert.equal((await fetch(base+'/pictures/invalid/image',{method:'DELETE',headers})).status,400)
 }finally{pool.query=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
})
