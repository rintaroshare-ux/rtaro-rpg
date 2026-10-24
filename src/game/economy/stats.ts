import {heroes,type HeroId} from '../data';
import {heroSpeed} from '../combat/data';
import {gear,type Equipment,type Gear} from './catalog';
export interface Stats {hp:number;mp:number;attack:number;magic:number;defense:number;speed:number}
export function stats(m:{id:HeroId;level:number;equipment:Equipment}):Stats{
 const h=heroes[m.id];const result:Stats={hp:h.hp+(m.level-1)*14,mp:h.mp+(m.level-1)*4,attack:h.atk+(m.level-1)*4,magic:0,defense:0,speed:heroSpeed[m.id]+m.level-1};
 for(const id of Object.values(m.equipment))if(id){const bonuses=(gear[id] as Gear).bonuses;for(const [key,value] of Object.entries(bonuses))result[key as keyof Stats]+=value;}
 return result;
}
