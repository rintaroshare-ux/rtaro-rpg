import {music} from '../audio/music';
import {fieldTrack} from '../audio/tracks';
import {isJourneyMap} from '../game/campaignData';
import type {MobileMenu,MobileAction} from '../input/mobileMenu';
import Phaser from 'phaser';
import {state,save} from '../game/state';
import {stats} from '../game/economy/stats';
import {count,equip,useItem} from '../game/economy/model';
import {gear,consumables,slotNames,type Gear,type GearId,type GearSlot,type ConsumableId} from '../game/economy/catalog';
import {heroes} from '../game/data';
import {bind,cancelKey,confirmKey,label,panel} from './shared';
import {uiButton} from './uiButton';
const ITEMS:ConsumableId[]=['bowl','deluxe','ether','revive'];const SLOTS:GearSlot[]=['weapon','armor','accessory'];
export class Inventory extends Phaser.Scene{
 private tab:'items'|'equipment'='items';private hero=0;private slot=0;private index=0;private notice='Q/E：仲間 / T：道具・装備 / ↑↓：品物 / ←→：装備枠';private ui:Phaser.GameObjects.GameObject[]=[];
 constructor(){super('Inventory')}
 create():void{this.tab='items';this.hero=0;this.slot=0;this.index=0;this.ui=[];this.notice='道具を選び、使う仲間を選んで決定。装備は「装備」タブから。';this.draw();bind(this,e=>this.key(e));}
 saveAnywhere(automatic=false):boolean{return save(automatic);}
 getMobileMenu():MobileMenu{
  const m=state.party[this.hero],value=stats(m);
  const tabs:MobileAction[]=[{id:'items',label:'道具',selected:this.tab==='items',run:()=>{this.tab='items';this.index=0;this.draw();}},{id:'equipment',label:'装備',selected:this.tab==='equipment',run:()=>{this.tab='equipment';this.index=0;this.draw();}},...state.party.map((t,i)=>({id:`hero-${i}`,label:heroes[t.id].name,selected:this.hero===i,run:()=>{this.hero=i;this.index=0;this.draw();}}))];
  const actions:MobileAction[]=[];
  if(this.tab==='items'){
   ITEMS.forEach((id,i)=>actions.push({id:`item-${id}`,label:consumables[id].name,detail:`所持 ${count(state,id)} / ${consumables[id].description}`,selected:this.index===i,run:()=>{this.index=i;this.draw();}}));
   actions.push({id:'use',label:`${heroes[m.id].name}に使う`,run:()=>this.apply()});
  }else{
   SLOTS.forEach((slot,i)=>tabs.push({id:`slot-${slot}`,label:`${slotNames[slot]}：${m.equipment[slot]?gear[m.equipment[slot]!].name:'なし'}`,selected:this.slot===i,run:()=>{this.slot=i;this.index=0;this.draw();}}));
   this.candidates().forEach((id,i)=>actions.push({id:`gear-${id??'none'}`,label:id?gear[id].name:'装備を外す',selected:this.index===i,run:()=>{this.index=i;this.draw();}}));
   actions.push({id:'equip',label:'装備を変更する',run:()=>this.apply()});
  }
  return {key:`Inventory:${this.tab}:${this.hero}:${this.slot}`,kind:'screen',title:'どうぐ・装備',description:`${heroes[m.id].name} / HP ${m.hp}/${value.hp} MP ${m.mp}/${value.mp}
攻撃 ${value.attack} 魔法 ${value.magic} 防御 ${value.defense} 速さ ${value.speed}
${this.notice}`,back:()=>this.close(),tabs,actions};
 }
 private candidates():(GearId|null)[]{const m=state.party[this.hero];return [null,...(Object.keys(gear) as GearId[]).filter(id=>{const def=gear[id] as Gear;return def.slot===SLOTS[this.slot]&&def.allowed.includes(m.id)&&count(state,id)>0;})];}
 private button(x:number,y:number,w:number,h:number,text:string,fn:()=>void,selected=false):void{this.ui.push(...uiButton(this,x,y,w,h,text,fn,selected));}
 private draw():void{
  this.ui.forEach(o=>o.destroy());this.ui=[];this.ui.push(panel(this,20,17,600,329),label(this,40,29,'旅のもちもの / 装備',18,'#efd092'));
  this.button(575,33,65,27,'戻る',()=>this.close());
  this.button(90,66,100,28,'道具',()=>{this.tab='items';this.index=0;this.draw();},this.tab==='items');this.button(201,66,100,28,'装備',()=>{this.tab='equipment';this.index=0;this.draw();},this.tab==='equipment');
  this.ui.push(label(this,600,62,`${state.money} G`,13).setOrigin(1,0));
  state.party.forEach((m,i)=>this.button(100+i*148,102,139,28,heroes[m.id].name,()=>{this.hero=i;this.index=0;this.draw();},i===this.hero));
  const m=state.party[this.hero],current=stats(m);
  if(this.tab==='items'){
   ITEMS.forEach((id,i)=>this.button(172,147+i*37,264,32,`${consumables[id].name} ×${count(state,id)}`,()=>{this.index=i;this.draw();},i===this.index));
   const id=ITEMS[this.index];this.ui.push(label(this,330,136,consumables[id].description,12).setWordWrapWidth(269),label(this,330,180,`${heroes[m.id].name}\nHP ${m.hp}/${current.hp} / MP ${m.mp}/${current.mp}`,12));
   this.button(460,255,259,36,'この仲間に使う',()=>this.apply());
  }else{
   SLOTS.forEach((slot,i)=>this.button(145,149+i*46,210,38,`${slotNames[slot]}：${m.equipment[slot]?gear[m.equipment[slot]!].name:'なし'}`,()=>{this.slot=i;this.index=0;this.draw();},i===this.slot));
   const entries=this.candidates();this.index=Math.min(this.index,entries.length-1);
   entries.forEach((id,i)=>this.button(466,143+i*30,287,26,id?`${gear[id].name} [${count(state,id)}]`:'装備を外す',()=>{this.index=i;this.apply();},i===this.index));
   const candidate=entries[this.index],next=stats({...m,equipment:{...m.equipment,[SLOTS[this.slot]]:candidate}});
   this.ui.push(label(this,330,275,`攻撃 ${current.attack}→${next.attack}  魔法 ${current.magic}→${next.magic}\n防御 ${current.defense}→${next.defense}  速さ ${current.speed}→${next.speed}\n最大HP ${current.hp}→${next.hp} / MP ${current.mp}→${next.mp}`,10).setLineSpacing(2));
  }
  this.ui.push(label(this,40,326,this.notice,9,'#e8d4a7').setWordWrapWidth(551));
 }
 private apply():void{this.notice=this.tab==='items'?useItem(state,ITEMS[this.index],this.hero).text:equip(state,this.hero,SLOTS[this.slot],this.candidates()[this.index]??null).text;this.draw();}
 private key(e:KeyboardEvent):void{
  if(e.repeat)return;if(cancelKey(e)){this.close();return;}
  if(e.code==='KeyT'){this.tab=this.tab==='items'?'equipment':'items';this.index=0;this.draw();}
  if(['KeyQ','KeyE'].includes(e.code)){this.hero=(this.hero+(e.code==='KeyQ'?state.party.length-1:1))%state.party.length;this.index=0;this.draw();}
  if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){const next=['ArrowRight','KeyD'].includes(e.code);if(this.tab==='equipment')this.slot=(this.slot+(next?1:2))%3;else this.hero=(this.hero+(next?1:state.party.length-1))%state.party.length;this.index=0;this.draw();}
  if(['ArrowUp','ArrowDown','KeyW','KeyS'].includes(e.code)){const n=this.tab==='items'?4:this.candidates().length;this.index=(this.index+(['ArrowUp','KeyW'].includes(e.code)?n-1:1))%n;this.draw();}
  if(confirmKey(e))this.apply();
 }
 private close():void{music.setTrack(fieldTrack(state.map));this.scene.resume(isJourneyMap(state.map)?'Campaign':'Field');this.scene.stop();}
}
