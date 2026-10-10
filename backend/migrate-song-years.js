// Safe to rerun on existing databases; never replace manually entered years.
import { pool } from './db.js'
import { readFile } from 'node:fs/promises'

try {
  const [columns] = await pool.query("SHOW COLUMNS FROM songs LIKE 'release_year'")
  if (!columns.length) await pool.query('ALTER TABLE songs ADD COLUMN release_year SMALLINT UNSIGNED NULL')
  const sql = await readFile(new URL('./song-years.sql', import.meta.url), 'utf8')
  for (const statement of sql.split(';').filter(value => value.trim())) await pool.query(statement)
  const [[counts]] = await pool.query('SELECT COUNT(*) AS total, COUNT(release_year) AS dated FROM songs')
  console.log(counts)
} finally {
  await pool.end()
}
