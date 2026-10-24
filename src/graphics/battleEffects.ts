import Phaser from 'phaser';
import type { BattleEvent } from '../game/battle';
interface Point {x:number;y:number}
/** Visual-only effects: deterministic geometry, no calls to the combat RNG. */
export function battleEffect(scene:Phaser.Scene,event:BattleEvent,enemyPoints:Point[],heroPoints:Point[]):number{
  if(!event.effect)return 100;
  const healing=['heal','revive','guard'].includes(event.effect);
  const targets=event.enemies.length?event.enemies.map(i=>enemyPoints[i]):event.heroes.map(i=>heroPoints[i]);
  const duration=event.effect==='void'?750:event.effect==='thunder'?550:450;
  const colors:Record<string,number>={thunder:0xffe287,water:0x74d8ff,heal:0x94efb4,revive:0xffe5a3,void:0xb29de5,guard:0xb8dded,hit:0xffe2b4,sweep:0xe4d3e9,flee:0xc4dfb9};
  const color=colors[event.effect]??0xffffff;
  if(!scene.textures.exists('combat-spark')){
    const pixel=scene.add.graphics();pixel.fillStyle(0xffffff).fillRect(0,0,3,3);pixel.generateTexture('combat-spark',3,3);pixel.destroy();
  }
  for(const point of targets){
    if(['thunder','water','heal','void','revive'].includes(event.effect)){
      const sigil=scene.add.graphics().setPosition(point.x,point.y+12).setDepth(59);
      sigil.lineStyle(2,color,.8).strokeEllipse(0,0,62,23).lineStyle(1,color,.55).strokeEllipse(0,0,74,30);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;sigil.fillStyle(color,.9).fillRect(Math.cos(a)*34-1,Math.sin(a)*13-1,3,3);}
      scene.tweens.add({targets:sigil,scaleX:1.6,scaleY:1.4,alpha:0,duration:duration+100,onComplete:()=>sigil.destroy()});
    }
    const g=scene.add.graphics().setPosition(point.x,point.y).setDepth(60);
    if(event.effect==='thunder'){
      for(let n=0;n<3;n++){
        g.lineStyle(n===0?5:2,n===0?0xffdf73:0xffffe7).beginPath().moveTo(n*6,-92);
        for(let y=-84;y<=8;y+=12)g.lineTo(Math.sin(y*.7+n)*13,y);
        g.strokePath();
      }
      scene.cameras.main.flash(120,255,238,174,false);
    }else if(event.effect==='void'){
      for(let i=0;i<15;i++)g.lineStyle(3,i%2?color:0x111728,.95).strokeEllipse(0,0,10+i*5,5+i*3);
      scene.tweens.add({targets:g,angle:130,scaleX:.1,scaleY:.1,duration});
      scene.cameras.main.shake(350,.008);
    }else if(event.effect==='water'){
      for(let i=0;i<9;i++)g.lineStyle(2+i%2,i%2?0xcef5ff:color,.85).beginPath().moveTo(-65,-30+i*7).lineTo(-12,-20+i*5).lineTo(35,-10+i*4).strokePath();
      scene.tweens.add({targets:g,x:point.x+20,y:point.y+6,duration});
    }else if(healing){
      for(let i=0;i<3;i++)g.lineStyle(2,color,.9-i*.2).strokeEllipse(0,i*4,26+i*13,12+i*7);
      for(let i=0;i<8;i++){const x=Math.sin(i*11)*27,y=Math.cos(i*5)*13;g.fillStyle(color).fillRect(x-1,y-5,3,10).fillRect(x-4,y-2,9,3);}
      scene.tweens.add({targets:g,y:point.y-20,duration});
    }else{
      for(let i=0;i<5;i++)g.lineStyle(3,color).lineBetween(-24+i*11,-22,10+i*3,25);
      if(event.effect==='sweep')scene.cameras.main.shake(240,.006);
    }
    scene.tweens.add({targets:g,alpha:0,duration,delay:80,onComplete:()=>g.destroy()});
    // Per-target particles; emitter lifetime is independent of scene time accounting.
    const particles=scene.add.particles(point.x,point.y,'combat-spark',{
      speed:{min:20,max:90},lifespan:duration,scale:{start:1.2,end:0},tint:color,emitting:false,
    }).setDepth(61);
    particles.explode(healing?16:24);
    scene.time.delayedCall(duration+100,()=>particles.destroy());
    if(event.amount&&(healing||targets.length===1)){const text=scene.add.text(point.x,point.y-20,healing?`+${event.amount}`:`${event.amount}`,{fontSize:'16px',fontFamily:'monospace',color:healing?'#b4ffcb':'#fff1c3',stroke:'#243443',strokeThickness:3}).setOrigin(.5).setDepth(70);scene.tweens.add({targets:text,y:point.y-45,alpha:0,duration:650,onComplete:()=>text.destroy()});}
  }
  return duration+100;
}
