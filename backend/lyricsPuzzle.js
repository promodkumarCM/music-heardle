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
  // Work with actual lyric lines, including newlines inside each stanza.
  const lines = []
  sections.forEach((section, sectionIndex) => {
    const eligible = new Set(candidates[sectionIndex])
    let line = []
    section.split(/(\s+)/).forEach((text, index) => {
      if (eligible.has(index)) line.push(`${sectionIndex}:${index}`)
      if (text.includes('\n')) { lines.push(line); line = [] }
    })
    lines.push(line)
  })
  const regions = Array.from({ length: 3 }, () => [])
  lines.forEach((words, index) => {
    regions[Math.min(2, Math.floor(index * 3 / lines.length))].push({ words: [...words], count: 0 })
  })
  const preferred = difficulties.indexOf(difficulty)
  const hidden = new Set()
  // Six blanks in the difficulty's region, two in each other third.
  // Balance picks across lines before adding another blank to the same line.
  function take(region, amount) {
    for (let i = 0; i < amount; i++) {
      const available = region.filter(line => line.words.length)
      if (!available.length) break
      const least = Math.min(...available.map(line => line.count))
      const choices = available.filter(line => line.count === least)
      const line = choices[randomInt(choices.length)]
      hidden.add(line.words.splice(randomInt(line.words.length), 1)[0])
      line.count++
    }
  }
  regions.forEach((region, index) => take(region, index === preferred ? 6 : 2))
  // Sparse or repeated lyrics may not have enough eligible words in a third.
  take(regions.flat(), 10 - hidden.size)
  if (hidden.size !== 10) throw new Error('Song needs at least 10 unique Malayalam words.')
  let id = 0
  return sections.map((section, sectionIndex) => section.split(/(\s+)/).map((text, index) =>
    hidden.has(`${sectionIndex}:${index}`) ? { id: id++, text } : { text }
  ))
}
