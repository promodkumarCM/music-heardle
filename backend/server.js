import express from 'express'
import cors from 'cors'
import { pool } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

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
