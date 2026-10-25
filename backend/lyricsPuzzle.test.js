import test from 'node:test'
import assert from 'node:assert/strict'
import { puzzle, canMakePuzzle } from './lyricsPuzzle.js'
import songs from './lyricsSeed.js'
const sections = Array.from({length:6}, (_,s)=>Array.from({length:16},(_,w)=>'വാക്ക്'+String.fromCharCode(0x0d15+s)+String.fromCharCode(0x0d15+w)).join(' '))
for (const [preferred, difficulty] of ['easy','medium','hard'].entries()) {
  test(`${difficulty} spreads ten blanks across the song with a difficulty bias`,()=>{
    for(let run=0;run<30;run++) {
      const result=puzzle(sections,difficulty)
      const blanks=result.flat().filter(w=>w.id!==undefined)
      assert.equal(blanks.length,10)
      assert.deepEqual(blanks.map(w=>w.id),Array.from({length:10},(_,i)=>i))
      const counts=result.map(stanza=>stanza.filter(w=>w.id!==undefined).length)
      assert.ok(counts.every(count=>count>0))
      for(let region=0;region<3;region++) {
        assert.equal(counts[region*2]+counts[region*2+1],region===preferred?6:2)
        assert.equal(counts[region*2],counts[region*2+1])
      }
    }
  })
}

test('newlines inside a stanza distribute blanks across actual lyric lines',()=>{
  const song=[sections.join('\n')]
  for(const difficulty of ['easy','medium','hard']) {
    const result=puzzle(song,difficulty)[0]
    const counts=[0]
    for(const word of result) {
      if(word.id!==undefined) counts[counts.length-1]++
      if(word.text.includes('\n')) counts.push(0)
    }
    assert.equal(counts.length,6)
    assert.ok(counts.every(count=>count>0))
  }
})

test('sparse regions redistribute their quota without losing blanks',()=>{
  const result=puzzle(['ലാൽ ലാൽ',...sections.slice(0,2),'ലാൽ ലാൽ'],'hard')
  assert.equal(result.flat().filter(w=>w.id!==undefined).length,10)
})

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

function assertSeparated(result) {
 const words=result.flat().filter(word=>/[\p{L}\p{M}\p{N}]/u.test(word.text))
 for(let i=1;i<words.length;i++)assert.ok(words[i-1].id===undefined||words[i].id===undefined,'Consecutive words must not both be hidden')
}
test('never hides consecutive words, including across lines and stanzas',()=>{
 for(const song of [sections,[sections.join('\n')],...songs.filter(canMakePuzzle)]) {
  for(const difficulty of ['easy','medium','hard'])for(let run=0;run<30;run++)assertSeparated(puzzle(song,difficulty))
 }
})
test('requires ten spaced candidates and avoids random selection dead ends',()=>{
 const unique=sections[0].split(' ')
 assert.equal(canMakePuzzle([unique.slice(0,10).join(' ')]),false)
 assert.throws(()=>puzzle([unique.slice(0,10).join(' ')]))
 const nineteen=[...unique,...sections[1].split(' ').slice(0,3)]
 for(const song of [[nineteen.join(' ')],nineteen]) {
  assert.equal(canMakePuzzle(song),true)
  for(let run=0;run<30;run++) {
   const result=puzzle(song)
   assert.equal(result.flat().filter(word=>word.id!==undefined).length,10)
   assertSeparated(result)
  }
 }
})
