import express from 'express'
import cors from 'cors'
import { pool } from './db.js'
import { normalizeMovie, rankMovies, matchMovie } from './movieMatching.js'

const app = express()
app.use(cors())
app.use(express.json())

async function movieCatalog() {
  const [songs] = await pool.query('SELECT DISTINCT movie FROM songs')
  const [dialogues] = await pool.query('SELECT movie, aliases FROM dialogues')
  const merged = new Map(songs.map(row => [normalizeMovie(row.movie), { movie: row.movie, aliases: [] }]))
  for (const row of dialogues) merged.set(normalizeMovie(row.movie), { movie: row.movie, aliases: typeof row.aliases === 'string' ? JSON.parse(row.aliases) : row.aliases })
  return [...merged.values()]
}
app.get('/movies', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (query.length < 2 || query.length > 100) return res.json([])
  try {
    const normalized = normalizeMovie(query)
    const ranked = rankMovies(query, await movieCatalog())
    const matches = ranked.filter(row => [row.movie, ...row.aliases].some(name => normalizeMovie(name).includes(normalized)) || row.distance <= (normalized.length >= 10 ? 2 : 1))
    res.json(matches.slice(0, 6).map(row => row.movie))
  } catch (error) { res.status(503).json({ error: 'Movie suggestions unavailable' }) }
})

app.get('/dialogues', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, dialogue FROM dialogues ORDER BY id')
    res.set('Cache-Control', 'no-store').json(rows)
  } catch (error) {
    console.error('Dialogue catalog:', error.message)
    res.status(503).json({ error: 'Could not load dialogue clues.' })
  }
})

app.post('/dialogues/:id/guess', async (req, res) => {
  const id = Number(req.params.id)
  const { guess, reveal } = req.body || {}
  if (!Number.isSafeInteger(id) || id < 1 || (reveal !== true && (typeof guess !== 'string' || !guess.trim() || guess.length > 255))) {
    return res.status(400).json({ error: 'Enter a movie name.' })
  }
  try {
    const [rows] = await pool.query('SELECT movie, aliases FROM dialogues WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Clue not found.' })
    const row = rows[0]
    const matched = reveal === true ? { correct: false } : matchMovie(guess, row.movie, await movieCatalog())
    res.json({ ...matched, ...(matched.correct || reveal === true ? { movie: row.movie } : {}) })
  } catch (error) {
    console.error('Dialogue answer:', error.message)
    res.status(503).json({ error: 'Could not check your answer. Try again.' })
  }
})

app.get('/songs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, movie, youtube_id AS youtubeId FROM songs ORDER BY id')
    res.set('Cache-Control', 'no-store').json(rows)
  } catch (error) {
    console.error('Could not load songs:', error.message)
    res.status(503).json({ error: 'Song catalog unavailable' })
  }
})

app.post('/scores', async (req, res) => {
  const { playerName, level, timeMs } = req.body || {}
  if (!playerName || !Number.isInteger(level) || !Number.isInteger(timeMs)) {
    return res.status(400).json({ error: 'playerName, level, timeMs required' })
  }
  await pool.query(
    'INSERT INTO scores (player_name, level, time_ms) VALUES (?, ?, ?)',
    [String(playerName).slice(0, 24), level, timeMs]
  )
  res.status(201).json({ ok: true })
})

app.get('/leaderboard', async (req, res) => {
  const level = Number(req.query.level) || 1
  const [rows] = await pool.query(
    'SELECT id, player_name AS playerName, level, time_ms AS timeMs, created_at AS createdAt FROM scores WHERE level = ? ORDER BY time_ms ASC LIMIT 10',
    [level]
  )
  res.json(rows)
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Leaderboard API on :${port}`))
