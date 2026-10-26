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
