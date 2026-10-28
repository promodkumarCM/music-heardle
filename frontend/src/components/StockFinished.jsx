import ContributionForm from './ContributionForm'
import SupportProject from './SupportProject'
export default function StockFinished({game}){
 return <section className="stock-finished" role="status"><span className="cinema-eyebrow">THAT’S A WRAP</span><h2>Interval! The clues have gone for chaya.</h2><p>You’ve cleared the whole stock. Even our last clue has put on its slippers and gone home. Fresh scenes are coming as we squeeze in a little cinema between meetings and deadlines.</p><p>Know a scene we missed? Send us a clue and join the credits. Or buy us two porotta—plot twists are easier on a full stomach.</p><div className="stock-finished-actions"><ContributionForm game={game}/><SupportProject/><a href="#">Try another game →</a></div></section>
}
