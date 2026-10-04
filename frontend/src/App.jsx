import { useEffect, useState } from 'react'
import ClueGame from './components/ClueGame'
import DialogueGame from './components/DialogueGame'
import GuessGame from './components/GuessGame'
import Leaderboard from './components/Leaderboard'
import './cinema.css'

function CinemaHome() {
  return (
    <main className="cinema-home">
      <div className="cinema-shell">
        <header className="cinema-header">
          <a className="cinema-logo" href="#"><span aria-hidden="true">✦</span> PADAM<span className="logo-caption">THE FILM PLAYHOUSE</span></a>
          <span className="cinema-header-note">Made for the love of Malayalam cinema.</span>
        </header>
        <section className="cinema-hero" aria-labelledby="cinema-title">
          <p className="cinema-eyebrow"><span /> THE SHOW IS ABOUT TO BEGIN</p>
          <h1 id="cinema-title">You know the films.<br />Now, <em>play the part.</em></h1>
          <p className="cinema-intro">The songs you hum. The stories you love.<br />A little movie magic, one game at a time.</p>
          <a className="cinema-explore" href="#now-showing">Find your next game <span aria-hidden="true">↓</span></a>
          <div className="cinema-reel" aria-hidden="true"><i /><i /><i /><i /><b /></div>
          <span className="hero-edition">MALAYALAM CINEMA / VOL. 01</span>
        </section>
        <section className="cinema-games" id="now-showing" aria-labelledby="showing-title">
          <div className="showing-heading"><h2 id="showing-title">Now showing</h2><span>ONE TICKET. ENDLESS NOSTALGIA.</span></div>
          <a className="featured-game" href="#song-game" aria-label="Play Guess the Song">
            <div className="game-poster">
              <span className="poster-topline">A MALAYALAM MUSIC EXPERIENCE</span>
              <div className="poster-disc" aria-hidden="true"><div><span>PADAM</span><b>♫</b><small>SIDE A · 33 RPM</small></div></div>
              <div className="poster-title">FOR THE<br /><em>record.</em></div>
              <span className="poster-bottomline">A FEW SECONDS. A THOUSAND MEMORIES.</span>
            </div>
            <div className="game-ticket">
              <div className="ticket-meta"><span className="live-badge">● NOW PLAYING</span><span>GAME 01</span></div>
              <p className="ticket-category">THE MUSIC ROUND</p>
              <h3>Guess the Song</h3>
              <p className="ticket-description">That opening note sounds familiar. Tune in to the vintage radio and name the Malayalam song before the moment slips away.</p>
              <div className="game-features"><span>5 difficulty levels</span><span>264 songs</span><span>Leaderboard</span></div>
              <span className="ticket-play">Let’s play <span aria-hidden="true">↗</span></span>
              <span className="ticket-admission">ADMIT ONE MUSIC LOVER <span className="ticket-barcode" aria-hidden="true" /></span>
            </div>
          </a>
          <a className="dialogue-game-card" href="#dialogue-game" aria-label="Play Guess the Movie">
            <div className="dialogue-card-art" aria-hidden="true"><span>“</span><p>FAMOUS LINES.<br /><em>Unforgettable films.</em></p></div>
            <div className="dialogue-card-copy"><span className="cinema-eyebrow">GAME 02 · THE DIALOGUE ROUND</span><h3>Guess the Movie</h3><p>One familiar dialogue. Which Malayalam film comes to mind?</p><span className="dialogue-card-play">Take your cue ↗</span></div>
          </a>
          <a className="dialogue-game-card" href="#clue-game" aria-label="Play Five Clues"><div className="dialogue-card-art" aria-hidden="true"><span>05</span><p>FOLLOW THE CLUES.<br/><em>Name the film.</em></p></div><div className="dialogue-card-copy"><span className="cinema-eyebrow">GAME 03 · THE MOVIE MYSTERY</span><h3>Five Clues</h3><p>One movie, five hints. Solve it early for more points, or reveal the answer after clue five.</p><span className="dialogue-card-play">Open the case ↗</span></div></a>
          <div className="coming-attractions"><span aria-hidden="true">✧</span><div><h3>More stories. More games.</h3><p>The next attraction is still in the making. Enjoy the music while you wait.</p></div><span className="coming-label">COMING SOON</span></div>
        </section>
        <footer className="cinema-footer"><span>PADAM / THE FILM PLAYHOUSE</span><span>For the fans. For the fun.</span></footer>
      </div>
    </main>
  )
}

export default function App() {
  const [page, setPage] = useState(() => window.location.hash === '#clue-game' ? 'clue' : window.location.hash === '#dialogue-game' ? 'dialogue' : window.location.hash === '#song-game' ? 'song' : 'home')
  const [scoreVersion, setScoreVersion] = useState(0)
  useEffect(() => {
    const updatePage = () => {
      setPage(window.location.hash === '#clue-game' ? 'clue' : window.location.hash === '#dialogue-game' ? 'dialogue' : window.location.hash === '#song-game' ? 'song' : 'home')
      if (window.location.hash !== '#now-showing') window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', updatePage)
    return () => window.removeEventListener('hashchange', updatePage)
  }, [])
  if (page === 'clue') return <ClueGame />
  if (page === 'dialogue') return <DialogueGame />
  if (page === 'home') return <CinemaHome />
  return (
    <main className="app">
      <a className="back-to-cinema" href="#">← All games <span>PADAM</span></a>
      <header className="masthead">
        <p className="eyebrow">THE MALAYALAM MUSIC CLUB</p>
        <h1>A little nostalgia.<br /><em>A familiar tune.</em></h1>
        <p>Listen to a little. Remember it all.</p>
      </header>
      <GuessGame onScoreSaved={() => setScoreVersion((value) => value + 1)} />
      <Leaderboard refreshKey={scoreVersion} />
    </main>
  )
}
