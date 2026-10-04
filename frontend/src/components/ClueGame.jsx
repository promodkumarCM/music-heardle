import { useEffect, useRef, useState } from 'react'
import { clueGameRequest } from '../lib/api'
export default function ClueGame() {
  const [timerSeconds,setTimerSeconds]=useState(0)
  const [remaining,setRemaining]=useState(0)
  const deadline=useRef(0)
  const autoIssued=useRef(false)
  const actRef=useRef(null)
  const [round,setRound]=useState(null)
  const [guess,setGuess]=useState('')
  const [busy,setBusy]=useState(true)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [expired,setExpired]=useState(false)
  const [score,setScore]=useState(0)
  const credited=useRef(new Set())
  const lock=useRef(false)
  const alive=useRef(true)
  useEffect(()=>{
    alive.current=true
    const controller=new AbortController()
    clueGameRequest('start',{},controller.signal).then(data=>{if(!controller.signal.aborted)setRound(data)}).catch(err=>{if(!controller.signal.aborted)setError(err.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)})
    return ()=>{alive.current=false;controller.abort()}
  },[])
  async function act(action) {
    if(lock.current||busy) return
    lock.current=true;setBusy(true);setError('');setMessage('')
    try {
      const data=await clueGameRequest(action==='start'?'start':`${round.token}/${action}`,action==='start'?{previousId:round?.puzzleId}:{guess})
      if(!alive.current)return
      setRound(data);setExpired(false)
      if(action==='start')setGuess('')
      if(data.incorrect)setMessage('Not quite. Try another name or open the next clue.')
      if(data.status==='correct'&&!credited.current.has(data.token)){credited.current.add(data.token);setScore(value=>value+data.points)}
    }catch(err){if(alive.current){setError(err.message);setExpired(!!err.expired)}}
    finally{lock.current=false;if(alive.current)setBusy(false)}
  }
  const active=round?.status==='active'
  actRef.current=act
  useEffect(()=>{
    deadline.current=Date.now()+timerSeconds*1000
    autoIssued.current=false
    setRemaining(timerSeconds)
  },[round?.token,round?.clues.length,timerSeconds])
  useEffect(()=>{
    if(!timerSeconds||!active||expired||error)return
    const tick=()=>{
      const left=Math.max(0,Math.ceil((deadline.current-Date.now())/1000))
      setRemaining(left)
      if(left===0&&!busy&&!lock.current&&!autoIssued.current){
        autoIssued.current=true
        actRef.current(round.clues.length<5?'next':'reveal')
      }
    }
    tick()
    const interval=setInterval(tick,200)
    return ()=>clearInterval(interval)
  },[timerSeconds,active,expired,error,busy,round?.token,round?.clues.length])
  return <main className="cinema-home clue-page"><div className="dialogue-shell">
    <header className="dialogue-nav"><a href="#">← All games</a><span>PADAM / GAME 03</span></header>
    <div className="dialogue-heading"><p className="cinema-eyebrow">THE FIVE-CLUE MYSTERY</p><h1>Five clues.<br/><em>One movie.</em></h1><p>The sooner it clicks, the more points you earn.</p></div>
    <div className="clue-timer-settings">
      <label htmlFor="clue-timer">Timer per clue</label>
      <select id="clue-timer" value={timerSeconds} disabled={busy} onChange={e=>setTimerSeconds(Number(e.target.value))}>
        <option value="0">Off · play at your pace</option>
        {[10,20,30,45,60].map(seconds=><option key={seconds} value={seconds}>{seconds} seconds</option>)}
      </select>
      <p>{timerSeconds?'Each new clue gets a fresh timer. Clue five expires into the answer.':'Turn on a timer to reveal clues automatically.'}</p>
    </div>
    {timerSeconds>0&&active&&!expired&&<div className={'clue-countdown'+(remaining<=5?' urgent':'')}>
      <span>{error?'Timer paused — use the buttons below to retry.':round.clues.length<5?'NEXT CLUE IN':'ANSWER REVEALS IN'}</span>
      <strong role="timer" aria-label="Seconds remaining">{remaining}s</strong>
      <div className="clue-clock-track"><div style={{width:Math.min(100,remaining/timerSeconds*100)+'%'}} /></div>
    </div>}
    <div className="clue-score"><span>THIS VISIT <strong>{score} pts</strong></span><span>{active?'UP FOR GRABS':'ROUND SCORE'} <strong>{active?round.availablePoints:round?.points||0} pts</strong></span></div>
    <section className="clue-case" aria-label="Movie clues" aria-busy={busy}>
      <div className="clue-steps" aria-label="Points by clue">{[100,80,60,40,20].map((points,i)=><span key={points} className={round?.clues.length===i+1?'current':''}>CLUE {i+1}<b>{points} pts</b></span>)}</div>
      {round?<ol className="clue-list">{Array.from({length:5},(_,i)=><li key={`${round.token}-${i}`} className={i<round.clues.length?'unlocked':'locked'}><span className="clue-number">0{i+1}</span><p>{round.clues[i]||'Clue not yet revealed'}</p>{i<round.clues.length && <span className="clue-reveal-cover" aria-hidden="true"><span>CLUE 0{i+1}</span><span className="clue-cover-seal">✦</span></span>}</li>)}</ol>:<p className="clue-wait" role="status">{busy?'Opening the case…':'The case could not be opened.'}</p>}
    </section>
    <section className="dialogue-answer" aria-label="Movie answer">
      {active&&!expired?<form autoComplete="off" onSubmit={e=>{e.preventDefault();act('guess')}}><label htmlFor="clue-guess">Which movie connects the clues?</label><div className="dialogue-input-row"><input id="clue-guess" value={guess} onChange={e=>setGuess(e.target.value)} maxLength={255} autoComplete="off" placeholder="Type the movie name…" disabled={busy}/><button disabled={busy||!guess.trim()}>Check answer →</button></div><div className="clue-actions"><span>Small spelling mistakes are accepted. No name suggestions.</span>{round.clues.length<5?<button type="button" disabled={busy} onClick={()=>act('next')}>Next clue · {round.availablePoints-20} pts</button>:<button type="button" disabled={busy} onClick={()=>act('reveal')}>Give up & reveal movie</button>}</div></form>:round&&!expired?<div className="dialogue-result" role="status"><p className="cinema-eyebrow">{round.status==='correct'?`CASE CLOSED · +${round.points} POINTS`:'THE ANSWER WAS'}</p><h2>{round.movie}</h2><button disabled={busy} onClick={()=>act('start')}>Next movie →</button></div>:null}
      {message&&<p className="dialogue-feedback" role="status">{message}</p>}
      {error&&<p className="dialogue-feedback" role="alert">{error}</p>}
      {(!round||expired)&&!busy&&<button onClick={()=>act('start')}>{expired?'Start a new movie':'Retry'}</button>}
    </section><footer className="dialogue-endnote">100 → 80 → 60 → 40 → 20 points · Reveal unlocks after clue five.</footer>
  </div></main>
}
