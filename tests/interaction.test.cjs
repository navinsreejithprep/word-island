// Runs actual screen and event logic with a minimal DOM stub.
// This does NOT establish real-browser rendering, audio, focus or accessibility.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
let active=null;const handlers={};const store=new Map();
class El{
  constructor(tag='DIV',attrs={}){this.tagName=tag;this.attrs=attrs;this.dataset={};for(const [k,v] of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;this.disabled='disabled' in attrs;this.open=false;this.isConnected=true;this.classList={add(){}};this.style={};this._html='';this.events={}}
  set innerHTML(s){this._html=s}get innerHTML(){return this._html}
  setAttribute(k,v){this.attrs[k]=v}focus(){active=this}
  addEventListener(name,fn){this.events[name]=fn}
  showModal(){this.open=true}close(){this.open=false}
  replaceChildren(){this._html=''}appendChild(){}
  closest(sel){return sel==='[data-action]'&&this.dataset.action?this:sel==='[data-dialog]'&&this.dataset.dialog?this:null}
  querySelector(selector){
    if(selector==='h1,h2,[data-focus]')return /<h[12]/.test(this._html)?new El('H2'):null;
    if(selector==='.feedback')return new El();
    const buttons=[...this._html.matchAll(/<button\s+([^>]+)>/g)].map(m=>{
      const attrs={};for(const pair of m[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[pair[1]]=pair[2]||'';return new El('BUTTON',attrs)
    });
    if(selector==='button')return buttons[0]||null;
    return buttons.find(b=>{
      const requirements=[...selector.matchAll(/\[([\w-]+)(?:="?([^"\]]+)"?)?\]/g)];
      if(!requirements.every(m=>m[1] in b.attrs&&(m[2]===undefined||b.attrs[m[1]]===m[2])))return false;
      if(selector.includes(':not(:disabled)')&&b.disabled)return false;
      if(selector.includes('.choice')&&!b.attrs.class?.split(' ').includes('choice'))return false;
      if(selector.includes('.tile')&&!b.attrs.class?.split(' ').includes('tile'))return false;
      return true;
    })||null;
  }
}
const elements=Object.fromEntries(['app','live','dialog','sparkles','music-btn'].map(id=>[id,new El()]));
const document={getElementById:id=>elements[id],get activeElement(){return active},hidden:false,addEventListener:(name,fn)=>handlers[name]=fn,createElement:tag=>new El(tag.toUpperCase())};
const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},matchMedia:()=>({matches:true}),scrollTo(){},addEventListener(){}};
const ctx=vm.createContext({document,window,console,setTimeout:fn=>fn(),setInterval:()=>1,clearInterval(){}});vm.runInContext(code,ctx);
const run=code=>vm.runInContext(code,ctx);
function click(action,extra={}){const attrs={'data-action':action};for(const[k,v]of Object.entries(extra))attrs['data-'+k]=String(v);handlers.click({target:new El('BUTTON',attrs)})}
function modal(id){elements.dialog.events.click({target:new El('BUTTON',{'data-dialog':id})})}
function closeHelp(){if(elements.dialog.open)modal('ok')}
function correct(){const q=run('getQ()');if(q.type==='spell'){const used=new Set();for(const letter of q.word.word){const tile=q.tiles.find(t=>t.letter===letter&&!used.has(t.id));used.add(tile.id);click('tile',{id:tile.id})}click('check')}else click('answer',{id:q.word.id})}
assert.equal(run('screen'),'home');assert(elements.app.innerHTML.includes('Small words.'));assert.equal(run('audio.ctx'),null);
click('play');assert.equal(run('screen'),'map');click('level',{level:2});assert.equal(run('session'),null);
for(let level=1;level<=10;level++){
 click('level',{level});assert.equal(run('screen'),'intro');click('start');closeHelp();
 for(let i=0;i<8;i++){correct();assert(run('session.resolved'));click('next');closeHelp()}
 assert.equal(run(`saved.stars[${level-1}]`),3);if(level<10)click('map');
}
assert.equal(run('screen'),'celebration');assert.equal(run('saved.points'),1400);assert.equal(run('saved.badges.length'),6);
// Duplicate Next after the end must not recommit points.
click('next');assert.equal(run('saved.points'),1400);
click('map');click('level',{level:1});click('start');closeHelp();
let wrong=run('getQ().options.find(id=>id!==getQ().word.id)');click('answer',{id:wrong});click('answer',{id:wrong});assert.equal(run('session.attempt'),2);assert.equal(run('session.resolved'),false);correct();assert.equal(run('session.points'),5);click('next');closeHelp();
for(let i=0;i<2;i++){wrong=run('getQ().options.find(id=>id!==getQ().word.id&&!session.wrong.includes(id))');click('answer',{id:wrong})}
assert(run('session.resolved'));assert.equal(run('session.points'),5);
click('settings');click('effects');assert.equal(run('saved.settings.effects'),false);click('settings-back');assert.equal(run('screen'),'question');
click('map');assert(elements.dialog.open);modal('cancel');assert.equal(run('screen'),'question');click('map');modal('leave');assert.equal(run('saved.points'),1400);
// Force a real spelling question through the real generated session, then edit it.
click('level',{level:7});click('start');closeHelp();
while(run('getQ().type')!=='spell'){correct();click('next');closeHelp()}
const spell=run('getQ()');click('check');assert.equal(run('session.attempt'),1);
click('tile',{id:spell.tiles[0].id});click('tile',{id:spell.tiles[0].id});assert.equal(run('session.selection.length'),1);click('undo');assert.equal(run('session.selection.length'),0);
const word=spell.word.word;let ordering=[...spell.tiles];if(ordering.map(t=>t.letter).join('')===word)ordering.reverse();if(ordering.map(t=>t.letter).join('')===word)[ordering[0],ordering[1]]=[ordering[1],ordering[0]];
for(const t of ordering)click('tile',{id:t.id});click('check');assert.equal(run('session.attempt'),2);assert.equal(run('session.resolved'),false);click('clear');assert.equal(run('session.selection.length'),0);correct();assert(run('session.resolved'));assert.equal(run('session.lastPoints'),5);
// Navigation from settings still confirms discarding a live attempt.
click('settings');click('home');assert(elements.dialog.open);modal('leave');assert.equal(run('screen'),'home');
store.set('unrelated','keep');click('settings');click('reset');modal('cancel');assert.equal(run('saved.points'),1400);click('reset');modal('continue');modal('erase');assert.equal(run('saved.points'),0);assert.equal(store.get('unrelated'),'keep');assert.equal(run('screen'),'home');assert.equal(run('saved.stars.reduce((a,b)=>a+b,0)'),0);
console.log('PASS: actual event/screen logic for ten levels, six badges, retries, duplicate input, spelling edits, abandonment, settings, and two-step reset.');
console.log('Limit: DOM stub; not real-browser visual, focus, audio, or accessibility verification.');
