import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('dist');
assert.ok(existsSync(resolve(root, 'index.html')), 'run npm run build first');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.ogg':'audio/ogg'};
const server = createServer((req,res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/rtaro-rpg/')) {res.writeHead(404).end();return;}
  const file = resolve(root, decodeURIComponent(pathname.slice('/rtaro-rpg/'.length)) || 'index.html');
  if (!file.startsWith(root + sep)) {res.writeHead(403).end();return;}
  try {res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(readFileSync(file));}
  catch {res.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:1280,height:880}});
  const errors=[], pngs=new Set();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().endsWith('.png')) {assert.equal(response.status(),200);pngs.add(response.url());}});
  await page.goto(`http://127.0.0.1:${server.address().port}/rtaro-rpg/`);
  await page.waitForFunction(()=>document.querySelector('canvas')?.width===640);
  await page.waitForTimeout(1200);
  assert.equal(pngs.size,29,'four heroes, seventeen enemies, six NPC/object PNGs and the tileset load beneath the Pages path');
  assert.equal(await page.title(),'R太郎と伝説の海鮮丼');
  await page.screenshot({path:'diagnostics/pages-title.png'});
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  for(let i=0;i<5;i++){await page.keyboard.press('Enter');await page.waitForTimeout(80);}
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');
  await page.screenshot({path:'diagnostics/pages-field.png'});
  assert.deepEqual(errors,[]);
  const compositions=JSON.parse(readFileSync('public/audio/compositions.json','utf8'));
  for(const c of compositions){const r=await page.request.get(`http://127.0.0.1:${server.address().port}/rtaro-rpg/audio/${c.id}.ogg`);assert.equal(r.status(),200);assert.equal((await r.body()).subarray(0,4).toString(),'OggS');}
  console.log('Production Pages path /rtaro-rpg/: title, field, JS/CSS and all 29 PNGs passed');
} finally {await browser.close();server.close();}
