import {useEffect,useState} from 'react'
import DialogueText from './DialogueText'
const BASE=import.meta.env.VITE_API_URL||location.protocol+'//'+location.hostname+':4000'
export default function CharacterStage({content,round=1,compact=false,points=100,hintAvailable=false,canReveal=false,hintDisabled=false,onReveal}){
 const [photoFailed,setPhotoFailed]=useState(false)
 useEffect(()=>setPhotoFailed(false),[round,content?.actorImage])
 if(compact)return <div className="character-file-mini"><span>CAST DOSSIER / 006</span><div className="character-silhouette"/><strong>CHARACTER FILE</strong><small>CHARACTER FIRST · WHICH MOVIE?</small></div>
 const photo=content?.actorImage?.startsWith('/uploads/')?BASE.replace(/\/$/,'')+content.actorImage:content?.actorImage
 const card=text=><section className="character-file" aria-label="Character clue"><header><span>PADAM / CAST DOSSIER</span><span>FILE {String(round).padStart(2,'0')}</span></header><div className="character-role">CHARACTER NAME</div><div className="character-file-name">{text}</div>{hintAvailable&&<div className="character-hint">{canReveal?<button type="button" disabled={hintDisabled} onClick={onReveal}>Reveal actor · 60 points</button>:<p>The room creator can reveal the actor for everyone.</p>}</div>}{photo&&!photoFailed?<div className="character-actor"><span>ACTOR CLUE</span><img className="character-actor-photo" src={photo} alt="Actor clue — identify the movie" onError={()=>setPhotoFailed(true)}/></div>:content?.actor?<p className="character-actor"><span>PLAYED BY</span><strong>{content.actor}</strong></p>:null}<footer>IDENTIFY THE MOVIE · {points} POINTS</footer></section>
 return content?<DialogueText text={content.name} english={content.english}>{card}</DialogueText>:card('Your next character awaits.')
}
