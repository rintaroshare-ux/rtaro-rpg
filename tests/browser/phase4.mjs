import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
mkdirSync('diagnostics',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:880}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('new Phaser.Game(','window.__testGame=new Phaser.Game(')});});
 const frame=async()=>{const n=await page.evaluate(()=>window.__testGame.loop.frame);await page.waitForFunction(n=>window.__testGame.loop.frame>=n+2,n);};
 const press=async key=>{await page.keyboard.press(key);await frame();};
 const ready=()=>page.waitForFunction(()=>window.__testGame?.scene.isActive('Title'));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173');await ready();
 const textures=await page.evaluate(async()=>{const {sceneAssets}=await import('/src/graphics/spec.ts');return sceneAssets.map(a=>{const image=window.__testGame.textures.get(a.key).getSourceImage();return {key:a.key,png:image instanceof HTMLImageElement,width:image.width,height:image.height,expected:[a.width,a.height]};});});
 assert.equal(textures.length,24);for(const t of textures){assert.ok(t.png,t.key+' should use a PNG');assert.deepEqual([t.width,t.height],t.expected);}
 await page.evaluate(async()=>{const {state,member}=await import('/src/game/state.ts');state.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id,3));state.flags=['intro','message'];state.map='park';state.x=680;state.y=325;window.__testGame.scene.getScene('Title').scene.start('Field');});
 await page.waitForFunction(()=>window.__testGame.scene.isActive('Field'));await frame();
 const bowls=await page.evaluate(async()=>(await import('/src/game/state.ts')).state.bowls);
 await press('Enter');assert.equal(await page.evaluate(async()=>(await import('/src/game/state.ts')).state.bowls),bowls+2);await press('Enter');await frame();
 await press('Enter');await press('Enter');assert.equal(await page.evaluate(async()=>(await import('/src/game/state.ts')).state.bowls),bowls+2);
 await page.locator('#quick-save').click();await page.reload();await ready();await press('ArrowDown');await press('Enter');await page.waitForFunction(()=>window.__testGame.scene.isActive('Field'));
 assert.ok(await page.evaluate(async()=>(await import('/src/game/state.ts')).state.flags.includes('chest:park-supplies')));await page.screenshot({path:'diagnostics/phase4-park-treasure.png'});
 const ids=await page.evaluate(async()=>(await import('/src/game/bestiary.ts')).plushIds);
 for(let i=0;i<ids.length;i+=3){const formation=ids.slice(i,i+3);await page.evaluate(async formation=>{const {state}=await import('/src/game/state.ts');state.resumeBattle=null;const active=window.__testGame.scene.getScenes(true).at(-1);active.scene.start('Battle',{formation});},formation);await page.waitForFunction(()=>window.__testGame.scene.isActive('Battle'));await frame();assert.deepEqual(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').images.map(i=>i.texture.key)),formation);if(i===9)await page.screenshot({path:'diagnostics/phase4-plush-battle.png'});}
 await page.locator('#quick-save').click();const kinds=await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.foes.map(f=>f.kind));await page.reload();await ready();await press('ArrowDown');await press('Enter');await page.waitForFunction(()=>window.__testGame.scene.isActive('Battle'));assert.deepEqual(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.foes.map(f=>f.kind)),kinds);
 await page.evaluate(async()=>{const {state}=await import('/src/game/state.ts');state.resumeBattle=null;window.__testGame.scene.getScene('Battle').scene.restart({formation:['king']});});await frame();await page.waitForFunction(()=>window.__testGame.scene.getScene('Battle').images[0]?.texture.key==='king');
 assert.equal(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').images[0].displayWidth),96);await page.screenshot({path:'diagnostics/phase4-boss.png'});assert.deepEqual(errors,[]);
 console.log('Phase 4: 24 PNGs, all sixteen enemy battle sprites, boss art, treasure once-only/save/reload, new-enemy battle resume passed');
}finally{await browser.close();}
