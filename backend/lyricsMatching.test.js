import test from 'node:test'
import assert from 'node:assert/strict'
import {matchesLyric} from './lyricsMatching.js'

test('accepts exact answers, punctuation, Unicode forms and legacy chillus',()=>{
 for(const [a,b] of [['പുഞ്ചിരിക്കും!','പുഞ്ചിരിക്കും'],['പുഞ്ചിരിക്കും'.normalize('NFD'),'പുഞ്ചിരിക്കും'],['അവൻ','അവന്\u200d']])assert.ok(matchesLyric(a,b))
})
test('accepts one final-letter difference in longer Malayalam answers',()=>{
 for(const [a,b] of [['പുഞ്ചിരിക്കു','പുഞ്ചിരിക്കും'],['പുഞ്ചിരിക്കുന്നൂ','പുഞ്ചിരിക്കുന്നു'],['പുഞ്ചിരിക്കുൽ','പുഞ്ചിരിക്കുൾ']]) {
  assert.ok(matchesLyric(a,b),`${a} / ${b}`)
  assert.ok(matchesLyric(b,a),`${b} / ${a}`)
 }
})
test('rejects different words, short near matches, missing words and multiple errors',()=>{
 for(const [a,b] of [['മഴ','മല'],['പുഞ്ചരിക്കും','പുഞ്ചിരിക്കും'],['പുഞ്ചിരിക്കാത്ത','പുഞ്ചിരിക്കും'],['','പുഞ്ചിരിക്കും'],['പുഞ്ചിരി','പുഞ്ചിരിക്കും'],['punjirikkum','പുഞ്ചിരിക്കും'],['123','124']])assert.equal(matchesLyric(a,b),false,`${a} / ${b}`)
})
