import Phaser from 'phaser';
import {heroes,spells,type EnemyId} from '../game/data';
import {Battle,type Command,type BattleEvent} from '../game/battle';
import {battleItems,bossPhases,combatEnemies,elementNames,type BattleItem,type Element} from '../game/combat/data';
import {state,restore,save,maxHp,maxMp} from '../game/state';
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
  constructor(){super('Battle')}
  create(data:{formation?:EnemyId[];kind?:EnemyId}):void{
    this.battle=new Battle(state,data.formation??[data.kind??'bear']);
    this.actor=null;this.command=0;this.target=0;this.itemIndex=0;this.selection='command';this.busy=false;this.result=false;
    this.stats=[];this.enemyLabels=[];this.images=[];this.points=[];
    this.cameras.main.setBackgroundColor(0x284857);
    const bg=this.add.graphics();
    for(let i=0;i<18;i++)bg.lineStyle(9,i%2?0x3c6672:0x365864,.5).strokeEllipse(320,105,60+i*51,15+i*19);
    label(this,15,12,'ATB BATTLE / VER.2',10,'#b6d9d0');
    this.modeText=label(this,622,12,'',10,'#e8d29a').setOrigin(1,0);
    this.heading=label(this,320,35,this.battle.boss?'モフモフキングが あらわれた！':'ぬいぐるみたちが あらわれた！',13,'#ffe3a0').setOrigin(.5);
    this.battle.foes.forEach((f,i)=>{
      const x=320+(i-(this.battle.foes.length-1)/2)*144,y=111;
      this.points.push({x,y});
      this.images.push(this.add.image(x,y,combatEnemies[f.kind].texture).setScale(f.kind==='king'?2.8:1.9));
      this.enemyLabels.push(label(this,x,151,'',10).setOrigin(.5,0));
    });
    panel(this,8,195,365,109);panel(this,379,195,253,109);panel(this,8,308,624,45);
    for(let i=0;i<state.party.length;i++)this.stats.push(label(this,18,204+i*24,'',10));
    this.bars=this.add.graphics().setDepth(1001);
    this.menuTitle=label(this,394,203,'ATBがたまるまで待機…',10,'#f1d39d');
    this.commands=label(this,394,223,'',11).setLineSpacing(5);
    this.log=label(this,20,316,'満タンの仲間から行動。Tでモード切替、Q/Eで行動する仲間を選択。',11).setWordWrapWidth(596).setLineSpacing(3);
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
    const duration=event.ok?battleEffect(this,event,this.points,state.party.map((_,i)=>({x:155,y:214+i*24}))):100;
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
      this.bars.fillStyle(0x142e39).fillRect(p.x-46,182,92,4).fillStyle(0xdda96e).fillRect(p.x-46,182,92*f.hp/def.hp,4);
      this.bars.fillStyle(0x192f3a).fillRect(p.x-46,189,92,2).fillStyle(0xb6cbd0).fillRect(p.x-46,189,92*this.battle.gauge('enemy',i),2);
    });
    state.party.forEach((m,i)=>{
      this.stats[i].setText(`${this.actor===i?'>':' '} ${heroes[m.id].name}\n   HP ${m.hp}/${maxHp(m)}  MP ${m.mp}/${maxMp(m)}${m.hp===0?' [戦闘不能]':''}`).setFontSize(9).setLineSpacing(0);
      const gauge=this.battle.gauge('hero',i),y=209+i*24;
      this.bars.fillStyle(0x122e38).fillRect(269,y,90,8).fillStyle(m.hp===0?0x677a7c:gauge>=1?0xffda80:0x7ebcbe).fillRect(269,y,90*gauge,8);
      this.bars.lineStyle(1,0x849c99).strokeRect(269,y,90,8);
    });
    const boss=this.battle.foes.find(f=>f.kind==='king');
    if(boss&&!this.result)this.heading.setText(`モフモフキング / 形態${boss.phase+1}「${bossPhases[boss.phase].name}」`);
    if(this.result){this.menuTitle.setText(this.battle.outcome==='win'?'VICTORY':this.battle.outcome==='escape'?'ESCAPED':'もう一度、挑もう');this.commands.setText('Z / ENTER で進む');return;}
    if(this.actor===null){this.menuTitle.setText('ATBがたまるまで待機…');this.commands.setText('速い仲間ほどゲージが早くたまる。\n防御で軽減・MP+3。\n道具で蘇生やMP回復もできます。');return;}
    this.menuTitle.setText(`${heroes[state.party[this.actor].id].name}の行動  [Q/E 仲間]`);
    if(this.selection==='command'){
      const spell=spells[heroes[state.party[this.actor].id].spell];
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
    this.actor=null;this.selection='command';this.refresh();
  }
  private end():void{
    this.result=true;this.actor=null;
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
