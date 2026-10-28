import CharacterStage from './components/CharacterStage'
import ContributionForm from './components/ContributionForm'
import SupportProject from './components/SupportProject'
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
import './components/ModePopup.css'
import {savedPlayMode,rememberPlayMode,playModeHref} from './lib/playMode'

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
              { id: 'characters', title: 'Character Files', hint: 'The name is known. The movie is missing.', dossier: true },
            ].map((game, index) => (
              <a className={'cinema-game-tile cinema-game-tile-' + game.id + (game.image || game.clapper || game.studio || game.film || game.dossier ? ' game-tile-illustrated' : '')} href={'#' + game.id + '-game'} aria-label={'Play ' + game.title} key={game.id}>
                {game.dossier && <div className="game-tile-artwork game-tile-dossier-art" aria-hidden="true"><CharacterStage compact/></div>}
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

          <section className="home-contribute" aria-labelledby="contribute-title"><div><span className="cinema-eyebrow">JOIN THE CREW</span><h3 id="contribute-title">Your movie memory deserves a screen credit.</h3><p>Know a legendary dialogue, sneaky clue or unforgettable character? Send it backstage. We’ll check it and put it in the spotlight.</p></div><ContributionForm home/></section>
        </section>
        <a className="admin-home-link" href="#admin">Admin ↗</a>
        <footer className="cinema-footer"><span>PADAM / THE FILM PLAYHOUSE</span><div className="home-footer-actions"><SupportProject/><ContributionForm game="bug"/></div><span>For the fans. For the fun.</span></footer>
      </div>
    </main>
  )
}

const soloRoutes={characters:'characters-game',pictures:'picture-game',song:'song-game',dialogue:'dialogue-game',clues:'clue-game',lyrics:'lyrics-game'}
const gameTitles={characters:'Character Files',pictures:'Picture Clues',song:'Guess the Song',dialogue:'Guess the Movie',clues:'Five Clues',lyrics:'Missing Lyrics'}
function ModePopup({game,force=false}) {
  const dialog=useRef(null)
  const [remember,setRemember]=useState(()=>!!savedPlayMode())
  useEffect(()=>{
    const saved=savedPlayMode()
    if(saved&&!force){location.replace(playModeHref(game,soloRoutes[game],saved));return}
    if(!dialog.current.open)dialog.current.showModal()
  },[game,force])
  const options=[
    {mode:'solo',title:'Solo',note:'JUST YOU',description:'Play at your pace. Test your memory and build your score.',icon:<><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>},
    {mode:'host',title:'Host a game',note:'ONE SCREEN · TEAMS',description:'Bring everyone together. Teams answer aloud; you award the points.',icon:<><path d="M3 4h18v12H3zM8 21l4-5 4 5M12 16v5"/><path d="m9 10 2 2 4-4"/></>},
    {mode:'buzzer',title:'Play with buzzers',note:'EVERYONE ON THEIR DEVICE',description:'Create or join a room. Buzz first, answer fast, and win the round.',icon:<><path d="M5 17v-3a7 7 0 0 1 14 0v3M3 17h18v4H3zM10 3h4M12 3v4"/></>},
  ]
  return <><CinemaHome/><dialog className="buzzer-setup-dialog mode-popup" ref={dialog} aria-labelledby="mode-popup-title" onCancel={()=>{location.hash='#'}}>
    <p className="mode-popup-eyebrow">PADAM / LET’S PLAY</p>
    <div className="buzzer-dialog-heading"><h2 id="mode-popup-title">{gameTitles[game]}</h2><a href="#" className="popup-close" aria-label="Close mode selection">×</a></div>
    <p className="mode-popup-intro">A quiet challenge or a little friendly competition?</p>
    <div className="mode-popup-options">
      {options.map(option=><a key={option.mode} href={playModeHref(game,soloRoutes[game],option.mode)} onClick={()=>rememberPlayMode(option.mode,remember)}>
        <span className="mode-option-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{option.icon}</svg></span>
        <span className="mode-option-copy"><span className="mode-option-note">{option.note}</span><strong>{option.title}</strong><span>{option.description}</span></span>
        <span className="mode-option-arrow" aria-hidden="true">↗</span>
      </a>)}
    </div>
    <label className="mode-popup-remember"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/><span><strong>Don’t show this again</strong><small>Use my chosen mode for all games on this browser.</small></span></label>
    <p className="mode-popup-footnote">You can always switch using “Change play mode” in a game.</p>
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
  if(params.get('mode')!=='solo')return <ModePopup key={`${game}:${params.get('mode')}`} game={game} force={params.get('mode')==='choose'}/>
  if(game==='characters')return <PartyGame key="solo-characters" mode="solo" game="characters" backdrop={<CinemaHome/>}/>
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
