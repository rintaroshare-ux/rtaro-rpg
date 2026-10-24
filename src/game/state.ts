import {stats} from './economy/stats';
import {emptyEquipment,isGear,gear,type Gear,type Equipment,type GearId} from './economy/catalog';
import {readBattleSnapshot,type BattleSnapshot} from './combat/snapshot';
import { heroes, maps, SAVE_KEY, AUTO_SAVE_KEY, PREVIOUS_SAVE_KEY, LEGACY_SAVE_KEY, type HeroId, type MapId } from './data';
export interface Member {id:HeroId;hp:number;mp:number;level:number;xp:number;equipment:Equipment}
export type AtbMode = 'wait' | 'active';
export interface State {version:3;map:MapId;x:number;y:number;party:Member[];flags:string[];defeated:string[];bowls:number;minutes:number;money:number;inventory:{revive:number;ether:number;deluxe:number};atbMode:AtbMode;gearBag:Partial<Record<GearId,number>>;resumeBattle:BattleSnapshot|null}
export const member=(id:HeroId,level=1):Member=>({id,hp:heroes[id].hp+(level-1)*14,mp:heroes[id].mp+(level-1)*4,level,xp:0,equipment:emptyEquipment()});
export const maxHp=(m:Member)=>stats(m).hp;
export const maxMp=(m:Member)=>stats(m).mp;
export const fresh=():State=>({version:3,map:'home',x:260,y:330,party:[member('rintaro')],flags:[],defeated:[],bowls:5,minutes:0,money:0,inventory:{revive:2,ether:3,deluxe:0},atbMode:'wait',gearBag:{},resumeBattle:null});
export let state:State=fresh();
export function reset():void{state=fresh()}
export function restore():void{state.party.forEach(m=>{m.hp=maxHp(m);m.mp=maxMp(m)})}
export function save(automatic=false):boolean{try{localStorage.setItem(automatic?AUTO_SAVE_KEY:SAVE_KEY,JSON.stringify(automatic?{...state,savedAt:Date.now()}:state));return true}catch{return false}}
export function load(source:'manual'|'auto'='manual'):boolean{
  try{
    const saved=source==='auto'?localStorage.getItem(AUTO_SAVE_KEY):localStorage.getItem(SAVE_KEY)??localStorage.getItem(PREVIOUS_SAVE_KEY)??localStorage.getItem(LEGACY_SAVE_KEY);
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
  if(!record(raw)||(raw.version!==1&&raw.version!==2&&raw.version!==3))return null;
  const v=raw;
  if(typeof v.map!=='string'||!Object.hasOwn(maps,v.map)||typeof v.x!=='number'||!Number.isFinite(v.x)||v.x<24||v.x>936||typeof v.y!=='number'||!Number.isFinite(v.y)||v.y<46||v.y>510)return null;
  if(!amount(v.bowls)||typeof v.minutes!=='number'||!Number.isFinite(v.minutes)||v.minutes<0||!strings(v.flags)||!strings(v.defeated))return null;
  if(!Array.isArray(v.party)||v.party.length<1||v.party.length>4)return null;
  const ids:HeroId[]=['rintaro','marmot','fugu','vanilla'];
  const party:Member[]=[];
  for(let i=0;i<v.party.length;i++){
    const p:unknown=v.party[i];
    if(!record(p)||p.id!==ids[i]||!amount(p.level,99)||p.level<1||!amount(p.xp))return null;
    const m=member(ids[i],p.level);
    if(v.version===3){
      if(!record(p.equipment))return null;
      for(const slot of ['weapon','armor','accessory'] as const){
        const id=p.equipment[slot];if(id!==null&&(typeof id!=='string'||!isGear(id)||(gear[id] as Gear).slot!==slot||!(gear[id] as Gear).allowed.includes(m.id)))return null;
        m.equipment[slot]=id as GearId|null;
      }
    }
    if(!amount(p.hp,maxHp(m))||!amount(p.mp,maxMp(m)))return null;
    party.push({...m,hp:p.hp,mp:p.mp,xp:p.xp});
  }
  let money=0,inventory={revive:2,ether:3,deluxe:0},atbMode:AtbMode='wait';
  if(v.version===2||v.version===3){
    if(!amount(v.money)||!record(v.inventory)||!amount(v.inventory.revive)||!amount(v.inventory.ether)||(v.atbMode!=='wait'&&v.atbMode!=='active'))return null;
    money=v.money;inventory={revive:v.inventory.revive,ether:v.inventory.ether,deluxe:0};atbMode=v.atbMode;
  }
  const gearBag:Partial<Record<GearId,number>>={};let resumeBattle:BattleSnapshot|null=null;
  if(v.version===3){
    if(!record(v.gearBag)||!record(v.inventory)||!amount(v.inventory.deluxe))return null;
    inventory.deluxe=v.inventory.deluxe;
    for(const [id,n] of Object.entries(v.gearBag)){if(!isGear(id)||!amount(n))return null;gearBag[id]=n;}
    if(v.resumeBattle!==null){resumeBattle=readBattleSnapshot(v.resumeBattle,party.length);if(!resumeBattle)return null;}
  }
  return {version:3,map:v.map as MapId,x:v.x,y:v.y,party,flags:[...v.flags],defeated:[...v.defeated],bowls:v.bowls,minutes:v.minutes,money,inventory,atbMode,gearBag,resumeBattle};
}
export function objective():string{return !state.flags.includes('message')?'ママと話して、パパのメッセージを読もう':state.party.length===1?'公園でマーモットに話しかけよう':state.party.length===2?'商店街でグアムバードを探そう':state.party.length===3?'駅前でシンガポール太郎に会おう':'駅前広場のベルを調べてキングに挑もう'}
