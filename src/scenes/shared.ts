import Phaser from 'phaser';
export const FONT='"Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';
export function label(s:Phaser.Scene,x:number,y:number,text:string,size=12,color='#fff5dc'){return s.add.text(x,y,text,{fontFamily:FONT,fontSize:size,color,lineSpacing:6}).setDepth(1000)}
export function panel(s:Phaser.Scene,x:number,y:number,w:number,h:number){const g=s.add.graphics().setDepth(999);g.fillStyle(0x183746,0.97).fillRoundedRect(x,y,w,h,5);g.lineStyle(2,0xe5d9b4).strokeRoundedRect(x+3,y+3,w-6,h-6,3);return g}
export function confirmKey(e:KeyboardEvent){return e.code==='KeyZ'||e.code==='Enter'}
export function cancelKey(e:KeyboardEvent){return e.code==='KeyX'||e.code==='Escape'}
export function bind(s:Phaser.Scene,fn:(e:KeyboardEvent)=>void){s.input.keyboard?.on('keydown',fn);s.events.once('shutdown',()=>s.input.keyboard?.off('keydown',fn))}
