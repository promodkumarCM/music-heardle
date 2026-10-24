import {useEffect,useId,useState} from 'react'
import './LyricsAnswerForm.css'

const BASE=import.meta.env.VITE_API_URL||`${location.protocol}//${location.hostname}:4000`
const nativeAnswer=text=>/[\u0d00-\u0d7f]/u.test(text)&&!/[\p{L}\p{M}]/u.test(text.replace(/[\u0d00-\u0d7f\u200c\u200d]/gu,''))

export default function LyricsAnswerForm({onSubmit,disabled=false,autoFocus=false,label='Missing word',submitLabel='Submit answer',resetKey}) {
 const id=useId()
 const [mode,setMode]=useState('manglish'),[raw,setRaw]=useState('')
 const [conversion,setConversion]=useState({input:'',suggestions:[],loading:false,error:''})
 const [selection,setSelection]=useState({input:'',word:''}),[retry,setRetry]=useState(0),[composing,setComposing]=useState(false)
 useEffect(()=>{setRaw('');setSelection({input:'',word:''})},[resetKey])
 const text=raw.trim(),native=nativeAnswer(text)
 const query=mode==='manglish'&&!native?text:''
 const validQuery=/^[a-z]{1,80}$/i.test(query)
 const current=conversion.input===query
 const suggestions=current?conversion.suggestions:[]
 const selected=selection.input===query&&suggestions.includes(selection.word)?selection.word:suggestions[0]||''
 const answer=native?text:mode==='manglish'&&validQuery&&current&&!conversion.loading?selected:''
 const converting=!disabled&&!composing&&validQuery&&(!current||conversion.loading)
 useEffect(()=>{
  if(disabled||composing||!validQuery){setConversion({input:query,suggestions:[],loading:false,error:''});return}
  const controller=new AbortController()
  let disposed=false,timeout
  setConversion({input:query,suggestions:[],loading:true,error:''})
  setSelection({input:query,word:''})
  const timer=setTimeout(async()=>{
   timeout=setTimeout(()=>controller.abort(),6000)
   try {
    const response=await fetch(`${BASE}/transliteration`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:query}),signal:controller.signal})
    const data=await response.json()
    if(!response.ok)throw Error(data.error||'Manglish conversion is unavailable.')
    const words=Array.isArray(data.suggestions)?data.suggestions.filter(word=>typeof word==='string'&&nativeAnswer(word)):[]
    if(!disposed)setConversion({input:query,suggestions:words,loading:false,error:words.length?'':'No Malayalam spelling found. Try another spelling or type Malayalam directly.'})
   } catch(error) {
    if(!disposed)setConversion({input:query,suggestions:[],loading:false,error:controller.signal.aborted?'Conversion timed out. Try again or type Malayalam directly.':error.message})
   } finally {clearTimeout(timeout)}
  },250)
  return()=>{disposed=true;clearTimeout(timer);clearTimeout(timeout);controller.abort()}
 },[query,validQuery,disabled,composing,retry])
 function changeMode(next){setMode(next);setRaw('');setSelection({input:'',word:''})}
 function submit(event){event.preventDefault();if(!disabled&&!composing&&!converting&&answer)onSubmit(answer)}
 return <form className="lyrics-answer-form" onSubmit={submit}>
  <fieldset className="lyrics-input-mode" disabled={disabled}><legend>Typing language</legend>
   <label><input type="radio" name={`${id}-mode`} checked={mode==='manglish'} onChange={()=>changeMode('manglish')}/>Manglish · English letters</label>
   <label><input type="radio" name={`${id}-mode`} checked={mode==='malayalam'} onChange={()=>changeMode('malayalam')}/>മലയാളം</label>
  </fieldset>
  <label className="lyrics-answer-label" htmlFor={`${id}-input`}>{label}</label>
  <div className="lyrics-answer-entry"><input id={`${id}-input`} autoFocus={autoFocus} autoComplete="off" autoCapitalize="off" spellCheck={false} lang={mode==='malayalam'?'ml':'en'} maxLength={150} disabled={disabled} required value={raw} placeholder={mode==='manglish'?'Type in English, e.g. mazha':'മലയാളത്തിൽ എഴുതുക'} aria-describedby={`${id}-help ${id}-preview`} onChange={event=>setRaw(event.target.value)} onCompositionStart={()=>setComposing(true)} onCompositionEnd={()=>setComposing(false)}/>
   <button type="submit" disabled={disabled||composing||converting||!answer}>{submitLabel}</button></div>
  <p className="lyrics-typing-help" id={`${id}-help`}>{mode==='manglish'?'Type one word, then check the Malayalam spelling below.':'Use your Malayalam keyboard or paste the word.'}</p>
  <div className="lyrics-answer-preview" id={`${id}-preview`} aria-live="polite" aria-atomic="true">{converting?'Converting…':answer?<><span>Answer to submit: </span><strong lang="ml">{answer}</strong></>:text&&!validQuery&&!native?mode==='malayalam'?'Enter a Malayalam word, or switch to Manglish.':'Use English letters for one word, or type Malayalam directly.':null}</div>
  {mode==='manglish'&&!native&&suggestions.length>1&&<div className="lyrics-spelling-options" role="group" aria-label="Choose Malayalam spelling">{suggestions.map(word=><button type="button" key={word} lang="ml" disabled={disabled} aria-pressed={word===answer} onClick={()=>setSelection({input:query,word})}>{word}</button>)}</div>}
  {mode==='manglish'&&current&&conversion.error&&<p className="lyrics-conversion-error" role="status">{conversion.error} <button type="button" disabled={disabled} onClick={()=>setRetry(n=>n+1)}>Retry</button></p>}
 </form>
}
