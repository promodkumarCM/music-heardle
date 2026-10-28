import {matchesLyric} from './lyricsMatching.js'
import {normalizeMovie, matchMovie} from './movieMatching.js'

export const fail = (message, status=409) => { throw Object.assign(new Error(message), {status}) }
const blanks = room => room.content.flat().filter(w=>w.id!==undefined)
export const characterPoints=room=>room.actorRevealed?60:100
export function beginQuestion(room) {
  room.blocked=[]; room.winner=null; room.deadline=null;room.skipVotes=[];room.notice=''
  room.phase=room.mode==='host'?'closed':room.mode==='solo'?'answering':'open'
}
export function chooseWord(room) {
  const remaining=blanks(room).filter(w=>!room.settled[w.id])
  room.active=(remaining.find(w=>w.id>(room.active??-1))||remaining[0])?.id ?? null
}
function settle(room, correct, team) {
  if(correct) room.teams[team].score+=room.game==='lyrics'?10:room.game==='clues'?120-room.clue*20:room.game==='characters'?characterPoints(room):100
  room.settled[room.active??0]=true;room.phase='settled';room.winner=null;room.deadline=null
}
function miss(room, team) {
  room.blocked.push(team);room.winner=null;room.deadline=null
  if(room.blocked.length>=room.teams.length)settle(room,false,team)
  else room.phase='open'
}
export function expireParty(room, now=Date.now()) {
  if(room.mode==='buzzer'&&room.phase==='answering'&&now>=room.deadline) {
    miss(room,room.winner.team);room.notice='Time expired.';room.version++
  }
}
export function partyAction(room, player, body, now=Date.now()) {
  expireParty(room,now)
  if(body.version!==room.version)fail('The round changed. Try again.')
  const creator=player.id===room.creator
  const a=body.action
  if(a==='start') {
    if(!creator||room.phase!=='lobby')fail('Only the room creator can start from the lobby.')
    if(room.mode==='buzzer'&&room.players.length<2)fail('Wait for at least two players.')
    if(room.game==='lyrics')chooseWord(room)
    beginQuestion(room)
  } else if(a==='select') {
    if(room.game!=='lyrics'||room.mode==='buzzer'||!creator||!['answering','closed','settled'].includes(room.phase))fail('Word selection is not available.')
    if(!Number.isInteger(body.id)||!blanks(room).some(w=>w.id===body.id)||room.settled[body.id])fail('Choose an unanswered word.',400)
    room.active=body.id;beginQuestion(room)
  } else if(a==='buzz') {
    if(room.mode!=='buzzer'||room.phase!=='open'||room.blocked.includes(player.team))fail('Buzzer is not available.')
    room.winner={id:player.id,team:player.team,name:player.name};room.phase='answering';room.deadline=now+room.seconds*1000;room.notice=''
  } else if(a==='skip') {
    if(room.mode!=='buzzer'||room.phase!=='open')fail('Vote to skip while buzzers are open.')
    room.skipVotes ||= []
    if(!room.skipVotes.includes(player.id))room.skipVotes.push(player.id)
    if(room.skipVotes.length>room.players.length/2) {
      if(room.game==='lyrics')for(const word of blanks(room))room.settled[word.id]=true
      settle(room,false,player.team);room.notice='The players voted to skip this round.'
    }
  } else if(a==='guess') {
    if(room.mode==='host'||room.phase!=='answering'||(room.mode==='buzzer'&&room.winner?.id!==player.id))fail('Wait for your turn to answer.')
    if(typeof body.guess!=='string'||!body.guess.trim()||body.guess.length>255)fail('Enter an answer.',400)
    const answer=room.game==='lyrics'?blanks(room).find(w=>w.id===room.active)?.text:room.target
    const correct=room.game==='lyrics'?matchesLyric(body.guess,answer):room.game==='song'
      ? normalizeMovie(body.guess)===normalizeMovie(answer)
      : matchMovie(body.guess,answer,room.movieCatalog).correct
    room.notice=correct?'Correct answer!':'Incorrect answer.'
    if(correct||room.mode==='solo')settle(room,correct,player.team)
    else miss(room,player.team)
  } else if(a==='mark') {
    if(room.mode!=='host'||!creator||!['closed','settled'].includes(room.phase)||room.settled[room.active??0])fail('This answer cannot be scored.')
    if(!Number.isInteger(body.team)||!room.teams[body.team])fail('Choose a team.',400)
    settle(room,true,body.team);room.notice=room.teams[body.team].name+' wins the answer.'
  } else if(a==='reveal') {
    if(room.mode==='buzzer'||!creator||['lobby','settled','exhausted'].includes(room.phase))fail('Reveal is not available.')
    settle(room,false,player.team)
  } else if(a==='continue') {
    if(room.phase!=='settled'||room.game!=='lyrics')fail('Finish the current word first.')
    if(room.mode==='host'&&!creator)fail('Host only.',403)
    chooseWord(room);if(room.active===null)fail('All ten words are finished. Start the next song.')
    beginQuestion(room)
  } else if(a==='actor') {
    if(room.game!=='characters'||!creator||!room.content.hideActorUntilReveal||room.actorRevealed||!room.content.actor||!['closed','open','answering'].includes(room.phase)||room.mode==='buzzer'&&room.phase!=='open')fail('The actor hint is not available.')
    room.actorRevealed=true;room.notice='Actor name revealed. This round is now worth 60 points for everyone.'
  } else if(a==='clue') {
    if(room.game!=='clues'||room.clue>=5||!['open','closed','answering'].includes(room.phase)||room.mode==='buzzer'&&room.phase!=='open')fail('Cannot open another clue now.')
    if(room.mode==='host'&&!creator)fail('Host only.',403)
    room.clue++
  } else fail('Unknown action.',400)
  room.version++
}

