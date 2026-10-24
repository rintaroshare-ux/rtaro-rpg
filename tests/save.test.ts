import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,load,migrateSave,save,state} from '../src/game/state';
import {SAVE_KEY,LEGACY_SAVE_KEY} from '../src/game/data';
function legacy(){const v=fresh();const {money:_m,inventory:_i,atbMode:_a,...old}=v;return {...old,version:1,flags:['intro','message'],bowls:9};}
test('v1 migrates without losing flags, members, coordinates or bowls',()=>{
 const old=legacy(),snapshot=JSON.stringify(old);const v=migrateSave(old)!;assert.equal(v.version,3);assert.deepEqual(v.flags,old.flags);assert.equal(v.bowls,9);assert.deepEqual(v.party,old.party);assert.equal(v.map,old.map);assert.equal(v.money,0);assert.equal(v.atbMode,'wait');assert.ok(v.inventory.revive>0);assert.equal(JSON.stringify(old),snapshot);
});
test('v3 round trip preserves money, inventory and ATB mode',()=>{const v=fresh();v.money=123;v.inventory.revive=4;v.inventory.ether=9;v.atbMode='active';assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(v))),v)});
test('corrupted/future saves are rejected defensively',()=>{
 for(const bad of [null,{},[],{...fresh(),version:4},{...fresh(),party:[null]},{...fresh(),party:[{...fresh().party[0],id:'unknown'}]},{...fresh(),money:-1},{...fresh(),inventory:{}},{...fresh(),x:Infinity},{...fresh(),atbMode:'broken'}])assert.equal(migrateSave(bad),null);
});
test('load fallback keeps legacy backup; save v3 and storage failures are safe',()=>{
 const entries=new Map<string,string>([[LEGACY_SAVE_KEY,JSON.stringify(legacy())]]);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>entries.get(k)??null,setItem:(k:string,v:string)=>entries.set(k,v)}});
 assert.equal(load(),true);assert.equal(state.version,3);assert.equal(save(),true);assert.ok(entries.has(LEGACY_SAVE_KEY));assert.ok(entries.has(SAVE_KEY));
 const previous=state;entries.set(SAVE_KEY,'invalid');assert.equal(load(),false);assert.equal(state,previous);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('quota')}}});assert.equal(load(),false);assert.equal(save(),false);
 delete (globalThis as {localStorage?:unknown}).localStorage;
});
test('physical world-edge coordinates remain loadable, including legacy saves',()=>{
 for(const [x,y] of [[24,52],[936,504],[32,46]]){const old={...legacy(),x,y};const migrated=migrateSave(old);assert.ok(migrated);assert.equal(migrated.x,x);assert.equal(migrated.y,y);assert.ok(migrateSave({...fresh(),x,y}));}
});
