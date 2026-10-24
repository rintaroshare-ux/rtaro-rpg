import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle,type Command} from '../src/game/battle';
import {fresh,member,maxHp,maxMp,type State} from '../src/game/state';
import {combatEnemies} from '../src/game/combat/data';
const party=():State=>{const s=fresh();s.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id as 'rintaro'|'marmot'|'fugu'|'vanilla'));return s};
function act(b:Battle,i:number,command:Command,target=0,item:'bowl'|'revive'|'ether'='bowl'){
 b.clock.set(`hero:${i}`,1);const submission=b.submit(i,command,target,item);assert.equal(submission.ok,true,submission.text);const result=b.resolveNext();assert.ok(result);return result;
}
test('formations contain 1–4 independent enemies',()=>{
 for(let count=1;count<=4;count++){const b=new Battle(party(),Array.from({length:count},()=> 'bear'));assert.equal(b.foes.length,count);act(b,0,'attack',count-1);assert.ok(b.foes[count-1].hp<combatEnemies.bear.hp);if(count>1)assert.equal(b.foes[0].hp,combatEnemies.bear.hp)}
 assert.throws(()=>new Battle(fresh(),[]));assert.throws(()=>new Battle(fresh(),['bear','bear','bear','bear','bear']));
});
test('speed changes ATB; wait pauses selection while active continues',()=>{
 const s=party(),b=new Battle(s,'bear');b.tick(1000);assert.ok(b.gauge('hero',2)>b.gauge('hero',3));
 const before=b.gauge('enemy',0);b.tick(1000,true);assert.equal(b.gauge('enemy',0),before);
 s.atbMode='active';b.tick(1000,true);assert.ok(b.gauge('enemy',0)>before);
});
test('gauge required, duplicate actions blocked, invalid resources do not spend readiness',()=>{
 const s=fresh(),b=new Battle(s,'bear');assert.equal(b.submit(0,'attack').ok,false);b.clock.set('hero:0',1);
 s.party[0].mp=0;assert.equal(b.submit(0,'magic').ok,false);assert.equal(b.gauge('hero',0),1);
 s.bowls=0;assert.equal(b.submit(0,'item').ok,false);assert.equal(b.gauge('hero',0),1);
 assert.equal(b.submit(0,'guard').ok,true);assert.equal(b.submit(0,'guard').ok,false);b.resolveNext();assert.equal(s.party[0].mp,3);assert.equal(b.gauge('hero',0),0);
});
test('element weakness and resistance affect damage',()=>{
 const a=new Battle(party(),'bear',()=>0),b=new Battle(party(),'rabbit',()=>0);
 const weak=act(a,0,'magic'),normal=act(b,0,'magic');assert.ok(weak.amount!>normal.amount!);
 const water=new Battle(party(),'bear',()=>0);assert.ok(act(water,2,'magic').amount!<43);
});
test('queued attacks retarget a living enemy, dead actors cannot execute',()=>{
 const b=new Battle(party(),['bear','rabbit'],()=>0);b.clock.set('hero:0',1);assert.equal(b.submit(0,'attack',0).ok,true);b.foes[0].hp=0;
 assert.deepEqual(b.resolveNext()?.enemies,[1]);
 b.clock.set('hero:1',1);b.submit(1,'magic');b.state.party[1].hp=0;const mp=b.state.party[1].mp;assert.equal(b.resolveNext()?.ok,false);assert.equal(b.state.party[1].mp,mp);assert.equal(b.gauge('hero',1),0);
});
test('healing, KO and resurrection reset readiness; items revalidate when queued',()=>{
 const s=party(),b=new Battle(s,'bear');s.party[1].hp=0;
 act(b,0,'magic');assert.equal(s.party[1].hp,0);
 assert.equal(b.submit(1,'guard').ok,false);
 const stock=s.inventory.revive;act(b,0,'item',1,'revive');assert.equal(s.party[1].hp,Math.ceil(maxHp(s.party[1])/2));assert.equal(s.inventory.revive,stock-1);assert.equal(b.gauge('hero',1),0);
 s.party[1].hp=0;b.clock.set('hero:0',1);b.clock.set('hero:2',1);b.submit(0,'item',1,'revive');b.submit(2,'item',1,'revive');b.resolveNext();const remaining=s.inventory.revive;
 assert.equal(b.resolveNext()?.ok,false);assert.equal(s.inventory.revive,remaining);assert.equal(b.gauge('hero',2),1);
 s.party[2].mp=0;act(b,0,'item',2,'ether');assert.equal(s.party[2].mp,25);assert.ok(s.party[2].mp<=maxMp(s.party[2]));
});
test('defense persists until next action, reduces damage and KO cancels gauges',()=>{
 const s=fresh(),b=new Battle(s,'bear',()=>0);act(b,0,'guard');const hp=s.party[0].hp;
 b.clock.set('enemy:0',1);b.tick(0);b.resolveNext();assert.equal(hp-s.party[0].hp,4);assert.ok(b.guards.has(0));
 act(b,0,'attack');assert.equal(b.guards.has(0),false);s.party[0].hp=1;b.clock.set('enemy:0',1);b.tick(0);b.resolveNext();assert.equal(b.outcome,'lose');assert.equal(b.gauge('hero',0),0);
});
test('boss phases are monotonic and patterns include area attack and drain',()=>{
 const s=party(),b=new Battle(s,'king',()=>0);b.foes[0].hp=500;act(b,0,'attack');assert.equal(b.foes[0].phase,1);assert.equal(b.resistance(0,'dark'),1.5);
 b.foes[0].hp=235;act(b,0,'attack');assert.equal(b.foes[0].phase,2);
 b.clock.set('enemy:0',1);b.tick(0);const sweep=b.resolveNext()!;assert.equal(sweep.heroes.length,4);
 b.clock.set('enemy:0',1);b.tick(0);assert.match(b.resolveNext()!.text,/ドレイン/);
});
test('escape fails then succeeds by third attempt; boss escape is rejected',()=>{
 const b=new Battle(party(),'bear',()=>.999);act(b,0,'flee');assert.equal(b.outcome,null);act(b,0,'flee');act(b,0,'flee');assert.equal(b.outcome,'escape');assert.equal(b.reward(),null);
 const boss=new Battle(party(),'king');boss.clock.set('hero:0',1);assert.equal(boss.submit(0,'flee').ok,false);assert.equal(boss.gauge('hero',0),1);
});
test('rewards grant XP, money, drops and levels exactly once; no reward before victory',()=>{
 const s=party(),b=new Battle(s,['bear','rabbit'],()=>0);assert.equal(b.reward(),null);
 while(!b.outcome){for(let i=0;i<s.party.length&&!b.outcome;i++)act(b,i,'attack');}
 assert.equal(b.outcome,'win');const r=b.reward()!;assert.equal(r.xp,40);assert.equal(s.money,28);assert.ok(s.party.every(m=>m.level===2));assert.ok(s.bowls>5);const snapshot=JSON.stringify(s);assert.equal(b.reward(),r);assert.equal(JSON.stringify(s),snapshot);
});
test('four-member ATB simulation beats all boss phases without bypassing time',()=>{
 const s=party(),b=new Battle(s,'king',()=>.1);const phases=new Set<number>();let events=0;
 for(let tick=0;tick<12000&&!b.outcome;tick++){
   b.tick(50,false);
   for(const i of b.readyHeroes){const m=s.party[i];b.submit(i,m.mp>=8?'magic':'attack');}
   let event=b.resolveNext();while(event){events++;phases.add(b.foes[0].phase);event=b.resolveNext();}
 }
 assert.equal(b.outcome,'win');assert.ok(events>20);assert.deepEqual([...phases].sort(),[0,1,2]);
});
test('KO cancels queued actions even if the combatant is resurrected before its old slot',()=>{
 const s=party(),b=new Battle(s,'bear',()=>0);
 s.party[0].hp=1;b.clock.set('enemy:0',1);b.tick(0);b.clock.set('hero:0',1);b.submit(0,'attack');assert.ok(b.queue.has('hero:0'));
 b.resolveNext();assert.equal(s.party[0].hp,0);assert.equal(b.queue.has('hero:0'),false);
 act(b,1,'item',0,'revive');assert.equal(b.gauge('hero',0),0);assert.equal(b.resolveNext(),null);
});
