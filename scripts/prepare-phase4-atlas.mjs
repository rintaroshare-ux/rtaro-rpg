// Pack generated transparent master cells into independent runtime PNGs.
// node scripts/prepare-phase4-atlas.mjs master.png out-dir columns rows sizeX sizeY key1,key2,...
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const [input,out,colsArg,rowsArg,wArg,hArg,keyList]=process.argv.slice(2);
const cols=Number(colsArg),rows=Number(rowsArg),width=Number(wArg),height=Number(hArg),keys=keyList?.split(',');
if(!input||!out||!keys||keys.length!==cols*rows||![cols,rows,width,height].every(n=>Number.isInteger(n)&&n>0))throw Error('Invalid atlas dimensions / keys');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{
 const page=await browser.newPage();const data=await page.evaluate(async({src,cols,rows,width,height})=>{
  const image=new Image();image.src=src;await image.decode();
  const master=document.createElement('canvas');master.width=image.width;master.height=image.height;
  const ctx=master.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height).data;
  const opaque=(x,y)=>pixels[(y*image.width+x)*4+3]>=160;
  const active=[];for(let y=0;y<image.height;y++){let n=0;for(let x=0;x<image.width;x++)if(opaque(x,y))n++;if(n>image.width*.012)active.push(y);}
  if(!active.length)throw Error('Empty atlas');
  const gaps=[];for(let i=1;i<active.length;i++)if(active[i]-active[i-1]>3)gaps.push({from:active[i-1],to:active[i],length:active[i]-active[i-1]});
  gaps.sort((a,b)=>b.length-a.length);if(gaps.length<rows-1)throw Error('No transparent row separators');
  const cuts=gaps.slice(0,rows-1).map(g=>Math.floor((g.from+g.to)/2)).sort((a,b)=>a-b),bounds=[active[0],...cuts,active.at(-1)+1],frames=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   let left=image.width,right=-1,top=image.height,bottom=-1;
   for(let y=bounds[row];y<bounds[row+1];y++)for(let x=Math.floor(col*image.width/cols);x<Math.floor((col+1)*image.width/cols);x++)if(opaque(x,y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<left)throw Error('Empty cell');frames.push({left,top,w:right-left+1,h:bottom-top+1});
  }
  const scale=Math.min((width-8)/Math.max(...frames.map(f=>f.w)),(height-8)/Math.max(...frames.map(f=>f.h)));
  return frames.map(f=>{const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const w=Math.round(f.w*scale),h=Math.round(f.h*scale);g.drawImage(image,f.left,f.top,f.w,f.h,Math.floor((width-w)/2),height-4-h,w,h);return c.toDataURL('image/png').split(',')[1];});
 },{src:`data:image/png;base64,${readFileSync(input).toString('base64')}`,cols,rows,width,height});
 mkdirSync(out,{recursive:true});data.forEach((png,i)=>writeFileSync(join(out,keys[i]+'.png'),Buffer.from(png,'base64')));console.log(`Prepared ${data.length} ${width}x${height} PNGs`);
}finally{await browser.close();}
