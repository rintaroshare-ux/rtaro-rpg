import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
mkdirSync('diagnostics',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:915,height:412},screen:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('new Phaser.Game(','window.__testGame=new Phaser.Game(')});});
 const frame=async()=>{const f=await page.evaluate(()=>window.__testGame.loop.frame);await page.waitForFunction(f=>window.__testGame.loop.frame>=f+2,f);};
 const action=async id=>{await page.locator(`#mobile-panel button[data-action="${id}"]`).tap();await frame();};
 const resume=async()=>{await page.getByRole('button',{name:'ゲームを再開',exact:true}).tap();await frame();};
 const snapshot=()=>page.evaluate(async()=>structuredClone((await import('/src/game/state.ts')).state));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.__testGame?.scene.isActive('Title'));
 await page.waitForSelector('#mobile-panel:not([hidden])');assert.equal(await page.evaluate(()=>document.body.dataset.touch),'true');
 await action('title-0');for(let i=0;i<5;i++)await action('continue');assert.equal(await page.evaluate(()=>window.__testGame.scene.getScene('Field').mode),'walk');
 for(const button of await page.locator('.dpad button,.touch-actions .confirm,.touch-actions .cancel').all()){const b=await button.boundingBox();assert.ok(b.width>=44&&b.height>=44);}
 const before=await snapshot(),cdp=await context.newCDPSession(page),right=await page.locator('[data-direction=right]').boundingBox(),up=await page.locator('[data-direction=up]').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:right.x+right.width/2,y:right.y+right.height/2,id:1}]});await page.waitForTimeout(250);
 assert.ok((await snapshot()).x>before.x+10);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:up.x+up.width/2,y:up.y+up.height/2,id:1}]});await page.waitForTimeout(120);
 const flags=await page.evaluate(async()=>(await import('/src/input/touch.ts')).touchDirections);assert.equal(flags.up,true);assert.equal(flags.right,false);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await frame();assert.deepEqual(await page.evaluate(async()=>(await import('/src/input/touch.ts')).touchDirections),{up:false,down:false,left:false,right:false});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:right.x+right.width/2,y:right.y+right.height/2,id:3},{x:up.x+up.width/2,y:up.y+up.height/2,id:4}]});await page.waitForTimeout(130);const diagonal=await page.evaluate(async()=>(await import('/src/input/touch.ts')).touchDirections);assert.ok(diagonal.right&&diagonal.up);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await frame();
 await page.locator('#quick-save').tap();const manual=await page.evaluate(async()=>localStorage.getItem((await import('/src/game/data.ts')).SAVE_KEY));
 await page.evaluate(async()=>{(await import('/src/game/state.ts')).state.money=123;window.dispatchEvent(new Event('blur'));});await page.waitForSelector('#pause-overlay:not([hidden])');
 assert.equal(await page.evaluate(()=>window.__testGame.scene.getScenes(true).length),0);
 const auto=await page.evaluate(async()=>JSON.parse(localStorage.getItem((await import('/src/game/data.ts')).AUTO_SAVE_KEY)));assert.equal(auto.money,123);assert.equal(await page.evaluate(async()=>localStorage.getItem((await import('/src/game/data.ts')).SAVE_KEY)),manual);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(await page.locator('#pause-overlay').isVisible(),true);await resume();
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.body.dataset.orientation==='portrait');await page.waitForSelector('#pause-overlay:not([hidden])');await resume();
 let canvas=await page.locator('canvas').boundingBox();assert.ok(canvas.x>=0&&canvas.x+canvas.width<=390&&canvas.y+canvas.height<=844);await page.screenshot({path:'diagnostics/phase3-portrait.png'});
 await page.setViewportSize({width:667,height:375});await page.waitForFunction(()=>document.body.dataset.orientation==='landscape');await page.waitForSelector('#pause-overlay:not([hidden])');await resume();
 canvas=await page.locator('canvas').boundingBox();assert.ok(canvas.x>=0&&canvas.x+canvas.width<=667&&canvas.y+canvas.height<=375);
 await page.evaluate(async()=>{const {state,member}=await import('/src/game/state.ts');state.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id));window.__testGame.scene.getScene('Field').startBattle(['bear','rabbit','bear']);});
 await page.waitForSelector('#mobile-panel button[data-action=choice-0]');await action('choice-0');assert.equal(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').selection),'enemy');await action('choice-0');
 await page.waitForFunction(()=>window.__testGame.scene.getScene('Battle').battle.foes[0].hp<65);await page.waitForTimeout(850);await page.screenshot({path:'diagnostics/phase3-battle-compact.png'});
 await page.evaluate(async()=>{(await import('/src/game/state.ts')).state.atbMode='active';window.dispatchEvent(new Event('blur'));});await page.waitForSelector('#pause-overlay:not([hidden])');const frozen=await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.snapshot().enemyGauges);const hp=await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.foes.map(f=>f.hp));await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.foes.map(f=>f.hp)),hp);assert.deepEqual(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.snapshot().enemyGauges),frozen);
 assert.equal(await page.evaluate(async()=>localStorage.getItem((await import('/src/game/data.ts')).SAVE_KEY)),manual);
 await page.reload();await page.waitForFunction(()=>window.__testGame?.scene.isActive('Title'));await action('title-2');await page.waitForFunction(()=>window.__testGame.scene.isActive('Battle'));assert.deepEqual(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.foes.map(f=>f.hp)),hp);
 // Fullscreen denial must fall back safely, and changing control preferences must not affect game saves.
 await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('not allowed'));});await page.locator('#fullscreen-button').tap();await page.waitForSelector('#pause-overlay:not([hidden])');await resume();
 await page.evaluate(async()=>{const {state}=await import('/src/game/state.ts');state.resumeBattle=null;state.map='market';state.x=540;state.y=325;state.money=500;state.flags=['intro','message'];window.__testGame.scene.getScene('Battle').scene.start('Field');});
 await page.waitForFunction(()=>window.__testGame.scene.getScene('Field').mode==='walk');await frame();await page.locator('[data-code=Enter]').tap();await page.waitForSelector('#mobile-panel button[data-action=stock-deluxe]');
 await action('stock-deluxe');await action('trade');assert.equal((await snapshot()).inventory.deluxe,1);assert.equal((await snapshot()).money,452);
 await page.locator('#mobile-panel [data-action=back]').tap();await frame();await page.evaluate(()=>window.__testGame.scene.getScene('Field').player.body.reset(700,325));await frame();await page.locator('[data-code=Enter]').tap();await page.waitForSelector('#mobile-panel [data-action=next]');await action('next');await action('stock-travelVest');await action('trade');assert.equal((await snapshot()).gearBag.travelVest,1);
 await page.locator('#mobile-panel [data-action=back]').tap();await frame();await page.locator('[data-code=Escape]').tap();await action('field-5');await action('equipment');await action('slot-armor');await action('gear-travelVest');await action('equip');assert.equal((await snapshot()).party[0].equipment.armor,'travelVest');
 await page.locator('#quick-save').tap();await page.screenshot({path:'diagnostics/phase3-equipment-large.png'});
 // Menus scroll inside their panel; the document itself never scrolls.
 assert.equal(await page.evaluate(()=>window.scrollY),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 await page.locator('#pause-button').tap();await page.waitForSelector('#pause-overlay:not([hidden])');await page.locator('#large-menu-toggle').tap();assert.equal(await page.evaluate(()=>document.body.dataset.largeMenu),'false');await page.locator('#large-menu-toggle').tap();await page.locator('#input-mode-setting').tap();assert.equal(await page.evaluate(()=>document.body.dataset.touch),'false');await page.locator('#input-mode-setting').tap();assert.equal(await page.evaluate(()=>document.body.dataset.touch),'true');await resume();
 for(const [width,height] of [[568,320],[740,360],[915,412],[820,1180]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);if(await page.locator('#pause-overlay').isVisible())await resume();const b=await page.locator('canvas').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,JSON.stringify({width,height,b,metrics:await page.evaluate(()=>({iw:innerWidth,ih:innerHeight,vw:visualViewport.width,vh:visualViewport.height,touch:document.body.dataset.touch,x:getComputedStyle(document.documentElement).getPropertyValue('--mobile-x'),w:getComputedStyle(document.documentElement).getPropertyValue('--mobile-w')}))}));assert.equal(await page.evaluate(()=>window.scrollY),0);}
 assert.deepEqual(errors,[]);console.log('Phase 3: large touch menus, movement/slide/cancel, phone rotation, pause, independent auto-resume, fullscreen fallback, shops/equipment/save and no document scroll passed');
}finally{await browser.close();}
