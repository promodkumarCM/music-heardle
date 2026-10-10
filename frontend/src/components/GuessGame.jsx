import { useEffect, useRef, useState } from 'react'
import Player from './Player'
import Radio from './Radio'
import YearTuner from './YearTuner'
import { fillQueue } from '../lib/songQueue'
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../data/levels'
import { getProgress, setProgress } from '../lib/storage'
import { fetchSongs, submitScore } from '../lib/api'

const MAX_SNIPPET_SECONDS = Math.max(...DIFFICULTIES.map((d) => d.snippetSeconds))
const YEAR_STATIONS = [0, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025]

function pickSong(songs, excludeId) {
  const pool = songs.filter((s) => s.id !== excludeId)
  const list = pool.length ? pool : songs
  return list[Math.floor(Math.random() * list.length)]
}

export default function GuessGame({ onScoreSaved }) {
  const [progress, setProgressState] = useState(getProgress)
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY)
  const [songs, setSongs] = useState([])
  const [afterYear, setAfterYear] = useState(0)
  const eligibleSongs = songs.filter((item) => !afterYear || item.releaseYear > afterYear)
  const [song, setSong] = useState(null)
  const [catalogError, setCatalogError] = useState('')
  const [catalogRequest, setCatalogRequest] = useState(0)
  const [guess, setGuess] = useState('')
  const [status, setStatus] = useState('active') // active | correct | revealed
  const [lastTimeMs, setLastTimeMs] = useState(0)
  const [playbackStatus, setPlaybackStatus] = useState('Press Tune to play the clip.')
  const [volume, setVolume] = useState(70)
  const [playerReady, setPlayerReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const queueRef = useRef([])
  const unavailableRef = useRef(new Set())
  const playerRef = useRef(null)
  const startedAtRef = useRef(null)
  const songRef = useRef(song)
  songRef.current = song

  useEffect(() => setProgress(progress), [progress])

  useEffect(() => {
    const controller = new AbortController()
    setCatalogError('')
    fetchSongs(controller.signal)
      .then((catalog) => {
        if (controller.signal.aborted) return
        if (!catalog.length) {
          setCatalogError('No songs are available yet. Please try again later.')
          return
        }
        setSongs(catalog)
        const first = pickSong(catalog)
        queueRef.current = fillQueue(catalog, [], first.id)
        setSong(first)
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogError('Could not load songs. Please try again.')
      })
    return () => controller.abort()
  }, [catalogRequest])

  useEffect(() => {
    if (!playerReady || !song) return
    const upcoming = status === 'active' ? song : queueRef.current[0]
    if (upcoming) playerRef.current?.prepare(upcoming.youtubeId)
  }, [playerReady, song, status])

  function takeNextSong() {
    queueRef.current = fillQueue(eligibleSongs, queueRef.current, songRef.current?.id, unavailableRef.current)
    const next = queueRef.current.shift()
    if (!next) {
      setPlaybackStatus('No playable songs remain. Reload to try again.')
      return null
    }
    queueRef.current = fillQueue(eligibleSongs, queueRef.current, next.id, unavailableRef.current)
    return next
  }

  function playClip() {
    if (startedAtRef.current == null) startedAtRef.current = Date.now()
    setLoadError(false)
    playerRef.current?.playSnippet(song.youtubeId, 0, difficulty.snippetSeconds, volume)
  }

  // A song that won't load (blocked embed, dead link, etc) would otherwise
  // leave the player stuck forever — swap in a different song automatically
  // instead of making the player stare at a dead Play button.
  function handleUnplayable(videoId) {
    if (status !== 'active' || songRef.current?.youtubeId !== videoId) return
    playerRef.current?.stop()
    unavailableRef.current.add(songRef.current.id)
    const next = takeNextSong()
    if (!next) return
    setSong(next)
    setGuess('')
    startedAtRef.current = null
    setLoadError(true)
    setPlaybackStatus('Clip unavailable. Press Tune to try the next song.')
  }

  function checkGuess(value) {
    if (status !== 'active' || !value.trim()) return
    if (value.trim().toLowerCase() !== song.title.trim().toLowerCase()) {
      playerRef.current?.stop()
      setStatus('wrong')
      return
    }
    const timeMs = Date.now() - (startedAtRef.current ?? Date.now())
    playerRef.current?.stop()
    setLastTimeMs(timeMs)
    setStatus('correct')
    const nextScore = progress.score + difficulty.weight * 20
    setProgressState({ ...progress, score: nextScore })
    if (progress.playerName) {
      submitScore({ playerName: progress.playerName, level: difficulty.weight, timeMs }).then(() => onScoreSaved?.()).catch(() => {})
    }
  }

  function handleGuessChange(e) {
    setGuess(e.target.value)
  }

  function tuneYear(year) {
    playerRef.current?.stop()
    setAfterYear(year)
    const pool = songs.filter((item) => (!year || item.releaseYear > year) && !unavailableRef.current.has(item.id))
    const next = pool.length ? pickSong(pool, song?.id) : null
    queueRef.current = next ? fillQueue(pool, [], next.id, unavailableRef.current) : []
    setSong(next)
    setGuess('')
    setStatus('active')
    setLoadError(false)
    setPlaybackStatus('Press Tune to play the clip.')
    startedAtRef.current = null
    setDifficulty(DIFFICULTIES[0])
  }

  function handleSubmit(e) {
    e.preventDefault()
    checkGuess(guess)
  }

  function giveUp() {
    if (status !== 'active') return
    playerRef.current?.stop()
    setStatus('revealed')
    setDifficulty(DIFFICULTIES[0]) // always back to Impossible for the next song
  }

  function nextRound() {
    setLoadError(false)
    setPlaybackStatus('Press Tune to play the clip.')
    const next = takeNextSong()
    if (!next) return
    setSong(next)
    setGuess('')
    setStatus('active')
    startedAtRef.current = null
    setDifficulty(DIFFICULTIES[0]) // always back to Impossible for the next song
  }

  if (!songs.length) {
    return (
      <div className="card game">
        <p role="status">{catalogError || 'Loading songs…'}</p>
        {catalogError && <button onClick={() => setCatalogRequest((value) => value + 1)}>Retry</button>}
      </div>
    )
  }

  const nameSet = !!progress.playerName

  return (
    <>
      <Radio
        feedback={status}
        roundId={song?.id}
        yearTuner={nameSet && <YearTuner years={YEAR_STATIONS} value={afterYear} onChange={tuneYear} />}
        tunerContent={nameSet && !song ? <p className="radio-hint" role="status">No playable songs with a known release year after {afterYear}. Choose another year or All.</p> : nameSet && status === 'active' ? (
          <>
              <p className="radio-hint" role="status">{playbackStatus}</p>

              <form className="guess-row" autoComplete="off" onSubmit={handleSubmit}>
                <input
                  aria-label="Guess song"
                  autoComplete="off"
                  spellCheck={false}
                  value={guess}
                  onChange={handleGuessChange}
                  placeholder="Guess song..."
                />
                {guess.trim().length >= 2 && (
                  <div className="song-suggestions" aria-label="Matching songs">
                    {eligibleSongs.filter((item) => item.title.toLowerCase().includes(guess.trim().toLowerCase())).slice(0, 5).map((item) => (
                      <button type="button" key={item.id} onClick={() => { setGuess(item.title); checkGuess(item.title) }}>{item.title}</button>
                    ))}
                  </div>
                )}
                <div className="radio-guess-actions"><button type="submit" disabled={!guess.trim()}>Guess</button><button type="button" onClick={giveUp}>Give up</button></div>
              </form>
          </>
        ) : nameSet ? (
          <div className="radio-round-result" role="status">
            <img
              key={song.youtubeId}
              className="radio-answer-thumbnail"
              src={`https://i.ytimg.com/vi/${song.youtubeId}/mqdefault.jpg`}
              alt={`${song.movie} — ${song.title}`}
              onError={(event) => { event.currentTarget.style.display = 'none' }}
            />
            <span className={`radio-result-label ${status === 'wrong' ? 'radio-result-wrong' : ''}`}>{status === 'correct' ? '🎉 Correct!' : status === 'wrong' ? 'Wrong song. The answer is:' : 'The answer'}</span>
            <strong>{song.title}</strong>
            <span className="radio-result-movie">{song.movie}</span>
            {status === 'correct' && <span className="radio-result-time">Guessed in {(lastTimeMs / 1000).toFixed(1)}s</span>}
            <button onClick={nextRound}>Next song ▶</button>
          </div>
        ) : null}
        onPlay={playClip}
        disabled={!song || !playerReady || !nameSet || status !== 'active'}
        ready={playerReady}
        seconds={difficulty.snippetSeconds}
        volume={volume}
        onVolumeChange={(value) => {
          setVolume(value)
          playerRef.current?.setVolume(value)
        }}
      >
        {nameSet && (
          <div className="radio-game-panel">
          <div className="pills">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.name}
                className="pill"
                aria-pressed={difficulty.name === d.name}
                style={{
                  '--pill-color': d.color,
                  opacity: difficulty.name === d.name ? 1 : 0.55,
                }}
                onClick={() => setDifficulty(d)}
              >
                {d.name}
              </button>
            ))}
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${(difficulty.snippetSeconds / MAX_SNIPPET_SECONDS) * 100}%`,
                background: difficulty.color,
              }}
            />
            {DIFFICULTIES.map((d) => (
              <div
                key={d.name}
                className="progress-tick"
                title={`${d.name} — ${d.snippetSeconds}s`}
                style={{ left: `${(d.snippetSeconds / MAX_SNIPPET_SECONDS) * 100}%` }}
              />
            ))}
          </div>

          <div className="score-row">
            <span>{difficulty.name}</span>
            <span>Score: {progress.score}</span>
          </div>
          </div>
        )}
      </Radio>
    <Player onPlaybackStatus={setPlaybackStatus} ref={playerRef} onReady={() => setPlayerReady(true)} onUnplayable={handleUnplayable} />
    {!nameSet && <div className="card game">

      {!nameSet ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const name = new FormData(e.target).get('name')?.toString().trim()
            if (name) setProgressState({ ...progress, playerName: name })
          }}
        >
          <label>
            Your name:
            <input name="name" required maxLength={24} />
          </label>
          <button type="submit">Start</button>
        </form>
      ) : null}
    </div>}
    </>
  )
}
