import type {State} from '../state';
import {heroes} from '../data';
import {stats} from './stats';
import {gear,consumables,isGear,isConsumable,stockDefinition,type Gear,type StockId,type GearId,type ConsumableId,type GearSlot} from './catalog';
const LIMIT=99999999;
export interface Result {ok:boolean;text:string}
export function count(s:State,id:StockId):number{return isGear(id)?s.gearBag[id]??0:id==='bowl'?s.bowls:s.inventory[id];}
function add(s:State,id:StockId,quantity:number):void{if(isGear(id))s.gearBag[id]=count(s,id)+quantity;else if(id==='bowl')s.bowls+=quantity;else s.inventory[id]+=quantity;}
export function trade(s:State,id:string,side:'buy'|'sell',quantity=1):Result{
 if(side!=='buy'&&side!=='sell')return {ok:false,text:'取引を確認してください。'};
 if((!isGear(id)&&!isConsumable(id))||!Number.isInteger(quantity)||quantity<1||quantity>99)return {ok:false,text:'品物と個数を確認してください。'};
 const def=stockDefinition(id),price=side==='buy'?def.price:Math.floor(def.price/2),total=price*quantity;
 if(side==='buy'){
  if(s.money<total)return {ok:false,text:'所持金が足りません。'};
  if(count(s,id)+quantity>LIMIT)return {ok:false,text:'これ以上持てません。'};
  s.money-=total;add(s,id,quantity);
 }else{
  if(count(s,id)<quantity)return {ok:false,text:'その個数を持っていません。装備中の品は外してから売ってください。'};
  if(s.money+total>LIMIT)return {ok:false,text:'所持金の上限に達しています。'};
  s.money+=total;add(s,id,-quantity);
 }
 return {ok:true,text:`${def.name} ×${quantity}を${side==='buy'?'購入':'売却'}しました。`};
}
export function equip(s:State,index:number,slot:GearSlot,id:GearId|null):Result{
 if(!['weapon','armor','accessory'].includes(slot))return {ok:false,text:'装備枠を確認してください。'};
 const m=s.party[index];if(!m)return {ok:false,text:'仲間が見つかりません。'};
 if(id){
  const def=gear[id] as Gear;
  if(!def||def.slot!==slot||!def.allowed.includes(m.id))return {ok:false,text:'この仲間は装備できません。'};
  if(count(s,id)<1)return {ok:false,text:'その装備を持っていません。'};
 }
 const previous=m.equipment[slot];if(previous&&previous!==id&&count(s,previous)>=LIMIT)return {ok:false,text:'装備の所持上限です。'};
 if(id)add(s,id,-1);if(previous)add(s,previous,1);
 m.equipment[slot]=id;
 const next=stats(m);m.hp=Math.min(m.hp,next.hp);m.mp=Math.min(m.mp,next.mp);
 return {ok:true,text:`${heroes[m.id].name}の${slot==='weapon'?'武器':slot==='armor'?'防具':'アクセサリー'}を変更しました。`};
}
export function canUse(s:State,id:ConsumableId,target:number):string|null{
 if(count(s,id)<1)return 'その道具を持っていません。';
 const m=s.party[target];if(!m)return '対象を選んでください。';
 if(id==='revive'&&m.hp>0)return '目覚めの塩は戦闘不能の仲間に使えます。';
 if(id!=='revive'&&m.hp<=0)return '戦闘不能の仲間には目覚めの塩を使ってください。';
 return null;
}
export function useItem(s:State,id:ConsumableId,target:number):Result{
 const invalid=canUse(s,id,target);if(invalid)return {ok:false,text:invalid};
 const m=s.party[target],maximum=stats(m);add(s,id,-1);
 if(id==='revive')m.hp=Math.ceil(maximum.hp/2);else if(id==='ether')m.mp=Math.min(maximum.mp,m.mp+25);else m.hp=Math.min(maximum.hp,m.hp+(id==='deluxe'?180:80));
 return {ok:true,text:`${heroes[m.id].name}に${consumables[id].name}！ ${id==='revive'?'蘇生した！':id==='ether'?'MP25回復！':id==='deluxe'?'HP180回復！':'HP80回復！'}`};
}
