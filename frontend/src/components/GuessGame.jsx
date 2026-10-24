import { useEffect, useRef, useState } from 'react'
import Player from './Player'
import Radio from './Radio'
import YearTuner from './YearTuner'
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../data/levels'
import { getProgress, setProgress } from '../lib/storage'
import { songRequest } from '../lib/api'

const MAX_SNIPPET_SECONDS = Math.max(...DIFFICULTIES.map((d) => d.snippetSeconds))
const YEAR_STATIONS = [0, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025]

export default function GuessGame({ onScoreSaved }) {
  const [progress, setProgressState] = useState(getProgress)
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY)
  const [songs, setSongs] = useState([])
  const [afterYear, setAfterYear] = useState(0)
  const [song, setSong] = useState(null)
  const [catalogError, setCatalogError] = useState('')
  const [catalogRequest, setCatalogRequest] = useState(0)
  const [busy, setBusy] = useState(false)
  const requestLock = useRef(false)
  const [guess, setGuess] = useState('')
  const [suggestions,setSuggestions]=useState([])
  const [status, setStatus] = useState('active') // active | correct | revealed
  const [lastTimeMs, setLastTimeMs] = useState(0)
  const [playbackStatus, setPlaybackStatus] = useState('Press Tune to play the clip.')
  const [volume, setVolume] = useState(70)
  const [playerReady, setPlayerReady] = useState(false)
  const [preparedVideoId, setPreparedVideoId] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [fullSongId, setFullSongId] = useState(null)
  const queueRef = useRef([])
  const unavailableRef = useRef(new Set())
  const playerRef = useRef(null)
  const songRef = useRef(song)
  songRef.current = song

  useEffect(() => setProgress(progress), [progress])
  useEffect(()=>{
    setSuggestions([])
    if(!song||status!=='active'||guess.trim().length<2)return
    const controller=new AbortController()
    const timer=setTimeout(()=>{
      songRequest(song.id+'/suggestions',{query:guess},controller.signal)
        .then(data=>{if(!controller.signal.aborted)setSuggestions(data.titles)})
        .catch(()=>{})
    },180)
    return()=>{clearTimeout(timer);controller.abort()}
  },[guess,song?.id,status])

  useEffect(() => {
    const controller = new AbortController()
    setCatalogError('')
    songRequest('queue', {afterYear}, controller.signal)
      .then((catalog) => {
        if (controller.signal.aborted) return
        if (!catalog.length) {
          setCatalogError('No songs are available yet. Please try again later.')
          return
        }
        setSongs(catalog)
        const [first,...queue] = catalog
        queueRef.current = queue
        setSong(first)
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogError('Could not load songs. Please try again.')
      })
    return () => controller.abort()
  }, [catalogRequest, afterYear])

  useEffect(() => {
    if (!playerReady || !song) return
    const upcoming = status === 'active' ? song : queueRef.current[0]
    if (upcoming) playerRef.current?.prepare(upcoming.youtubeId)
  }, [playerReady, song, status])

  useEffect(() => {
    if (!song || status !== 'active' || queueRef.current.length >= 5) return
    const controller = new AbortController()
    songRequest('queue', {afterYear, exclude:[song.id,...queueRef.current.map(s=>s.id),...unavailableRef.current]}, controller.signal)
      .then(items => { if (!controller.signal.aborted) {
        const used=new Set([song.youtubeId,...queueRef.current.map(s=>s.youtubeId)])
        queueRef.current=[...queueRef.current,...items.filter(s=>!used.has(s.youtubeId))].slice(0,5)
      } }).catch(() => {})
    return () => controller.abort()
  }, [song, status, afterYear])

  async function takeNextSong() {
    if (!queueRef.current.length) queueRef.current = await songRequest('queue', {afterYear,exclude:[songRef.current?.id,...unavailableRef.current]})
    const next=queueRef.current.shift()
    if (!next) throw new Error('No songs available for this year filter.')
    return next
  }

  async function playClip() {
    if(requestLock.current||!song||preparedVideoId!==song.youtubeId)return
    requestLock.current=true;setBusy(true)
    try {
      const recording=songRequest(song.id+'/play',{weight:difficulty.weight})
      // Keep playback inside the user's click, before yielding to the network.
      playerRef.current?.playSnippet(song.youtubeId,0,difficulty.snippetSeconds,volume)
      await recording;setLoadError(false)
    }
    catch(e){playerRef.current?.stop();setPlaybackStatus(e.message)}finally{requestLock.current=false;setBusy(false)}
  }

  async function handleUnplayable(videoId) {
    if (status!=='active'||songRef.current?.youtubeId!==videoId||requestLock.current) return
    unavailableRef.current.add(songRef.current.id)
    await nextRound()
    setLoadError(true);setPlaybackStatus('Clip unavailable. Press Tune to try the next song.')
  }

  async function finishRound(action,value) {
    if(status!=='active'||requestLock.current)return
    requestLock.current=true;setBusy(true)
    try {
      const data=await songRequest(song.id+'/'+action,{guess:value,playerName:progress.playerName})
      playerRef.current?.stop();setSong(data);setStatus(data.status);setLastTimeMs(data.timeMs)
      if(data.status==='correct'){setProgressState(p=>({...p,score:p.score+data.points}));if(data.scoreSaved)onScoreSaved?.()}
    }catch(e){setPlaybackStatus(e.message)}finally{requestLock.current=false;setBusy(false)}
  }
  function checkGuess(value){if(value.trim())finishRound('guess',value)}

  function handleGuessChange(e) {
    setGuess(e.target.value)
  }

  function tuneYear(year) {
    if(requestLock.current || year === afterYear)return
    playerRef.current?.stop();setFullSongId(null);setAfterYear(year);setSongs([]);setSong(null);queueRef.current=[]
    setGuess('');setStatus('active');setLoadError(false);setPlaybackStatus('Press Tune to play the clip.');setDifficulty(DIFFICULTIES[0])
  }

  function handleSubmit(e) {
    e.preventDefault()
    checkGuess(guess)
  }

  function giveUp(){finishRound('reveal')}

  async function nextRound(skip = false) {
    if(requestLock.current)return
    requestLock.current=true;setBusy(true);setFullSongId(null);playerRef.current?.stop()
    try{if(skip)await songRequest(song.id+'/skip');const next=await takeNextSong();setSong(next);setGuess('');setStatus('active');setLoadError(false);setPlaybackStatus('Press Tune to play the clip.');setDifficulty(DIFFICULTIES[0])}
    catch(e){setPlaybackStatus(e.message);setCatalogError(e.message)}finally{requestLock.current=false;setBusy(false)}
  }

  const nameSet = !!progress.playerName

  return (
    <>
      <Radio
        feedback={status}
        roundId={song?.id}
        yearTuner={nameSet && <YearTuner years={YEAR_STATIONS} value={afterYear} onChange={tuneYear} />}
        tunerContent={nameSet && !song ? <div className="radio-hint" role="status"><p>{catalogError || 'Loading songs…'}</p>{catalogError && <button onClick={() => setCatalogRequest(value => value + 1)}>Retry</button>}</div> : nameSet && status === 'active' ? (
          <>
              <p className="radio-hint" role="status">{playbackStatus}</p>

              <form className="guess-row" autoComplete="off" onSubmit={handleSubmit}>
                <input
                  aria-label="Guess song"
                  list="song-title-suggestions"
                  autoComplete="off"
                  spellCheck={false}
                  value={guess}
                  onChange={handleGuessChange}
                  placeholder="Guess song..."
                  maxLength={255}
                />
                <datalist id="song-title-suggestions">{suggestions.map(title=><option key={title} value={title}/>)}</datalist>
                <div className="radio-guess-actions"><button type="submit" disabled={busy||!guess.trim()}>Guess</button><button type="button" disabled={busy} onClick={giveUp}>Give up</button><button type="button" disabled={busy} onClick={()=>nextRound(true)}>Skip →</button></div>
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
            <span className="radio-result-movie">Movie: {song.movie}</span>
            {status === 'correct' && <span className="radio-result-time">Guessed in {(lastTimeMs / 1000).toFixed(1)}s</span>}
            <div className="radio-reveal-actions">
              <button aria-expanded={fullSongId === song.youtubeId} aria-controls="revealed-song-player" onClick={() => { playerRef.current?.stop(); setFullSongId(fullSongId === song.youtubeId ? null : song.youtubeId) }}>{fullSongId === song.youtubeId ? 'Stop song' : '▶ Play song'}</button>
              <button disabled={busy} onClick={()=>nextRound()}>Next song ▶</button>
            </div>
          </div>
        ) : null}
        onPlay={playClip}
        disabled={busy || !song || !playerReady || preparedVideoId!==song.youtubeId || !nameSet || status !== 'active'}
        ready={playerReady && !!song && preparedVideoId===song.youtubeId}
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
                disabled={busy}
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
    {song && status !== 'active' && fullSongId === song.youtubeId && <section className="card revealed-song-player" id="revealed-song-player" aria-label="Revealed song playback">
      <h2>{song.title}</h2>
      <p>Movie: {song.movie}</p>
      <iframe key={song.youtubeId} title={`Play ${song.title}`} src={`https://www.youtube.com/embed/${song.youtubeId}?autoplay=1&playsinline=1`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
      <p><a href={`https://www.youtube.com/watch?v=${song.youtubeId}`} target="_blank" rel="noopener noreferrer">Open song on YouTube ↗</a></p>
    </section>}
    <Player onPlaybackStatus={setPlaybackStatus} ref={playerRef} onReady={() => setPlayerReady(true)} onPrepared={setPreparedVideoId} onUnplayable={handleUnplayable} />
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
