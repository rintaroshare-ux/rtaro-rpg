import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
mkdirSync('diagnostics',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('new Phaser.Game(','window.__testGame=new Phaser.Game(')});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.__testGame?.scene.isActive('Title'));
 const frame=async()=>{const n=await page.evaluate(()=>window.__testGame.loop.frame);await page.waitForFunction(n=>window.__testGame.loop.frame>=n+2,n);};
 const action=async id=>{await page.locator(`#mobile-panel [data-action="${id}"]`).tap();await frame();};
 const talk=async()=>{for(let n=0;n<25;n++){const s=await page.evaluate(()=>window.__testGame.scene.getScenes(true).at(-1)?.sys.settings.key);if(s!=='Campaign'||await page.evaluate(()=>window.__testGame.scene.getScene('Campaign').mode)!=='talk')break;await action('continue');}};
 const node=async id=>{const n=await page.evaluate(id=>{const s=window.__testGame.scene.getScene('Campaign'),n=s.nodes.find(n=>n.id===id);s.player.body.reset(n.x,n.y+33);return n.name;},id);assert.ok(n);await frame();await page.locator('[data-code=Enter]').tap();await frame();};
 await page.evaluate(async()=>{const {state,member}=await import('/src/game/state.ts');state.flags=['intro','message','ticket','clear'];state.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id,3));window.__testGame.scene.getScene('Title').scene.start('Clear');});await frame();await page.locator('[data-code=Enter]').tap();await frame();await talk();
 const chapters=await page.evaluate(async()=>(await import('/src/game/campaignData.ts')).chapters);
 for(const c of chapters){
  for(const dungeon of [false,true]){
   for(const q of c.quests.filter(q=>q.map===(dungeon?c.dungeon:c.field))){await node(q.id);await talk();await page.waitForSelector('#mobile-panel [data-action=choice-0]');await action(`choice-${q.answer}`);await talk();await frame();assert.ok(await page.evaluate(async id=>(await import('/src/game/state.ts')).state.flags.includes(`quest:${id}`),q.id));}
   if(!dungeon){await page.locator('#quick-save').tap();await node('next');await talk();await frame();assert.equal(await page.evaluate(async()=>(await import('/src/game/state.ts')).state.map),c.dungeon);await page.screenshot({path:`diagnostics/campaign-${c.id}.png`});}
   else{
    for(const boss of ['mid','boss']){await node(boss);await talk();await page.waitForFunction(()=>window.__testGame.scene.isActive('Battle'));await page.evaluate(()=>{const s=window.__testGame.scene.getScene('Battle');s.battle.foes.forEach(f=>f.hp=0);s.end();});await frame();await action('continue');await frame();await talk();}
    await node('next');await talk();await frame();await talk();
   }
  }
 }
 await page.waitForFunction(()=>window.__testGame.scene.isActive('Ending'));assert.ok(await page.evaluate(async()=>(await import('/src/game/state.ts')).state.flags.includes('delivered')));await page.screenshot({path:'diagnostics/campaign-ending.png'});
 await page.reload();await page.waitForFunction(()=>window.__testGame.scene.isActive('Title'));await action('title-1');await page.waitForFunction(()=>window.__testGame.scene.isActive('Ending'));assert.deepEqual(errors,[]);
 console.log('Campaign: touch quests, all eight maps, chapter gates, boss result transitions (accelerated fixtures), delivery, ending and clear-save reload passed');
}finally{await browser.close();}
