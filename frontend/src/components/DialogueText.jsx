import {useState} from 'react'
import './DialogueText.css'
import {conversationLines} from '../lib/dialogueLines'
export default function DialogueText({text,english,lines,children}) {
 const [language,setLanguage]=useState('ml')
 const selectedLanguage=language
 const turns=conversationLines(lines,text,english)
 const controls=<div className="dialogue-language" role="group" aria-label="Dialogue language"><button type="button" aria-pressed={selectedLanguage==='ml'} onClick={()=>setLanguage('ml')}>മലയാളം</button><button type="button" aria-pressed={selectedLanguage==='en'} onClick={()=>setLanguage('en')}>English</button><button type="button" aria-pressed={selectedLanguage==='both'} onClick={()=>setLanguage('both')}>Show both</button></div>
 const content=turns.length?<div className="dialogue-conversation" aria-label="Two speaker conversation" aria-live="polite">{turns.map((line,index)=><div className={'dialogue-turn dialogue-speaker-'+line.speaker} key={index}><span className="dialogue-speaker-label">Speaker {line.speaker}</span><div className="dialogue-bubble">{selectedLanguage!=='en'&&<span lang="ml">{line.dialogue}</span>}{selectedLanguage!=='ml'&&<span lang="en">{line.dialogue_english||'English is not available for this line yet.'}</span>}</div></div>)}</div>:<div className="dialogue-bilingual dialogue-language-content" aria-live="polite">
   {selectedLanguage!=='en'&&<span className="dialogue-language-text" lang="ml">{text}</span>}
   {selectedLanguage!=='ml'&&<span className="dialogue-language-text" lang="en">{english||'English is not available for this dialogue yet.'}</span>}
 </div>
 return <>{children?children(content):content}{controls}</>
}
