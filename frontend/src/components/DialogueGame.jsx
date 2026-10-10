import { useEffect, useRef, useState } from 'react'
import { fetchDialogues, guessDialogue } from '../lib/api'
import RoundFeedback, { useRoundFeedback } from './RoundFeedback'

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function DialogueGame() {
  const { feedback, targetRef, showFeedback, clearFeedback } = useRoundFeedback()
  const [clues, setClues] = useState([])
  const [turningPage, setTurningPage] = useState(null)
  const turnLock = useRef(false)
  const turnTimer = useRef(null)
  useEffect(() => () => clearTimeout(turnTimer.current), [])
  const [round, setRound] = useState(0)
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const [solved, setSolved] = useState(0)
  const requestRef = useRef(false)
  const mounted = useRef(true)
  const inputRef = useRef(null)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    fetchDialogues(controller.signal).then(data => {
      if (controller.signal.aborted) return
      setClues(shuffle(data))
      if (!data.length) setError('The next scene is still being prepared. Check back soon.')
    }).catch(err => { if (!controller.signal.aborted) setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  const clue = clues[round]
  async function answer(reveal = false) {
    if (!clue || result || requestRef.current || (!reveal && !guess.trim())) return
    requestRef.current = true; setBusy(true); setError(''); setMessage('')
    try {
      const data = await guessDialogue(clue.id, guess, reveal)
      if (!mounted.current) return
      if (data.correct || reveal) {
        setResult({ ...data, revealed: reveal })
        if (data.correct) { setSolved(value => value + 1); showFeedback('correct') }
        else clearFeedback()
      } else { showFeedback('wrong'); setMessage('Not quite. Check your spelling or try another movie.'); inputRef.current?.focus() }
    } catch (err) { if (mounted.current) setError(err.message) }
    finally { requestRef.current = false; if (mounted.current) setBusy(false) }
  }
  function finishPageTurn() {
    clearTimeout(turnTimer.current)
    turnLock.current = false
    setTurningPage(null)
    inputRef.current?.focus({ preventScroll: true })
  }
  function next() {
    if (turnLock.current || !clue) return
    clearFeedback()
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      turnLock.current = true
      setTurningPage({ dialogue: clue.dialogue, round, solved })
      turnTimer.current = setTimeout(finishPageTurn, 900)
    }

    if (round + 1 === clues.length) {
      const shuffled = shuffle(clues)
      if (shuffled.length > 1 && shuffled[0].id === clue.id) [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
      setClues(shuffled); setRound(0)
    } else setRound(value => value + 1)
    setGuess(''); setResult(null); setMessage(''); setError('')
  }
  return (
    <main className="cinema-home dialogue-page">
      <div className="dialogue-shell">
        <header className="dialogue-nav"><a href="#">← All games</a><span>PADAM / GAME 02</span></header>
        <div className="dialogue-heading"><p className="cinema-eyebrow">THE DIALOGUE ROUND</p><h1>One line.<br /><em>A whole movie.</em></h1><p>You remember the dialogue. Can you name the film?</p></div>
        <div className="script-page-stack" aria-busy={!!turningPage}>
        <section ref={targetRef} className="dialogue-screen" aria-label="Movie dialogue clue">
          <RoundFeedback feedback={feedback} />
          <div className="cinema-reel" aria-hidden="true"><i /><i /><i /><i /><b /></div>
          <div className="dialogue-screen-meta"><span>SCENE {String(round + 1).padStart(2, '0')}</span><span>MALAYALAM CINEMA</span></div>
          {loading ? <p className="dialogue-loading" role="status">Setting the scene…</p> : clue ? <blockquote key={clue.id}><span aria-hidden="true">“</span>{clue.dialogue}</blockquote> : <p className="dialogue-loading">No dialogue loaded.</p>}
          <div className="dialogue-screen-footer"><span>READ IT. HEAR IT IN YOUR HEAD.</span><span>{solved} SOLVED THIS VISIT</span></div>
        </section>
        {turningPage && <div className="dialogue-screen script-turning-page" aria-hidden="true" onAnimationEnd={event => { if (event.target === event.currentTarget) finishPageTurn() }}>
          <div className="dialogue-screen-meta"><span>SCENE {String(turningPage.round + 1).padStart(2, '0')}</span><span>MALAYALAM CINEMA</span></div>
          <blockquote><span>“</span>{turningPage.dialogue}</blockquote>
          <div className="dialogue-screen-footer"><span>READ IT. HEAR IT IN YOUR HEAD.</span><span>{turningPage.solved} SOLVED THIS VISIT</span></div>
        </div>}
        </div>
        <section className="dialogue-answer" aria-label="Your answer">
          {result ? <div className="dialogue-result" role="status"><span className="cinema-eyebrow">{result.correct ? '✦ THAT’S A WRAP. YOU GOT IT!' : 'THE FILM BEHIND THE LINE'}</span><h2>{result.movie}</h2><button onClick={next}>{round + 1 === clues.length ? 'Play another set' : 'Next dialogue'} <span aria-hidden="true">→</span></button></div>
            : clue && !loading ? <form autoComplete="off" onSubmit={e => { e.preventDefault(); answer() }}><label htmlFor="movie-guess">Which movie is this from?</label><div className="dialogue-input-row"><input ref={inputRef} id="movie-guess" autoComplete="off" spellCheck={false} maxLength={255} placeholder="Type the movie name…" value={guess} onChange={e => { setGuess(e.target.value); setMessage('') }} disabled={busy || !!turningPage} /><button type="submit" disabled={busy || !!turningPage || !guess.trim()}>{busy ? 'Checking…' : 'Check answer'} <span aria-hidden="true">→</span></button></div><div className="dialogue-form-bottom"><span>English or Malayalam titles accepted.</span><button type="button" disabled={busy} onClick={() => answer(true)}>Reveal movie</button></div></form> : null}
          {message && <p className="dialogue-feedback" role="status">{message}</p>}
          {error && <div className="dialogue-feedback" role="alert">{error}{!clue && <button onClick={() => setRetry(value => value + 1)}>Retry</button>}</div>}
        </section>
        <footer className="dialogue-endnote">No clock. No rush. Just your love of cinema.</footer>
      </div>
    </main>
  )
}
