const routes={characters:'characters-game',pictures:'picture-game',song:'song-game',dialogue:'dialogue-game',clues:'clue-game',lyrics:'lyrics-game'}
import ContributionForm from './ContributionForm'
export default function GameModes({game,context,actions}){
 return <div className="game-toolbar">{context&&<div className="game-toolbar-context">{context}</div>}<nav className="game-toolbar-actions" aria-label="Game options">
 <a className="game-menu-action" href={`#${routes[game]}?mode=choose`}>Change play mode</a>
 <ContributionForm key={game} game={game}/>{actions}
 </nav></div>
}
