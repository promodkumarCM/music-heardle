import {pool} from './db.js'
import {contributionTable} from './contributions.js'
try {await pool.query(contributionTable);console.log('Contribution review queue ready.')} finally {await pool.end()}
