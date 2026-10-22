import { heroes, order, SAVE_KEY, type HeroId, type MapId } from './data';
export interface Member {id:HeroId;hp:number;mp:number;level:number;xp:number}
export interface State {version:1;map:MapId;x:number;y:number;party:Member[];flags:string[];defeated:string[];bowls:number;minutes:number}
export const member=(id:HeroId,level=1):Member=>({id,hp:heroes[id].hp+(level-1)*14,mp:heroes[id].mp+(level-1)*4,level,xp:0});
export const maxHp=(m:Member)=>heroes[m.id].hp+(m.level-1)*14;
export const maxMp=(m:Member)=>heroes[m.id].mp+(m.level-1)*4;
export const fresh=():State=>({version:1,map:'home',x:260,y:330,party:[member('rintaro')],flags:[],defeated:[],bowls:5,minutes:0});
export let state:State=fresh();
export function reset(){state=fresh()}
export function restore(){state.party.forEach(m=>{m.hp=maxHp(m);m.mp=maxMp(m)})}
export function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch{return false}}
export function load(){try{const s:unknown=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!valid(s))return false;state=s;return true}catch{return false}}
function valid(s:unknown):s is State {if(!s||typeof s!=='object')return false;const v=s as State;return v.version===1&&order.includes(v.map)&&Number.isFinite(v.x)&&v.x>=32&&v.x<=928&&Number.isFinite(v.y)&&v.y>=60&&v.y<=510&&Number.isFinite(v.bowls)&&v.bowls>=0&&Number.isFinite(v.minutes)&&Array.isArray(v.flags)&&v.flags.every(x=>typeof x==='string')&&Array.isArray(v.defeated)&&v.defeated.every(x=>typeof x==='string')&&Array.isArray(v.party)&&v.party.length>0&&v.party.length<=4&&v.party.every((m,i)=>m.id===(['rintaro','marmot','fugu','vanilla'][i])&&Number.isInteger(m.level)&&m.level>=1&&m.level<=99&&Number.isFinite(m.hp)&&m.hp>=0&&m.hp<=maxHp(m)&&Number.isFinite(m.mp)&&m.mp>=0&&m.mp<=maxMp(m)&&Number.isFinite(m.xp)&&m.xp>=0)}
export function objective(){return !state.flags.includes('message')?'ママと話して、パパのメッセージを読もう':state.party.length===1?'公園でマーモットに話しかけよう':state.party.length===2?'商店街でふぐを探そう':state.party.length===3?'駅前でヴァニラ・アイスに会おう':'駅前のモフモフキングを倒そう'}
