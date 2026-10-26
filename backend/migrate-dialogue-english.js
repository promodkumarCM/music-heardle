import {pool} from './db.js'
import {ensureDialogueEnglish} from './dialogueSchema.js'
try {await ensureDialogueEnglish(pool);console.log('English dialogue field ready. Existing Malayalam dialogues preserved.')} finally {await pool.end()}
