import test from 'node:test'
import assert from 'node:assert/strict'
import {validateDialogueVariants,expandDialogues} from './dialogueVariants.js'
test('keeps each English version paired with its native dialogue',()=>{
 const pairs=validateDialogueVariants([{dialogue:' ആദ്യ വരി ',dialogue_english:' First line '},{dialogue:'രണ്ടാമത്തെ വരി'}])
 assert.deepEqual(pairs,[{dialogue:'ആദ്യ വരി',dialogue_english:'First line'},{dialogue:'രണ്ടാമത്തെ വരി',dialogue_english:''}])
 const rows=expandDialogues([{id:6,movie:'Movie',aliases:['Alias'],dialogue:'Old',dialogue_variants:JSON.stringify(pairs)}])
 assert.equal(rows.length,2)
 assert.equal(rows[0].dialogue_english,'First line')
 assert.equal(rows[1].dialogue,'രണ്ടാമത്തെ വരി')
 assert.ok(rows.every(row=>row.id===6&&row.movie==='Movie'&&row.aliases[0]==='Alias'))
})
test('existing single-dialogue rows remain usable',()=>{
 const row={id:6,dialogue:'Original',dialogue_english:'English',dialogue_variants:null}
 assert.deepEqual(expandDialogues([row]),[row])
})
test('rejects empty, duplicate, excessive and malformed lists',()=>{
 for(const input of [[],null,[{dialogue:''}],[{dialogue:'A'},{dialogue:' A '}],[{dialogue:'A',dialogue_english:123}],Array.from({length:31},(_,i)=>({dialogue:String(i)}))])assert.throws(()=>validateDialogueVariants(input))
})

test('conversation lines stay together with speaker and bilingual text',()=>{
 const lines=[{speaker:1,dialogue:' ആദ്യ ചോദ്യം ',dialogue_english:' Question '},{speaker:2,dialogue:'മറുപടി'}]
 const pairs=validateDialogueVariants([{dialogue_lines:lines}])
 assert.equal(pairs[0].dialogue,'ആദ്യ ചോദ്യം\nമറുപടി')
 assert.equal(pairs[0].dialogue_english,'Question')
 assert.deepEqual(pairs[0].dialogue_lines,[{speaker:1,dialogue:'ആദ്യ ചോദ്യം',dialogue_english:'Question'},{speaker:2,dialogue:'മറുപടി',dialogue_english:''}])
 const expanded=expandDialogues([{id:9,dialogue_variants:JSON.stringify(pairs)}])
 assert.equal(expanded.length,1)
 assert.deepEqual(expanded[0].dialogue_lines,pairs[0].dialogue_lines)
 for(const invalid of [[],[lines[0]],[{...lines[0],speaker:3},lines[1]],[{...lines[0],dialogue:''},lines[1]],Array(21).fill(lines[0])])assert.throws(()=>validateDialogueVariants([{dialogue_lines:invalid}]))
})
