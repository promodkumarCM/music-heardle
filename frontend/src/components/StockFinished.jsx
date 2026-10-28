import ContributionForm from './ContributionForm'
import SupportProject from './SupportProject'
export default function StockFinished({game}){
 return <section className="stock-finished" role="status"><span className="cinema-eyebrow">THAT’S A WRAP</span><h2>Out of clues. Send porotta!</h2><p>You’ve seen them all! More clues coming between work and chaya.</p><p>Send a clue. Or send porotta. Both help.</p><div className="stock-finished-actions"><ContributionForm game={game}/><SupportProject/><a href="#">Try another game →</a></div></section>
}
