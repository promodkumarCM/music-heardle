import {useEffect,useRef} from 'react'
import './LyricsPlayLayout.css'

export default function LyricsPlayLayout({enabled=true,activeKey,children}) {
 const root=useRef(null)
 useEffect(()=>{
  if(!enabled)return
  const viewport=window.visualViewport
  const update=()=>{
   if(!root.current)return
   // Size the stacked mobile workspace to the visible area, including when
   // the software keyboard opens. Neither pane overlays the other.
   root.current.style.setProperty('--play-height',`${Math.max(220,(viewport?.height||window.innerHeight)-16)}px`)
   if(window.matchMedia('(max-width:760px)').matches&&root.current.contains(document.activeElement)) {
    root.current.scrollIntoView({block:'start',behavior:'instant'})
    root.current.querySelector('.active-blank')?.scrollIntoView({block:'nearest',behavior:'instant'})
   }
  }
  viewport?.addEventListener('resize',update)
  window.addEventListener('resize',update)
  update()
  return()=>{viewport?.removeEventListener('resize',update);window.removeEventListener('resize',update)}
 },[enabled])
 useEffect(()=>{
  if(!enabled)return
  const timer=setTimeout(()=>{
   const mobile=window.matchMedia('(max-width:760px)').matches
   const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
   if(mobile)root.current?.scrollIntoView({block:'start',behavior:'instant'})
   root.current?.querySelector('.active-blank')?.scrollIntoView({block:mobile?'nearest':'center',behavior})
  },100)
  return()=>clearTimeout(timer)
 },[enabled,activeKey])
 if(!enabled)return <>{children}</>
 return <div ref={root} className="lyrics-play-layout"><div className="lyrics-reading-pane" tabIndex={0} role="region" aria-label="Scroll song lyrics">{children[0]}</div><aside className="lyrics-answer-dock" aria-label="Selected word answer">{children[1]}</aside></div>
}
