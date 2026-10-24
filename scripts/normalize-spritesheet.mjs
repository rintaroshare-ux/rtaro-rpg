// Convert a generated 3-column / 4-row RGBA master to the game's stable frame size.
// Usage: node scripts/normalize-spritesheet.mjs input.png output.png [--fit-frames]
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Specify input.png and output.png');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
try{
 const page=await browser.newPage();
 const png=await page.evaluate(async ({data,fit})=>{
  const image=new Image();image.src=data;await image.decode();
  if(Math.abs(image.width/image.height-.5)>.01)throw Error('Expected 3 × 4 portrait master with 1:2 aspect ratio');
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  if(!fit)ctx.drawImage(image,0,0,96,192);
  else{
   // Generated masters may use uneven row spacing. Find the four opaque bands,
   // then fit individual silhouettes into fixed cells without neighboring pixels.
   const master=document.createElement('canvas');master.width=image.width;master.height=image.height;
   const mc=master.getContext('2d');mc.drawImage(image,0,0);const pixels=mc.getImageData(0,0,image.width,image.height).data;
   const opaque=(x,y)=>pixels[(y*image.width+x)*4+3]>=160;
   const bands=[];let start=-1,last=-1;
   for(let y=0;y<image.height;y++){
    let count=0;for(let x=0;x<image.width;x++)if(opaque(x,y))count++;
    if(count>image.width*.02){if(start<0)start=y;last=y;}
    else if(start>=0&&y-last>12){bands.push([start,last]);start=-1;}
   }
   if(start>=0)bands.push([start,last]);
   if(bands.length!==4)throw Error(`Expected four character rows, found ${bands.length}`);
   const frames=[];
   for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    let left=image.width,right=-1,top=image.height,bottom=-1;
    for(let y=bands[row][0];y<=bands[row][1];y++)for(let x=Math.floor(col*image.width/3);x<Math.floor((col+1)*image.width/3);x++)if(opaque(x,y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(right<left)throw Error('Empty character frame');frames.push({row,col,left,top,width:right-left+1,height:bottom-top+1});
   }
   const scale=Math.min(28/Math.max(...frames.map(f=>f.width)),40/Math.max(...frames.map(f=>f.height)));
   for(const f of frames){const w=Math.max(1,Math.round(f.width*scale)),h=Math.max(1,Math.round(f.height*scale));ctx.drawImage(image,f.left,f.top,f.width,f.height,f.col*32+Math.floor((32-w)/2),f.row*48+44-h,w,h);}
  }
  return canvas.toDataURL('image/png').split(',')[1];
 },{data:`data:image/png;base64,${readFileSync(input).toString('base64')}`,fit:process.argv.includes('--fit-frames')});
 writeFileSync(output,Buffer.from(png,'base64'));
}finally{await browser.close();}
