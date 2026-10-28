const BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:4000`

export async function songRequest(path, body={}, signal) {
 if(path==='queue')body={...body,session:stockSession()}
 const res=await fetch(BASE+'/song-game/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal,cache:'no-store'});
 const data=await res.json();if(!res.ok)throw new Error(data.error||'Song request failed');return data
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
  if(action==='start')body={...body,session:stockSession()}
  const response = await fetch(`${BASE}/clue-game/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal,
  })
  const data = await response.json()
  if (!response.ok) { const error = new Error(data.error || 'Please try again.'); error.expired = response.status === 410; throw error }
  return data
}

export async function fetchPictures(signal) {
 const r=await fetch(BASE+'/picture-game',{signal});if(!r.ok)throw Error('Could not load picture clues.');return r.json()
}
export async function guessPicture(id,guess,reveal=false) {
 const r=await fetch(BASE+'/picture-game/'+id+'/guess',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guess,reveal})})
 const data=await r.json();if(!r.ok)throw Error(data.error||'Could not check answer.');return data
}

let fallbackStockSession
function stockSession(){try{let id=sessionStorage.getItem('padam.stock-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('padam.stock-session',id)}return id}catch{return fallbackStockSession??=crypto.randomUUID()}}
