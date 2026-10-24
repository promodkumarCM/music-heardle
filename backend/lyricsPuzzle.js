import { randomInt } from 'node:crypto'
export const difficulties = ['easy', 'medium', 'hard']
const normalize = value => value.normalize('NFC').replace(/[\u200c\u200d]/g, '').replace(/[^\p{L}\p{M}\p{N}]/gu, '')
function candidatesFor(sections) {
  const frequency = new Map()
  const tokens = sections.map(section => section.split(/(\s+)/))
  for (const text of tokens.flat()) {
    const key = normalize(text)
    if (key) frequency.set(key, (frequency.get(key) || 0) + 1)
  }
  return tokens.map(section => section.map((text, index) =>
    /[\u0d00-\u0d7f]/u.test(text) && !/[()]/.test(text) && frequency.get(normalize(text)) === 1 ? index : -1
  ).filter(index => index >= 0))
}
export function canMakePuzzle(sections) {
  return Array.isArray(sections) && sections.every(section => typeof section === 'string') && candidatesFor(sections).flat().length >= 10
}
export function puzzle(sections, difficulty = 'easy') {
  if (!difficulties.includes(difficulty)) throw new Error('Unknown difficulty.')
  const candidates = candidatesFor(sections)
  const middle = (sections.length - 1) / 2
  // Prefer the requested region, expanding to nearby stanzas when necessary.
  const rank = index => difficulty === 'easy' ? Math.max(0, index - 1) : difficulty === 'hard' ? Math.max(0, sections.length - 2 - index) : Math.abs(index - middle)
  const priority = sections.map((_, index) => index).sort((a, b) => rank(a) - rank(b) || a - b)
  const hidden = new Set()
  for (let start = 0; start < priority.length && hidden.size < 10;) {
    const distance = rank(priority[start])
    const pool = []
    while (start < priority.length && rank(priority[start]) === distance) {
      const section = priority[start++]
      pool.push(...candidates[section].map(index => `${section}:${index}`))
    }
    while (pool.length && hidden.size < 10) hidden.add(pool.splice(randomInt(pool.length), 1)[0])
  }
  if (hidden.size !== 10) throw new Error('Song needs at least 10 unique Malayalam words.')
  let id = 0
  return sections.map((section, sectionIndex) => section.split(/(\s+)/).map((text, index) =>
    hidden.has(`${sectionIndex}:${index}`) ? { id: id++, text } : { text }
  ))
}
