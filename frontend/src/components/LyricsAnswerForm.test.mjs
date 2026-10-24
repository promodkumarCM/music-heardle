import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {transformSync} from 'esbuild'

const source=transformSync(readFileSync(new URL('./LyricsAnswerForm.jsx',import.meta.url),'utf8'),{loader:'jsx',format:'cjs',jsx:'automatic',define:{'import.meta.env.VITE_API_URL':'"http://api.test"'}}).code
function mount() {
 const slots=[],timers=new Map(),requests=[],answers=[]
 let cursor=0,dirty=true,tree,component,time=0,nextTimer=0,scheduled=[]
 const props={onSubmit:answer=>answers.push(answer)}
 const react={
  useId(){const i=cursor++;return slots[i]??(slots[i]=`input-${i}`)},
  useState(initial){const i=cursor++;if(!slots[i])slots[i]={value:initial};return [slots[i].value,value=>{slots[i].value=typeof value==='function'?value(slots[i].value):value;dirty=true}]},
  useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){scheduled.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()}})}}
 }
 const jsx=(tag,props)=>({tag,props})
 const context={module:{exports:{}},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:{},AbortController,
  setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,at:time+ms});return id},clearTimeout:id=>timers.delete(id),
  fetch:(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}))}
 vm.runInNewContext(source,context);component=context.module.exports.default
 function flush(){let loops=0;while(dirty){assert.ok(loops++<30,'render loop');dirty=false;cursor=0;scheduled=[];tree=component(props);for(const effect of scheduled)effect()}}
 function nodes(node=tree){return [node,...[node?.props?.children].flat(Infinity).filter(x=>x&&typeof x==='object').flatMap(x=>nodes(x))]}
 function find(predicate){const result=nodes().find(predicate);assert.ok(result,'element exists');return result}
 async function settle(){for(let i=0;i<12;i++)await Promise.resolve();flush()}
 flush()
 return {requests,answers,
  find,
  type(value){find(n=>n.tag==='input'&&n.props.type!=='radio').props.onChange({target:{value}});flush()},
  submit(){tree.props.onSubmit({preventDefault(){}});flush()},
  submitDisabled(){return find(n=>n.tag==='button'&&n.props.type==='submit').props.disabled},
  select(word){find(n=>n.tag==='button'&&n.props.children===word).props.onClick();flush()},
  mode(value){const radios=nodes().filter(n=>n.tag==='input'&&n.props.type==='radio');radios[value==='malayalam'?1:0].props.onChange();flush()},
  compose(active){const input=find(n=>n.tag==='input'&&n.props.type!=='radio');input.props[active?'onCompositionStart':'onCompositionEnd']();flush()},
  async advance(ms){time+=ms;for(const [id,timer] of [...timers])if(timer.at<=time){timers.delete(id);timer.fn()}await settle()},
  async respond(index,body,ok=true){requests[index].resolve({ok,json:async()=>body});await settle()},
  disabled(value){props.disabled=value;dirty=true;flush()},
 }
}
test('Manglish submits the chosen Malayalam spelling, never the English input',async()=>{
 const h=mount();assert.equal(h.submitDisabled(),true)
 h.type('mazha');h.submit();assert.equal(h.answers.length,0)
 await h.advance(250);assert.equal(h.requests.length,1)
 assert.deepEqual(JSON.parse(h.requests[0].options.body),{text:'mazha'})
 assert.equal(h.requests[0].url,'http://api.test/transliteration')
 await h.respond(0,{suggestions:['മഴ','മഴയും']});assert.equal(h.submitDisabled(),false)
 h.select('മഴയും');h.submit();assert.deepEqual(h.answers,['മഴയും'])
})
test('late conversions cannot replace the current word or submit stale answers',async()=>{
 const h=mount();h.type('mazha');await h.advance(250)
 h.type('nilavu');assert.equal(h.submitDisabled(),true);h.submit();assert.equal(h.answers.length,0)
 await h.advance(250);assert.equal(h.requests[0].options.signal.aborted,true)
 await h.respond(0,{suggestions:['മഴ']});assert.equal(h.submitDisabled(),true)
 await h.respond(1,{suggestions:['നീളവു','നിലാവു']});h.select('നിലാവു');h.submit();assert.deepEqual(h.answers,['നിലാവു'])
 h.type('kattu');h.submit();assert.equal(h.answers.length,1)
})
test('failed conversions block English submission while direct Malayalam remains usable',async()=>{
 const h=mount();h.type('mazha');await h.advance(250)
 await h.respond(0,{error:'Service unavailable'},false);assert.equal(h.submitDisabled(),true);h.submit();assert.equal(h.answers.length,0)
 h.mode('malayalam');h.type('മഴ');assert.equal(h.submitDisabled(),false);h.submit();assert.deepEqual(h.answers,['മഴ'])
 assert.equal(h.requests.length,1)
 h.type('mazha');h.submit();assert.equal(h.answers.length,1)
})
test('Malayalam paste bypasses conversion and composition/disabled states cannot submit',async()=>{
 const h=mount();h.type('മഴ');await h.advance(250);assert.equal(h.requests.length,0)
 h.compose(true);h.submit();assert.equal(h.answers.length,0)
 h.compose(false);h.disabled(true);h.submit();assert.equal(h.answers.length,0)
 h.disabled(false);h.submit();assert.deepEqual(h.answers,['മഴ'])
})
