import ContributionForm from './ContributionForm'
import SupportProject from './SupportProject'
export default function StockFinished({game}){
 return <section className="stock-finished" role="status"><span className="cinema-eyebrow">THAT’S A WRAP</span><h2>Stock finished. Even the prop cupboard is empty!</h2><p>You’ve seen every clue in this set. We’re squeezing in new scenes between meetings, deadlines and chaya breaks.</p><p>Got a scene up your sleeve? Contribute a clue—or buy us two porotta to fuel the next refill.</p><div className="stock-finished-actions"><ContributionForm game={game}/><SupportProject/><a href="#">Try another game →</a></div></section>
}
