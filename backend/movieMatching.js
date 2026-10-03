export const normalizeMovie = value => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '')
export function distance(a, b) {
  a = Array.from(a); b = Array.from(b)
  const d = Array.from({length:a.length+1}, (_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0))
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) {
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1))
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)
  }
  return d[a.length][b.length]
}
export function rankMovies(guess, catalog) {
  const query=normalizeMovie(guess)
  return catalog.map(movie=>({...movie, distance:Math.min(...[movie.movie,...movie.aliases].map(name=>distance(query,normalizeMovie(name))))})).sort((a,b)=>a.distance-b.distance)
}
export function matchMovie(guess, target, catalog) {
  const query=normalizeMovie(guess)
  const ranked=rankMovies(guess,catalog)
  const exact=ranked.filter(row=>row.distance===0)
  if(exact.length) return {correct:exact.some(row=>row.movie===target)}
  const limit=query.length>=10?2:query.length>=5?1:0
  const nearest=ranked[0]
  if(limit && nearest?.distance<=limit && ranked[1]?.distance>nearest.distance) return {correct:nearest.movie===target}
  // Suggestions depend only on the entered text, never on the hidden answer.
  const suggestions=ranked.filter(row=>row.distance<=Math.max(1,limit)).slice(0,3).map(row=>row.movie)
  return {correct:false,...(suggestions.length?{suggestions}:{})}
}
