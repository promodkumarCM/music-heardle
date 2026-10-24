import RoundFeedback from './RoundFeedback'
const BASE=import.meta.env.VITE_API_URL||`${window.location.protocol}//${window.location.hostname}:4000`
const imageUrl=url=>url?.startsWith('/uploads/picture-clues/')?BASE.replace(/\/$/,'')+url:url
export default function PictureStage({image,mobileImage,loading,round=0,targetRef,feedback}){
 return <div className="picture-theatre" ref={targetRef}>
 <RoundFeedback feedback={feedback}/>
 <div className="theatre-valance" aria-hidden="true"/>
 <div className="theatre-curtain curtain-left" aria-hidden="true"/>
 <div className="theatre-curtain curtain-right" aria-hidden="true"/>
 <div className="picture-screen" key={round}>
 {image?<picture>{mobileImage&&<source media="(max-width: 800px)" srcSet={imageUrl(mobileImage)}/>}<img src={imageUrl(image)} alt="Illustrated movie clue" onError={e=>{e.currentTarget.hidden=true;e.currentTarget.parentElement.nextElementSibling.hidden=false}}/></picture>:null}
 <p hidden={!!image} role="status">{loading?'Preparing the screen…':image?'Image unavailable. Try the next picture.':'Invite your teams to start.'}</p>
 </div><div className="theatre-stage" aria-hidden="true"/>
 </div>
}
