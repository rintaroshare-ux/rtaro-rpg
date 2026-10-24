import {plushEnemies,plushIds,type PlushEnemyId} from '../bestiary';
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
  ...Object.fromEntries(plushIds.map((id):[PlushEnemyId,EnemyDefinition]=>[id,{...plushEnemies[id],texture:id}])) as Record<PlushEnemyId,EnemyDefinition>,
  king:{...enemies.king,hp:760,atk:20,speed:14,xp:300,money:250,resists:{lightning:1.5,dark:.5},drop:'revive'},
};
export const bossPhases = [
  {threshold:2/3,name:'ぬいぐるみの王',speed:1,pattern:['attack','attack','sweep']},
  {threshold:1/3,name:'ほつれた王冠',speed:1.15,pattern:['attack','sweep','drain']},
  {threshold:0,name:'最後のモフモフ',speed:1.3,pattern:['sweep','drain','attack']},
] as const;
