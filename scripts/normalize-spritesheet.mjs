// Convert a generated 3-column / 4-row RGBA master to the game's stable frame size.
// Usage: node scripts/normalize-spritesheet.mjs input.png output.png
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Specify input.png and output.png');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{
 const page=await browser.newPage();
 const png=await page.evaluate(async data=>{
  const image=new Image();image.src=data;await image.decode();
  if(Math.abs(image.width/image.height-.5)>.01)throw Error('Expected 3 × 4 portrait master with 1:2 aspect ratio');
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0,96,192);
  return canvas.toDataURL('image/png').split(',')[1];
 },`data:image/png;base64,${readFileSync(input).toString('base64')}`);
 writeFileSync(output,Buffer.from(png,'base64'));
}finally{await browser.close();}
