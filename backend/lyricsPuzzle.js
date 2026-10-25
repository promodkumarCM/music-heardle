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
// Count real words continuously across line and stanza boundaries. Whitespace
// and punctuation alone cannot act as the visible word between two blanks.
function wordPositions(sections) {
  const positions = new Map()
  let position = 0
  sections.forEach((section, sectionIndex) => section.split(/(\s+)/).forEach((text, index) => {
    if (normalize(text)) positions.set(`${sectionIndex}:${index}`, position++)
  }))
  return positions
}
function spacedCapacity(positions) {
  let count = 0, previous = -2
  for (const position of positions) if (position > previous + 1) { count++; previous = position }
  return count
}
export function canMakePuzzle(sections) {
  if (!Array.isArray(sections) || !sections.every(section => typeof section === 'string')) return false
  const candidates = candidatesFor(sections), positions = wordPositions(sections)
  const eligible = candidates.flatMap((section, s) => section.map(index => positions.get(`${s}:${index}`)))
  return spacedCapacity(eligible) >= 10
}
export function puzzle(sections, difficulty = 'easy') {
  if (!difficulties.includes(difficulty)) throw new Error('Unknown difficulty.')
  const candidates = candidatesFor(sections)
  const positions = wordPositions(sections)
  const eligible = candidates.flatMap((section, s) => section.map(index => `${s}:${index}`))
  if (spacedCapacity(eligible.map(key => positions.get(key))) < 10) throw new Error('Song needs at least 10 non-consecutive unique Malayalam words.')
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
  const availableWords = new Set(eligible)
  function options(line) {
    return line.words.filter(key => {
      if (!availableWords.has(key)) return false
      const position = positions.get(key)
      // Preserve enough room for ten spaced blanks even after a random pick.
      const remaining = eligible.filter(other => availableWords.has(other) && Math.abs(positions.get(other) - position) > 1)
      return spacedCapacity(remaining.map(other => positions.get(other))) >= 9 - hidden.size
    })
  }
  // Six blanks in the difficulty's region, two in each other third.
  // Balance picks across lines before adding another blank to the same line.
  function take(region, amount) {
    for (let i = 0; i < amount; i++) {
      const available = region.map(line => ({line, choices: options(line)})).filter(entry => entry.choices.length)
      if (!available.length) break
      const least = Math.min(...available.map(entry => entry.line.count))
      const choices = available.filter(entry => entry.line.count === least)
      const {line, choices: words} = choices[randomInt(choices.length)]
      const selected = words[randomInt(words.length)]
      hidden.add(selected)
      for (const key of availableWords) if (Math.abs(positions.get(key) - positions.get(selected)) <= 1) availableWords.delete(key)
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
