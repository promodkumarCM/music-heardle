import './FilmClues.css'
const points=[100,80,60,40,20]
export default function FilmClues({clues=[],roundKey='preview',targetRef,feedback,busy=false,compact=false}) {
 return <section ref={targetRef} className={`film-clues${compact?' film-clues-mini':''}`} aria-label="Movie clues" aria-busy={busy}>
 {feedback}<ol className="film-frames">{points.map((value,i)=><li key={`${roundKey}-${i}`} className={clues[i]?'film-lit':'film-dark'}><div className="film-frame-number">0{i+1}</div><span className="film-frame-points">{value} pts</span><p>{compact?'━━━━ ━━━━━':clues[i]||'Clue not yet revealed'}</p>{clues[i]&&!compact&&<span className="clue-reveal-cover" aria-hidden="true">CLUE 0{i+1}</span>}</li>)}</ol>
 </section>
}
