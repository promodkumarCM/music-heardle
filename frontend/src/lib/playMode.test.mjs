import test from 'node:test'
import assert from 'node:assert/strict'
import {savedPlayMode,rememberPlayMode,playModeHref} from './playMode.js'

test('remembers only valid modes and clears an unchecked preference',()=>{
 const values=new Map()
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
 try {
  assert.equal(savedPlayMode(),null)
  for(const mode of ['solo','host','buzzer']){rememberPlayMode(mode,true);assert.equal(savedPlayMode(),mode)}
  rememberPlayMode('solo',false);assert.equal(savedPlayMode(),null)
  rememberPlayMode('invalid',true);assert.equal(savedPlayMode(),null)
  values.set('padam.preferred-play-mode','invalid');assert.equal(savedPlayMode(),null)
 } finally {delete globalThis.localStorage}
})
test('storage failures leave the chooser usable',()=>{
 globalThis.localStorage={getItem(){throw Error('Blocked')},setItem(){throw Error('Blocked')},removeItem(){throw Error('Blocked')}}
 try {assert.equal(savedPlayMode(),null);assert.doesNotThrow(()=>rememberPlayMode('solo',true));assert.doesNotThrow(()=>rememberPlayMode('solo',false))}finally{delete globalThis.localStorage}
})
test('builds solo, host, and buzzer routes for each game',()=>{
 assert.equal(playModeHref('song','song-game','solo'),'#song-game?mode=solo')
 assert.equal(playModeHref('lyrics','lyrics-game','host'),'#host-game?game=lyrics')
 assert.equal(playModeHref('pictures','picture-game','buzzer'),'#buzzer-game?game=pictures')
})
