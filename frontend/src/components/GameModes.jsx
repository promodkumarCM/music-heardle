const routes={characters:'characters-game',pictures:'picture-game',song:'song-game',dialogue:'dialogue-game',clues:'clue-game',lyrics:'lyrics-game'}
import ContributionForm from './ContributionForm'
export default function GameModes({game}){
 return <><nav className="game-modes game-modes-compact" aria-label="Play mode">
 <a href={`#${routes[game]}?mode=choose`}>Change play mode</a>
 </nav><ContributionForm key={game} game={game}/></>
}
