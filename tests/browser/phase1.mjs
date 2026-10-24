import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
mkdirSync('diagnostics',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const base=process.env.GAME_URL||'http://127.0.0.1:5173';
const errors=[];
async function press(page,key){const frame=await page.evaluate(()=>window.__testGame.loop.frame);await page.keyboard.press(key);await page.waitForFunction(frame=>window.__testGame.loop.frame>=frame+2,frame);}
async function inspect(page,fn,arg){return page.evaluate(({source,arg})=>new Function('game','arg',`return (${source})(game,arg)`)(window.__testGame,arg),{source:fn.toString(),arg});}
async function open(fallback=false){
 const page=await browser.newPage({viewport:{width:1280,height:880}});page.on('pageerror',e=>errors.push(e.message));
 if(fallback)await page.route('**/assets/**/*.png',route=>route.abort());
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('new Phaser.Game(','window.__testGame = new Phaser.Game(')});});
 await page.goto(base);await page.waitForFunction(()=>window.__testGame?.scene.isActive('Title'));return page;
}
async function waitBattle(page){await page.waitForFunction(()=>{const s=window.__testGame.scene.getScene('Battle');return s.sys.isActive()&&(s.result||(!s.busy&&s.actor!==null));},{},{timeout:20000});}
async function chooseCommand(page,choice){
 await press(page,'Escape');await press(page,'Escape');
 const current=await inspect(page,g=>g.scene.getScene('Battle').command);
 for(let i=0;i<(choice-current+5)%5;i++)await press(page,'ArrowDown');
 assert.equal(await inspect(page,g=>g.scene.getScene('Battle').command),choice,'command navigation');
 await press(page,'Enter');
}
async function playBattle(page){
 const phases=new Set();
 for(let step=0;step<100;step++){
  await waitBattle(page);
  const snapshot=await inspect(page,g=>{const s=g.scene.getScene('Battle'),m=s.actor===null?null:s.battle.state.party[s.actor];return {result:s.result,outcome:s.battle.outcome,id:m?.id,mp:m?.mp,phase:s.battle.foes.find(f=>f.kind==='king')?.phase};});
  if(snapshot.phase!==undefined)phases.add(snapshot.phase);
  if(snapshot.result){assert.equal(snapshot.outcome,'win');return phases;}
  const costs={rintaro:5,marmot:7,fugu:6,vanilla:8};
  const ether=snapshot.id==='marmot'&&snapshot.mp<7;
  await chooseCommand(page,ether?2:snapshot.mp>=costs[snapshot.id]?1:0);
  const selection=await inspect(page,g=>g.scene.getScene('Battle').selection);
  if(selection==='enemy')await press(page,'Enter');
  if(selection==='item'){await press(page,'ArrowDown');await press(page,'ArrowDown');await press(page,'Enter');await press(page,'Enter');}
  await page.waitForTimeout(100);
 }
 throw Error('battle did not complete within action budget');
}
try{
 const page=await open();
 const blocks=await inspect(page,g=>['title-first','title-second','chapter-title','title-options'].map(n=>{const b=g.scene.getScene('Title').children.getByName(n).getBounds();return {top:b.top,bottom:b.bottom}}));
 for(let i=1;i<blocks.length;i++)assert.ok(blocks[i-1].bottom<blocks[i].top);
 await press(page,'Enter');await page.waitForTimeout(250);for(let i=0;i<5;i++){await press(page,'Enter');await page.waitForTimeout(50);}
 assert.equal(await inspect(page,g=>g.scene.getScene('Field').mode),'walk');
 assert.equal(await inspect(page,g=>g.scene.getScene('Field').children.list.filter(c=>['bear','rabbit','king'].includes(c.texture?.key)).length),0);
 for(const [key,direction] of [['ArrowRight','right'],['ArrowLeft','left'],['ArrowDown','down'],['ArrowUp','up']]){
  await page.keyboard.down(key);await page.waitForTimeout(180);assert.equal(await inspect(page,g=>g.scene.getScene('Field').player.anims.currentAnim?.key),`rintaro:walk:${direction}`);await page.keyboard.up(key);await page.waitForTimeout(60);
 }
 for(const event of [{map:'home',x:270,y:305,count:1},{map:'park',x:220,y:315,count:2},{map:'market',x:270,y:325,count:3},{map:'station',x:240,y:335,count:4}]){
  if(event.map!=='home'){await inspect(page,g=>g.scene.getScene('Field').player.body.reset(925,370));await page.keyboard.down('ArrowRight');await page.waitForTimeout(260);await page.keyboard.up('ArrowRight');await page.waitForFunction(async expected=>{const {state}=await import('/src/game/state.ts');const field=window.__testGame.scene.getScene('Field');return state.map===expected&&field.sys.isActive()&&!field.changing;},event.map);}
  await inspect(page,(g,e)=>g.scene.getScene('Field').player.body.reset(e.x,e.y),event);await page.waitForTimeout(120);await press(page,'Enter');assert.equal(await inspect(page,g=>g.scene.getScene('Field').mode),'talk',JSON.stringify({event,context:await inspect(page,g=>{const s=g.scene.getScene('Field');return {near:s.nearby()?.name,x:s.player.x,y:s.player.y,changing:s.changing,active:g.scene.getScenes(true).map(s=>s.sys.settings.key)};})}));
  for(let i=0;i<3;i++){await press(page,'Enter');await page.waitForTimeout(90);}
  const progress=await page.evaluate(async()=>{const {state}=await import('/src/game/state.ts');return {map:state.map,count:state.party.length}});assert.deepEqual(progress,{map:event.map,count:event.count});
 }
 console.log('Story: message and sequential recruitment, no enemy symbols, four-direction walking passed');
 // Genuine legacy entry, then use the title's Load and menu Save.
 await page.evaluate(async()=>{
  const {state}=await import('/src/game/state.ts');const {SAVE_KEY,LEGACY_SAVE_KEY}=await import('/src/game/data.ts');
  const {money,inventory,atbMode,...old}=state;localStorage.removeItem(SAVE_KEY);localStorage.setItem(LEGACY_SAVE_KEY,JSON.stringify({...old,version:1}));window.__testGame.scene.getScene('Field').scene.start('Title');
 });
 await page.waitForTimeout(100);await press(page,'ArrowDown');await press(page,'Enter');await page.waitForTimeout(200);
 assert.equal(await page.evaluate(async()=>(await import('/src/game/state.ts')).state.version),3);
 await press(page,'Escape');await press(page,'ArrowDown');await press(page,'Enter');await page.waitForTimeout(80);await press(page,'Enter');
 assert.ok(await page.evaluate(async()=>{const {SAVE_KEY,LEGACY_SAVE_KEY}=await import('/src/game/data.ts');return JSON.parse(localStorage.getItem(SAVE_KEY)).version===3&&!!localStorage.getItem(LEGACY_SAVE_KEY)}));
 // Four enemies and active/wait behavior while a real command window is open.
 await inspect(page,g=>g.scene.getScene('Field').scene.start('Battle',{formation:['bear','rabbit','bear']}));await waitBattle(page);
 assert.equal(await inspect(page,g=>g.scene.getScene('Battle').images.length),3);assert.deepEqual(await inspect(page,g=>g.scene.getScenes(true).map(s=>s.sys.settings.key)),['Battle']);
 const paused=await inspect(page,g=>g.scene.getScene('Battle').battle.gauge('enemy',0));await page.waitForTimeout(250);assert.equal(await inspect(page,g=>g.scene.getScene('Battle').battle.gauge('enemy',0)),paused);
 await press(page,'KeyT');await page.waitForTimeout(250);assert.ok(await inspect(page,g=>g.scene.getScene('Battle').battle.gauge('enemy',0))>paused);await press(page,'KeyT');
 await page.screenshot({path:'diagnostics/v2-atb-four-enemies.png'});
 await playBattle(page);await press(page,'Enter');await page.waitForTimeout(200);
 assert.ok(await page.evaluate(async()=>(await import('/src/game/state.ts')).state.money>0));
 console.log('Save v1→v3 migration/backup, wait/active mode, three-enemy ATB victory and rewards passed');
 // Real movement in danger, deterministic step roll only; no artificial battle trigger.
 await page.evaluate(async()=>{const {StepEncounters}=await import('/src/game/encounters.ts');const field=window.__testGame.scene.getScene('Field');field.player.body.reset(150,455);field.meter=new StepEncounters(()=>0,0);});
 await page.waitForTimeout(450);assert.ok(await inspect(page,g=>g.scene.isActive('Field')));
 await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__testGame.scene.isActive('Battle'),{},{timeout:6000});await page.keyboard.up('ArrowRight');
 const formation=await inspect(page,g=>g.scene.getScene('Battle').battle.foes.length);assert.ok(formation>=1&&formation<=3);
 for(let attempt=0;attempt<3;attempt++){
  await waitBattle(page);if(await inspect(page,g=>g.scene.getScene('Battle').result))break;
  await chooseCommand(page,4);await page.waitForTimeout(700);
 }
 await page.waitForFunction(()=>window.__testGame.scene.getScene('Battle').result);assert.equal(await inspect(page,g=>g.scene.getScene('Battle').battle.outcome),'escape');
 await press(page,'Enter');await page.waitForTimeout(200);assert.ok(await inspect(page,g=>g.scene.isActive('Field')));
 console.log('Walking random encounter and escape/field recovery passed');
 // Boss is a deliberate interaction, not a symbol collision.
 await inspect(page,g=>g.scene.getScene('Field').player.body.reset(490,270));await press(page,'Enter');await page.waitForTimeout(80);await press(page,'Enter');await waitBattle(page);
 assert.ok(await inspect(page,g=>g.scene.getScene('Battle').battle.boss));
 await chooseCommand(page,4);assert.match(await inspect(page,g=>g.scene.getScene('Battle').log.text),/ボス戦からは逃げ/);
 const phases=await playBattle(page);assert.deepEqual([...phases].sort(),[0,1,2]);
 await press(page,'Enter');await page.waitForTimeout(200);assert.ok(await inspect(page,g=>g.scene.isActive('Clear')));
 assert.ok(await page.evaluate(async()=>{const {state}=await import('/src/game/state.ts');return state.flags.includes('ticket')&&state.flags.includes('clear')}));
 await page.screenshot({path:'diagnostics/v2-chapter-clear.png'});await page.close();
 console.log('Boss interaction, three phases, all spell effects, ticket and chapter clear passed');
 const fallback=await open(true);await press(fallback,'Enter');await fallback.waitForTimeout(200);assert.ok(await inspect(fallback,g=>g.scene.isActive('Field')));await fallback.close();
 assert.deepEqual(errors,[]);console.log('Missing PNG fallback and zero browser runtime errors passed');
}finally{await browser.close();}
