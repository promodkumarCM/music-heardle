import {pool} from './db.js'
import {characterTable,ensureCharacterActor,ensureCharacterImage} from './characterSchema.js'
try {await pool.query(characterTable);await ensureCharacterActor(pool);await ensureCharacterImage(pool);console.log('Character Files catalog ready. Add verified entries through Admin.')}finally{await pool.end()}
