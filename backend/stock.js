import {randomInt} from 'node:crypto'
const norm=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu,'')
export const stockKey=row=>JSON.stringify([row.youtube_id||row.image_url||row.id,row.dialogue||''])
export const movieGroup=row=>norm(row.movie||row.title||row.id)
export function drawStock(rows,state){
 state.used??=new Set()
 const unused=rows.filter(row=>!state.used.has(stockKey(row)))
 if(!unused.length)return null
 const differentMovie=unused.filter(row=>movieGroup(row)!==state.lastMovie)
 const different=differentMovie.filter(row=>!row.character_name||norm(row.character_name)!==state.lastCharacter)
 const differentActor=different.filter(row=>!row.actor_name||norm(row.actor_name)!==state.lastActor)
 const choices=differentActor.length?differentActor:different.length?different:differentMovie.length?differentMovie:unused
 const row=choices[randomInt(choices.length)]
 state.used.add(stockKey(row));state.lastMovie=movieGroup(row);state.lastCharacter=norm(row.character_name);state.lastActor=norm(row.actor_name)
 return row
}
