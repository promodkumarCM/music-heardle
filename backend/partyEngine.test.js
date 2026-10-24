import {test} from 'node:test'
import assert from 'node:assert/strict'
import {partyAction,partyView,expireParty} from './partyEngine.js'
const alice={id:'alice',name:'Alice',team:0,token:'secret-a'}
const bob={id:'bob',name:'Bob',team:1,token:'secret-b'}
function make(mode='buzzer',game='pictures') {
  return {mode,game,creator:'alice',players:[alice,bob],teams:[{name:'Alice',score:0},{name:'Bob',score:0}],
    phase:'lobby',version:0,round:1,seconds:10,content:'clue.jpg',target:'Test Movie',answer:'Test Movie',movieCatalog:[{movie:'Test Movie',aliases:['Alias']}],active:null,blocked:[],settled:{},winner:null}
}
const act=(room,player,action,extra={},now=1000)=>partyAction(room,player,{action,version:room.version,...extra},now)
test('creator is also a player; first buzz wins and only winner can answer',()=>{
  const r=make();act(r,alice,'start');const version=r.version
  act(r,alice,'buzz');assert.equal(r.winner.id,'alice')
  assert.throws(()=>partyAction(r,bob,{action:'buzz',version},1000))
  assert.throws(()=>act(r,bob,'guess',{guess:'Test Movie'}))
  assert.equal(partyView(r,alice,1000).answer,undefined)
  act(r,alice,'guess',{guess:'Alias'});assert.equal(r.teams[0].score,100);assert.equal(r.phase,'settled')
  assert.equal(partyView(r,bob,1000).answer,'Test Movie')
  assert.throws(()=>act(r,alice,'guess',{guess:'Test Movie'}));assert.equal(r.teams[0].score,100)
})
test('wrong answer locks out player and immediately reopens for others',()=>{
  const r=make();act(r,alice,'start');act(r,bob,'buzz');act(r,bob,'guess',{guess:'wrong'})
  assert.equal(r.phase,'open');assert.deepEqual(r.blocked,[1]);assert.throws(()=>act(r,bob,'buzz'))
  act(r,alice,'buzz');act(r,alice,'guess',{guess:'Test Movie'});assert.equal(r.teams[0].score,100)
})
test('timeout reopens for others; all attempts used reveals with zero points',()=>{
  const r=make();act(r,alice,'start');act(r,alice,'buzz');expireParty(r,11000)
  assert.equal(r.phase,'open');assert.throws(()=>act(r,alice,'guess',{guess:'Test Movie'},11001))
  act(r,bob,'buzz',{},12000);act(r,bob,'guess',{guess:'wrong'},12500)
  assert.equal(r.phase,'settled');assert.deepEqual(r.teams.map(t=>t.score),[0,0])
})
test('players cannot mark scores, reveal answers, or start another player’s room',()=>{
  const r=make();assert.throws(()=>act(r,bob,'start'));act(r,alice,'start')
  assert.throws(()=>act(r,alice,'mark',{team:0}));assert.throws(()=>act(r,alice,'reveal'))
  assert.equal(partyView(r,alice,1000).answer,undefined)
  assert.equal(JSON.stringify(partyView(r,alice,1000)).includes('secret-'),false)
})
test('host awards spoken answers to selected teams with no device players needed',()=>{
  const r=make('host');r.players=[alice];act(r,alice,'start');act(r,alice,'mark',{team:1})
  assert.equal(r.teams[1].score,100);assert.throws(()=>act(r,alice,'mark',{team:1}));assert.equal(r.teams[1].score,100)
})
test('lyrics reveals only settled words and moves through all ten words',()=>{
  const r=make('solo','lyrics');r.players=[alice];r.teams=r.teams.slice(0,1)
  r.content=[Array.from({length:10},(_,id)=>({id,text:`വാക്ക്${id}`}))]
  act(r,alice,'start')
  for(let id=0;id<10;id++) {
    assert.equal(r.active,id)
    assert.equal(partyView(r,alice,1000).content[0][id].text,null)
    act(r,alice,'guess',{guess:`വാക്ക്${id}`})
    if(id<9)act(r,alice,'continue')
  }
  assert.equal(r.teams[0].score,100);assert.equal(partyView(r,alice,1000).complete,true)
  assert.throws(()=>act(r,alice,'continue'))
})
test('five clue points use current clue and cannot change during answer window',()=>{
  const r=make('buzzer','clues');r.content=['one','two','three','four','five'];r.clue=1
  act(r,alice,'start');act(r,alice,'clue');act(r,bob,'buzz')
  assert.throws(()=>act(r,alice,'clue'))
  act(r,bob,'guess',{guess:'Test Movie'});assert.equal(r.teams[1].score,80)
})
test('one player cannot start a buzzer room alone',()=>{
  const r=make();r.players=[alice];assert.throws(()=>act(r,alice,'start'))
})
test('majority skip voting ends the round without awarding points',()=>{
  const r=make();act(r,alice,'start');act(r,alice,'skip');act(r,alice,'skip')
  assert.equal(r.phase,'open');assert.equal(r.skipVotes.length,1)
  act(r,bob,'skip');assert.equal(r.phase,'settled');assert.deepEqual(r.teams.map(t=>t.score),[0,0])
})
