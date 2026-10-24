export default function LyricsAnswerResult({result}) {
 if(!result)return null
 return <div className="lyrics-answer-result" role="status">
  <strong>Word {result.id+1} · {result.revealed?'Revealed · 0 points':result.correct?'Correct · 10 points':'Incorrect · 0 points'}</strong>
  {!result.revealed&&<p>Your answer: <span lang="ml">{result.guess}</span></p>}
  {(result.revealed||!result.correct)&&<p>Correct answer: <span lang="ml">{result.answer}</span></p>}
 </div>
}
