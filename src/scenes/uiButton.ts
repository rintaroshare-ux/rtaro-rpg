import Phaser from 'phaser';
import {label} from './shared';
export function uiButton(scene:Phaser.Scene,x:number,y:number,width:number,height:number,text:string,action:()=>void,selected=false):Phaser.GameObjects.GameObject[]{
 const box=scene.add.rectangle(x,y,width,height,selected?0x526e71:0x244958).setDepth(1002).setStrokeStyle(1,selected?0xf1d18a:0x77988e).setInteractive({useHandCursor:true});box.on('pointerdown',action);
 return [box,label(scene,x-width/2+8,y,text,11,selected?'#ffe2a6':'#f4efdb').setOrigin(0,.5).setDepth(1003)];
}
