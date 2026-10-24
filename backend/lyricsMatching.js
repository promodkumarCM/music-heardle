// Keep lyric spelling tolerance separate from movie and song-title matching.
const chillus = new Map([['ണ','ൺ'],['ന','ൻ'],['ര','ർ'],['ല','ൽ'],['ള','ൾ'],['ക','ൿ']])
export function normalizeLyric(value) {
 return value.normalize('NFC')
  .replace(/([ണനരലളക])്\u200d/gu,(_,letter)=>chillus.get(letter))
  .replace(/[\u200c\u200d]/g,'')
  .replace(/[^\p{L}\p{M}\p{N}]/gu,'')
}
const segmenter = new Intl.Segmenter('ml',{granularity:'grapheme'})
const letters = text => [...segmenter.segment(text)].map(part=>part.segment)
function oneEdit(a,b) {
 const left=Array.from(a),right=Array.from(b)
 if(Math.abs(left.length-right.length)>1)return false
 let i=0,j=0,edits=0
 while(i<left.length&&j<right.length) {
  if(left[i]===right[j]){i++;j++;continue}
  if(++edits>1)return false
  if(left.length>=right.length)i++
  if(right.length>=left.length)j++
 }
 return edits+(left.length-i)+(right.length-j)<=1
}
export function matchesLyric(guess,answer) {
 const a=normalizeLyric(guess),b=normalizeLyric(answer)
 if(!a||!b)return false
 if(a===b)return true
 // Allow one character difference only in the final written letter of a
 // longer Malayalam word. Keep short words and earlier letters exact.
 if(!/^[\u0d00-\u0d7f]+$/u.test(a)||! /^[\u0d00-\u0d7f]+$/u.test(b))return false
 const left=letters(a),right=letters(b)
 if(left.length<4||right.length<4||left.length!==right.length)return false
 return left.slice(0,-1).join('')===right.slice(0,-1).join('')&&oneEdit(left.at(-1),right.at(-1))
}
