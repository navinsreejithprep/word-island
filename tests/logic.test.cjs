const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function section(name) {
  return html.split(`// === ${name} START ===`)[1].split(`// === ${name} END ===`)[0];
}
const context = vm.createContext({ console });
vm.runInContext(section('DATA') + section('LOGIC') + '\nthis.api={WORDS,LEVELS,BADGES,STORAGE_KEY,validateWords,shuffle,starsFor,scoreAnswer,isUnlocked,freshSave,validateSave,loadProgress,writeProgress,removeProgress,earnedBadges,commitResult,makeQuestions,selectedSpelling};', context);
const a = context.api;
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS', name); }
function json(x) { return JSON.parse(JSON.stringify(x)); }
function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
test('120 unique words, allocations, definitions, templates, opposites and eligibility', () => {
  assert.deepEqual(json(a.validateWords()), []);
  assert.equal(a.WORDS.length, 120);
});
test('all star boundaries 0–8', () => {
  assert.deepEqual(Array.from({ length: 9 }, (_, i) => a.starsFor(i)), [0,0,0,0,1,1,2,2,3]);
});
test('streak awards, wrong reset, second try and perfect total', () => {
  let streak = 0, total = 0, six = 0;
  for (let i=0;i<8;i++) { const r=a.scoreAnswer(streak,1,true); streak=r.streak; total+=r.points; if(i===5)six=total; }
  assert.equal(six,100); assert.equal(total,140);
  assert.deepEqual(json(a.scoreAnswer(4,1,false)),{streak:0,points:0});
  assert.deepEqual(json(a.scoreAnswer(0,2,true)),{streak:0,points:5});
  assert.equal(a.scoreAnswer(0,1,true).points,12);
});
test('session generation: 500 seeds × ten levels', () => {
  for(let seed=1;seed<=500;seed++)for(let level=1;level<=10;level++) {
    const qs=a.makeQuestions(level,{},seeded(seed));
    assert.equal(qs.length,8); assert.equal(new Set(qs.map(q=>q.word.id)).size,8);
    for(const [type,count] of Object.entries(a.LEVELS[level-1].mix))assert.equal(qs.filter(q=>q.type===type).length,count);
    for(const q of qs) {
      assert(q.word.allowed.includes(q.type));
      assert.equal(new Set(q.options).size,level<=4?3:4);
      assert(q.options.includes(q.word.id));
      assert(q.options.every(id=>a.WORDS.find(w=>w.id===id).level===q.word.level));
      if(q.type==='spell')assert.equal(q.tiles.map(t=>t.letter).sort().join(''),[...q.word.word].sort().join(''));
    }
    if(level===10) { assert(new Set(qs.map(q=>q.word.level)).size>=4); assert(qs.some(q=>q.word.level>=7)); }
  }
});
test('history preference and review validity with a highly skewed history', () => {
  const history={}; for(const w of a.WORDS)history[w.id]={seen:w.level===1?0:3,missed:0};
  for(let seed=1;seed<=30;seed++)assert.equal(a.makeQuestions(10,history,seeded(seed)).length,8);
  const first=a.makeQuestions(1,{},seeded(1));const seen={};for(const q of first)seen[q.word.id]={seen:1,missed:0};
  const replay=a.makeQuestions(1,seen,seeded(2));assert.equal(replay.filter(q=>!seen[q.word.id]).length,4);
});
test('ten-level progression, idempotent commit, replay and all badges', () => {
  let save=a.freshSave();assert(a.isUnlocked(1,save.stars));assert(!a.isUnlocked(2,save.stars));
  for(let level=1;level<=10;level++){
    assert(a.isUnlocked(level,save.stars));const session={level,correct:8,points:140,maxStreak:8,records:a.makeQuestions(level,{},seeded(level)).map(q=>({id:q.word.id,correct:true})),committed:false};
    save=a.commitResult(save,session);const points=save.points;save=a.commitResult(save,session);assert.equal(save.points,points);
  }
  assert.equal(save.points,1400);assert.equal(save.stars.reduce((a,b)=>a+b,0),30);assert.equal(save.badges.length,6);
  save=a.commitResult(save,{level:1,correct:3,points:36,maxStreak:3,records:[],committed:false});
  assert.equal(save.stars[0],3);assert(a.isUnlocked(2,save.stars));assert.equal(save.points,1436);
});
test('zero-star and boundary badges', () => {
  let stars=Array(10).fill(0);assert.deepEqual(json(a.earnedBadges(stars,0)),[]);
  stars[0]=1;assert.deepEqual(json(a.earnedBadges(stars,4)),['first']);
  assert(a.earnedBadges(stars,5).includes('streak'));
  stars[4]=1;assert(a.earnedBadges(stars,0).includes('halfway'));
  stars=Array(10).fill(2);assert(a.earnedBadges(stars,0).includes('collector'));
  stars[9]=0;assert(!a.earnedBadges(stars,0).includes('wizard'));
});
test('save validation, corrupt JSON, blocked getter and write, reset isolation', () => {
  const store=new Map([['unrelated','keep']]);const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  const save=a.freshSave();save.stars[0]=2;save.points=123;assert(a.writeProgress(()=>storage,save));assert.equal(a.loadProgress(()=>storage).points,123);
  store.set(a.STORAGE_KEY,'{');assert.equal(a.loadProgress(()=>storage).points,0);
  for(const mutation of [s=>s.points=-1,s=>s.stars=[5],s=>s.settings.music='yes',s=>s.version=9,s=>s.badges=['unknown'],s=>s.stars[4]=1]){const bad=a.freshSave();mutation(bad);assert.equal(a.validateSave(bad),null);}
  assert.equal(a.loadProgress(()=>{throw Error('blocked')}).points,0);
  assert.equal(a.writeProgress(()=>({setItem(){throw Error('full')}}),save),false);
  assert(a.removeProgress(()=>storage));assert.equal(store.get('unrelated'),'keep');
});
test('repeated-letter spelling uses distinct tile identities', () => {
  const word=a.WORDS.find(w=>w.word==='happy');const q={word,tiles:[...word.word].map((letter,id)=>({letter,id}))};
  assert.equal(new Set(q.tiles.map(t=>t.id)).size,5);assert.equal(a.selectedSpelling(q,[0,1,2,3,4]),'happy');
});
test('file size and no external assets or network APIs', () => {
  assert(Buffer.byteLength(html)<500000);
  assert(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html));
});
console.log(`\n${checks} test groups passed.`);
