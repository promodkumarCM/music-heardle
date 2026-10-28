import StockFinished from './StockFinished'
import FilmClues from './FilmClues'
import GameModes from './GameModes'
import { useEffect, useRef, useState } from 'react'
import { clueGameRequest } from '../lib/api'
import RoundFeedback, { useRoundFeedback } from './RoundFeedback'
export default function ClueGame() {
  const { feedback, targetRef, showFeedback, clearFeedback } = useRoundFeedback()
  const [timerSeconds,setTimerSeconds]=useState(0)
  const [timerChoice,setTimerChoice]=useState('0')
  const [customSeconds,setCustomSeconds]=useState('25')
  const validCustom = /^\d+$/.test(customSeconds) && Number(customSeconds)>=1 && Number(customSeconds)<=600
  const [remaining,setRemaining]=useState(0)
  const deadline=useRef(0)
  const autoIssued=useRef(false)
  const actRef=useRef(null)
  const [round,setRound]=useState(null)
  const [setupOpen,setSetupOpen]=useState(true)
  const setupDialog=useRef(null)
  useEffect(()=>{
    const dialog=setupDialog.current
    if(!dialog)return
    if(!round&&setupOpen&&!dialog.open)dialog.showModal()
    else if((round||!setupOpen)&&dialog.open)dialog.close()
  },[round,setupOpen])
  const [guess,setGuess]=useState('')
  const [suggestions,setSuggestions]=useState([])
  useEffect(()=>{
    setSuggestions([])
    if(!round||round.status!=='active'||guess.trim().length<2)return
    const controller=new AbortController()
    const timer=setTimeout(()=>clueGameRequest(round.token+'/suggestions',{query:guess},controller.signal)
      .then(data=>{if(!controller.signal.aborted)setSuggestions(data.titles||[])})
      .catch(()=>{}),200)
    return()=>{clearTimeout(timer);controller.abort()}
  },[guess,round?.token,round?.status])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [expired,setExpired]=useState(false)
  const [score,setScore]=useState(0)
  const credited=useRef(new Set())
  const lock=useRef(false)
  const alive=useRef(true)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  async function act(action) {
    if(lock.current||busy) return
    lock.current=true;setBusy(true);setError('');setMessage('')
    try {
      if(action==='skip'){await clueGameRequest(`${round.token}/skip`);action='start'}
      const data=await clueGameRequest(action==='start'?'start':`${round.token}/${action}`,action==='start'?{previousId:round?.puzzleId}:{guess})
      if(!alive.current)return
      setRound(data);setExpired(false)
      if(action==='start'||action==='reveal')clearFeedback()
      if(data.incorrect)showFeedback('wrong')
      if(data.status==='correct'&&!credited.current.has(data.token))showFeedback('correct')
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
  if(round?.status==='exhausted')return <main className="cinema-home"><div className="dialogue-shell"><GameModes game="clues"/><StockFinished game="clues"/></div></main>
  return <main className="cinema-home clue-page"><div className="dialogue-shell">
    <header className="dialogue-nav"><a href="#">← All games</a><span>PADAM / GAME 04</span></header>
    <div className="dialogue-heading"><p className="cinema-eyebrow">THE FIVE-CLUE MYSTERY</p><h1>Five clues.<br/><em>One movie.</em></h1><p>The sooner it clicks, the more points you earn.</p></div>
 <GameModes game="clues" />
    {!round&&<><button className="buzzer-setup-launch" onClick={()=>setSetupOpen(true)}>Set up game</button><dialog ref={setupDialog} className="buzzer-setup-dialog clue-timer-dialog" aria-labelledby="clue-setup-title" onCancel={()=>setSetupOpen(false)} onClose={()=>setSetupOpen(false)}>
      <div className="buzzer-dialog-heading"><h2 id="clue-setup-title">Before the first clue</h2><button aria-label="Close timer setup" disabled={busy} onClick={()=>setSetupOpen(false)}>×</button></div>
      <form onSubmit={e=>{e.preventDefault();if(timerChoice==='custom'&&!validCustom)return;setTimerSeconds(timerChoice==='custom'?Number(customSeconds):Number(timerChoice));act('start')}}>
        <label htmlFor="clue-timer">Timer per clue</label>
        <select id="clue-timer" value={timerChoice} disabled={busy} onChange={e=>setTimerChoice(e.target.value)}>
          <option value="0">Off · play at your pace</option>
          {[10,20,30,45,60].map(seconds=><option key={seconds} value={seconds}>{seconds} seconds</option>)}
          <option value="custom">Custom time…</option>
        </select>
        {timerChoice==='custom'&&<label>Seconds per clue<input type="number" min="1" max="600" required value={customSeconds} disabled={busy} onChange={e=>setCustomSeconds(e.target.value)}/></label>}
        <p>Choose your pace. The first clue appears when you start. A timer automatically reveals the next clue, then the answer after clue five.</p>
        <button disabled={busy||(timerChoice==='custom'&&!validCustom)}>{busy?'Loading…':'Start · reveal first clue'}</button>
      </form>
      {error&&<p role="alert">{error}</p>}
    </dialog></>}
    <FilmClues targetRef={targetRef} clues={round?.clues||[]} roundKey={round?.token} busy={busy} feedback={<RoundFeedback feedback={feedback}/>} />
    {active&&!expired&&<div className="clue-board-controls">
      <span>{timerSeconds?timerSeconds+'s per clue':'Timer off'}</span>
      {round.clues.length<5?<button disabled={busy} onClick={()=>act('next')}>Next clue · {round.availablePoints-20} pts →</button>:<button disabled={busy} onClick={()=>act('reveal')}>Reveal movie →</button>}
    </div>}
    {timerSeconds>0&&active&&!expired&&<div className={'clue-countdown'+(remaining<=5?' urgent':'')}>
      <span>{error?'Timer paused — use the buttons below to retry.':round.clues.length<5?'NEXT CLUE IN':'ANSWER REVEALS IN'}</span>
      <strong role="timer" aria-label="Seconds remaining">{remaining}s</strong>
      <div className="clue-clock-track"><div style={{width:Math.min(100,remaining/timerSeconds*100)+'%'}} /></div>
    </div>}
    <div className="clue-score"><span>THIS VISIT <strong>{score} pts</strong></span><span>{active?'UP FOR GRABS':'ROUND SCORE'} <strong>{active?round.availablePoints:round?.points||0} pts</strong></span></div>
    <section className="dialogue-answer" aria-label="Movie answer">
      {active&&!expired?<form autoComplete="off" onSubmit={e=>{e.preventDefault();act('guess')}}><label htmlFor="clue-guess">Which movie connects the clues?</label><div className="dialogue-input-row"><input id="clue-guess" list="clue-movie-suggestions" value={guess} onChange={e=>setGuess(e.target.value)} maxLength={255} autoComplete="off" placeholder="Type the movie name…" disabled={busy}/><datalist id="clue-movie-suggestions">{suggestions.map(title=><option key={title} value={title}/>)}</datalist><button disabled={busy||!guess.trim()}>Check answer →</button></div><div className="clue-actions"><button type="button" disabled={busy} onClick={()=>act('skip')}>Skip movie →</button><span>Type at least 2 characters for movie suggestions. Small spelling mistakes are accepted.</span></div></form>:round&&!expired?<div className="dialogue-result" role="status"><p className="cinema-eyebrow">{round.status==='correct'?`CASE CLOSED · +${round.points} POINTS`:'THE ANSWER WAS'}</p><h2>{round.movie}</h2><button disabled={busy} onClick={()=>act('start')}>Next movie →</button></div>:null}
      {message&&<p className="dialogue-feedback" role="status">{message}</p>}
      {error&&<p className="dialogue-feedback" role="alert">{error}</p>}
      {expired&&!busy&&<button onClick={()=>act('start')}>{expired?'Start a new movie':'Retry'}</button>}
    </section><footer className="dialogue-endnote">100 → 80 → 60 → 40 → 20 points · Reveal unlocks after clue five.</footer>
  </div></main>
}
