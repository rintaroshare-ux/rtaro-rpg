import { heroes, order, SAVE_KEY, LEGACY_SAVE_KEY, type HeroId, type MapId } from './data';
export interface Member {id:HeroId;hp:number;mp:number;level:number;xp:number}
export type AtbMode = 'wait' | 'active';
export interface State {version:2;map:MapId;x:number;y:number;party:Member[];flags:string[];defeated:string[];bowls:number;minutes:number;money:number;inventory:{revive:number;ether:number};atbMode:AtbMode}
export const member=(id:HeroId,level=1):Member=>({id,hp:heroes[id].hp+(level-1)*14,mp:heroes[id].mp+(level-1)*4,level,xp:0});
export const maxHp=(m:Member)=>heroes[m.id].hp+(m.level-1)*14;
export const maxMp=(m:Member)=>heroes[m.id].mp+(m.level-1)*4;
export const fresh=():State=>({version:2,map:'home',x:260,y:330,party:[member('rintaro')],flags:[],defeated:[],bowls:5,minutes:0,money:0,inventory:{revive:2,ether:3},atbMode:'wait'});
export let state:State=fresh();
export function reset():void{state=fresh()}
export function restore():void{state.party.forEach(m=>{m.hp=maxHp(m);m.mp=maxMp(m)})}
export function save():boolean{try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch{return false}}
export function load():boolean{
  try{
    const saved=localStorage.getItem(SAVE_KEY)??localStorage.getItem(LEGACY_SAVE_KEY);
    const candidate=migrateSave(JSON.parse(saved??'null'));
    if(!candidate)return false;
    state=candidate;return true;
  }catch{return false}
}
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const amount=(v:unknown,max=99999999):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=max;
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=10000&&v.every(x=>typeof x==='string');
/** Pure, defensive v1 -> v2 migration. Old storage entry is never deleted/overwritten. */
export function migrateSave(raw:unknown):State|null{
  if(!record(raw)||(raw.version!==1&&raw.version!==2))return null;
  const v=raw;
  if(typeof v.map!=='string'||!order.includes(v.map as MapId)||typeof v.x!=='number'||!Number.isFinite(v.x)||v.x<24||v.x>936||typeof v.y!=='number'||!Number.isFinite(v.y)||v.y<46||v.y>510)return null;
  if(!amount(v.bowls)||typeof v.minutes!=='number'||!Number.isFinite(v.minutes)||v.minutes<0||!strings(v.flags)||!strings(v.defeated))return null;
  if(!Array.isArray(v.party)||v.party.length<1||v.party.length>4)return null;
  const ids:HeroId[]=['rintaro','marmot','fugu','vanilla'];
  const party:Member[]=[];
  for(let i=0;i<v.party.length;i++){
    const p:unknown=v.party[i];
    if(!record(p)||p.id!==ids[i]||!amount(p.level,99)||p.level<1||!amount(p.xp))return null;
    const m=member(ids[i],p.level);
    if(!amount(p.hp,maxHp(m))||!amount(p.mp,maxMp(m)))return null;
    party.push({...m,hp:p.hp,mp:p.mp,xp:p.xp});
  }
  let money=0,inventory={revive:2,ether:3},atbMode:AtbMode='wait';
  if(v.version===2){
    if(!amount(v.money)||!record(v.inventory)||!amount(v.inventory.revive)||!amount(v.inventory.ether)||(v.atbMode!=='wait'&&v.atbMode!=='active'))return null;
    money=v.money;inventory={revive:v.inventory.revive,ether:v.inventory.ether};atbMode=v.atbMode;
  }
  return {version:2,map:v.map as MapId,x:v.x,y:v.y,party,flags:[...v.flags],defeated:[...v.defeated],bowls:v.bowls,minutes:v.minutes,money,inventory,atbMode};
}
export function objective():string{return !state.flags.includes('message')?'ママと話して、パパのメッセージを読もう':state.party.length===1?'公園でマーモットに話しかけよう':state.party.length===2?'商店街でふぐを探そう':state.party.length===3?'駅前でヴァニラ・アイスに会おう':'駅前広場のベルを調べてキングに挑もう'}
