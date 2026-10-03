import { useState } from 'react'
import GuessGame from './components/GuessGame'
import Leaderboard from './components/Leaderboard'

export default function App() {
  const [scoreVersion, setScoreVersion] = useState(0)

  return (
    <div className="app">
      <header className="masthead">
        <p className="eyebrow">THE MALAYALAM MUSIC CLUB</p>
        <h1>A little nostalgia.<br /><em>A familiar tune.</em></h1>
        <p>Listen to a little. Remember it all.</p>
      </header>
      <GuessGame onScoreSaved={() => setScoreVersion((value) => value + 1)} />
      <Leaderboard refreshKey={scoreVersion} />
    </div>
  )
}
