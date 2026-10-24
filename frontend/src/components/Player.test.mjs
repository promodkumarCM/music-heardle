import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {transformSync} from 'esbuild'

const source=transformSync(readFileSync(new URL('./Player.jsx',import.meta.url),'utf8'),{loader:'jsx',format:'cjs',jsx:'automatic'}).code
function mount() {
  const effects=[],calls=[],prepared=[],status=[],failures=[],timers=new Map()
  let player,clock=1000,nextTimer=0
  const react={forwardRef:fn=>fn,useRef:value=>({current:value}),useEffect:fn=>effects.push(fn),useImperativeHandle:(ref,fn)=>{ref.current=fn()}}
  const context={module:{exports:{}},require:name=>name==='react'?react:{jsx:(tag,props)=>({tag,props})},
    document:{createElement:()=>({}),head:{appendChild(){}}},
    setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,at:clock+ms});return id},clearTimeout:id=>timers.delete(id),Date:{now:()=>clock},
    window:{location:{origin:'http://localhost:5173'},YT:{PlayerState:{PLAYING:1,CUED:5},Player:class {
      constructor(target,options){this.events=options.events;this.videoId='';player=this;queueMicrotask(()=>this.events.onReady({target:this}))}
      cueVideoById({videoId}){this.videoId=videoId;calls.push(['cue',videoId])}
      loadVideoById({videoId}){this.videoId=videoId;calls.push(['load',videoId])}
      getVideoData(){return {video_id:this.videoId}}
      seekTo(seconds){calls.push(['seek',seconds])}
      playVideo(){calls.push(['play'])}
      pauseVideo(){calls.push(['pause'])}
      setVolume(){} unMute(){} destroy(){}
    }}}
  }
  vm.runInNewContext(source,context)
  const ref={current:null}
  const tree=context.module.exports.default({onReady:()=>calls.push(['ready']),onPrepared:id=>prepared.push(id),onPlaybackStatus:message=>status.push(message),onUnplayable:id=>failures.push(id)},ref)
  tree.props.ref.current={appendChild(){}}
  const cleanup=effects.map(fn=>fn())
  return {ref,calls,prepared,status,failures,cleanup,
    async ready(){await Promise.resolve();await Promise.resolve()},
    emit(state,id=player.videoId){player.videoId=id;player.events.onStateChange({data:state})},
    blocked(){player.events.onAutoplayBlocked()},
    error(code){player.events.onError({data:code})},
    advance(ms){const end=clock+ms;while(true){const entry=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry||entry[1].at>end)break;clock=entry[1].at;timers.delete(entry[0]);entry[1].fn()}clock=end},
  }
}
test('preparation requested before iframe readiness is queued and never autoplays',async()=>{
  const h=mount();h.ref.current.prepare('first');await h.ready()
  assert.equal(h.calls.filter(c=>c[0]==='cue').length,1)
  assert.equal(h.calls.some(c=>c[0]==='play'||c[0]==='load'),false)
  assert.equal(h.prepared.at(-1),null)
  h.emit(5);assert.equal(h.prepared.at(-1),'first')
})
test('stale cue cannot mark a newer song ready',async()=>{
  const h=mount();await h.ready();h.ref.current.prepare('old');h.ref.current.prepare('new')
  h.emit(5,'old');assert.equal(h.prepared.at(-1),null)
  h.emit(5,'new');assert.equal(h.prepared.at(-1),'new')
})
test('slow first load gets ten seconds before retry; snippet timing starts when audio plays',async()=>{
  const h=mount();await h.ready();h.ref.current.prepare('first');h.emit(5)
  h.ref.current.playSnippet('first',0,5)
  h.advance(7000);assert.equal(h.calls.some(c=>c[0]==='load'),false);assert.equal(h.failures.length,0)
  h.emit(1);h.advance(4999);assert.equal(h.calls.some(c=>c[0]==='pause'),false)
  h.advance(1);assert.equal(h.calls.at(-1)[0],'pause');assert.equal(h.failures.length,0)
})
test('blocked playback cancels retries and allows the same clip to be played again',async()=>{
  const h=mount();await h.ready();h.ref.current.prepare('first');h.emit(5)
  h.ref.current.playSnippet('first',0,5);h.blocked();h.advance(30000)
  assert.equal(h.failures.length,0);assert.equal(h.calls.some(c=>c[0]==='load'),false)
  h.ref.current.playSnippet('first',0,5);h.emit(1);h.advance(5000)
  assert.equal(h.calls.at(-1)[0],'pause')
})
test('genuinely stuck playback fails after one retry; stop cancels a pending retry',async()=>{
  const h=mount();await h.ready();h.ref.current.playSnippet('first',0,5)
  h.advance(20000);assert.deepEqual(h.failures,['first'])
  h.ref.current.playSnippet('second',0,5);h.ref.current.stop();h.advance(30000)
  assert.deepEqual(h.failures,['first'])
})
test('temporary preparation errors retry then allow a manual Play attempt',async()=>{
  const h=mount();await h.ready();h.ref.current.prepare('first');h.error(5)
  h.advance(1000);assert.equal(h.calls.filter(c=>c[0]==='cue').length,2)
  h.error(5);assert.equal(h.prepared.at(-1),'first')
  h.ref.current.playSnippet('first',0,5);h.emit(1);h.advance(5000)
  assert.equal(h.calls.at(-1)[0],'pause')
})
test('unavailable videos show the specific YouTube reason and do not retry forever',async()=>{
  const h=mount();await h.ready();h.ref.current.prepare('first');h.error(150);h.advance(30000)
  assert.equal(h.prepared.at(-1),null)
  assert.match(h.status.at(-1),/owner.*150/)
  assert.equal(h.calls.filter(c=>c[0]==='cue').length,1)
})
test('silent preparation timeout permits Play after a bounded retry',async()=>{
  const h=mount();await h.ready();h.ref.current.prepare('first');h.advance(20000)
  assert.equal(h.prepared.at(-1),'first');assert.equal(h.failures.length,0)
})
