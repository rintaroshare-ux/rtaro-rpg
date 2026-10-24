import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AtbClock} from '../src/game/combat/atb';
import {ActionQueue} from '../src/game/combat/queue';
test('ATB is frame-rate independent, clamps gauges and resets dead actors',()=>{
 const a=new AtbClock(),b=new AtbClock();const actors=[{id:'h',speed:20,alive:true,queued:false}];
 a.advance(1000,actors);for(let i=0;i<100;i++)b.advance(10,actors);assert.ok(Math.abs(a.value('h')-b.value('h'))<1e-10);
 a.advance(10000,actors);assert.equal(a.value('h'),1);a.advance(50,[{...actors[0],alive:false}]);assert.equal(a.value('h'),0);
});
test('paused or reserved actors do not charge, invalid deltas do not corrupt time',()=>{
 const c=new AtbClock(),actors=[{id:'h',speed:20,alive:true,queued:false}];c.advance(1000,actors,true);assert.equal(c.value('h'),0);
 c.advance(1000,[{...actors[0],queued:true}]);assert.equal(c.value('h'),0);c.advance(NaN,actors);c.advance(-1,actors);assert.equal(c.value('h'),0);
});
test('action queue is FIFO and reserves one action per actor until dequeue',()=>{
 const q=new ActionQueue<number>();assert.ok(q.enqueue('a',1));assert.equal(q.enqueue('a',2),false);q.enqueue('b',3);assert.equal(q.shift(),1);assert.ok(q.enqueue('a',4));assert.equal(q.shift(),3);assert.equal(q.shift(),4);q.enqueue('c',5);q.clear();assert.equal(q.length,0);assert.equal(q.shift(),undefined);
});
