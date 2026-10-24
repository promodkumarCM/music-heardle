import {useEffect,useState} from 'react'

const BASE=import.meta.env.VITE_API_URL||`${location.protocol}//${location.hostname}:4000`
export default function useTitleSuggestions(query,game,enabled=true,roundKey='') {
  const [titles,setTitles]=useState([])
  useEffect(()=>{
    setTitles([])
    if(!enabled||game==='lyrics'||query.trim().length<2)return
    const controller=new AbortController()
    const timer=setTimeout(async()=>{
      try{
        const response=await fetch(`${BASE}/title-suggestions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,query}),signal:controller.signal})
        if(!response.ok)return
        const data=await response.json()
        if(!controller.signal.aborted)setTitles(data.titles)
      }catch{/* Suggestions must never prevent manual answers. */}
    },180)
    return()=>{clearTimeout(timer);controller.abort()}
  },[query,game,enabled,roundKey])
  return titles
}
