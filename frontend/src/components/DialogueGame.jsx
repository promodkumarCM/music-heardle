import StockFinished from './StockFinished'
import {stockOrder} from '../lib/stockOrder'
import DialogueText from './DialogueText'
import Clapperboard from './Clapperboard'
import GameModes from './GameModes'
import useTitleSuggestions from '../lib/useTitleSuggestions'
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
      setClues(stockOrder(data))
      if (!data.length) setError('The next scene is still being prepared. Check back soon.')
    }).catch(err => { if (!controller.signal.aborted) setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
  return () => controller.abort()
  }, [retry])
  const clue = clues[round]
  const suggestions=useTitleSuggestions(guess,'dialogue',!!clue&&!result,clue?.id)
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
    if (turnLock.current || requestRef.current || !clue) return
    clearFeedback()
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      turnLock.current = true
      setTurningPage({ dialogue: clue.dialogue, round, solved })
      turnTimer.current = setTimeout(finishPageTurn, 900)
    }

    setRound(value => value + 1)
    setGuess(''); setResult(null); setMessage(''); setError('')
  }
  if(!loading&&clues.length>0&&round>=clues.length)return <main className="cinema-home"><div className="dialogue-shell"><GameModes game="dialogue"/><StockFinished game="dialogue"/></div></main>
  return (
    <main className="cinema-home dialogue-page">
      <div className="dialogue-shell">
        <header className="dialogue-nav"><a href="#">← All games</a><span>PADAM / GAME 03</span></header>
        <div className="dialogue-heading"><p className="cinema-eyebrow">THE DIALOGUE ROUND</p><h1>Guess the Movie</h1><p>One dialogue. One unforgettable film.</p></div>
 <GameModes game="dialogue" />
        <DialogueText text={clue?.dialogue} english={clue?.dialogue_english}>
         {content=><Clapperboard round={round+1} targetRef={targetRef} feedback={<RoundFeedback feedback={feedback}/>} footer={solved+' SOLVED · NAME THE MOVIE'}>
          {loading ? <span role="status">Setting the scene…</span> : clue?content: 'No dialogue loaded.'}
         </Clapperboard>}
        </DialogueText>
        <section className="dialogue-answer" aria-label="Your answer">
          {result ? <div className="dialogue-result" role="status"><span className="cinema-eyebrow">{result.correct ? '✦ THAT’S A WRAP. YOU GOT IT!' : 'THE FILM BEHIND THE LINE'}</span><h2>{result.movie}</h2><button onClick={next}>{round + 1 === clues.length ? 'Finish this set' : 'Next dialogue'} <span aria-hidden="true">→</span></button></div>
            : clue && !loading ? <form autoComplete="off" onSubmit={e => { e.preventDefault(); answer() }}><label htmlFor="movie-guess">Which movie is this from?</label><div className="dialogue-input-row"><input ref={inputRef} id="movie-guess" list="movie-title-suggestions" autoComplete="off" spellCheck={false} maxLength={255} placeholder="Type the movie name…" value={guess} onChange={e => { setGuess(e.target.value); setMessage('') }} disabled={busy || !!turningPage} /><datalist id="movie-title-suggestions">{suggestions.map(title=><option key={title} value={title}/>)}</datalist><button type="submit" disabled={busy || !!turningPage || !guess.trim()}>{busy ? 'Checking…' : 'Check answer'} <span aria-hidden="true">→</span></button></div><div className="dialogue-form-bottom"><span>English or Malayalam titles accepted.</span><button type="button" disabled={busy || !!turningPage} onClick={next}>Skip dialogue →</button><button type="button" disabled={busy || !!turningPage} onClick={() => answer(true)}>Reveal movie</button></div></form> : null}
          {message && <p className="dialogue-feedback" role="status">{message}</p>}
          {error && <div className="dialogue-feedback" role="alert">{error}{!clue && <button onClick={() => setRetry(value => value + 1)}>Retry</button>}</div>}
        </section>
        <footer className="dialogue-endnote">No clock. No rush. Just your love of cinema.</footer>
      </div>
    </main>
  )
}
