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

export async function fetchDialogues(signal) {
  const response = await fetch(`${BASE}/dialogues`, { signal })
  if (!response.ok) throw new Error('Could not load dialogue clues. Please try again.')
  return response.json()
}

export async function guessDialogue(id, guess, reveal = false) {
  const response = await fetch(`${BASE}/dialogues/${id}/guess`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess, reveal }),
  })
  if (!response.ok) throw new Error('Could not check the answer. Please try again.')
  return response.json()
}

export async function clueGameRequest(action, body = {}, signal) {
  const response = await fetch(`${BASE}/clue-game/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal,
  })
  const data = await response.json()
  if (!response.ok) { const error = new Error(data.error || 'Please try again.'); error.expired = response.status === 410; throw error }
  return data
}
