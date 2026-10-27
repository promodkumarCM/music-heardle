import LyricsAnswerResult from './LyricsAnswerResult'
import LyricsPlayLayout from './LyricsPlayLayout'
import {useEffect,useRef,useState} from 'react'
import GameModes from './GameModes'
import useTitleSuggestions from '../lib/useTitleSuggestions'
import BuzzerStage from './BuzzerStage'
import LyricsAnswerForm from './LyricsAnswerForm'

const BASE=import.meta.env.VITE_API_URL||`${location.protocol}//${location.hostname}:4000`
const games={characters:'Character Files',pictures:'Picture Clues',song:'Guess the Song',dialogue:'Guess the Movie',clues:'Five Clues',lyrics:'Missing Lyrics'}
const labels={host:'Host',buzzer:'Buzzer',solo:'Solo'}
export default function PartyGame({mode='buzzer',game:gameProp,backdrop}) {
  const params=new URLSearchParams(location.hash.split('?')[1]||'')
  const initialGame=gameProp||params.get('game')||'pictures'
  const [session,setSession]=useState(()=>{try{
    const saved=JSON.parse(sessionStorage.getItem(`party-${mode}`))
    return saved&&(params.get('room')?saved.code===params.get('room'):(saved.entryGame||saved.game)===initialGame)?saved:null
  }catch{return null}})
  const [room,setRoom]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const [tab,setTab]=useState(params.get('room')?'join':'create'),[code,setCode]=useState(params.get('room')||''),[name,setName]=useState('')
  const [teamNames,setTeamNames]=useState(['Team A','Team B']),[seconds,setSeconds]=useState(15),[difficulty,setDifficulty]=useState('easy')
  const [lastLyricAnswer,setLastLyricAnswer]=useState('')
  const [guess,setGuess]=useState(''),[remaining,setRemaining]=useState(0),[copied,setCopied]=useState(''),[nextGame,setNextGame]=useState(initialGame)
  const lock=useRef(false),generation=useRef(0),offset=useRef(0),setupDialog=useRef(null)
  const game=room?.game||initialGame
  const phase=room?.phase
  const preflight=!room||phase==='lobby'
  useEffect(()=>{const d=setupDialog.current;if(!d)return;if(preflight&&!d.open)d.showModal();else if(!preflight&&d.open)d.close()},[preflight])
  function receive(data){offset.current=data.serverNow-Date.now();setRoom(data)}
  async function request(path,body,credentials=session) {
    const response=await fetch(`${BASE}/party-game/${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(credentials?{Authorization:`Bearer ${credentials.token}`}:{})},...(body?{body:JSON.stringify(body)}:{})})
    const data=await response.json()
    if(!response.ok)throw Object.assign(new Error(data.error||'Connection failed.'),{status:response.status})
    return data
  }
  useEffect(()=>{if(session)sessionStorage.setItem(`party-${mode}`,JSON.stringify(session));else sessionStorage.removeItem(`party-${mode}`)},[session,mode])
  useEffect(()=>{
    if(!session)return
    let alive=true,inflight=false
    async function poll(){
      if(inflight||lock.current)return
      inflight=true;const version=generation.current
      try{const data=await request(`rooms/${session.code}`,null,session);if(alive&&version===generation.current)receive(data)}
      catch(e){if(alive){setError(e.message);if(e.status===403||e.status===404){generation.current++;setSession(null);setRoom(null)}}}
      finally{inflight=false}
    }
    poll();const timer=setInterval(poll,mode==='buzzer'?400:1500)
    return()=>{alive=false;clearInterval(timer)}
  },[session,mode])
  useEffect(()=>{
    const tick=()=>setRemaining(Math.max(0,Math.ceil(((room?.deadline||0)-Date.now()-offset.current)/1000)))
    tick();const timer=setInterval(tick,100);return()=>clearInterval(timer)
  },[room?.deadline])
  useEffect(()=>{setGuess('')},[room?.round,room?.active,room?.phase])
  useEffect(()=>setNextGame(game),[game])
  useEffect(()=>setLastLyricAnswer(''),[room?.round,game])
  async function run(fn){
    if(lock.current)return
    lock.current=true;generation.current++;setBusy(true);setError('')
    try{await fn()}catch(e){setError(e.message)}finally{lock.current=false;setBusy(false)}
  }
  function enter(join=false){run(async()=>{
    const data=await request(join?`rooms/${code.trim().toUpperCase()}/join`:'rooms',join?{name}:{mode,game:initialGame,teams:teamNames,seconds,difficulty,name:mode==='buzzer'?name:mode==='host'?'Host':'You'},null)
    setSession({code:data.code,token:data.token,game:data.game,entryGame:initialGame});receive(data)
  })}
  function act(action,extra={}){run(async()=>{
    let data=await request(`rooms/${room.code}/action`,{action,version:room.version,...extra})
    if(mode==='solo'&&game==='lyrics'&&['guess','reveal'].includes(action)&&data.phase==='settled') {
      setLastLyricAnswer({id:data.active,guess:extra.guess,answer:data.answer,correct:data.notice==='Correct answer!',revealed:action==='reveal'})
      receive(data)
      if(!data.complete)data=await request(`rooms/${room.code}/action`,{action:'continue',version:data.version})
    }
    receive(data)
    if(action==='game')setSession(s=>({...s,game:data.game}))
  })}
  function leave(){generation.current++;setSession(null);setRoom(null);setError('');setCopied('')}
  const joinLink=room?`${location.origin}${location.pathname}#buzzer-game?game=${game}&room=${room.code}`:''
  async function copyLink(){try{await navigator.clipboard.writeText(joinLink);setCopied('Copied')}catch{setCopied('Copy the link from the field below.')}}
  const canAnswer=mode==='solo'||room?.winner?.id===room?.me
  const suggestions=useTitleSuggestions(guess,game,phase==='answering'&&canAnswer&&mode!=='host',`${room?.round}:${room?.active}`)
  const settled=phase==='settled'
  const status=phase==='open'?'Buzzers open — first to buzz answers.':phase==='answering'&&mode==='buzzer'?`${room.winner.name} buzzed first` :settled?'Answer revealed':mode==='host'?'Listen to your teams, then award the answer.':'Your turn'
  return <>{preflight&&backdrop}<main className={`cinema-home party-page ${preflight?'party-preflight':''} ${game==='lyrics'?'lyrics-page':''}`}><div className="dialogue-shell">
    {!preflight&&<><header className="dialogue-nav"><a href="#">← All games</a><span>PADAM / {labels[mode].toUpperCase()}</span></header>
    <div className="dialogue-heading"><p className="cinema-eyebrow">THE FILM PLAYHOUSE</p><h1>{games[game]}</h1><p>{mode==='host'?'One screen. Your teams. You keep score.':mode==='buzzer'?'Everyone plays. First to buzz gets the answer.':'Play at your own pace.'}</p></div>
    <GameModes game={game} mode={mode}/></>}
    <dialog ref={setupDialog} className="buzzer-setup-dialog party-setup-dialog" aria-label={`${labels[mode]} setup`} onCancel={()=>{location.hash='#'}}>
      <div className="buzzer-dialog-heading"><h2>{games[game]} · {labels[mode]}</h2><a className="popup-close" href="#" aria-label="Close setup">×</a></div>
    {!session&&<section className="party-setup clue-case" aria-label={`${labels[mode]} setup`}>
      <h2>{mode==='host'?'Set up your teams':mode==='buzzer'?'Play with buzzers':'Start a solo game'}</h2>
      {mode==='buzzer'&&<div className="buzzer-setup-tabs"><button aria-pressed={tab==='create'} onClick={()=>setTab('create')}>Create room</button><button aria-pressed={tab==='join'} onClick={()=>setTab('join')}>Join room</button></div>}
      <form onSubmit={e=>{e.preventDefault();enter(mode==='buzzer'&&tab==='join')}}>
        {mode==='buzzer'&&<><label>Your name<input required maxLength={30} autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)}/></label>{tab==='join'&&<label>Room code<input required maxLength={6} pattern="[a-fA-F0-9]{6}" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></label>}</>}
        {!(mode==='buzzer'&&tab==='join')&&<>
          {mode==='host'&&<><label>Number of teams<select value={teamNames.length} onChange={e=>setTeamNames(names=>Array.from({length:Number(e.target.value)},(_,i)=>names[i]||`Team ${String.fromCharCode(65+i)}`))}>{[2,3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}</select></label><div className="party-team-fields">{teamNames.map((team,i)=><label key={i}>Team {i+1}<input required maxLength={30} value={team} onChange={e=>setTeamNames(names=>names.map((n,j)=>j===i?e.target.value:n))}/></label>)}</div></>}
          {game==='lyrics'&&<label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>}
          {mode==='buzzer'&&<label>Answer timer (seconds)<input required type="number" min={5} max={120} value={seconds} onChange={e=>setSeconds(Number(e.target.value))}/></label>}
        </>}
        <p>{mode==='buzzer'?'Each player competes individually. The room creator plays too. Answers and points are checked automatically.':mode==='host'?'Teams answer aloud. Award points to the first correct team, or reveal for no points.':game==='lyrics'?'Complete 10 missing words. Each correct answer earns 10 points.':''}</p>
        <button disabled={busy}>{busy?'Loading…':mode==='buzzer'?(tab==='join'?'Join room':'Create room & join'):'Start game'}</button>
      </form>
    </section>}
    {session&&!room&&<p>Connecting… <button onClick={leave}>Back to setup</button></p>}
      {room&&phase==='lobby'&&<section className="party-setup clue-case">
        {mode==='buzzer'?<><h2>Room {room.code}</h2><p>Share this code or link. Everyone joins as a player, including you.</p><button onClick={copyLink}>Copy invite link</button><input aria-label="Room invite link" readOnly value={joinLink}/><p role="status">{copied}</p><ul>{room.players.map(p=><li key={p.id}>{p.name}{p.id===room.me?' (you)':''}</li>)}</ul>{room.creator?<button disabled={busy||room.players.length<2} onClick={()=>act('start')}>Start game · {room.players.length} players</button>:<p>Waiting for the room creator to start.</p>}</>:<><h2>Ready to play</h2><button disabled={busy} onClick={()=>act('start')}>Start game</button></>}
      </section>}
    {error&&preflight&&<p role="alert">{error}</p>}
    </dialog>
    {room&&!preflight&&<>
      <div className="lyrics-room-bar"><span>{labels[mode]} · Round {room.round}{game==='lyrics'?` · ${room.difficulty} · 10 hidden words`:''}</span><button disabled={busy} onClick={leave}>Leave game</button></div>
      <div className="party-scores">{room.teams.map((team,i)=><div key={i} className={room.winner?.team===i?'winning':''}><span>{team.name}{mode==='buzzer'&&room.team===i?' (you)':''}</span><strong>{team.score} pts</strong></div>)}</div>
      {phase!=='lobby'&&<>
        <LyricsPlayLayout enabled={game==='lyrics'} activeKey={`${room.round}:${room.active}`}>
        <BuzzerStage game={game} room={room} busy={busy} act={act} automaticWords={mode==='buzzer'}/>
        <section className="party-answer-panel clue-case">
          <h2 role="status">{game==='lyrics'?`Word ${(room.active??0)+1} of 10`:status}</h2>
          {game==='lyrics'&&mode==='buzzer'&&<p>{status}</p>}
          {phase==='answering'&&mode==='buzzer'&&<p role="timer">{remaining} seconds remaining</p>}
          {game==='lyrics'&&<LyricsAnswerResult result={lastLyricAnswer}/>}
          {room.notice&&<p aria-live="polite">{room.notice}</p>}
          {mode==='buzzer'&&!settled&&<button className="team-buzzer" disabled={busy||phase!=='open'||room.blocked.includes(room.team)} onClick={()=>act('buzz')}>BUZZ</button>}
          {mode==='buzzer'&&room.blocked.includes(room.team)&&!settled&&<p>Your attempt is used. Other players can still buzz.</p>}
          {mode==='buzzer'&&phase==='open'&&<button disabled={busy||room.skipVotes.includes(room.me)} onClick={()=>act('skip')}>{room.skipVotes.includes(room.me)?'Skip vote recorded':'Vote to skip round'} · {room.skipVotes.length}/{Math.floor(room.players.length/2)+1}</button>}
          {phase==='answering'&&canAnswer&&mode!=='host'&&(game==='lyrics'?<LyricsAnswerForm resetKey={`${room.round}:${room.active}`} label={`Word ${(room.active??0)+1}`} submitLabel="Check" disabled={busy} onSubmit={answer=>act('guess',{guess:answer})}/>:<form className="party-guess" onSubmit={e=>{e.preventDefault();act('guess',{guess})}}><label>{game==='song'?'Song name':'Movie name'}<input list="party-title-suggestions" autoFocus required autoComplete="off" maxLength={255} value={guess} onChange={e=>setGuess(e.target.value)}/></label><datalist id="party-title-suggestions">{suggestions.map(title=><option key={title} value={title}/>)}</datalist><button disabled={busy||!guess.trim()}>Submit answer</button></form>)}
          {mode==='host'&&!settled&&<><div className="lyrics-controls">{room.teams.map((team,i)=><button key={i} disabled={busy} onClick={()=>act('mark',{team:i})}>{team.name} · +{game==='lyrics'?10:game==='clues'?120-room.clue*20:100}</button>)}<button disabled={busy} onClick={()=>act('reveal')}>Nobody · Reveal</button></div><details><summary>Check answer</summary><p>{room.answer}</p></details></>}
          {game==='clues'&&!settled&&room.clue<5&&<button disabled={busy||mode==='buzzer'&&phase!=='open'} onClick={()=>act('clue')}>Next clue ({room.clue}/5)</button>}
          {mode==='solo'&&!settled&&<button disabled={busy} onClick={()=>act('reveal')}>Reveal · 0 points</button>}
          {settled&&<><p className="party-revealed-answer">{room.answer}</p><button disabled={busy} onClick={()=>act(game==='lyrics'&&!room.complete?'continue':'next')}>{game==='lyrics'&&!room.complete?'Next word':'Next round'} →</button>
            {room.creator&&room.complete&&mode!=='solo'&&<form className="party-switch" onSubmit={e=>{e.preventDefault();act('game',{game:nextGame})}}><label>Switch game · keep scores<select value={nextGame} onChange={e=>setNextGame(e.target.value)}>{Object.entries(games).map(([key,title])=><option key={key} value={key}>{title}</option>)}</select></label><button disabled={busy||nextGame===game}>Switch game</button></form>}
          </>}
        </section>
        </LyricsPlayLayout>
      </>}
    </>}
    {error&&!preflight&&<p role="alert" className="dialogue-feedback">{error}</p>}
  </div></main></>
}
