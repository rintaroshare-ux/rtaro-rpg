import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('new Phaser.Game(','window.__testGame=new Phaser.Game(')});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.__testGame?.scene.isActive('Title'));
 await page.evaluate(async()=>{
  const {state}=await import('/src/game/state.ts');state.party[0].hp=0;state.bowls=0;state.inventory={revive:0,ether:0,deluxe:0};state.money=77;state.flags=['intro','message'];
  // Simulate a damaged legacy state plus unavailable browser storage.
  Storage.prototype.setItem=function(){throw Error('storage unavailable')};
  window.__testGame.scene.getScene('Title').scene.start('Battle',{formation:['bear']});
 });
 await page.waitForFunction(()=>window.__testGame.scene.getScene('Battle').result);
 assert.equal(await page.evaluate(()=>window.__testGame.scene.getScene('Battle').battle.outcome),'lose');
 await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__testGame.scene.isActive('Field'));
 const state=await page.evaluate(async()=>{const {state}=await import('/src/game/state.ts');return state});
 assert.equal(state.map,'home');assert.equal(state.party[0].hp,125);assert.equal(state.bowls,3);assert.equal(state.inventory.revive,1);assert.equal(state.inventory.ether,1);assert.equal(state.money,77);
 assert.equal(await page.evaluate(()=>window.__testGame.scene.getScene('Field').mode),'talk');
 await page.keyboard.press('Enter');await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.__testGame.scene.getScene('Field').mode),'walk');
 assert.deepEqual(errors,[]);console.log('Defeat, all-KO legacy recovery, storage failure notice and continued field play passed');
}finally{await browser.close();}
