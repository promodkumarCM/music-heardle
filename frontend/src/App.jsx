import FilmClues from './components/FilmClues'
import LyricsStudio from './components/LyricsStudio'
import Clapperboard from './components/Clapperboard'
import PictureGame from './components/PictureGame'
import GameModes from './components/GameModes'
import BuzzerGame from './components/BuzzerGame'
import Admin from './components/Admin'
import { useEffect, useState } from 'react'
import ClueGame from './components/ClueGame'
import LyricsGame from './components/LyricsGame'
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
        <section className="cinema-games" id="now-showing" aria-labelledby="showing-title">
          <div className="showing-heading"><h2 id="showing-title">Now showing</h2><span>ONE TICKET. ENDLESS NOSTALGIA.</span></div>
          <div className="cinema-game-grid">
            {[
              { id: 'song', title: 'Guess the Song', hint: 'Listen. Name the tune.', image: '/art/radio-card.png' },
              { id: 'picture', title: 'Picture Clues', hint: 'One picture. One movie.', image: '/art/theatre-card-red-wide.png' },
              { id: 'dialogue', title: 'Guess the Movie', hint: 'Know that dialogue?', clapper: true },
              { id: 'clue', title: 'Five Clues', hint: 'Fewer clues. More points.', film: true },
              { id: 'lyrics', title: 'Missing Lyrics', hint: 'Fill in the missing words.', studio: true },
            ].map((game, index) => (
              <a className={'cinema-game-tile cinema-game-tile-' + game.id + (game.image || game.clapper || game.studio || game.film ? ' game-tile-illustrated' : '')} href={'#' + game.id + '-game'} aria-label={'Play ' + game.title} key={game.id}>
                {game.film && <div className="game-tile-artwork game-tile-film-art" aria-hidden="true"><FilmClues compact clues={[true,true]}/></div>}
                {game.studio && <div className="game-tile-artwork game-tile-studio-art" aria-hidden="true"><LyricsStudio compact><div className="studio-mini-notation">♪ ♫ ♩ ♫</div><p className="studio-mini-words"><span>____ ♪ ____</span><span>♫ ____ ____</span><span>____ ____ ♩</span></p></LyricsStudio></div>}
                {game.clapper && <div className="game-tile-artwork game-tile-clapper-art" aria-hidden="true"><Clapperboard compact animate={false}>Famous lines.</Clapperboard></div>}
                {game.image && <div className="game-tile-artwork" aria-hidden="true">
                  <img className="game-tile-art" src={game.image} alt="" />
                </div>}
                <div className="game-tile-top"><span>GAME 0{index + 1}</span>{!game.image && !game.clapper && !game.studio && !game.film && <span className="game-tile-symbol" aria-hidden="true">{game.symbol}</span>}</div>
                <div className="game-tile-copy"><h3>{game.title}</h3><p>{game.hint}</p></div>
                <span className="game-tile-play">Let’s play <span aria-hidden="true">↗</span></span>
              </a>
            ))}
          </div>

          <div className="coming-attractions"><span aria-hidden="true">✧</span><div><h3>More stories. More games.</h3><p>The next attraction is still in the making. Enjoy the music while you wait.</p></div><span className="coming-label">COMING SOON</span></div>
        </section>
        <a className="admin-home-link" href="#admin">Admin ↗</a>
        <footer className="cinema-footer"><span>PADAM / THE FILM PLAYHOUSE</span><span>For the fans. For the fun.</span></footer>
      </div>
    </main>
  )
}

export default function App() {
  const [page, setPage] = useState(() => window.location.hash.startsWith('#buzzer-game') ? 'buzzer' : window.location.hash === '#picture-game' ? 'pictures' : window.location.hash === '#admin' ? 'admin' : window.location.hash === '#lyrics-game' ? 'lyrics' : window.location.hash === '#clue-game' ? 'clue' : window.location.hash === '#dialogue-game' ? 'dialogue' : window.location.hash === '#song-game' ? 'song' : 'home')
  const [scoreVersion, setScoreVersion] = useState(0)
  useEffect(() => {
    let previousHash = window.location.hash
    const gameFor = hash => hash.startsWith('#buzzer-game') ? new URLSearchParams(hash.split('?')[1]).get('game') : ({'#picture-game':'pictures','#song-game':'song','#dialogue-game':'dialogue','#clue-game':'clues','#lyrics-game':'lyrics'})[hash]
    const updatePage = () => {
      const sameGame = gameFor(previousHash) && gameFor(previousHash) === gameFor(window.location.hash)
      previousHash = window.location.hash
      setPage(window.location.hash.startsWith('#buzzer-game') ? 'buzzer' : window.location.hash === '#picture-game' ? 'pictures' : window.location.hash === '#admin' ? 'admin' : window.location.hash === '#lyrics-game' ? 'lyrics' : window.location.hash === '#clue-game' ? 'clue' : window.location.hash === '#dialogue-game' ? 'dialogue' : window.location.hash === '#song-game' ? 'song' : 'home')
      if (!sameGame && window.location.hash !== '#now-showing') window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', updatePage)
    return () => window.removeEventListener('hashchange', updatePage)
  }, [])
  if (page === 'buzzer') return <BuzzerGame />
  if (page === 'pictures') return <PictureGame />
  if (page === 'admin') return <Admin />
  if (page === 'lyrics') return <LyricsGame />
  if (page === 'clue') return <ClueGame />
  if (page === 'dialogue') return <DialogueGame />
  if (page === 'home') return <CinemaHome />
  return (
    <main className="app">
      <a className="back-to-cinema" href="#">← All games <span>PADAM</span></a>

      <GameModes game="song" />
      <GuessGame onScoreSaved={() => setScoreVersion((value) => value + 1)} />
      <Leaderboard refreshKey={scoreVersion} />
    </main>
  )
}
