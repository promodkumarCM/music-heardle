import FilmClues from './components/FilmClues'
import LyricsStudio from './components/LyricsStudio'
import Clapperboard from './components/Clapperboard'
import PictureGame from './components/PictureGame'
import GameModes from './components/GameModes'
import PartyGame from './components/PartyGame'
import Admin from './components/Admin'
import { useEffect, useRef, useState } from 'react'
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

const soloRoutes={pictures:'picture-game',song:'song-game',dialogue:'dialogue-game',clues:'clue-game',lyrics:'lyrics-game'}
const gameTitles={pictures:'Picture Clues',song:'Guess the Song',dialogue:'Guess the Movie',clues:'Five Clues',lyrics:'Missing Lyrics'}
function ModePopup({game}) {
  const dialog=useRef(null)
  useEffect(()=>{if(!dialog.current.open)dialog.current.showModal()},[])
  return <><CinemaHome/><dialog className="buzzer-setup-dialog mode-popup" ref={dialog} aria-labelledby="mode-popup-title" onCancel={()=>{location.hash='#'}}>
    <div className="buzzer-dialog-heading"><h2 id="mode-popup-title">{gameTitles[game]}</h2><a href="#" className="popup-close" aria-label="Close mode selection">×</a></div>
    <p>How would you like to play?</p>
    <div className="mode-popup-options">
      <a href={`#${soloRoutes[game]}?mode=solo`}><strong>Solo</strong><span>Play on your own and earn your own score.</span></a>
      <a href={`#host-game?game=${game}`}><strong>Host</strong><span>Set up teams. Answer aloud. The host awards points.</span></a>
      <a href={`#buzzer-game?game=${game}`}><strong>Buzzer</strong><span>Create or join a room. Everyone plays on their own device.</span></a>
    </div>
  </dialog></>
}
export default function App() {
  const [hash,setHash]=useState(window.location.hash)
  const [scoreVersion,setScoreVersion]=useState(0)
  useEffect(()=>{
    const update=()=>{setHash(window.location.hash);window.scrollTo(0,0)}
    window.addEventListener('hashchange',update)
    return()=>window.removeEventListener('hashchange',update)
  },[])
  const [route,query='']=hash.split('?')
  const params=new URLSearchParams(query)
  if(route==='#admin')return <Admin/>
  if(route==='#host-game'||route==='#buzzer-game')return <PartyGame key={hash} mode={route==='#host-game'?'host':'buzzer'} backdrop={<CinemaHome/>}/>
  const game=Object.keys(soloRoutes).find(key=>`#${soloRoutes[key]}`===route)
  if(!game)return <CinemaHome/>
  if(params.get('mode')!=='solo')return <ModePopup key={game} game={game}/>
  if(game==='pictures')return <PictureGame/>
  if(game==='lyrics')return <PartyGame key="solo-lyrics" mode="solo" game="lyrics" backdrop={<CinemaHome/>}/>
  if(game==='clues')return <ClueGame/>
  if(game==='dialogue')return <DialogueGame/>
  return <main className="app">
    <a className="back-to-cinema" href="#">← All games <span>PADAM</span></a>
    <GameModes game="song"/>
    <GuessGame onScoreSaved={()=>setScoreVersion(value=>value+1)}/>
    <Leaderboard refreshKey={scoreVersion}/>
  </main>
}
