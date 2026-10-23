import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
const base = process.env.GAME_URL || 'http://127.0.0.1:5173';
// Instrument the served entry in the test browser only; no hooks in the product build.
async function open(fallback = false) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 880 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  if (fallback) await page.route('**/assets/**/*.png', route => route.abort());
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('new Phaser.Game(', 'window.__testGame = new Phaser.Game(');
    await route.fulfill({ response, body });
  });
  await page.goto(base);
  await page.waitForFunction(() => window.__testGame?.scene.isActive('Title'));
  return { page, errors };
}
async function inspect(page, fn, arg) {
  return page.evaluate(async ({ expression, arg }) => {
    return new Function('game', 'arg', `return (${expression})(game,arg)`)(window.__testGame, arg);
  }, { expression: fn.toString(), arg });
}
try {
  for (const fallback of [false, true]) {
    const { page, errors } = await open(fallback);
    const textures = await inspect(page, game => ['rintaro', 'marmot', 'fugu', 'vanilla'].map(key => ({ key, width: game.textures.get(key).source[0].width, height: game.textures.get(key).source[0].height, frames: game.textures.get(key).frameTotal })));
    assert.ok(textures.every(t => t.width === 96 && t.height === 192 && t.frames === 13));
    const titleLayout = await inspect(page, game => {
      const scene = game.scene.getScene('Title');
      return ['title-first','title-second','chapter-title','title-options'].map(name => {
        const bounds = scene.children.getByName(name).getBounds();
        return {top:bounds.top,bottom:bounds.bottom,left:bounds.left,right:bounds.right};
      });
    });
    for(let i=1;i<titleLayout.length;i++) assert.ok(titleLayout[i-1].bottom<titleLayout[i].top, 'title text regions do not overlap');
    assert.ok(titleLayout.every(b=>b.left>=0&&b.right<=640));
    await page.screenshot({path:`diagnostics/integration-title-${fallback?'fallback':'png'}.png`});
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    for (let i = 0; i < 5; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(60); }
    assert.equal(await inspect(page, game => game.scene.getScene('Field').mode), 'walk');
    for (const [key, direction] of [['ArrowRight', 'right'], ['ArrowLeft', 'left'], ['ArrowDown', 'down'], ['ArrowUp', 'up']]) {
      await page.keyboard.down(key); await page.waitForTimeout(200);
      const anim = await inspect(page, game => game.scene.getScene('Field').player.anims.currentAnim?.key);
      assert.equal(anim, `rintaro:walk:${direction}`);
      await page.keyboard.up(key); await page.waitForTimeout(80);
      assert.equal(await inspect(page, game => game.scene.getScene('Field').player.anims.isPlaying), false);
    }
    const layers = await inspect(page, game => game.scene.getScene('Field').children.list.filter(child => child.type === 'TilemapLayer').map(child => child.layer.name));
    assert.ok(['ground', 'roads', 'signs', 'buildings-0', 'foliage-0'].every(name => layers.includes(name)));
    await page.keyboard.press('Escape'); await page.waitForTimeout(60);
    assert.equal(await inspect(page, game => game.scene.getScene('Field').mode), 'menu');
    await page.keyboard.press('Escape');
    await page.screenshot({ path: `diagnostics/graphics-${fallback ? 'fallback' : 'png'}.png` });
    if (!fallback) {
      // Drive the existing chapter events by keyboard; no flag shortcuts.
      for (const event of [
        {map:'home',x:270,y:305,count:1},
        {map:'park',x:220,y:315,count:2},
        {map:'market',x:270,y:325,count:3},
        {map:'station',x:240,y:335,count:4},
      ]) {
        if(event.map!=='home') {
          await inspect(page, game => game.scene.getScene('Field').player.body.reset(925,370));
          await page.keyboard.down('ArrowRight'); await page.waitForTimeout(260); await page.keyboard.up('ArrowRight');
          await page.waitForTimeout(150);
        }
        await inspect(page, (game,event) => game.scene.getScene('Field').player.body.reset(event.x,event.y), event);
        await page.keyboard.press('Enter'); await page.waitForTimeout(60);
        assert.equal(await inspect(page, game => game.scene.getScene('Field').mode),'talk');
        for(let i=0;i<3;i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(90); }
        const progress = await page.evaluate(async () => {const {state}=await import('/src/game/state.ts');return {map:state.map,count:state.party.length}});
        assert.deepEqual(progress,{map:event.map,count:event.count});
      }
      assert.equal(await inspect(page, game=>game.scene.getScene('Field').partyView.followers.length),3);
      console.log('Keyboard story: mother message and sequential recruitment of all three companions passed');
      // Use the existing v1 save format and exercise real load/scene/render paths.
      await page.evaluate(async () => {
        const { fresh, member } = await import('/src/game/state.ts');
        const { SAVE_KEY } = await import('/src/game/data.ts');
        const fixture = fresh();
        fixture.party = ['rintaro','marmot','fugu','vanilla'].map(id => member(id));
        fixture.flags = ['intro','message'];
        localStorage.setItem(SAVE_KEY, JSON.stringify(fixture));
      });
      const loaded = await page.evaluate(async () => (await import('/src/game/state.ts')).load());
      assert.equal(loaded, true);
      for (const map of ['home', 'park', 'market', 'station']) {
        await page.evaluate(async map => {
          const { state } = await import('/src/game/state.ts');
          state.map = map; state.x = 260; state.y = 370;
          window.__testGame.scene.start('Field');
        }, map);
        await page.waitForTimeout(150);
        assert.equal(await inspect(page, game => game.scene.getScene('Field').sys.isActive()), true);
        const party = await inspect(page, game => {
          const scene = game.scene.getScene('Field');
          return [scene.player,...scene.partyView.followers.map(f=>f.sprite)].map(p=>({key:p.texture.key,width:p.frame.width,height:p.frame.height,scale:p.scaleX}));
        });
        assert.deepEqual(party.map(p=>p.key),['rintaro','marmot','fugu','vanilla']);
        assert.ok(party.every(p=>p.width===32&&p.height===48&&p.scale===1));
        await page.screenshot({path: `diagnostics/map-${map}.png`});
      }
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1250);
      const walkers = await inspect(page, game => {
        const scene=game.scene.getScene('Field');
        return [scene.player,...scene.partyView.followers.map(f=>f.sprite)].map(p=>({playing:p.anims.isPlaying,key:p.anims.currentAnim?.key}));
      });
      assert.ok(walkers.every(p=>p.playing&&p.key.endsWith(':walk:right')), 'all four party sprites walk');
      await page.keyboard.up('ArrowRight'); await page.waitForTimeout(300);
      assert.ok(await inspect(page, game => game.scene.getScene('Field').partyView.followers.every(f=>!f.sprite.anims.isPlaying)));
      await inspect(page, game => game.scene.start('Battle', {id:'boss',kind:'king'}));
      await page.waitForTimeout(150);
      // Actual render effects and battle controller, without altering enemy HP.
      for(let action = 0; action < 40; action++) {
        const finished = await inspect(page, game => game.scene.getScene('Battle').result);
        if(finished) break;
        await inspect(page, game => {
          const scene = game.scene.getScene('Battle');
          const member = scene.battle.state.party[scene.actor];
          scene.command = member.mp >= 8 ? 1 : 0;
          scene.act();
        });
        await page.waitForFunction(() => !window.__testGame.scene.getScene('Battle').busy);
      }
      assert.equal(await inspect(page, game => game.scene.getScene('Battle').outcome), 'win');
      await page.keyboard.press('Enter'); await page.waitForTimeout(200);
      assert.equal(await inspect(page, game => game.scene.isActive('Clear')), true);
      await page.screenshot({path: 'diagnostics/graphics-clear.png'});
      console.log('Existing v1 save: 4 maps, four-member boss battle, magic effects and chapter clear passed');
    }
    assert.deepEqual(errors, []);
    console.log(`${fallback ? 'Fallback' : 'PNG'}: 4 sprite sheets, four directions, idle, tile layers and menu passed`);
    await page.close();
  }
} finally { await browser.close(); }
