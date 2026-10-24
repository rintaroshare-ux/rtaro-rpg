import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('new Phaser.Game(','window.__testGame=new Phaser.Game(')});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.__testGame?.scene.isActive('Title'));
 assert.equal(await page.evaluate(async()=>(await import('/src/audio/music.ts')).music.contextState),'locked');await page.locator('#sound-toggle').tap();
 const played=async id=>page.waitForFunction(async id=>{const {music}=await import('/src/audio/music.ts');return music.track===id&&music.active?.id===id&&music.contextState==='running';},id);
 await played('title');
 for(const [map,id] of [['home','field'],['airport','airport'],['cabin','sky'],['oslo','oslo'],['office','office']]){
  await page.evaluate(async map=>{const {state,member}=await import('/src/game/state.ts');state.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id,9));state.flags=['intro','message','clear','arrival:haneda','arrival:sky','arrival:norway','arrival:company'];state.map=map;state.x=130;state.y=370;window.__testGame.scene.getScenes(true).at(-1).scene.start(map==='home'?'Field':'Campaign');},map);await played(id);
 }
 const rms=await page.evaluate(async()=>{const {music}=await import('/src/audio/music.ts'),analyser=music.context.createAnalyser();music.master.connect(analyser);let peak=0;for(let i=0;i<15;i++){await new Promise(r=>setTimeout(r,50));const a=new Float32Array(256);analyser.getFloatTimeDomainData(a);peak=Math.max(peak,...a.map(Math.abs));}music.master.disconnect(analyser);return peak;});assert.ok(rms>.0001);
 await page.evaluate(()=>{const s=window.__testGame.scene.getScene('Campaign');s.scene.launch('Shop');s.scene.pause();});await played('shop');await page.evaluate(()=>window.__testGame.scene.getScene('Shop').close());await played('office');
 for(const [kind,id] of [['airportMid','elite'],['king','boss'],['dad','final']]){await page.evaluate(async kind=>{const {state}=await import('/src/game/state.ts');state.resumeBattle=null;window.__testGame.scene.getScenes(true).at(-1).scene.start('Battle',{formation:[kind]});},kind);await played(id);}
 await page.evaluate(()=>{const s=window.__testGame.scene.getScene('Battle');s.battle.foes.forEach(f=>f.hp=0);s.end();});await played('victory');await page.evaluate(()=>window.__testGame.scene.getScene('Battle').finish());await played('office');
 await page.evaluate(async()=>{const {music}=await import('/src/audio/music.ts');music.setVolume(.2);music.setEffectVolume(.7);});assert.deepEqual(await page.evaluate(async()=>{const {music}=await import('/src/audio/music.ts');return [music.level,music.sfxLevel];}),[.2,.7]);
 await page.locator('#pause-button').tap();assert.equal(await page.evaluate(async()=>(await import('/src/audio/music.ts')).music.active),null);await page.getByRole('button',{name:'ゲームを再開',exact:true}).tap();await played('office');
 await page.evaluate(()=>window.__testGame.scene.getScene('Campaign').scene.start('Ending'));await played('ending');await page.evaluate(async()=>{(await import('/src/audio/music.ts')).music.setTrack('emotion');});await played('emotion');await page.route('**/audio/title.ogg',r=>r.abort());await page.evaluate(async()=>(await import('/src/audio/music.ts')).music.setTrack('title'));await page.waitForFunction(async()=>!!(await import('/src/audio/music.ts')).music.error);await page.unroute('**/audio/title.ogg');await page.locator('#sound-toggle').tap();await played('title');assert.deepEqual(errors,[]);
 console.log('Phase 6: gesture unlock, real decoded non-silent music, five field tracks, shop return, elite/boss/final, victory/field return, emotion/ending, independent volumes and pause passed');
}finally{await browser.close();}
