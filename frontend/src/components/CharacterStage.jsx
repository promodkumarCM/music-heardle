import DialogueText from './DialogueText'
export default function CharacterStage({content,round=1,compact=false}){
 if(compact)return <div className="character-file-mini"><span>CAST DOSSIER / 006</span><div className="character-silhouette"/><strong>HERO / VILLAIN</strong><small>WHICH MOVIE?</small></div>
 const card=text=><section className="character-file" aria-label="Character clue"><header><span>PADAM / CAST DOSSIER</span><span>FILE {String(round).padStart(2,'0')}</span></header><div className="character-role">{content?.role==='hero'?'THE HERO':content?.role==='villain'?'THE VILLAIN':'AWAITING THE CAST'}</div><div className="character-file-name">{text}</div><footer>IDENTIFY THE MOVIE · 100 POINTS</footer></section>
 return content?<DialogueText text={content.name} english={content.english}>{card}</DialogueText>:card('Your next character awaits.')
}
