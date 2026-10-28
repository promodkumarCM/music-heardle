// Recognize explicitly labelled conversations saved in the older text editor.
export function labelledDialogueLines(text) {
 if(typeof text!=='string')return []
 const markers=[...text.matchAll(/(?:^|\n)[ \t]*Speaker[ \t]+([12])[ \t]*[:：]?[ \t]*(?:\n|(?=\S))/gi)]
 if(markers.length<2||text.slice(0,markers[0].index).trim())return []
 const lines=markers.map((marker,index)=>({speaker:Number(marker[1]),dialogue:text.slice(marker.index+marker[0].length,markers[index+1]?.index??text.length).trim()}))
 return lines.every(line=>line.dialogue)&&new Set(lines.map(line=>line.speaker)).size===2?lines:[]
}

export function conversationLines(lines,text,english) {
 if(Array.isArray(lines)&&lines.length)return lines
 const native=labelledDialogueLines(text),translated=labelledDialogueLines(english)
 const paired=translated.length===native.length&&translated.every((line,index)=>line.speaker===native[index].speaker)
 return native.map((line,index)=>({...line,dialogue_english:paired?translated[index].dialogue:''}))
}
