import Phaser from 'phaser';
import {heroes,spells,type EnemyId} from '../game/data';
import {Battle,type Command,type BattleEvent} from '../game/battle';
import {battleItems,bossPhases,combatEnemies,elementNames,type BattleItem,type Element} from '../game/combat/data';
import {state,restore,save,maxHp,maxMp} from '../game/state';
import {music} from '../audio/music';
import {partyPoint,enemyPoint} from '../graphics/battleLayout';
import {idleFrame} from '../graphics/spec';
import {battleEffect} from '../graphics/battleEffects';
import {bind,cancelKey,confirmKey,label,panel} from './shared';
const COMMANDS:Command[]=['attack','magic','item','guard','flee'];
const ITEMS:BattleItem[]=['bowl','ether','revive'];
type Selection='command'|'enemy'|'item'|'ally';
export class BattleScene extends Phaser.Scene{
  private battle!:Battle;
  private actor:number|null=null;
  private command=0;
  private target=0;
  private itemIndex=0;
  private selection:Selection='command';
  private busy=false;
  private result=false;
  private heading!:Phaser.GameObjects.Text;
  private log!:Phaser.GameObjects.Text;
  private menuTitle!:Phaser.GameObjects.Text;
  private commands!:Phaser.GameObjects.Text;
  private modeText!:Phaser.GameObjects.Text;
  private stats:Phaser.GameObjects.Text[]=[];
  private enemyLabels:Phaser.GameObjects.Text[]=[];
  private images:Phaser.GameObjects.Image[]=[];
  private bars!:Phaser.GameObjects.Graphics;
  private points:{x:number;y:number}[]=[];
  private partySprites:Phaser.GameObjects.Sprite[]=[];
  private menuRows:Phaser.GameObjects.Rectangle[]=[];
  private rowLabels:Phaser.GameObjects.Text[]=[];
  private pendingHero:number|null=null;
  constructor(){super('Battle')}
  create(data:{formation?:EnemyId[];kind?:EnemyId}):void{
    this.battle=new Battle(state,data.formation??[data.kind??'bear']);
    music.setTrack(this.battle.boss?'boss':'battle');document.body.classList.add('battle-screen');this.events.once('shutdown',()=>document.body.classList.remove('battle-screen'));
    this.actor=null;this.command=0;this.target=0;this.itemIndex=0;this.selection='command';this.busy=false;this.result=false;
    this.stats=[];this.enemyLabels=[];this.images=[];this.points=[];this.partySprites=[];this.menuRows=[];this.rowLabels=[];this.pendingHero=null;
    this.cameras.main.setBackgroundColor(0x90b4bb);
    const bg=this.add.graphics();
    bg.fillStyle(0x709695).fillRect(0,69,640,61);
    for(let i=0;i<18;i++){bg.fillStyle(i%2?0x66898a:0x779b96).fillRect(i*39,57-i%3*12,29,72);bg.fillStyle(0xa2bab0).fillRect(i*39+6,64-i%3*12,5,8);}
    bg.fillStyle(0x567d66).fillRect(0,115,640,91).fillStyle(0x75906b).fillRect(0,136,640,70);
    for(let y=148;y<206;y+=10)for(let x=0;x<640;x+=27)bg.fillStyle((x+y)%3?0x68845f:0x93a67a).fillRect(x+(y%3)*3,y,9,2);
    bg.fillStyle(0x263e4a,.9).fillRect(0,0,640,48);
    label(this,15,12,'ATB BATTLE / VER.2',10,'#b6d9d0');
    this.modeText=label(this,622,12,'',10,'#e8d29a').setOrigin(1,0);
    this.heading=label(this,320,35,this.battle.boss?'モフモフキングが あらわれた！':'ぬいぐるみたちが あらわれた！',13,'#ffe3a0').setOrigin(.5);
    this.battle.foes.forEach((f,i)=>{
      const {x,y}=enemyPoint(i,this.battle.foes.length);
      this.points.push({x,y});
      this.images.push(this.add.image(x,y,combatEnemies[f.kind].texture).setScale(f.kind==='king'?2.7:1.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.tapEnemy(i)));
      this.enemyLabels.push(label(this,x,y+(f.kind==='king'?39:23),'',8).setOrigin(.5,0).setLineSpacing(0));
    });
    state.party.forEach((m,i)=>{
      const point=partyPoint(i);
      const sprite=this.add.sprite(point.x,point.y,m.id,idleFrame('left')).setDepth(30+i).setInteractive({useHandCursor:true});
      sprite.on('pointerdown',()=>this.tapAlly(i));this.partySprites.push(sprite);
      this.add.ellipse(point.x,point.y+21,30,7,0x213e45,.3).setDepth(29);
    });
    panel(this,8,211,235,99);panel(this,248,211,384,99);panel(this,8,314,624,40);
    for(let i=0;i<state.party.length;i++)this.stats.push(label(this,260,218+i*22,'',10));
    this.bars=this.add.graphics().setDepth(1001);
    this.menuTitle=label(this,18,218,'ATBがたまるまで待機…',10,'#f1d39d');
    this.commands=label(this,18,240,'',10).setLineSpacing(5);
    this.log=label(this,20,320,'敵は左、仲間は右。満タンの仲間を選んで行動！',10).setWordWrapWidth(596).setLineSpacing(2);
    this.modeText.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.key(new KeyboardEvent('keydown',{code:'KeyT'})));
    for(let i=0;i<5;i++){
      const row=this.add.rectangle(0,0,104,22,0x284c5b).setDepth(1003).setStrokeStyle(1,0x71918e).setInteractive({useHandCursor:true});
      row.on('pointerdown',()=>this.tapRow(i));this.menuRows.push(row);
      this.rowLabels.push(label(this,0,0,'',11).setOrigin(0,.5).setDepth(1004));
    }
    bind(this,e=>this.key(e));this.refresh();
  }
  update(_time:number,delta:number):void{
    if(this.result||this.busy||document.hidden)return;
    if(this.battle.outcome){this.end();return;}
    this.battle.tick(Math.min(delta,100),this.actor!==null);
    const event=this.battle.resolveNext();
    if(event){this.present(event);return;}
    this.chooseActor();this.refresh();
  }
  private chooseActor():void{
    const ready=this.battle.readyHeroes;
    if(this.actor===null||!ready.includes(this.actor)){
      this.actor=ready[0]??null;this.selection='command';this.command=0;this.target=0;
    }
  }
  private present(event:BattleEvent):void{
    this.busy=true;this.log.setText(event.text);
    if(this.actor!==null&&!this.battle.readyHeroes.includes(this.actor))this.actor=null;
    const duration=event.ok?battleEffect(this,event,this.points,state.party.map((_,i)=>partyPoint(i))):100;
    this.animateParty(event,duration);
    this.refresh();
    this.time.delayedCall(duration,()=>{
      this.busy=false;
      if(this.battle.outcome)this.end();else{this.chooseActor();this.refresh();}
    });
  }
  private refresh():void{
    this.modeText.setText(`${state.atbMode==='wait'?'ウェイト':'アクティブ'} [T 切替]`);
    this.bars.clear();
    this.battle.foes.forEach((f,i)=>{
      const p=this.points[i],def=combatEnemies[f.kind];
      this.images[i].setAlpha(f.hp>0?1:.15);
      this.enemyLabels[i].setText(`${this.selection==='enemy'&&this.target===i?'> ':''}${def.name}\nHP ${f.hp}/${def.hp}`);
      this.bars.fillStyle(0x142e39).fillRect(p.x-42,p.y+(f.kind==='king'?68:42),84,4).fillStyle(0xdda96e).fillRect(p.x-42,p.y+(f.kind==='king'?68:42),84*f.hp/def.hp,4);
      this.bars.fillStyle(0x192f3a).fillRect(p.x-42,p.y+(f.kind==='king'?74:47),84,2).fillStyle(0xb6cbd0).fillRect(p.x-42,p.y+(f.kind==='king'?74:47),84*this.battle.gauge('enemy',i),2);
    });
    state.party.forEach((m,i)=>{
      this.stats[i].setText(`${this.actor===i?'>':' '} ${heroes[m.id].name}\n   HP ${m.hp}/${maxHp(m)}  MP ${m.mp}/${maxMp(m)}${m.hp===0?' [戦闘不能]':''}`).setFontSize(9).setLineSpacing(0);
      const gauge=this.battle.gauge('hero',i),y=221+i*22;
      const sprite=this.partySprites[i];if(m.hp===0){sprite.setAngle(90).setAlpha(.45).setTint(0x849298).setData('dead',true);}else if(sprite.getData('dead')){sprite.setAngle(0).setAlpha(1).clearTint().setData('dead',false);}
      if(this.actor===i&&m.hp>0){const p=partyPoint(i);this.bars.fillStyle(0xffdf87).fillTriangle(p.x-32,p.y-5,p.x-32,p.y+5,p.x-23,p.y);}
      this.bars.fillStyle(0x122e38).fillRect(541,y,78,8).fillStyle(m.hp===0?0x677a7c:gauge>=1?0xffda80:0x7ebcbe).fillRect(541,y,78*gauge,8);
      this.bars.lineStyle(1,0x849c99).strokeRect(541,y,78,8);
    });
    const boss=this.battle.foes.find(f=>f.kind==='king');
    if(boss&&!this.result)this.heading.setText(`モフモフキング / 形態${boss.phase+1}「${bossPhases[boss.phase].name}」`);
    this.refreshRows();
    if(this.result){this.menuTitle.setText(this.battle.outcome==='win'?'VICTORY':this.battle.outcome==='escape'?'ESCAPED':'もう一度、挑もう');this.commands.setText('Z / ENTER で進む');return;}
    if(this.actor===null){this.menuTitle.setText('ATBがたまるまで待機…');this.commands.setText('速い仲間ほどゲージが早くたまる。\n防御で軽減・MP+3。\n道具で蘇生やMP回復もできます。');return;}
    this.menuTitle.setText(`${heroes[state.party[this.actor].id].name}の行動  [Q/E 仲間]`);
    if(this.selection==='command'){
      const spell=spells[heroes[state.party[this.actor].id].spell];
      if(this.command===1)this.menuTitle.setText(`${heroes[state.party[this.actor].id].name}：${spell.name} MP${spell.cost}`);
      const names=['攻撃',`${spell.name} MP${spell.cost}`,'アイテム','防御 / MP+3','逃げる'];
      this.commands.setFontSize(11).setText(names.map((name,i)=>`${i===this.command?'>':' '} ${name}`).join('\n')).setLineSpacing(2);
    }else if(this.selection==='item')this.commands.setText(ITEMS.map((item,i)=>`${this.itemIndex===i?'>':' '} ${battleItems[item].name} ×${this.battle.count(item)}`).join('\n')+'\nX：戻る').setLineSpacing(4);
    else if(this.selection==='ally')this.commands.setText(state.party.map((m,i)=>`${i===this.target?'>':' '} ${heroes[m.id].name}${m.hp<=0?' [戦闘不能]':''}`).join('\n')).setLineSpacing(3);
    else{
      this.commands.setText(this.battle.foes.map((f,i)=>`${this.target===i?'>':' '} ${combatEnemies[f.kind].name}${f.hp<=0?' [倒した]':''}`).join('\n')).setLineSpacing(3);
      const f=this.battle.foes[this.target];
      if(f){const info=(['lightning','water','dark'] as Element[]).map(element=>`${elementNames[element]}${this.battle.resistance(this.target,element)>1?'弱':this.battle.resistance(this.target,element)<1?'耐':'−'}`).join(' / ');this.menuTitle.setText(`対象選択  ${info}`);}
    }
  }
  private refreshRows():void{
    const active=this.actor!==null&&!this.busy;
    this.commands.setVisible(!active&&!this.result);
    const names=this.result?['続ける / 決定']:this.selection==='command'?['攻撃','魔法','アイテム','防御','逃げる']:this.selection==='item'?ITEMS.map(item=>`${battleItems[item].name} ×${this.battle.count(item)}`):this.selection==='ally'?state.party.map(m=>`${heroes[m.id].name}${m.hp===0?' [戦闘不能]':''}`):this.battle.foes.map(f=>`${combatEnemies[f.kind].name} ${f.hp===0?'[倒した]':''}`);
    this.menuRows.forEach((row,i)=>{
      const visible=(active||this.result)&&i<names.length;row.setVisible(visible);this.rowLabels[i].setVisible(visible);if(!visible)return;
      const grid=this.selection==='command'&&!this.result;
      const x=grid?18+(i%2)*110:18,y=this.result?265:grid?246+Math.floor(i/2)*24:244+i*18;
      const w=grid?104:214,h=this.result?32:grid?22:17;
      row.setPosition(x+w/2,y).setSize(w,h);
      // Rectangle hit areas are local to its top-left display bounds.
      if(row.input)row.input.hitArea.setTo(0,0,w,h);
      const selected=(this.selection==='command'?this.command:this.selection==='item'?this.itemIndex:this.target)===i;
      row.setFillStyle(selected?0x526b71:0x244958).setStrokeStyle(1,selected?0xf0d28f:0x64898c);
      this.rowLabels[i].setPosition(x+7,y).setText(names[i]).setFontSize(grid?11:10).setColor(selected?'#ffe3a5':'#f0ead5');
    });
  }
  private tapRow(index:number):void{
    if(this.busy)return;if(this.result){this.finish();return;}if(this.actor===null)return;
    if(this.selection==='command')this.command=index;else if(this.selection==='item')this.itemIndex=index;else this.target=index;
    this.key(new KeyboardEvent('keydown',{code:'Enter'}));
  }
  private tapEnemy(index:number):void{
    if(this.busy||this.result||this.selection!=='enemy'||this.battle.foes[index].hp<=0)return;
    this.target=index;this.key(new KeyboardEvent('keydown',{code:'Enter'}));
  }
  private tapAlly(index:number):void{
    if(this.busy||this.result)return;
    if(this.selection==='ally'){this.target=index;this.key(new KeyboardEvent('keydown',{code:'Enter'}));}
    else if(this.battle.readyHeroes.includes(index)){this.actor=index;this.selection='command';this.command=0;this.refresh();}
  }
  private animateParty(event:BattleEvent,duration:number):void{
    if(!event.ok)return;
    const heroAction=event.enemies.length>0||['heal','revive','guard','flee'].includes(event.effect??'');
    if(heroAction&&this.pendingHero!==null){
      const index=this.pendingHero,sprite=this.partySprites[index],p=partyPoint(index);this.pendingHero=null;
      if(sprite&&state.party[index].hp>0){sprite.play(`${sprite.texture.key}:walk:left`);this.tweens.add({targets:sprite,x:p.x-22,duration:Math.floor(duration/2),yoyo:true,onComplete:()=>{sprite.setX(p.x);sprite.anims.stop();sprite.setFrame(idleFrame('left'));}});}
    }
    if(!heroAction)for(const index of event.heroes){const sprite=this.partySprites[index];if(!sprite)continue;sprite.setTint(0xffa49c);this.time.delayedCall(180,()=>{if(state.party[index].hp>0)sprite.clearTint();});}
  }
  private key(e:KeyboardEvent):void{
    if(e.repeat)return;
    if(e.code==='KeyT'&&!this.result){state.atbMode=state.atbMode==='wait'?'active':'wait';this.refresh();return;}
    if(this.busy)return;
    if(this.result){if(confirmKey(e))this.finish();return;}
    if(this.actor===null)return;
    if(['KeyQ','KeyE'].includes(e.code)){
      const ready=this.battle.readyHeroes,index=ready.indexOf(this.actor);
      this.actor=ready[(index+(e.code==='KeyQ'?ready.length-1:1))%ready.length]??null;
      this.selection='command';this.command=0;this.refresh();return;
    }
    if(cancelKey(e)){this.selection=this.selection==='ally'?'item':'command';this.refresh();return;}
    const previous=['ArrowUp','ArrowLeft','KeyW','KeyA'].includes(e.code),next=['ArrowDown','ArrowRight','KeyS','KeyD'].includes(e.code);
    if(previous||next){
      const n=this.selection==='command'?5:this.selection==='item'?ITEMS.length:this.selection==='ally'?state.party.length:this.battle.foes.length;
      const current=this.selection==='command'?this.command:this.selection==='item'?this.itemIndex:this.target;
      const value=(current+(previous?n-1:1))%n;
      if(this.selection==='command')this.command=value;else if(this.selection==='item')this.itemIndex=value;else this.target=value;
      this.refresh();return;
    }
    if(!confirmKey(e))return;
    if(this.selection==='command'){
      const command=COMMANDS[this.command];
      if(command==='attack'||(command==='magic'&&heroes[state.party[this.actor].id].spell!=='heal')){this.selection='enemy';this.target=this.battle.foes.findIndex(f=>f.hp>0);this.refresh();return;}
      if(command==='item'){this.selection='item';this.itemIndex=0;this.refresh();return;}
    }else if(this.selection==='item'){this.selection='ally';this.target=this.actor;this.refresh();return;}
    const result=this.battle.submit(this.actor,COMMANDS[this.command],this.target,ITEMS[this.itemIndex]);
    if(!result.ok){this.log.setText(result.text);return;}
    this.pendingHero=this.actor;this.actor=null;this.selection='command';this.refresh();
  }
  private end():void{
    this.result=true;this.actor=null;music.setTrack(this.battle.outcome==='win'?'victory':this.battle.outcome==='lose'?'defeat':'field');
    if(this.battle.outcome==='win'){
      const reward=this.battle.reward()!;
      this.heading.setText('ぬいぐるみは おとなしくなった！');
      const drops=Object.entries(reward.drops).map(([item,count])=>`${battleItems[item as BattleItem].name}×${count}`).join('・');
      this.log.setText(`EXP ${reward.xp} / ${reward.money}G / ${drops}\n${reward.levels.join(' / ')||'みんなの勇気が、少し大きくなった。'}`).setFontSize(10);
    }else this.log.setText(this.battle.outcome==='escape'?'安全に逃げきった。少し歩くまでは敵が出にくくなります。':'全員が戦闘不能になった…。自宅で全回復してやり直せます。');
    this.refresh();
  }
  private finish():void{
    if(this.battle.outcome==='lose'){
      restore();state.map='home';state.x=260;state.y=330;state.bowls=Math.max(3,state.bowls);state.inventory.revive=Math.max(1,state.inventory.revive);state.inventory.ether=Math.max(1,state.inventory.ether);
    }
    if(this.battle.outcome==='win'&&this.battle.boss){
      state.flags=[...new Set([...state.flags,'ticket','clear'])];restore();this.scene.start('Clear');return;
    }
    const saved=save();this.scene.start('Field',{notice:saved?undefined:'セーブできませんでした。ブラウザの保存設定をご確認ください。進行は続けられます。'});
  }
}
