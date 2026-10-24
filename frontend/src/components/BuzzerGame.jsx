import BuzzerStage from './BuzzerStage'
import GameModes from './GameModes'
import {useEffect,useRef,useState} from 'react'
const BASE=import.meta.env.VITE_API_URL||`${location.protocol}//${location.hostname}:4000`
const games={pictures:'Picture Clues',buzzer:'Standalone Buzzer',lyrics:'Missing Lyrics',dialogue:'Guess the Movie',clues:'Five Clues',song:'Guess the Song'}
export default function BuzzerGame(){
 const params=new URLSearchParams(location.hash.split('?')[1]||'')
 const [session,setSession]=useState(()=>{try{const s=JSON.parse(sessionStorage.getItem('buzzer-room'));return params.get('room')?(s?.code===params.get('room')?s:null):params.get('game')&&s?.game!==params.get('game')?null:s}catch{return null}})
 const [room,setRoom]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[teamCount,setTeamCount]=useState(3),[limit,setLimit]=useState(4),[seconds,setSeconds]=useState(10),[code,setCode]=useState(params.get('room')||''),[name,setName]=useState(''),[invite,setInvite]=useState(params.get('invite')||''),[peek,setPeek]=useState(false),[remaining,setRemaining]=useState(0),[copied,setCopied]=useState('')
 const game=Object.hasOwn(games,params.get('game'))?params.get('game'):'buzzer'
 const [setupOpen,setSetupOpen]=useState(true),[setupTab,setSetupTab]=useState(params.get('room')?'join':'host'),[lobbyOpen,setLobbyOpen]=useState(true)
 const dialogRef=useRef(null),lobbyDialogRef=useRef(null),previousPhase=useRef(null)
 useEffect(()=>{const d=dialogRef.current;if(!d)return;if(!session&&setupOpen&&!d.open){const y=window.scrollY;d.showModal();window.scrollTo(0,y)}else if(d.open)d.close()},[session,setupOpen])
 useEffect(()=>{if(previousPhase.current==='lobby'&&room?.phase&&room.phase!=='lobby')setLobbyOpen(false);previousPhase.current=room?.phase},[room?.phase])
 useEffect(()=>{const d=lobbyDialogRef.current;if(!d)return;if(lobbyOpen&&!d.open){const y=window.scrollY;d.showModal();window.scrollTo(0,y)}else if(!lobbyOpen&&d.open)d.close()},[room?.code,lobbyOpen])
 const names=Array.from({length:teamCount},(_,i)=>`Team ${String.fromCharCode(65+i)}`)
 const lock=useRef(false),generation=useRef(0),offset=useRef(0)
 function receive(data){offset.current=data.serverNow-Date.now();setRoom(data)}
 async function request(path,body,auth=session){const r=await fetch(`${BASE}/buzzer/${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth.token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'Connection failed'),{status:r.status});return data}
 useEffect(()=>{if(session)sessionStorage.setItem('buzzer-room',JSON.stringify(session));else sessionStorage.removeItem('buzzer-room')},[session])
 useEffect(()=>{if(!session)return;let alive=true,inflight=false;const poll=async()=>{if(lock.current||inflight)return;inflight=true;const g=generation.current;try{const d=await request(`rooms/${session.code}`,null,session);if(alive&&g===generation.current){receive(d);setError('')}}catch(e){if(alive){if(e.status===403||e.status===404){generation.current++;setSession(null);setRoom(null);setError('Your previous room expired or you were removed. Please create or join a new room.')}else setError(e.message)}}finally{inflight=false}};poll();const t=setInterval(poll,350);return()=>{alive=false;clearInterval(t)}},[session])
 useEffect(()=>{const update=()=>setRemaining(Math.max(0,Math.ceil(((room?.deadline||0)-Date.now()-offset.current)/1000)));update();const t=setInterval(update,100);return()=>clearInterval(t)},[room?.deadline])
 useEffect(()=>setPeek(false),[room?.active,room?.round,room?.phase])
 async function run(fn){if(lock.current)return;lock.current=true;generation.current++;setBusy(true);setError('');try{await fn()}catch(e){setError(e.message)}finally{lock.current=false;setBusy(false)}}
 function enter(join){run(async()=>{const d=await request(join?`rooms/${code.trim().toUpperCase()}/join`:'rooms',join?{name,invite}:{game,teams:names,limit,seconds},null);setLobbyOpen(true);setSession({code:d.code,token:d.token,game:d.game});receive(d)})}
 function act(action,extra={}){run(async()=>receive(await request(`rooms/${room.code}/action`,{action,version:room.version,...extra})))}
 function leave(){generation.current++;setSession(null);setRoom(null);setError('');setSetupOpen(true);setLobbyOpen(true)}
 function link(token){return `${location.origin}${location.pathname}#buzzer-game?room=${room.code}${token?`&invite=${token}`:''}`}
 async function copy(value){try{await navigator.clipboard.writeText(value);setCopied('Link copied')}catch{setCopied('Select the link below and copy it.')}}
 const allBlocked=room&&room.blocked.length===room.teams.length

 const selected=room?.game||game
 const titles={pictures:<>One picture.<br/><em>Which movie?</em></>,lyrics:<>Missing Lyrics</>,dialogue:<>Guess the Movie</>,clues:<>Five clues.<br/><em>One movie.</em></>}
 const heading={"pictures":["02","THE PICTURE CLUE","Look closely. Name the film."],"dialogue":["02","THE DIALOGUE ROUND","One dialogue. One unforgettable film."],"clues":["04","THE FIVE-CLUE MYSTERY","The sooner it clicks, the more points you earn."],"lyrics":["05","THE MISSING LYRICS","Complete the song. Bring the scene back."]}[selected]
 const phase=room?.phase
 const status=phase==='open'?'Buzzers open!':phase==='answering'?room.teams[room.winner.team].name+' buzzed first!':phase==='settled'?'Round settled':allBlocked?'All teams have tried.':'Buzzers closed'
 return <main className={selected==='song'?'app buzzer-page buzzer-integrated':'cinema-home buzzer-page buzzer-integrated '+(selected==='pictures'?'picture-page':selected==='dialogue'?'dialogue-page':selected==='clues'?'clue-page':'lyrics-page')}><div className="dialogue-shell">
 {selected==='song'?<a className="back-to-cinema" href="#">← All games <span>PADAM</span></a>:<header className="dialogue-nav"><a href="#">← All games</a><span>{heading?`PADAM / GAME ${heading[0]}`:games[selected]}</span></header>}
 {selected!=='song'&&<div className="dialogue-heading"><p className="cinema-eyebrow">{heading?.[1]||games[selected]}</p><h1>{titles[selected]||'First to buzz.'}</h1>{heading&&<p>{heading[2]}</p>}</div>}
 {(!room||room.host)&&selected!=='buzzer'&&<GameModes game={selected} buzzer />}
 {!session&&<>
 <BuzzerStage game={selected}/>
 <button className="buzzer-setup-launch" onClick={()=>setSetupOpen(true)}>Set up team play</button>
 <dialog className="buzzer-setup-dialog" ref={dialogRef} onCancel={()=>setSetupOpen(false)} onClose={()=>setSetupOpen(false)}>
 <div className="buzzer-dialog-heading"><h2>{games[selected]} · Buzzer</h2><button aria-label="Close setup" onClick={()=>setSetupOpen(false)}>×</button></div>
 <div className="buzzer-setup-tabs"><button aria-pressed={setupTab==='host'} onClick={()=>setSetupTab('host')}>Host a room</button><button aria-pressed={setupTab==='join'} onClick={()=>setSetupTab('join')}>Join a room</button></div>
 {setupTab==='host'?<form onSubmit={e=>{e.preventDefault();enter(false)}}>
 <div className="buzzer-setup-fields"><label>Teams<select value={teamCount} onChange={e=>setTeamCount(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}</select></label><label>Players per team<input type="number" required min="1" max="20" value={limit} onChange={e=>setLimit(Number(e.target.value))}/></label><label>Answer timer (seconds)<input type="number" required min="5" max="120" value={seconds} onChange={e=>setSeconds(Number(e.target.value))}/></label></div>
 <p>{names.join(' · ')}</p><button disabled={busy}>Create lobby →</button></form>:<form onSubmit={e=>{e.preventDefault();enter(true)}}><label>Room code<input required maxLength={6} pattern="[a-fA-F0-9]{6}" value={code} onChange={e=>{setCode(e.target.value);setInvite('')}}/></label><label>Your name<input autoComplete="nickname" required maxLength={30} value={name} onChange={e=>setName(e.target.value)}/></label>{invite&&<p>Your invitation assigns your team automatically.</p>}<button disabled={busy}>Join room →</button></form>}
 {error&&<p role="alert">{error}</p>}
 </dialog></>}
 {session&&!room&&<p>Connecting… <button onClick={leave}>Back</button></p>}
 {room&&<>
 
 <dialog className="buzzer-setup-dialog buzzer-room-dialog" ref={lobbyDialogRef} aria-labelledby="buzzer-room-title" onCancel={()=>setLobbyOpen(false)} onClose={()=>setLobbyOpen(false)}>
 <div className="buzzer-dialog-heading"><h2 id="buzzer-room-title">Teams & invitations</h2><button aria-label="Close room details" onClick={()=>setLobbyOpen(false)}>×</button></div>
 <div className="lyrics-room-bar"><span>Room <strong>{room.code}</strong> · Round {room.round}</span><button disabled={busy} onClick={leave}>← Back</button></div>
 <div className="buzzer-scores compact-team-scores">{room.teams.map((t,i)=><div key={i} className={room.winner?.team===i?'winning':''}><strong>{t.name}</strong><span>{t.score} pts</span>{room.blocked.includes(i)&&<small>Locked out</small>}</div>)}</div>
 <section className="buzzer-lobby"><p>{room.players.length} players · {phase==='lobby'?'Waiting to start':'In progress'}</p>
 {room.host&&phase==='lobby'&&<><p>Share a team link, or assign players who join with the room code. Use this computer’s network address for phone access.</p><button onClick={()=>copy(link())}>Copy room link</button><input aria-label="Room join link" readOnly value={link()}/>{room.teams.map(t=><div key={t.invite}><button onClick={()=>copy(link(t.invite))}>Copy {t.name} invitation</button><input aria-label={t.name+' invitation'} readOnly value={link(t.invite)}/></div>)}<p role="status">{copied}</p></>}
 {room.players.map(p=><div className="lyrics-word-row" key={p.id}><strong>{p.name}</strong>{room.host&&phase==='lobby'?<><select aria-label={'Team for '+p.name} value={p.team??''} disabled={busy} onChange={e=>act('assign',{player:p.id,team:Number(e.target.value)})}><option value="" disabled>Unassigned</option>{room.teams.map((t,i)=><option key={i} value={i}>{t.name}</option>)}</select><button disabled={busy} onClick={()=>act('remove',{player:p.id})}>Remove</button></>:<span>{room.teams[p.team]?.name||'Unassigned'}</span>}</div>)}
 {room.host&&phase==='lobby'&&<div className="lyrics-controls"><button disabled={busy} onClick={()=>act('lock')}>{room.locked?'Unlock joining':'Lock joining'}</button></div>}
 </section>
 {phase==='lobby'&&(room.host?<button className="buzzer-start" disabled={busy||room.players.some(p=>p.team===null)||!room.teams.every((_,i)=>room.players.some(p=>p.team===i))} onClick={()=>act('start')}>Start game →</button>:<p role="status">{room.team==null?'Waiting for your team assignment.':'You are on '+room.teams[room.team].name+'. Waiting for the host…'}</p>)}
 {error&&<p role="alert">{error}</p>}
 </dialog>
 {room.host?<>
 <div className="buzzer-play-area">
 <BuzzerStage game={selected} room={room} busy={busy} act={act}/>
 {phase==='answering'&&<section className="buzzer-winner-overlay" aria-label="Winning team"><h2 role="status">{status}</h2><p>{room.winner.name} · <strong role="timer">{remaining}s</strong> to answer</p><div className="lyrics-controls"><button disabled={busy} onClick={()=>act('mark',{correct:true})}>Correct</button><button disabled={busy} onClick={()=>act('mark',{correct:false})}>Wrong</button></div>{selected!=='buzzer'&&<details onToggle={e=>setPeek(e.currentTarget.open)}><summary>Privately check answer</summary>{peek&&<p>{room.answer}</p>}</details>}<small>Keep answer previews off the shared display.</small></section>}
 </div>
 {phase!=='lobby'&&<section className="buzzer-host-bar">
 <p role="status">{phase!=='answering'?status:''} {room.notice} {selected==='lyrics'?(room.active===null?'Select a blank to begin.':'Word '+(room.active+1)+' · 10 points'):''}</p>
 {phase==='settled'&&selected!=='song'&&room.answer&&<p className="buzzer-answer">{room.answer}</p>}
 <div className="lyrics-controls"><button disabled={busy||phase!=='closed'||allBlocked||(selected==='lyrics'&&room.active===null)} onClick={()=>act('open')}>Open buzzer</button><button disabled={busy||phase!=='open'} onClick={()=>act('close')}>Close</button>{selected==='clues'&&<button disabled={busy||phase!=='closed'||room.clue===5} onClick={()=>act('clue')}>Next clue ({room.clue}/5)</button>}<button disabled={busy||!['closed','open'].includes(phase)||(selected==='lyrics'&&room.active===null)} onClick={()=>act('reveal')}>Reveal</button><button disabled={busy||!room.canUndo||!['closed','settled'].includes(phase)} onClick={()=>act('undo')}>Undo</button><button disabled={busy} onClick={()=>{if(window.confirm('Move to the next round? Earned points stay.'))act('next')}}>{phase==='settled'?'Next round →':'Skip →'}</button></div>
 </section>}
 </>:phase!=='lobby'&&<section className="buzzer-player-screen"><p>{room.teams[room.team]?.name}</p><h2 aria-live="polite">{status}</h2>{room.winner&&<p>{room.winner.name} · {remaining}s</p>}<button className="team-buzzer" disabled={busy||phase!=='open'||room.team==null||room.blocked.includes(room.team)} onClick={()=>act('buzz')}>BUZZ</button><p>{room.blocked.includes(room.team)?'Your team can buzz again on the next question.':'Watch the host’s screen. Answer aloud when your team wins.'}</p></section>}
 <div className="lyrics-room-bar"><span>Round {room.round}</span><button onClick={()=>setLobbyOpen(true)}>Teams & room</button></div>
 {error&&<p role="alert">{error}</p>}
 </>}
 </div></main>
}
