const routes={pictures:'picture-game',song:'song-game',dialogue:'dialogue-game',clues:'clue-game',lyrics:'lyrics-game'}
export default function GameModes({game}){
 return <nav className="game-modes game-modes-compact" aria-label="Play mode">
 <a href={`#${routes[game]}`}>Change play mode</a>
 </nav>
}
