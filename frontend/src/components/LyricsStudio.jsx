import './LyricsStudio.css'
export default function LyricsStudio({children,round=1,targetRef,feedback,compact=false}) {
 return <section ref={targetRef} className={`lyrics-studio-sheet ${compact?'lyrics-studio-compact':''}`} aria-label={compact?undefined:'Lyrics with missing words'}>
  {feedback}
  <div className="studio-paper"><div className="studio-paper-heading"><span>PLAYBACK SESSION</span><span>TAKE {String(round).padStart(2,'0')}</span></div><div className="studio-lyrics-content">{children}</div><div className="studio-paper-footer" aria-hidden="true">PADAM · THE MISSING WORDS</div></div>
  <div className="studio-stand-lip" aria-hidden="true"/>
 </section>
}
