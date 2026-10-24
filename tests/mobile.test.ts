import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mobileLayout} from '../src/input/mobileLayout';
import {TouchState} from '../src/input/touchState';
import {save,load,reset,state} from '../src/game/state';
import {SAVE_KEY,AUTO_SAVE_KEY} from '../src/game/data';
test('phone/tablet layouts stay on screen with 44px or larger directional targets',()=>{
 for(const [w,h] of [[568,320],[667,375],[740,360],[915,412],[390,844],[820,1180],[1180,820]]){
  const p=mobileLayout(w,h);assert.ok(p.x>=0&&p.y>=0);assert.ok(p.x+p.width<=w&&p.y+p.height<=h);assert.ok(p.buttonSize>=44);assert.ok(Math.abs(p.width/p.height-16/9)<.001);assert.equal(p.portrait,h>w);
 }
 const notch=mobileLayout(915,412,{top:22,right:40,bottom:18,left:40});assert.ok(notch.x>=40&&notch.x+notch.width<=875&&notch.y>=22&&notch.y+notch.height<=394);
});
test('multiple touch pointers release independently and support diagonal movement',()=>{
 const t=new TouchState();t.press(1,'right');t.press(2,'right');t.release(1);assert.equal(t.flags.right,true);t.press(3,'up');assert.equal(t.flags.up,true);t.release(2);assert.equal(t.flags.right,false);assert.equal(t.flags.up,true);t.clear();assert.deepEqual(t.flags,{up:false,down:false,left:false,right:false});
});
test('sliding a pointer changes direction without leaving its previous direction stuck',()=>{
 const t=new TouchState();t.press(1,'left');t.press(1,'up');assert.equal(t.flags.left,false);assert.equal(t.flags.up,true);t.release(1);assert.equal(t.flags.up,false);
});
test('automatic interruption save never overwrites the manual slot and loads independently',()=>{
 const entries=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>entries.get(k)??null,setItem:(k:string,v:string)=>entries.set(k,v)}});
 reset();state.money=77;assert.ok(save());const manual=entries.get(SAVE_KEY);state.money=91;assert.ok(save(true));assert.equal(entries.get(SAVE_KEY),manual);assert.ok(JSON.parse(entries.get(AUTO_SAVE_KEY)!).savedAt>0);
 assert.ok(load('auto'));assert.equal(state.money,91);assert.ok(load());assert.equal(state.money,77);
 entries.set(AUTO_SAVE_KEY,'broken');assert.equal(load('auto'),false);assert.equal(state.money,77);
 delete (globalThis as {localStorage?:unknown}).localStorage;
});
