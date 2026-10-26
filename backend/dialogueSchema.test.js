import test from 'node:test'
import assert from 'node:assert/strict'
import {ensureDialogueEnglish} from './dialogueSchema.js'
test('English dialogue migration adds the column once',async()=>{
 let exists=false;const queries=[]
 const db={query:async sql=>{queries.push(sql);if(sql.startsWith('SELECT'))return [exists?[{COLUMN_NAME:'dialogue_english'}]:[]];exists=true;return [{}]}}
 await ensureDialogueEnglish(db);await ensureDialogueEnglish(db)
 assert.equal(queries.filter(sql=>sql.startsWith('ALTER')).length,1)
 assert.ok(queries[1].includes('TEXT NULL'))
})
