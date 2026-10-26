import {expandDialogues} from './dialogueVariants.js'
import {uploadDirectory} from './pictureUploads.js'
import pictureGame from './pictureGame.js'
import songGame from './songGame.js'
import express from 'express'
import clueGame from './clueGame.js'
import lyricsGame from './lyricsGame.js'
import admin from './admin.js'
import buzzer from './buzzer.js'
import partyGame from './partyGame.js'
import titleSuggestions from './titleSuggestions.js'
import transliteration from './transliteration.js'
import cors from 'cors'
import { pool } from './db.js'
import { normalizeMovie, matchMovie } from './movieMatching.js'

const app = express()
app.use(cors())
app.use('/admin',express.json({limit:'2mb'}))
app.use(express.json())
app.use('/uploads/picture-clues', express.static(uploadDirectory,{dotfiles:'deny',index:false,setHeaders:res=>res.set('X-Content-Type-Options','nosniff')}))
app.use('/picture-game', pictureGame)
app.use('/song-game', songGame)
app.use('/admin', admin)
app.use('/buzzer', buzzer)
app.use('/party-game', partyGame)
app.use('/title-suggestions', titleSuggestions)
app.use('/transliteration', transliteration)
app.use('/clue-game', clueGame)
app.use('/lyrics-game', lyricsGame)

async function movieCatalog() {
  const [songs] = await pool.query('SELECT DISTINCT movie FROM songs')
  const [dialogues] = await pool.query('SELECT movie, aliases FROM dialogues')
  const merged = new Map(songs.map(row => [normalizeMovie(row.movie), { movie: row.movie, aliases: [] }]))
  for (const row of dialogues) merged.set(normalizeMovie(row.movie), { movie: row.movie, aliases: typeof row.aliases === 'string' ? JSON.parse(row.aliases) : row.aliases })
  return [...merged.values()]
}
app.get('/movies', (req,res) => res.status(410).json({error:'Public catalog disabled.'}))

app.get('/dialogues', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, dialogue, dialogue_english, dialogue_variants FROM dialogues ORDER BY id')
    res.set('Cache-Control', 'no-store').json(expandDialogues(rows).map(({id,dialogue,dialogue_english})=>({id,dialogue,dialogue_english})))
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

app.get('/songs', (req,res) => res.status(410).json({error:'Use song-game rounds.'}))
app.post('/scores', (req,res) => res.status(410).json({error:'Scores are saved by song-game rounds.'}))

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
