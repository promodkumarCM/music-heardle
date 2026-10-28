import {pool} from './db.js'
import {characterTable,ensureCharacterActor,ensureCharacterImage,ensureActorPhotos,ensureCharacterReveal} from './characterSchema.js'
try {await pool.query(characterTable);await ensureCharacterActor(pool);await ensureCharacterImage(pool);await ensureActorPhotos(pool);await ensureCharacterReveal(pool);console.log('Character Files catalog ready. Add verified entries through Admin.')}finally{await pool.end()}
