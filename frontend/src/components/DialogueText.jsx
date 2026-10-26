import {useState} from 'react'
import './DialogueText.css'
export default function DialogueText({text,english,children}) {
 const [language,setLanguage]=useState('ml')
 const selectedLanguage=language
 const controls=<div className="dialogue-language" role="group" aria-label="Dialogue language"><button type="button" aria-pressed={selectedLanguage==='ml'} onClick={()=>setLanguage('ml')}>മലയാളം</button><button type="button" aria-pressed={selectedLanguage==='en'} onClick={()=>setLanguage('en')}>English</button><button type="button" aria-pressed={selectedLanguage==='both'} onClick={()=>setLanguage('both')}>Show both</button></div>
 const content=<div className="dialogue-bilingual dialogue-language-content" aria-live="polite">
   {selectedLanguage!=='en'&&<span className="dialogue-language-text" lang="ml">{text}</span>}
   {selectedLanguage!=='ml'&&<span className="dialogue-language-text" lang="en">{english||'English is not available for this dialogue yet.'}</span>}
 </div>
 return <>{children?children(content):content}{controls}</>
}
