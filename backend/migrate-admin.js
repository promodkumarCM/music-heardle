import {ensureDialogueEnglish,ensureDialogueVariants} from './dialogueSchema.js'
import {pool} from './db.js'
import songs from './lyricsSeed.js'
try {
 await ensureDialogueEnglish(pool)
 await ensureDialogueVariants(pool)
 await pool.query(`CREATE TABLE IF NOT EXISTS lyric_songs (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, sections JSON NOT NULL) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
 await pool.query(`CREATE TABLE IF NOT EXISTS app_migrations (name VARCHAR(100) PRIMARY KEY)`)
 const connection=await pool.getConnection()
 try {await connection.beginTransaction();const [done]=await connection.query('SELECT name FROM app_migrations WHERE name=?',['lyrics-catalog-v1']);if(!done.length){for(const [i,title] of ['ചോര വീണ മണ്ണിൽ','നിലാ പൈതലേ','ഹരിമുരളീ രവം','മഴത്തുള്ളികൾ'].entries())await connection.query('INSERT INTO lyric_songs (title,sections) VALUES (?,?)',[title,JSON.stringify(songs[i])]);await connection.query('INSERT INTO app_migrations (name) VALUES (?)',['lyrics-catalog-v1'])}await connection.commit()}catch(error){await connection.rollback();throw error}finally{connection.release()}
 console.log('Lyrics database catalog ready')
}finally{await pool.end()}