export function partyView(room,player,now=Date.now()) {
  expireParty(room,now)
  const host=room.mode==='host'
  const finished=room.phase==='settled'
  const answer=room.game==='lyrics'?blanks(room).find(w=>w.id===room.active)?.text:room.answer
  const content=['lobby','exhausted'].includes(room.phase)?null:room.game==='lyrics'
    ? room.content.map(s=>s.map(w=>w.id===undefined?w:{id:w.id,text:room.settled[w.id]?w.text:null}))
    :room.game==='clues'?room.content.slice(0,room.clue):room.game==='characters'
      ? {name:room.content.name,english:room.content.english,role:room.content.role,actorImage:!room.content.hideActorUntilReveal||room.actorRevealed?room.content.actorImage||'':'',...(!room.content.hideActorUntilReveal||room.actorRevealed||finished?{actor:room.content.actor}:{})}
      :room.content
  return {code:room.code,mode:room.mode,game:room.game,difficulty:room.difficulty,host,creator:player.id===room.creator,
    me:player.id,team:player.team,phase:room.phase,round:room.round,version:room.version,seconds:room.seconds,
    content,dialogueLines:room.game==='dialogue'&&!['lobby','exhausted'].includes(room.phase)?room.dialogueLines:undefined,dialogueEnglish:room.game==='dialogue'&&room.phase!=='lobby'?room.dialogueEnglish:undefined,mobileImage:room.mobileImage,active:room.active,settled:room.settled,blocked:room.blocked,
    winner:room.winner,deadline:room.deadline,serverNow:now,notice:room.notice,clue:room.clue,skipVotes:room.skipVotes||[],
    teams:room.teams.map(({name,score})=>({name,score})),players:room.players.map(({id,name,team})=>({id,name,team})),
    complete:room.phase==='exhausted'||room.game!=='lyrics'||Object.keys(room.settled).length===10,
    ...(room.game==='characters'?{actorRevealed:!!room.actorRevealed,actorHintAvailable:!!room.content.hideActorUntilReveal&&!room.actorRevealed&&!!room.content.actor,availablePoints:characterPoints(room)}:{}),
    ...(host||finished?{answer}:{}),
  }
}
