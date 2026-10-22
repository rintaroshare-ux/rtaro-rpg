import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Battle} from '../src/game/battle';
import {fresh,member,maxHp} from '../src/game/state';
test('four party members can use their spells and defeat the boss',()=>{
 const s=fresh();s.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id as 'rintaro'|'marmot'|'fugu'|'vanilla'));
 const b=new Battle(s,'king',()=>0);
 for(let i=0;i<4;i++)assert.equal(b.act(i,'magic').ok,true);
 while(!b.won){for(let i=0;i<4&&!b.won;i++)b.act(i,'attack')}
 assert.equal(b.won,true);b.reward();assert.ok(s.party.every(m=>m.level>1));
});
test('insufficient MP and items do not consume the action',()=>{const s=fresh();const b=new Battle(s,'bear');s.party[0].mp=0;s.bowls=0;assert.equal(b.act(0,'magic').ok,false);assert.equal(b.act(0,'item').ok,false);assert.equal(b.act(0,'guard').ok,true);assert.equal(s.party[0].mp,3)});
test('seafood bowl revives a fallen member without consuming the legendary item',()=>{const s=fresh();s.party.push(member('marmot'));s.party[1].hp=0;const b=new Battle(s,'bear');assert.equal(b.act(0,'item',1).ok,true);assert.equal(s.party[1].hp,Math.min(80,maxHp(s.party[1])));assert.equal(s.bowls,4)});
test('defense reduces enemy damage and defeat is detected',()=>{const s=fresh();const b=new Battle(s,'king',()=>0);b.act(0,'guard');const before=s.party[0].hp;b.enemyTurn();assert.ok(before-s.party[0].hp<25);s.party[0].hp=1;b.enemyTurn();assert.equal(b.lost,true)});
