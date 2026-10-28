export default function DialogueEditor({pair,onChange}) {
 const conversation=Array.isArray(pair.dialogue_lines)
 function updateLine(index,patch){onChange({...pair,dialogue_lines:pair.dialogue_lines.map((line,i)=>i===index?{...line,...patch}:line)})}
 function toggle(enabled){
  if(enabled)onChange({...pair,dialogue_lines:[{speaker:1,dialogue:pair.dialogue||'',dialogue_english:pair.dialogue_english||''},{speaker:2,dialogue:'',dialogue_english:''}]})
  else {const {dialogue_lines,...rest}=pair;onChange({...rest,dialogue:dialogue_lines.map(line=>line.dialogue).join('\n'),dialogue_english:dialogue_lines.map(line=>line.dialogue_english).join('\n')})}
 }
 return <div className="dialogue-entry-editor">
  <label className="dialogue-conversation-toggle"><input type="checkbox" role="switch" checked={conversation} onChange={event=>toggle(event.target.checked)}/> Two-speaker conversation</label>
  {conversation?<><p>Lines appear together as alternating speech bubbles. Use speaker numbers to keep actor names hidden.</p>{pair.dialogue_lines.map((line,index)=><div className="dialogue-line-editor" key={index}>
   <label>Line {index+1} · Speaker<select value={line.speaker} onChange={event=>updateLine(index,{speaker:Number(event.target.value)})}><option value={1}>Speaker 1 · left</option><option value={2}>Speaker 2 · right</option></select></label>
   <label>Malayalam<textarea required lang="ml" rows={2} maxLength={10000} value={line.dialogue} onChange={event=>updateLine(index,{dialogue:event.target.value})}/></label>
   <label>English (optional)<textarea lang="en" rows={2} maxLength={10000} value={line.dialogue_english||''} onChange={event=>updateLine(index,{dialogue_english:event.target.value})}/></label>
   <button type="button" disabled={pair.dialogue_lines.length<=2} onClick={()=>onChange({...pair,dialogue_lines:pair.dialogue_lines.filter((_,i)=>i!==index)})}>Remove line {index+1}</button>
  </div>)}<button type="button" disabled={pair.dialogue_lines.length>=20} onClick={()=>onChange({...pair,dialogue_lines:[...pair.dialogue_lines,{speaker:pair.dialogue_lines.at(-1).speaker===1?2:1,dialogue:'',dialogue_english:''}]})}>+ Add speaker line</button></>:<>
   <label>Malayalam<textarea lang="ml" rows={2} required maxLength={10000} value={pair.dialogue} onChange={event=>onChange({...pair,dialogue:event.target.value})}/></label>
   <label>English (optional)<textarea lang="en" rows={3} maxLength={10000} value={pair.dialogue_english} onChange={event=>onChange({...pair,dialogue_english:event.target.value})}/></label>
  </>}
 </div>
}
