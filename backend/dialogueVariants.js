export function validateDialogueVariants(input) {
 if(!Array.isArray(input)||input.length<1||input.length>30)throw Error('Add between 1 and 30 dialogues for this movie.')
 const seen=new Set()
 return input.map((pair,index)=>{
  let lines
  if(pair?.dialogue_lines!==undefined){
   if(!Array.isArray(pair.dialogue_lines)||pair.dialogue_lines.length<2||pair.dialogue_lines.length>20)throw Error(`Dialogue ${index+1}: add between 2 and 20 conversation lines.`)
   lines=pair.dialogue_lines.map(line=>{
    if(!line||![1,2].includes(line.speaker)||typeof line.dialogue!=='string'||!line.dialogue.trim()||line.dialogue.length>10000||typeof (line.dialogue_english??'')!=='string'||(line.dialogue_english||'').length>10000)throw Error(`Dialogue ${index+1}: enter valid speaker lines.`)
    return {speaker:line.speaker,dialogue:line.dialogue.trim(),dialogue_english:(line.dialogue_english||'').trim()}
   })
   pair={...pair,dialogue:lines.map(line=>line.dialogue).join('\n'),dialogue_english:lines.map(line=>line.dialogue_english).join('\n')}
  }
  if(!pair||typeof pair.dialogue!=='string'||!pair.dialogue.trim()||pair.dialogue.length>10000)throw Error(`Dialogue ${index+1}: enter Malayalam text (up to 10,000 characters).`)
  const english=pair.dialogue_english??''
  if(typeof english!=='string'||english.length>10000)throw Error(`Dialogue ${index+1}: enter valid English text (up to 10,000 characters).`)
  const dialogue=pair.dialogue.trim(),key=dialogue.normalize('NFC')
  if(seen.has(key))throw Error(`Dialogue ${index+1} repeats another dialogue for this movie.`)
  seen.add(key)
  return {dialogue,dialogue_english:english.trim(),...(lines?{dialogue_lines:lines}:{})}
 })
}
export function expandDialogues(rows) {
 return rows.flatMap(row=>{
  const pairs=typeof row.dialogue_variants==='string'?JSON.parse(row.dialogue_variants):row.dialogue_variants
  return Array.isArray(pairs)&&pairs.length?pairs.map(pair=>({...row,dialogue:pair.dialogue,dialogue_english:pair.dialogue_english||'',...(pair.dialogue_lines?{dialogue_lines:pair.dialogue_lines}:{})})):[row]
 })
}
