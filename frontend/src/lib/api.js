const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function fetchSongs(signal) {
  const res = await fetch(`${BASE}/songs`, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load songs')
  return res.json()
}

export async function submitScore({ playerName, level, timeMs }) {
  const res = await fetch(`${BASE}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, level, timeMs }),
  })
  if (!res.ok) throw new Error('Failed to submit score')
  return res.json()
}

export async function fetchLeaderboard(level) {
  const res = await fetch(`${BASE}/leaderboard?level=${level}`)
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}
