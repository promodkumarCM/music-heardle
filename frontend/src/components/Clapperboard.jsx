import './Clapperboard.css'
export default function Clapperboard({children,round=1,footer='NAME THE MOVIE',targetRef,feedback,compact=false,animate=true}) {
 return <section ref={targetRef} className={`clapperboard ${compact?'clapperboard-compact':''}`} aria-label={compact?undefined:'Movie dialogue clue'}>
  {feedback}
  <div className="clapper-top" key={animate?round:'still'} aria-hidden="true"/><div className="clapper-fixed" aria-hidden="true"/><div className="clapper-hinge" aria-hidden="true"><i/><i/><i/></div>
  <div className="clapper-body"><div className="clapper-meta">TAKE {String(round).padStart(2,'0')}</div><blockquote>{children}</blockquote><div className="clapper-footer">{footer}</div></div>
 </section>
}
