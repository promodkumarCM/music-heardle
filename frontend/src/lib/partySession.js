export function readPartySession(mode) {
  try {
    const session = JSON.parse(sessionStorage.getItem(`party-${mode}`))
    return session?.code && session?.token ? session : null
  } catch {
    return null
  }
}

export function savePartySession(mode, session) {
  try {
    sessionStorage.setItem(`party-${mode}`, JSON.stringify(session))
  } catch {
    // The current room can still be played when browser storage is unavailable.
  }
}

export function findPartySession(mode, game, roomCode) {
  const saved = readPartySession(mode)
  if (!saved) return null
  const matches = roomCode
    ? saved.code === roomCode.toUpperCase()
    : [saved.entryGame, saved.game].includes(game)
  return matches ? saved : null
}

export function clearPartySession(mode, session) {
  if (session && readPartySession(mode)?.token === session.token) {
    sessionStorage.removeItem(`party-${mode}`)
  }
}

export function partyResumeHref(mode, session) {
  const params = new URLSearchParams({game: session.game, room: session.code})
  return `#${mode}-game?${params}`
}
