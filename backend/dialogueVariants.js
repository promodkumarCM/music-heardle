export function validateDialogueVariants(input) {
 if(!Array.isArray(input)||input.length<1||input.length>30)throw Error('Add between 1 and 30 dialogues for this movie.')
 const seen=new Set()
 return input.map((pair,index)=>{
  if(!pair||typeof pair.dialogue!=='string'||!pair.dialogue.trim()||pair.dialogue.length>10000)throw Error(`Dialogue ${index+1}: enter Malayalam text (up to 10,000 characters).`)
  const english=pair.dialogue_english??''
  if(typeof english!=='string'||english.length>10000)throw Error(`Dialogue ${index+1}: enter valid English text (up to 10,000 characters).`)
  const dialogue=pair.dialogue.trim(),key=dialogue.normalize('NFC')
  if(seen.has(key))throw Error(`Dialogue ${index+1} repeats another dialogue for this movie.`)
  seen.add(key)
  return {dialogue,dialogue_english:english.trim()}
 })
}
export function expandDialogues(rows) {
 return rows.flatMap(row=>{
  const pairs=typeof row.dialogue_variants==='string'?JSON.parse(row.dialogue_variants):row.dialogue_variants
  return Array.isArray(pairs)&&pairs.length?pairs.map(pair=>({...row,dialogue:pair.dialogue,dialogue_english:pair.dialogue_english||''})):[row]
 })
}
