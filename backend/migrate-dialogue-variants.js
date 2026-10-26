import {pool} from './db.js'
import {ensureDialogueEnglish,ensureDialogueVariants} from './dialogueSchema.js'
try {
 await ensureDialogueEnglish(pool)
 await ensureDialogueVariants(pool)
 console.log('Multiple bilingual dialogues ready. Existing entries preserved.')
} finally {await pool.end()}
