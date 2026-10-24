import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,member,maxHp,migrateSave} from '../src/game/state';
import {trade,equip,useItem,count} from '../src/game/economy/model';
import {stats} from '../src/game/economy/stats';
import {Battle} from '../src/game/battle';
test('buy/sell transactions conserve money and stock, reject bad quantities and important items',()=>{
 const s=fresh();s.money=100;
 assert.equal(trade(s,'bowl','buy',2).ok,true);assert.equal(s.money,64);assert.equal(s.bowls,7);
 assert.equal(trade(s,'bowl','sell',2).ok,true);assert.equal(s.money,82);assert.equal(s.bowls,5);
 for(const [id,q] of [['bowl',0],['bowl',-1],['bowl',1.2],['legendary',1]] as const){const before=JSON.stringify(s);assert.equal(trade(s,id,'buy',q).ok,false);assert.equal(JSON.stringify(s),before);}
 const before=JSON.stringify(s);assert.equal(trade(s,'shellCoat','buy',99).ok,false);assert.equal(trade(s,'windPin','sell',1).ok,false);assert.equal(JSON.stringify(s),before);
});
test('equipment restrictions, inventory transfer, removal and stats survive a save roundtrip',()=>{
 const s=fresh();s.money=500;s.party.push(member('marmot'));
 assert.ok(trade(s,'littleBat','buy').ok);assert.equal(equip(s,1,'weapon','littleBat').ok,false);assert.equal(count(s,'littleBat'),1);
 const attack=stats(s.party[0]).attack;assert.ok(equip(s,0,'weapon','littleBat').ok);assert.equal(stats(s.party[0]).attack,attack+6);assert.equal(count(s,'littleBat'),0);assert.equal(trade(s,'littleBat','sell').ok,false);
 assert.ok(trade(s,'shellCoat','buy').ok);assert.ok(equip(s,0,'armor','shellCoat').ok);assert.equal(stats(s.party[0]).defense,8);s.party[0].hp=maxHp(s.party[0]);
 assert.ok(equip(s,0,'armor',null).ok);assert.equal(s.party[0].hp,maxHp(s.party[0]));assert.equal(count(s,'shellCoat'),1);
 assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))),s);
 assert.ok(equip(s,0,'weapon',null).ok);assert.equal(count(s,'littleBat'),1);
});
test('equipped stats affect attack, magic, defense, and ATB speed',()=>{
 const a=fresh(),b=fresh();b.gearBag={littleBat:1,travelVest:1,windPin:1};equip(b,0,'weapon','littleBat');equip(b,0,'armor','travelVest');equip(b,0,'accessory','windPin');
 const plain=new Battle(a,'king',()=>0),equipped=new Battle(b,'king',()=>0);
 for(const battle of [plain,equipped]){battle.tick(1000);battle.clock.set('hero:0',1);battle.submit(0,'attack');}
 assert.ok(equipped.resolveNext()!.amount!>plain.resolveNext()!.amount!);
 const speedA=new Battle(a,'bear'),speedB=new Battle(b,'bear');speedA.tick(1000);speedB.tick(1000);assert.ok(speedB.gauge('hero',0)>speedA.gauge('hero',0));
 for(const battle of [plain,equipped]){battle.clock.set('enemy:0',1);battle.tick(0);battle.resolveNext();}
 assert.ok(b.party[0].hp>a.party[0].hp);
 const caster=fresh();caster.party.push(member('marmot'));caster.gearBag={leafStaff:1};equip(caster,1,'weapon','leafStaff');assert.equal(stats(caster.party[1]).magic,8);
});
test('deluxe bowl, MP recovery and resurrection work with costs and caps',()=>{
 const s=fresh();s.inventory.deluxe=1;s.party[0].hp=1;assert.ok(useItem(s,'deluxe',0).ok);assert.equal(s.party[0].hp,maxHp(s.party[0]));assert.equal(s.inventory.deluxe,0);
 s.party[0].mp=0;assert.ok(useItem(s,'ether',0).ok);assert.equal(s.party[0].mp,25);
 s.party[0].hp=0;assert.equal(useItem(s,'bowl',0).ok,false);assert.ok(useItem(s,'revive',0).ok);assert.equal(s.party[0].hp,Math.ceil(maxHp(s.party[0])/2));
});
