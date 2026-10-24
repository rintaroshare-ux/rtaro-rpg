import type {Action,Foe,Rewards} from '../battle';
import {combatEnemies} from './data';
import {isConsumable} from '../economy/catalog';
export interface BattleSnapshot {version:1;foes:Foe[];heroGauges:number[];enemyGauges:number[];guards:number[];attempts:number;escaped:boolean;queue:Action[];rewards:Rewards|null}
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const integer=(x:unknown,max=99999999):x is number=>typeof x==='number'&&Number.isInteger(x)&&x>=0&&x<=max;
export function readBattleSnapshot(raw:unknown,partyCount:number):BattleSnapshot|null{
 if(!record(raw)||raw.version!==1||!Array.isArray(raw.foes)||raw.foes.length<1||raw.foes.length>3)return null;
 if(!raw.foes.every(f=>record(f)&&typeof f.kind==='string'&&Object.hasOwn(combatEnemies,f.kind)&&integer(f.hp,combatEnemies[f.kind as keyof typeof combatEnemies].hp)&&integer(f.phase,2)&&integer(f.actions)))return null;
 const gauges=(x:unknown,n:number)=>Array.isArray(x)&&x.length===n&&x.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1);
 if(!gauges(raw.heroGauges,partyCount)||!gauges(raw.enemyGauges,raw.foes.length)||!Array.isArray(raw.guards)||!raw.guards.every(i=>integer(i,partyCount-1)))return null;
 if(!integer(raw.attempts)||typeof raw.escaped!=='boolean'||!Array.isArray(raw.queue)||raw.queue.length>partyCount+raw.foes.length)return null;
 const keys=new Set<string>();
 for(const a of raw.queue){
  if(!record(a)||(a.side!=='hero'&&a.side!=='enemy')||!integer(a.actor,a.side==='hero'?partyCount-1:raw.foes.length-1)||!['attack','magic','item','guard','flee'].includes(a.command as string)||!integer(a.target,Math.max(partyCount,raw.foes.length)-1)||typeof a.item!=='string'||!isConsumable(a.item))return null;
  const key=`${a.side}:${a.actor}`;if(keys.has(key))return null;keys.add(key);
 }
 if(raw.rewards!==null){const r=raw.rewards;if(!record(r)||!integer(r.xp)||!integer(r.money)||!record(r.drops)||!Object.entries(r.drops).every(([key,n])=>isConsumable(key)&&integer(n))||!Array.isArray(r.levels)||!r.levels.every(x=>typeof x==='string'))return null;}
 return JSON.parse(JSON.stringify(raw)) as BattleSnapshot;
}
