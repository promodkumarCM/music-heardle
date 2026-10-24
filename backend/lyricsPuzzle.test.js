import test from 'node:test'
import assert from 'node:assert/strict'
import { puzzle, canMakePuzzle } from './lyricsPuzzle.js'
import songs from './lyricsSeed.js'
const sections = Array.from({length:6}, (_,s)=>Array.from({length:16},(_,w)=>'വാക്ക്'+String.fromCharCode(0x0d15+s)+String.fromCharCode(0x0d15+w)).join(' '))
for (const [difficulty, allowed] of [['easy',[0,1]],['medium',[2,3]],['hard',[4,5]]]) {
  test(`${difficulty} hides exactly ten words in its region`,()=>{
    for(let run=0;run<20;run++) {
      const result=puzzle(sections,difficulty)
      const blanks=result.flat().filter(w=>w.id!==undefined)
      assert.equal(blanks.length,10)
      assert.deepEqual(blanks.map(w=>w.id),Array.from({length:10},(_,i)=>i))
      result.forEach((stanza,i)=>{if(!allowed.includes(i))assert.ok(stanza.every(w=>w.id===undefined))})
    }
  })
}
test('catalog rounds have ten blanks and no answer visible elsewhere',()=>{
  for(const song of songs.filter(canMakePuzzle))for(const difficulty of ['easy','medium','hard']) {
    const words=puzzle(song,difficulty).flat()
    assert.equal(words.filter(w=>w.id!==undefined).length,10)
    const key=s=>s.normalize('NFC').replace(/[\u200c\u200d]/g,'').replace(/[^\p{L}\p{M}\p{N}]/gu,'')
    const visible=new Set(words.filter(w=>w.id===undefined).map(w=>key(w.text)))
    for(const word of words.filter(w=>w.id!==undefined))assert.ok(!visible.has(key(word.text)))
  }
})
test('short lyrics cannot produce undersized rounds',()=>{
  assert.equal(canMakePuzzle(['കാറ്റ് മഴ']),false)
  assert.throws(()=>puzzle(['കാറ്റ് മഴ']))
  assert.throws(()=>puzzle(sections,'invalid'))
})
