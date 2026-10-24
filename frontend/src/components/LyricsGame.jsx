import LyricsAnswerResult from './LyricsAnswerResult'
import LyricsPlayLayout from './LyricsPlayLayout'
import LyricsStudio from './LyricsStudio'
import GameModes from './GameModes'
import LyricsAnswerForm from './LyricsAnswerForm'
import {useEffect,useRef,useState} from 'react'
import RoundFeedback,{useRoundFeedback} from './RoundFeedback'
const BASE=import.meta.env.VITE_API_URL||`${window.location.protocol}//${window.location.hostname}:4000`
export default function LyricsGame(){
 const [session,setSession]=useState(()=>{try{return JSON.parse(sessionStorage.getItem('lyrics-room'))}catch{return null}})
 const [room,setRoom]=useState(null),[code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const [selectedWord,setSelectedWord]=useState(null)
 const [lastAnswer,setLastAnswer]=useState('')
 const [joinTeam,setJoinTeam]=useState(1)
 const [difficulty,setDifficulty]=useState('easy')
 const [setupOpen,setSetupOpen]=useState(true)
 const setupRef=useRef(null)
 useEffect(()=>{const d=setupRef.current;if(!d)return;if(!session&&setupOpen&&!d.open)d.showModal();else if((session||!setupOpen)&&d.open)d.close()},[session,setupOpen])
 const lock=useRef(false),revision=useRef(0)
 const {feedback,targetRef,showFeedback,clearFeedback}=useRoundFeedback()
 async function request(path,body,credentials=session){
  const response=await fetch(`${BASE}/lyrics-game/${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(credentials?{Authorization:`Bearer ${credentials.token}`}:{})},...(body?{body:JSON.stringify(body)}:{})})
  const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'Request failed'),{status:response.status});return data
 }
 useEffect(()=>{if(session)sessionStorage.setItem('lyrics-room',JSON.stringify(session));else sessionStorage.removeItem('lyrics-room')},[session])
 useEffect(()=>{
  if(!session)return
  let alive=true,inFlight=false
  async function poll(){if(inFlight||lock.current)return;inFlight=true;const version=revision.current;try{const data=await request(`rooms/${session.code}`,null,session);if(alive&&version===revision.current)setRoom(data)}catch(e){if(alive){if(e.status===403||e.status===404){revision.current++;setSession(null);setRoom(null);setError('Your previous room expired or the server restarted. Please create or join a new room.')}else setError(e.message)}}finally{inFlight=false}}
  poll();const timer=setInterval(poll,1500);return()=>{alive=false;clearInterval(timer)}
 },[session])
 useEffect(()=>{clearFeedback()},[room?.round])
 async function enter(mode){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const data=await request(mode==='join'?`rooms/${code.trim().toUpperCase()}/join`:'rooms',mode==='join'?{team:joinTeam}:{mode,difficulty},null);setSession({code:data.code,token:data.token});setRoom(data)}catch(e){setError(e.message)}finally{lock.current=false;setBusy(false)}}
 async function act(action,extra={}){if(lock.current)return;lock.current=true;revision.current++;setBusy(true);setError('');try{const data=await request(`rooms/${room.code}/action`,{action,round:room.round,...extra});setRoom(data);if(action==='guess'){showFeedback(data.answers[extra.id].correct?'correct':'wrong');setLastAnswer({id:extra.id,guess:extra.guess,answer:data.sections.flat().find(w=>w.id===extra.id)?.text,correct:data.answers[extra.id].correct});setSelectedWord(data.sections.flat().find(w=>w.id>extra.id&&!data.answers[w.id])?.id??null)};if(action==='mark')showFeedback(extra.correct?'correct':'wrong')}catch(e){setError(e.message)}finally{lock.current=false;setBusy(false)}}
 function leave(){revision.current++;setSession(null);setRoom(null);setSetupOpen(true);setError('');clearFeedback()}
 const words=room?.sections.flat().filter(w=>w.id!==undefined)||[]
 const unanswered=room?.mode==='online'?words.filter(w=>!room.answers[w.id]):[]
 const activeWord=unanswered.find(w=>w.id===selectedWord)||unanswered[0]
 useEffect(()=>{setSelectedWord(null);setLastAnswer('')},[room?.round])
 async function submitWord(answer) {
  const id=activeWord.id
  await act('guess',{id,guess:answer})
 }

 return <main className="cinema-home lyrics-page"><div className="dialogue-shell">
 <header className="dialogue-nav"><a href="#">← All games</a><span>PADAM / GAME 05</span></header>
 <div className="dialogue-heading"><p className="cinema-eyebrow">THE MISSING LYRICS</p><h1>Missing Lyrics</h1><p>Complete the song. Bring the scene back.</p></div>
 <GameModes game="lyrics" />
 {!session?<><LyricsStudio><p className="lyrics-stanza">Invite your teams. Complete the missing words.</p></LyricsStudio><button className="buzzer-setup-launch" onClick={()=>setSetupOpen(true)}>Set up team play</button><dialog className="buzzer-setup-dialog lyrics-setup-dialog" ref={setupRef} onCancel={()=>setSetupOpen(false)} onClose={()=>setSetupOpen(false)}><div className="buzzer-dialog-heading"><h2>Missing Lyrics · Team play</h2><button aria-label="Close setup" onClick={()=>setSetupOpen(false)}>×</button></div><label className="lyrics-difficulty">Difficulty <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} disabled={busy}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><p>10 hidden words per song.</p><section className="lyrics-setup"><div className="clue-case"><h2>Play together</h2><p>One host, spoken answers. The first team to answer correctly wins the word; the other team is locked out.</p><button disabled={busy} onClick={()=>enter('host')}>Start host mode</button></div><div className="clue-case"><h2>Play online</h2><p>Two teams, identical blanks. Each team submits its own answers and reveals only its own words. Teammates share attempts and scores.</p><button disabled={busy} onClick={()=>enter('online')}>Create online room</button><form onSubmit={e=>{e.preventDefault();enter('join')}}><label htmlFor="room-code">Join a room</label><input id="room-code" value={code} maxLength={6} required pattern="[a-fA-F0-9]{6}" placeholder="Room code" onChange={e=>setCode(e.target.value)}/><select aria-label="Choose team" value={joinTeam} onChange={e=>setJoinTeam(Number(e.target.value))}><option value={1}>Team B</option><option value={0}>Team A</option></select><button disabled={busy}>Join</button></form></div></section>{error&&<p role="alert">{error}</p>}</dialog></>:room?<>
 <LyricsPlayLayout enabled={room.mode==='online'} activeKey={`${room.round}:${activeWord?.id}`}>
 <LyricsStudio targetRef={targetRef} round={room.round} feedback={<RoundFeedback feedback={feedback}/>} >{room.sections.map((section,i)=><p className="lyrics-stanza" key={i}>{section.map((word,j)=>word.id===undefined?<span key={j}>{word.text}</span>:room.mode==='host'&&!word.text?<button type="button" className="lyrics-blank lyrics-reveal-word" key={j} disabled={busy||room.pendingWord!=null} aria-label={`Reveal word ${word.id+1}`} onClick={()=>act('revealWord',{id:word.id})}><sup>{word.id+1}</sup>----- <small>Reveal</small></button>:room.mode==='online'&&!room.answers[word.id]?<button type="button" className={`lyrics-blank ${activeWord?.id===word.id?'active-blank':''}`} key={j} disabled={busy} aria-label={`Answer word ${word.id+1}`} aria-pressed={activeWord?.id===word.id} onClick={()=>setSelectedWord(word.id)}><sup>{word.id+1}</sup>-----</button>:<span className={`lyrics-blank ${word.text?'settled':''}`} key={j}><sup>{word.id+1}</sup>{word.text||'-----'}</span>)}</p>)}</LyricsStudio>
 {room.mode==='online'&&<section className="lyrics-selected-answer">
 <h2>{activeWord?`Word ${activeWord.id+1} of 10`:'All words completed'}</h2>
 <p>Tap a blank to answer it · {10-unanswered.length}/10 completed</p>
 <nav className="lyrics-word-picker" aria-label="Choose missing word">{unanswered.map(word=><button key={word.id} disabled={busy} aria-label={`Answer word ${word.id+1}`} aria-pressed={activeWord?.id===word.id} onClick={()=>setSelectedWord(word.id)}>{word.id+1}</button>)}</nav>
 <LyricsAnswerResult result={lastAnswer}/>
 {activeWord?<LyricsAnswerForm resetKey={`${room.round}:${activeWord.id}`} label={`Missing word ${activeWord.id+1}`} submitLabel="Check" disabled={busy||!room.ready} onSubmit={submitWord}/>:<p>Your answers are recorded. Use the round controls below to continue.</p>}
 {!room.ready&&<p role="status">Waiting for Team B to join.</p>}
 </section>}
 </LyricsPlayLayout>
 {room.mode==='host'&&room.pendingWord!=null&&<section className="lyrics-winner-prompt" aria-label="Who answered first?" role="group"><h2>Who answered word {room.pendingWord+1} first?</h2><p role="status">{words.find(w=>w.id===room.pendingWord)?.text} — choose before revealing another word.</p><div>{room.teams.map((team,i)=><button key={i} disabled={busy} onClick={()=>act('mark',{id:room.pendingWord,team:i,correct:true})}>{team.name} · +10 points</button>)}<button disabled={busy} onClick={()=>act('neither',{id:room.pendingWord})}>Neither · 0 points</button></div></section>}
 {room.mode==='host'&&<details className="lyrics-answer-details" open={room.mode==='online'?true:undefined}><summary>{room.mode==='host'?'Word scores':'Answer missing words'}</summary><section aria-label="Missing word answers" className="lyrics-answers">{words.map(word=><div className="lyrics-word-row" key={`${room.round}-${word.id}`}><strong>Word {word.id+1}</strong>{room.mode==='host'?room.teams.map((team,i)=><div className="lyrics-mark" key={i}><span>{team.name}</span>{room.answers[i][word.id]?<span>{room.answers[i][word.id].correct?'✓ Won · 10 pts':room.answers[i][word.id].kind==='claimed'?'Other team won':'0 pts'}</span>:<span>Not scored</span>}</div>):room.answers[word.id]?<span>{room.answers[word.id].correct?'✓ Correct · 10 pts':room.answers[word.id].kind==='reveal'?'Revealed · 0 pts':'Incorrect · 0 pts'} — {word.text}</span>:<LyricsAnswerForm label={`Missing word ${word.id+1}`} submitLabel="Check" disabled={busy||!room.ready} onSubmit={answer=>act('guess',{id:word.id,guess:answer})}/>}</div>)}</section></details>}
 <div className="lyrics-controls"><button disabled={busy||!room.ready||room.skipVotes?.includes(room.team)} onClick={()=>act('skip')}>{room.mode==='host'?'Skip song →':room.skipVotes?.includes(room.team)?'Waiting for other team…':room.skipVotes?.length?'Agree to skip →':'Vote to skip song →'}</button><button disabled={busy||!room.ready||room.pendingWord!=null||words.every(w=>w.text)} onClick={()=>act('reveal')}>Reveal next</button>{room.mode==='online'&&<button disabled={busy||!room.ready||words.every(w=>w.text)} onClick={()=>act('revealAll')}>Reveal all</button>}{room.teams.every(t=>t.finished)&&<button disabled={busy} onClick={()=>act('next')}>Next round →</button>}</div>
 <div className="lyrics-room-bar"><span>{room.mode==='host'?'Host mode':`Room ${room.code} · You are ${room.teams[room.team].name}`} · {room.difficulty} · 10 hidden words · Round {room.round}</span><button onClick={leave} disabled={busy}>← Back</button></div>
 {!room.ready&&<p role="status">Share code <strong>{room.code}</strong> and this site’s address with Team B. Waiting for them to join…</p>}
 <div className="clue-score">{room.teams.map((team,i)=><span key={i}>{team.name}<strong>{team.score} / {room.maxPoints}</strong>{team.finished?' · Finished':''}</span>)}</div>
 <p className="dialogue-endnote">Skipping discards this round’s points and starts the next song. {room.mode==='host'?'Reveal one word, choose the first correct team or Neither, then reveal the next word.':'Revealing affects only your team. The other team can keep answering.'} Lyrics from the game catalog. Rooms expire after six hours.</p>
 </>:<p>Reconnecting to room… <button onClick={leave}>Back</button></p>}
 {error&&<p role="alert" className="dialogue-feedback">{error}</p>}
 </div></main>
}
