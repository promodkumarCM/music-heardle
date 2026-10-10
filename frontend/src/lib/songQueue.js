export function fillQueue(catalog, queue, currentId, excluded = new Set()) {
  const available = catalog.filter((song) => !excluded.has(song.id))
  const allowedIds = new Set(available.map((song) => song.id))
  const next = queue.filter((song) => allowedIds.has(song.id)).slice(0, 5)
  while (available.length && next.length < 5) {
    const used = new Set([currentId, ...next.map((song) => song.id)])
    let pool = available.filter((song) => !used.has(song.id))
    if (!pool.length) pool = available.filter((song) => song.id !== (next.at(-1)?.id ?? currentId))
    if (!pool.length) pool = available
    next.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return next
}
