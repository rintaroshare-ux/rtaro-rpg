import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,member,migrateSave} from '../src/game/state';
import {Battle} from '../src/game/battle';
import {readBattleSnapshot} from '../src/game/combat/snapshot';
test('battle save preserves foes, ATB, guards, pending actions and equipment',()=>{
 const s=fresh();s.party.push(member('marmot'));const b=new Battle(s,['bear','rabbit'],()=>0);
 b.tick(700);b.clock.set('hero:0',1);b.submit(0,'attack',1);b.guards.add(1);s.resumeBattle=b.snapshot();
 const loaded=migrateSave(JSON.parse(JSON.stringify(s)));assert.ok(loaded?.resumeBattle);
 const resumed=Battle.resume(loaded,loaded.resumeBattle,()=>0);assert.deepEqual(resumed.snapshot(),b.snapshot());
 assert.deepEqual(resumed.resolveNext(),b.resolveNext());assert.deepEqual(resumed.snapshot(),b.snapshot());
});
test('already-paid victory rewards do not duplicate after reload',()=>{
 const s=fresh(),b=new Battle(s,'bear',()=>0);b.foes[0].hp=0;const first=b.reward();s.resumeBattle=b.snapshot();
 const loaded=migrateSave(JSON.parse(JSON.stringify(s)))!;const before=JSON.stringify(loaded);const resumed=Battle.resume(loaded,loaded.resumeBattle!,()=>0);
 assert.deepEqual(resumed.reward(),first);assert.equal(JSON.stringify(loaded),before);
});
test('victory saved during final effect pays once on resume',()=>{
 const s=fresh(),b=new Battle(s,'bear',()=>0);b.foes[0].hp=0;s.resumeBattle=b.snapshot();const loaded=migrateSave(s)!;const resumed=Battle.resume(loaded,loaded.resumeBattle!,()=>0);
 assert.ok(resumed.reward());assert.equal(loaded.money,12);const money=loaded.money;resumed.reward();assert.equal(loaded.money,money);
});
test('bad snapshots, invalid equipment and impossible inventories are rejected',()=>{
 const s=fresh();s.resumeBattle=new Battle(s,'bear').snapshot();
 assert.equal(readBattleSnapshot({...s.resumeBattle,heroGauges:[NaN]},1),null);
 assert.equal(migrateSave({...s,resumeBattle:{...s.resumeBattle,foes:[]}}),null);
 assert.equal(migrateSave({...s,gearBag:{unknown:1}}),null);
 assert.equal(migrateSave({...s,party:[{...s.party[0],equipment:{weapon:'leafStaff',armor:null,accessory:null}}]}),null);
});
test('genuine v2 save adds new fields while preserving gold, XP and party',()=>{
 const s=fresh();const {gearBag:_b,resumeBattle:_r,...base}=s;const old={...base,version:2,inventory:{revive:5,ether:2},money:321,party:s.party.map(({equipment:_e,...m})=>m)};
 const migrated=migrateSave(old)!;assert.equal(migrated.version,3);assert.equal(migrated.money,321);assert.equal(migrated.inventory.deluxe,0);assert.equal(migrated.inventory.revive,5);assert.equal(migrated.resumeBattle,null);assert.deepEqual(migrated.party[0].equipment,{weapon:null,armor:null,accessory:null});
});
