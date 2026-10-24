import {consumables,type ConsumableId} from '../economy/catalog';
import { enemies, type EnemyId, type HeroId, type SpellId } from '../data';
export type Element = 'physical' | 'lightning' | 'water' | 'dark';
export const elementNames: Record<Element, string> = {physical:'物理', lightning:'雷',water:'水',dark:'闇'};
export const heroSpeed: Record<HeroId, number> = {rintaro:20,marmot:18,fugu:22,vanilla:16};
export const spellElements: Partial<Record<SpellId, Element>> = {thunder:'lightning',water:'water',void:'dark'};
export type BattleItem=ConsumableId;
export const battleItems=consumables;
export interface EnemyDefinition {name:string;texture:string;hp:number;atk:number;speed:number;xp:number;money:number;resists:Partial<Record<Element, number>>;drop:BattleItem}
export const combatEnemies: Record<EnemyId, EnemyDefinition> = {
  bear:{...enemies.bear,hp:65,atk:10,speed:10,xp:30,money:12,resists:{lightning:1.5,water:.65},drop:'bowl'},
  rabbit:{...enemies.rabbit,hp:72,atk:11,speed:15,xp:36,money:16,resists:{water:1.5,dark:.65},drop:'ether'},
  king:{...enemies.king,hp:760,atk:20,speed:14,xp:300,money:250,resists:{lightning:1.5,dark:.5},drop:'revive'},
};
export const bossPhases = [
  {threshold:2/3,name:'ぬいぐるみの王',speed:1,pattern:['attack','attack','sweep']},
  {threshold:1/3,name:'ほつれた王冠',speed:1.15,pattern:['attack','sweep','drain']},
  {threshold:0,name:'最後のモフモフ',speed:1.3,pattern:['sweep','drain','attack']},
] as const;
