// Each difficulty plays a fixed-length snippet. Switching difficulty on the
// same song re-plays from the same point at the new (usually longer) length.
export const DIFFICULTIES = [
  { name: 'Impossible', snippetSeconds: 1, weight: 9, color: '#a855f7' },
  { name: 'Expert', snippetSeconds: 3, weight: 7, color: '#ef4444' },
  { name: 'Hard', snippetSeconds: 5, weight: 5, color: '#f97316' },
  { name: 'Medium', snippetSeconds: 8, weight: 3, color: '#eab308' },
  { name: 'Easy', snippetSeconds: 12, weight: 1, color: '#4ade80' },
]

export const DEFAULT_DIFFICULTY = DIFFICULTIES.find((d) => d.name === 'Hard')
