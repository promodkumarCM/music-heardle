import CharacterStage from './CharacterStage'
import DialogueText from './DialogueText'
import FilmClues from './FilmClues'
import LyricsStudio from './LyricsStudio'
import Clapperboard from './Clapperboard'
import PictureStage from './PictureStage'
import './PictureGame.css'
import {useEffect,useRef,useState} from 'react'
import Radio from './Radio'
import YearTuner from './YearTuner'
import Player from './Player'
import {DIFFICULTIES} from '../data/levels'

export default function BuzzerStage({game,room,busy,act,automaticWords=false}){
 const player=useRef(null)
 const [ready,setReady]=useState(false),[volume,setVolume]=useState(70),[duration,setDuration]=useState(5),[message,setMessage]=useState('Press Tune to play the clip.')
 const [preparedVideoId,setPreparedVideoId]=useState(null)
 useEffect(()=>{player.current?.stop();setMessage('Press Tune to play the clip.')},[room?.round])
 useEffect(()=>{if(room?.phase==='answering'||room?.phase==='settled')player.current?.stop()},[room?.phase])
 useEffect(()=>{if(game==='song'&&ready&&room?.content)player.current?.prepare(room.content)},[game,ready,room?.content])
 const live=room&&room.phase!=='lobby'
 if(game==='characters')return <CharacterStage content={live?room.content:null} round={room?.round} points={room?.availablePoints??100} hintAvailable={live&&room.actorHintAvailable&&room.phase!=='settled'} canReveal={room?.creator} hintDisabled={busy||room?.mode==='buzzer'&&room.phase!=='open'} onReveal={()=>act('actor')}/>
 if(game==='pictures')return <PictureStage image={live?room.content:null} mobileImage={room?.mobileImage} round={room?.round}/>
 if(game==='song')return <>
  <Radio yearTuner={<YearTuner disabled={!room||busy||!['lobby','settled'].includes(room.phase)} years={[0,1990,1995,2000,2005,2010,2015,2020,2025]} value={room?.afterYear||0} onChange={year=>{if(room&&!busy&&['lobby','settled'].includes(room.phase))act('year',{afterYear:year})}} />} onPlay={()=>player.current?.playSnippet(room.content,0,duration,volume)} ready={ready&&preparedVideoId===room?.content} disabled={!live||!ready||preparedVideoId!==room?.content||busy||room.phase==='answering'} seconds={duration} volume={volume} onVolumeChange={v=>{setVolume(v);player.current?.setVolume(v)}}
   tunerContent={<div className="buzzer-radio-display"><span className="cinema-eyebrow">MUSIC ROUND</span><p>{!live?'Invite your teams to start.':room.phase==='settled'?room.answer:message}</p><small>Listen to the clip, then answer.</small></div>}>
   <div className="radio-game-panel"><div className="pills">{DIFFICULTIES.map(d=><button key={d.name} className="pill" aria-pressed={duration===d.snippetSeconds} disabled={!live||busy||room.phase==='answering'} onClick={()=>setDuration(d.snippetSeconds)}>{d.name}</button>)}</div><div className="progress-track"><div className="progress-fill" style={{width:`${duration/12*100}%`}} />{DIFFICULTIES.map(d=><div className="progress-tick" key={d.name} style={{left:`${d.snippetSeconds/12*100}%`}} />)}</div><div className="score-row"><span>{duration}s clip</span><span>100 points per answer</span></div></div>
  </Radio><Player ref={player} onPrepared={setPreparedVideoId} onReady={()=>setReady(true)} onPlaybackStatus={setMessage} onUnplayable={()=>setMessage('Clip unavailable. Skip this round.')} />
 </>
 if(game==='dialogue')return <DialogueText lines={room?.dialogueLines} text={room?.content} english={room?.dialogueEnglish}>{content=><Clapperboard round={room?.round||1} footer="100 POINTS · NAME THE MOVIE">{live?content: 'Your next scene awaits your teams.'}</Clapperboard>}</DialogueText>
 if(game==='clues')return <FilmClues clues={live?room.content:[]} roundKey={room?.round} busy={busy}/>
 if(game==='lyrics')return <LyricsStudio round={room?.round||1}>{live?room.content.map((s,i)=><p className={`lyrics-stanza ${s.some(w=>w.id===room.active)?'lyrics-active-stanza':''}`} key={i}>{s.map((w,j)=>w.id===undefined?<span key={j}>{w.text}</span>:<button className={`lyrics-blank ${room.active===w.id?'active-blank':''}`} key={j} disabled={automaticWords||busy||!!room.settled[w.id]||!['answering','closed','settled'].includes(room.phase)} aria-label={`Word ${w.id+1}${w.text?' · answered':''}`} aria-pressed={room.active===w.id} onClick={()=>act('select',{id:w.id})}><sup>{w.id+1}</sup>{w.text||'-----'}</button>)}</p>):<p className="lyrics-stanza">Invite your teams. Pick a missing word. Open the buzzer.</p>}</LyricsStudio>
 return <section className="clue-case"><p>Ask your question aloud, then open the buzzer.</p></section>
}
