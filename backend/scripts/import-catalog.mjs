import fs from 'node:fs'
import { pool } from '../db.js'

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '')
const verified = JSON.parse(fs.readFileSync(new URL('../data/verified-songs.json', import.meta.url)))
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  const [existing] = await connection.query('SELECT * FROM songs FOR UPDATE')
  const titles = new Set(existing.map(row => normalize(row.title)))
  const ids = new Set(existing.map(row => row.youtube_id))
  const selected = []
  for (const song of verified) {
    if (titles.has(normalize(song.title)) || ids.has(song.youtubeId) || song.youtubeId === 'xmVITsClKvw') continue
    titles.add(normalize(song.title))
    ids.add(song.youtubeId)
    selected.push(song)
    if (selected.length === 250) break
  }
  if (selected.length !== 250) throw Error(`Need 250 new verified songs; found ${selected.length}`)
  fs.writeFileSync(new URL('../data/catalog-before-import.json', import.meta.url), JSON.stringify(existing, null, 2))
  const inserted = []
  for (const song of selected) {
    const [result] = await connection.query('INSERT INTO songs (title, movie, youtube_id) VALUES (?, ?, ?)', [song.title, song.movie, song.youtubeId])
    inserted.push({id:result.insertId, ...song})
  }
  const [all] = await connection.query('SELECT id,title,youtube_id FROM songs')
  if (all.length !== existing.length + 250 || new Set(all.map(s=>normalize(s.title))).size !== all.length || new Set(all.map(s=>s.youtube_id)).size !== all.length) throw Error('Catalog uniqueness/count check failed')
  fs.writeFileSync(new URL('../data/imported-songs.json', import.meta.url), JSON.stringify(inserted, null, 2))
  await connection.commit()
  console.log(`Imported ${inserted.length} songs. Total ${all.length}. No duplicate normalized titles or video IDs.`)
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
  await pool.end()
}
