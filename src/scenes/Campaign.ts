import {fieldTrack} from '../audio/tracks';
import Phaser from 'phaser';
import {state,save,restore} from '../game/state';
import {type EnemyId,type MapId} from '../game/data';
import {chapters,chapterFor,type Quest} from '../game/campaignData';
import {completeQuest,questFlag,gateReady,won,enterChapter,campaignFormation,deliver} from '../game/campaign';
import {claimTreasure} from '../game/treasure';
import {StepEncounters} from '../game/encounters';
import {touchDirections} from '../input/touch';
import type {MobileMenu} from '../input/mobileMenu';
import {PartyView} from '../graphics/partyView';
import {idleFrame,CHARACTER_ORIGIN_Y,TILESET_KEY} from '../graphics/spec';
import {bind,confirmKey,cancelKey,label,panel} from './shared';
import {music} from '../audio/music';
interface Node {id:string;x:number;y:number;name:string;texture:string;run:()=>void}
export class Campaign extends Phaser.Scene{
 private player!:Phaser.Physics.Arcade.Sprite;private party!:PartyView;private keys!:Record<string,Phaser.Input.Keyboard.Key>;
 private nodes:Node[]=[];private ui:Phaser.GameObjects.GameObject[]=[];private hud!:Phaser.GameObjects.Text;private hint!:Phaser.GameObjects.Text;
 private mode:'walk'|'talk'|'choice'|'menu'='walk';private lines:string[]=[];private after?:()=>void;private actions:{label:string;run:()=>void}[]=[];private index=0;private choiceTitle='';private changing=false;
 private meter=new StepEncounters();private last={x:0,y:0};
 constructor(){super('Campaign');}
 create(data:{notice?:string}={}):void{
  const c=chapterFor(state.map);if(!c){this.scene.start('Field');return;}
  this.mode='walk';this.ui=[];this.nodes=[];this.changing=false;this.meter=new StepEncounters();music.setTrack(fieldTrack(state.map));
  const dungeon=state.map===c.dungeon;this.cameras.main.setBackgroundColor(c.color);this.physics.world.setBounds(32,80,896,420);
  const tilemap=this.make.tilemap({tileWidth:32,tileHeight:32,width:30,height:17}),tiles=tilemap.addTilesetImage(TILESET_KEY,TILESET_KEY,32,32)!;
  const layer=tilemap.createBlankLayer('journey-floor',tiles)!;const winter=chapters.indexOf(c)===2;const floor=c.id==='norway'?0:3;
  for(let y=0;y<17;y++)for(let x=0;x<30;x++)layer.putTileAt(y>=10&&y<=12?4:floor,x,y);layer.setDepth(-20);if(winter)layer.setTint(0xd8edff);
  const g=this.add.graphics().setDepth(-10),blocks=this.physics.add.staticGroup();
  const wall=(x:number,y:number,w:number,h:number)=>{g.fillStyle(dungeon?0x526878:0x708d9b).fillRect(x,y,w,h).fillStyle(0xc6d5d4).fillRect(x,y,w,5);const r=this.add.rectangle(x+w/2,y+h/2,w,h,0,0);this.physics.add.existing(r,true);blocks.add(r);};
  wall(32,70,896,25);for(let i=0;i<8;i++)g.fillStyle(c.id==='sky'?0xb9eaff:0xe6e4bc).fillRect(100+i*100,105,45,24);
  if(dungeon){wall(320,175,32,140);wall(615,200,32,115);wall(240,440,100,25);wall(670,440,90,25);}else{wall(340,170,90,45);wall(600,175,70,40);}
  if(c.id==='sky'){for(let i=0;i<12;i++)g.fillStyle(0xe7f6ff,.7).fillRoundedRect(35+i*78,465+i%2*8,64,25,9);}
  if(c.id==='norway')g.fillStyle(0x75aabb).fillRect(40,450,160,32);
  this.player=this.physics.add.sprite(state.x,state.y,'rintaro',idleFrame('down')).setOrigin(.5,CHARACTER_ORIGIN_Y).setSize(16,12).setOffset(8,36).setCollideWorldBounds(true);this.physics.add.collider(this.player,blocks);this.party=new PartyView(this,state.party,this.player);this.last={x:this.player.x,y:this.player.y};
  this.cameras.main.setBounds(0,0,960,540).startFollow(this.player,true,.12,.12);this.cameras.main.fadeIn(180);
  const add=(node:Node)=>{this.nodes.push(node);const image=this.add.image(node.x,node.y,node.texture).setOrigin(.5,.75).setDepth(node.y);if(['rintaro','marmot','fugu','vanilla'].includes(node.texture))image.setFrame(idleFrame('down'));if(node.id==='boss')image.setDisplaySize(48,48);label(this,node.x,node.y-45,node.name,9,'#203d4a').setOrigin(.5).setDepth(node.y);};
  for(const q of c.quests.filter(q=>q.map===state.map))add({id:q.id,x:q.x,y:q.y,name:(state.flags.includes(questFlag(q.id))?'✓ ':'')+q.name,texture:q.texture,run:()=>this.quest(q)});
  add({id:'rest',x:110,y:450,name:'休憩所・無料回復',texture:'bed',run:()=>{restore();state.bowls=Math.max(state.bowls,2);state.inventory.ether=Math.max(state.inventory.ether,2);this.dialog(['ひと休み。HPとMPが全回復した。','必要な回復物資も補充した。いつでも何度でも利用できるよ。'],()=>this.persist());}});
  add({id:'shop',x:110,y:285,name:'旅の売店',texture:'merchant',run:()=>this.choose('売店',[{label:'道具を買う・売る',run:()=>this.overlay('Shop',{kind:'items'})},{label:'装備を買う・売る',run:()=>this.overlay('Shop',{kind:'equipment'})},{label:'やめる',run:()=>this.walk()}])});
  const chestId=`journey-${state.map}`,opened=state.flags.includes(`chest:${chestId}`);add({id:'treasure',x:845,y:450,name:opened?'開いた宝箱':'旅の宝箱',texture:opened?'chestOpen':'chest',run:()=>{const ok=claimTreasure(state,{x:0,y:0,name:'宝箱',texture:'chest',event:'chest',chestId,reward:{money:90,ether:2,bowls:2},lines:[]});this.dialog([ok?'90G、海鮮丼2個、潮風ソーダ2本を見つけた！':'宝箱は空っぽだ。'],()=>this.persist(()=>this.scene.restart()));}});
  if(dungeon){
   add({id:'mid',x:430,y:190,name:won(state,c.mid)?'中ボス：解決済み':'道をふさぐ中ボス',texture:c.texture,run:()=>{if(won(state,c.mid)){this.dialog(['道はもう開いているよ。']);return;}if(!state.flags.includes(questFlag(c.quests[3].id))){this.dialog(['最初の仕掛けの手がかりを解決しよう。']);return;}this.dialog(['この先は通さないぞ！','R太郎：でも、パパに届けたいものがあるんだ。'],()=>this.battle([c.mid as EnemyId]));}});
   add({id:'boss',x:800,y:185,name:won(state,c.boss)?'章の問題：解決済み':c.boss==='dad'?'仕事に取り憑かれたパパ':'この章のボス',texture:c.boss==='dad'?'dad':c.texture,run:()=>{if(won(state,c.boss)){this.dialog(['ありがとう。もう先へ進めるよ！']);return;}if(!won(state,c.mid)||!gateReady(state,true)){this.dialog(['まだ準備が整っていない。','仕掛けを三つ解き、中ボスを越えてから挑もう。']);return;}this.dialog(c.boss==='dad'?['パパ：この会議を終えないと……次の会議が……。','R太郎：パパ、ぼくだよ！ ひとりで全部背負わないで！']:['最後の番人が立ちはだかった！','仲間と力を合わせて、この章の問題を解決しよう。'],()=>this.battle([c.boss as EnemyId]));}});
  }
  add({id:'next',x:885,y:370,name:dungeon?'次の章へ →':'ダンジョンへ →',texture:'bell',run:()=>{if(!dungeon){if(!gateReady(state)){this.dialog(['町の三人を手伝って、手がかりをそろえよう。']);return;}this.move(c.dungeon);return;}if(!won(state,c.boss)){this.dialog(['この章のボスを倒してから先へ進もう。']);return;}if(c.boss==='dad')music.setTrack('emotion');this.dialog(c.farewell,()=>{if(c.boss==='dad'){deliver(state);this.persist(()=>this.scene.start('Ending'));}else{enterChapter(state,chapters.indexOf(c)+1);this.changing=true;this.persist(()=>this.scene.restart());}});}});
  add({id:'back',x:55,y:370,name:'← 引き返す',texture:'bell',run:()=>{if(dungeon)this.move(c.field);else{const i=chapters.indexOf(c);if(i>0){enterChapter(state,i-1);this.changing=true;this.persist(()=>this.scene.restart());}else this.scene.start('Clear');}}});
  panel(this,8,7,624,54).setScrollFactor(0);this.hud=label(this,18,14,'',10).setScrollFactor(0);this.hint=label(this,320,339,'',11).setOrigin(.5).setScrollFactor(0).setShadow(1,1,'#183746',2);this.keys=this.input.keyboard!.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D') as Record<string,Phaser.Input.Keyboard.Key>;bind(this,e=>this.key(e));
  if(data.notice)this.dialog([data.notice]);else if(!state.flags.includes(`arrival:${c.id}`)){state.flags.push(`arrival:${c.id}`);this.dialog(c.arrival,()=>this.persist());}
 }
 saveAnywhere(automatic=false):boolean{if(!this.changing){state.x=this.player.x;state.y=this.player.y;}state.resumeBattle=null;return save(automatic);}
 private persist(after?:()=>void):void{if(this.saveAnywhere())after?.();else this.dialog(['保存できませんでした。ゲームは続けられます。'],after);}
 private clearUi():void{this.ui.forEach(o=>o.destroy());this.ui=[];}
 private walk():void{this.mode='walk';this.clearUi();}
 private dialog(lines:string[],after?:()=>void):void{this.clearUi();this.mode='talk';this.lines=[...lines];this.after=after;this.drawDialog();}
 private drawDialog():void{this.clearUi();this.ui.push(panel(this,15,224,610,120).setScrollFactor(0),label(this,32,242,this.lines[0]??'',13).setWordWrapWidth(570).setScrollFactor(0),label(this,580,319,'決定 →',10).setScrollFactor(0));}
 private next():void{this.lines.shift();if(this.lines.length)this.drawDialog();else{const after=this.after;this.after=undefined;this.walk();after?.();}}
 private choose(title:string,actions:{label:string;run:()=>void}[]):void{this.clearUi();this.mode='choice';this.actions=actions;this.index=0;this.choiceTitle=title;this.drawChoices();}
 private drawChoices():void{this.clearUi();this.ui.push(panel(this,25,185,590,157).setScrollFactor(0),label(this,42,199,this.choiceTitle,12).setWordWrapWidth(555).setScrollFactor(0));this.actions.forEach((a,i)=>{const y=238+i*25;const text=label(this,45,y,`${i===this.index?'>':' '} ${a.label}`,12).setScrollFactor(0).setInteractive({useHandCursor:true}).on('pointerdown',()=>a.run());this.ui.push(text);});}
 private quest(q:Quest):void{if(q.id==='promise')music.setTrack('emotion');if(state.flags.includes(questFlag(q.id))){this.dialog(['もう解決したね。ありがとう！']);return;}if(q.requires?.some(id=>!state.flags.includes(questFlag(id)))){this.dialog(['先にほかの人の話を聞いて、手がかりを集めよう。']);return;}this.dialog(q.lines,()=>this.choose('どうしよう？',q.choices.map((text,i)=>({label:text,run:()=>{const result=completeQuest(state,q,i);this.dialog([result.text],()=>result.ok?this.persist(()=>this.scene.restart()):this.walk());}}))));}
 private menu():void{this.choose('旅のメニュー',[{label:'どうぐ・装備',run:()=>this.overlay('Inventory')},{label:'セーブする',run:()=>this.dialog([this.saveAnywhere()?'保存しました。':'保存できませんでした。'])},{label:'旅の手がかり',run:()=>{const c=chapterFor(state.map)!;this.dialog(c.quests.filter(q=>!state.flags.includes(questFlag(q.id))).map(q=>`${q.name}：${q.lines[0]}`).slice(0,4));}},{label:'タイトルへ',run:()=>this.scene.start('Title')}]);}
 private overlay(scene:'Shop'|'Inventory',data?:{kind:'items'|'equipment'}):void{this.walk();this.player.setVelocity(0);state.x=this.player.x;state.y=this.player.y;this.scene.launch(scene,data);this.scene.pause();}
 private move(map:MapId):void{this.changing=true;state.map=map;state.x=130;state.y=370;this.persist(()=>this.scene.restart());}
 private battle(ids:EnemyId[]):void{if(this.changing)return;this.changing=true;state.x=this.player.x;state.y=this.player.y;state.resumeBattle=null;this.player.setVelocity(0);this.scene.start('Battle',{formation:ids});}
 private nearby():Node|undefined{return this.nodes.find(n=>Phaser.Math.Distance.Between(n.x,n.y,this.player.x,this.player.y)<58);}
 private key(e:KeyboardEvent):void{if(e.repeat)return;if(this.mode==='talk'){if(confirmKey(e)||cancelKey(e))this.next();return;}if(this.mode==='choice'){if(cancelKey(e)){this.walk();return;}if(['ArrowUp','KeyW','ArrowDown','KeyS'].includes(e.code)){this.index=(this.index+(['ArrowUp','KeyW'].includes(e.code)?this.actions.length-1:1))%this.actions.length;this.drawChoices();}if(confirmKey(e))this.actions[this.index]?.run();return;}if(cancelKey(e)){this.menu();return;}if(confirmKey(e))this.nearby()?.run();}
 getMobileMenu():MobileMenu|null{if(this.mode==='talk')return {key:'Campaign:talk',kind:'dialogue',title:chapterFor(state.map)!.title,description:this.lines[0],actions:[{id:'continue',label:'つぎへ',run:()=>this.next()}]};if(this.mode==='choice')return {key:'Campaign:choice:'+this.choiceTitle,kind:'screen',title:this.choiceTitle,back:()=>this.walk(),actions:this.actions.map((a,i)=>({id:`choice-${i}`,label:a.label,selected:this.index===i,run:a.run}))};return null;}
 update(_time:number,delta:number):void{if(!this.player)return;this.player.setVelocity(0);const c=chapterFor(state.map)!;this.hud?.setText(`${c.title}\n解決 ${c.quests.filter(q=>state.flags.includes(questFlag(q.id))).length}/6 / ${state.money}G / メニュー：X`);if(this.mode!=='walk'||this.changing){this.player.anims.stop();this.party.stop();return;}let x=0,y=0;if(this.keys.LEFT.isDown||this.keys.A.isDown||touchDirections.left)x--;if(this.keys.RIGHT.isDown||this.keys.D.isDown||touchDirections.right)x++;if(this.keys.UP.isDown||this.keys.W.isDown||touchDirections.up)y--;if(this.keys.DOWN.isDown||this.keys.S.isDown||touchDirections.down)y++;this.player.setVelocity(x*115,y*115);if(x&&y)this.player.body?.velocity.normalize().scale(115);if(x||y)this.player.play(`rintaro:walk:${x<0?'left':x>0?'right':y<0?'up':'down'}`,true);else{this.player.anims.stop();this.player.setFrame(idleFrame('down'));}this.player.setDepth(this.player.y);this.party.update(this.player,delta);const node=this.nearby();this.hint.setText(node?`決定：${node.name}`:'道の上は安全 / 決定で話す / Xでメニュー');const moved=Math.hypot(this.player.x-this.last.x,this.player.y-this.last.y);this.last={x:this.player.x,y:this.player.y};state.x=this.player.x;state.y=this.player.y;const danger=state.map===c.dungeon&&(this.player.y<250||this.player.y>420)&&!this.nodes.some(n=>Phaser.Math.Distance.Between(n.x,n.y,this.player.x,this.player.y)<75);if(this.meter.move(moved,danger))this.battle(campaignFormation(state) as EnemyId[]);}
}
