import test from 'node:test'
import assert from 'node:assert/strict'
import {drawStock} from './stock.js'
import {actorPhotos,randomActorPhoto,validateActorPhotos} from './actorPhotos.js'
test('stock draws every unique clue once, separates movies when possible, and ends',()=>{
 const rows=[{id:1,movie:'A'},{id:2,movie:'A'},{id:3,movie:'B'},{id:4,movie:'C'}],state={},seen=[]
 for(let i=0;i<rows.length;i++){const remaining=rows.filter(row=>!seen.includes(row.id)),previous=seen.length?rows.find(row=>row.id===seen.at(-1)):null;const row=drawStock(rows,state);if(previous&&remaining.some(item=>item.movie!==previous.movie))assert.notEqual(row.movie,previous.movie);seen.push(row.id)}
 assert.equal(new Set(seen).size,4);assert.equal(drawStock(rows,state),null)
})
test('dialogue variants are distinct stock, while duplicate song videos are not',()=>{
 const state={},rows=[{id:1,movie:'A',dialogue:'First'},{id:1,movie:'A',dialogue:'Second'}]
 assert.notEqual(drawStock(rows,state).dialogue,drawStock(rows,state).dialogue);assert.equal(drawStock(rows,state),null)
 const songs=[{id:1,youtube_id:'same',movie:'A'},{id:2,youtube_id:'same',movie:'A'}],songState={}
 assert.ok(drawStock(songs,songState));assert.equal(drawStock(songs,songState),null)
})
test('actor photo lists preserve legacy images and rotate without immediate repeats',()=>{
 const row={actor_image_url:'/picture-clues/a.png',actor_image_urls:JSON.stringify(['/picture-clues/a.png','/picture-clues/b.png'])}
 assert.equal(actorPhotos(row).length,2);assert.equal(randomActorPhoto(row,'/picture-clues/a.png'),'/picture-clues/b.png')
 assert.deepEqual(actorPhotos({actor_image_url:'/picture-clues/legacy.png'}),['/picture-clues/legacy.png'])
 assert.deepEqual(validateActorPhotos({actor_image_urls:[]}),[])
 assert.throws(()=>validateActorPhotos({actor_image_urls:['javascript:bad']}))
 assert.throws(()=>validateActorPhotos({actor_image_urls:Array(21).fill('/picture-clues/a.png')}))
})
