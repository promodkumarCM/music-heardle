import { useEffect, useState } from 'react'
import { DIFFICULTIES } from '../data/levels'
import { fetchLeaderboard } from '../lib/api'

export default function Leaderboard({ refreshKey = 0 }) {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0])
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError('')
    setLoading(true)
    fetchLeaderboard(difficulty.weight)
      .then((data) => { if (!cancelled) setRows(data) })
      .catch(() => { if (!cancelled) setError('The chart is unavailable right now.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [difficulty, refreshKey, retry])

  return (
    <section className="card leaderboard" aria-labelledby="leaderboard-title">
      <div className="chart-heading">
        <div>
          <p className="chart-eyebrow">THE LISTENERS’ CHART</p>
          <h2 id="leaderboard-title">Quickest ears in town.</h2>
          <p className="chart-subtitle">Ten spots. A whole lot of melody.</p>
        </div>
        <span className="chart-record" aria-hidden="true"><i /></span>
      </div>
      <div className="chart-filter">
        <label htmlFor="chart-difficulty">Leaderboard</label>
        <select id="chart-difficulty" value={difficulty.name}
          onChange={(e) => setDifficulty(DIFFICULTIES.find((d) => d.name === e.target.value))}>
          {DIFFICULTIES.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
        </select>
      </div>
      <div className="chart-columns" aria-hidden="true"><span>RANK / LISTENER</span><span>GUESS TIME</span></div>
      <div className="chart-content" aria-busy={loading}>
        {loading ? <p className="chart-empty" role="status">Tuning in to the latest scores…</p>
          : error ? <div className="chart-empty" role="alert"><p>{error}</p><button onClick={() => setRetry((value) => value + 1)}>Try again</button></div>
          : rows.length === 0 ? <div className="chart-empty"><span aria-hidden="true">♫</span><strong>Your name could be first.</strong><p>Guess a song on {difficulty.name} to start this chart.</p></div>
          : <ol className="chart-list">
            {rows.map((row, index) => (
              <li key={row.id} className={index === 0 ? 'chart-winner' : ''}>
                <span className="chart-rank" aria-label={`Rank ${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                <div className="chart-player"><strong>{row.playerName}</strong>{index === 0 && <span>FASTEST LISTENER</span>}</div>
                <span className="chart-time">{(row.timeMs / 1000).toFixed(1)}<small> sec</small></span>
              </li>
            ))}
          </ol>}
      </div>
      <p className="chart-footer">{difficulty.snippetSeconds}-second clips <span>·</span> Ranked by fastest guess</p>
    </section>
  )
}
