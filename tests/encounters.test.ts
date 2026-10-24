import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isDangerous,randomFormation,StepEncounters,STEP_PIXELS} from '../src/game/encounters';
import {maps} from '../src/game/data';
test('home, shops, roads, entrances and NPC surroundings are safe',()=>{
 for(const map of ['home','market'] as const)assert.equal(isDangerous(map,{x:640,y:450},maps[map].people),false);
 for(const map of ['park','station'] as const){for(const p of [{x:300,y:370},{x:50,y:250},...maps[map].people])assert.equal(isDangerous(map,p,maps[map].people),false);assert.ok(isDangerous(map,{x:700,y:460},maps[map].people));}
});
test('actual walking distance triggers encounters, idle/wall/safe/teleports do not',()=>{
 const meter=new StepEncounters(()=>0,0);for(let i=0;i<100;i++){assert.equal(meter.move(0,true),false);assert.equal(meter.move(24,false),false);assert.equal(meter.move(300,true),false);}
 for(let i=0;i<11;i++)assert.equal(meter.move(STEP_PIXELS,true),false);assert.equal(meter.move(STEP_PIXELS,true),true);assert.equal(meter.move(STEP_PIXELS,true),false);
});
test('encounter frequency depends on distance instead of frame count',()=>{
 const a=new StepEncounters(()=>0,0),b=new StepEncounters(()=>0,0);let hitsA=0,hitsB=0;
 for(let i=0;i<120;i++)if(a.move(3,true))hitsA++;
 for(let i=0;i<60;i++)if(b.move(6,true))hitsB++;
 assert.equal(hitsA,hitsB);assert.equal(hitsA,1);
});
test('formation generation scales safely from solo to 1–4 foes',()=>{
 assert.equal(randomFormation(1,()=>.999).length,1);assert.equal(randomFormation(4,()=>.999).length,4);assert.equal(randomFormation(4,()=>0).length,1);
});
