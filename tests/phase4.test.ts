import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plushIds,plushEnemies} from '../src/game/bestiary';
import {randomFormation} from '../src/game/encounters';
import {combatEnemies} from '../src/game/combat/data';
import {fresh,member,migrateSave} from '../src/game/state';
import {Battle} from '../src/game/battle';
import {maps,type HeroId} from '../src/game/data';
import {claimTreasure} from '../src/game/treasure';
test('sixteen distinct plush enemies are reachable without exceeding three foes',()=>{
 assert.equal(plushIds.length,16);assert.equal(new Set(plushIds.map(id=>plushEnemies[id].name)).size,16);
 for(let i=0;i<plushIds.length;i++){
  const f=randomFormation(4,()=> (i+.5)/plushIds.length);assert.ok(f.length<=3);assert.ok(f.includes(plushIds[i]));
  const def=combatEnemies[plushIds[i]];assert.ok(def.hp>0&&def.xp>=30&&def.money>0);assert.ok(Object.values(def.resists).some(n=>n===1.5));
 }
});
test('every new enemy formation survives v3 battle save validation',()=>{
 for(const id of plushIds){const s=fresh();s.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id as HeroId,3));const battle=new Battle(s,[id]);s.resumeBattle=battle.snapshot();const loaded=migrateSave(JSON.parse(JSON.stringify(s)));assert.ok(loaded);assert.equal(loaded.resumeBattle?.foes[0].kind,id);}
});
test('treasure is awarded once and remains opened after save migration',()=>{
 const s=fresh(),chest=maps.station.people.find(p=>p.event==='chest')!;const money=s.money,ether=s.inventory.ether;
 assert.ok(claimTreasure(s,chest));assert.equal(s.money,money+50);assert.equal(s.inventory.ether,ether+2);assert.equal(claimTreasure(s,chest),false);
 const loaded=migrateSave(JSON.parse(JSON.stringify(s)))!;assert.ok(loaded);assert.equal(claimTreasure(loaded,chest),false);assert.equal(loaded.money,s.money);
 const invalid={...chest,chestId:'invalid',reward:{money:-1}};assert.equal(claimTreasure(s,invalid),false);assert.ok(!s.flags.includes('chest:invalid'));
});
