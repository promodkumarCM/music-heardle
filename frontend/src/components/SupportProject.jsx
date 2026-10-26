import {useEffect,useRef,useState} from 'react'
import QRCode from 'qrcode'
const paymentLink=import.meta.env.VITE_SUPPORT_PAYMENT_URL??'https://payments.cashfree.com/forms/porotta'
const upiId=import.meta.env.VITE_SUPPORT_UPI_ID||''
const recipient=import.meta.env.VITE_SUPPORT_RECIPIENT||'CurrentUndo'
const amount=import.meta.env.VITE_SUPPORT_AMOUNT||'60'
function paymentDestination(){
 if(paymentLink){try{const url=new URL(paymentLink);if(url.protocol==='https:')return url.href}catch{}return ''}
 if(!upiId||!recipient||!amount||!Number.isFinite(Number(amount))||Number(amount)<=0)return ''
 const params=new URLSearchParams({pa:upiId,pn:recipient,am:amount,cu:'INR',tn:'Buy me 2 porotta - PADAM'})
 return `upi://pay?${params}`
}
export default function SupportProject(){
 const dialog=useRef(null),[qr,setQr]=useState(''),[error,setError]=useState('')
 const destination=paymentDestination()
 useEffect(()=>{if(!destination)return;let active=true;QRCode.toDataURL(destination,{width:280,margin:4,errorCorrectionLevel:'M',color:{dark:'#111111',light:'#ffffff'}}).then(data=>{if(active)setQr(data)}).catch(()=>{if(active)setError('QR code could not load. Use the payment link below.')});return()=>{active=false}},[destination])
 return <div className="support-project"><button type="button" className="support-trigger" onClick={()=>dialog.current.showModal()}><span aria-hidden="true">♥</span> Buy me 2 porotta</button><dialog ref={dialog} className="support-dialog" aria-labelledby="support-title" onClick={event=>{if(event.target===event.currentTarget)dialog.current.close()}}><button type="button" className="support-close" aria-label="Close support dialog" onClick={()=>dialog.current.close()}>×</button><p className="cinema-eyebrow">A LITTLE LOVE FOR PADAM</p><h2 id="support-title">Buy me 2 porotta</h2><p>Enjoying the games? Send a little support with a porotta set.</p>{destination?<><p className="support-amount">{amount?`₹${amount}`:'Support the project'}{recipient&&<small>To {recipient}</small>}</p>{qr&&<img className="support-qr" src={qr} width="220" height="220" alt="Scan to open the CurrentUndo payment page"/>}{error&&<p role="status">{error}</p>}<p>{paymentLink?'Scan with your camera to open the payment page, or use the link below.':'Scan with your UPI app, or use the link on this device.'}</p>{upiId&&<p className="support-upi">UPI: {upiId}</p>}<a className="support-pay" href={destination} target={paymentLink?'_blank':undefined} rel={paymentLink?'noopener noreferrer':undefined}>Open payment{amount?` · ₹${amount}`:''} ↗</a><small>Complete your payment in your payment app.</small></>:<p className="support-pending">Payment details are being set up. Thank you for supporting PADAM!</p>}</dialog></div>
}
