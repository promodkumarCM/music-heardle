const KEY = 'mh_progress'

// ponytail: browser localStorage is the whole DB — cleared when the user
// clears site data, by design (no backend account system for progress)
export function getProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : { score: 0, playerName: '' }
  } catch {
    return { score: 0, playerName: '' }
  }
}

export function setProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}
