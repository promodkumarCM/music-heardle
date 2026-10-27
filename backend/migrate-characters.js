import {pool} from './db.js'
import {characterTable} from './characterSchema.js'
try {await pool.query(characterTable);console.log('Character Files catalog ready. Add verified entries through Admin.')}finally{await pool.end()}
