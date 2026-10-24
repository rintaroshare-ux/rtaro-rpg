import {plushIds} from './bestiary';
import type { EnemyId, MapId } from './data';
export const STEP_PIXELS = 24;
const NPC_SAFE_RADIUS = 74;
export interface Position {x:number;y:number}
export function isDangerous(map: MapId, point: Position, npcs: readonly Position[]): boolean {
  if (map === 'home' || map === 'market') return false;
  if (point.x < 105 || point.x > 855 || (point.y >= 320 && point.y <= 420)) return false;
  return npcs.every(npc => Math.hypot(npc.x - point.x, npc.y - point.y) > NPC_SAFE_RADIUS);
}
/** Movement distance, not key presses or elapsed time. Safe movement never triggers. */
export class StepEncounters {
  private pixels = 0;
  private remaining: number;
  constructor(private readonly random: () => number = Math.random, private grace = 8) {this.remaining=this.roll();}
  private roll():number {return 12 + Math.floor(this.random()*11);}
  move(distance:number, dangerous:boolean):boolean {
    if (!dangerous) {this.pixels=0;return false;}
    if (!Number.isFinite(distance) || distance<=0 || distance>32) return false; // scene transition/teleport
    this.pixels+=distance;
    while(this.pixels>=STEP_PIXELS){
      this.pixels-=STEP_PIXELS;
      if(this.grace>0){this.grace--;continue;}
      if(--this.remaining<=0){this.remaining=this.roll();this.grace=8;this.pixels=0;return true;}
    }
    return false;
  }
}
export function randomFormation(partySize:number,random:()=>number=Math.random):EnemyId[]{
  const count=1+Math.floor(random()*Math.max(1,Math.min(3,partySize)));
  const pool=partySize<=1?['bear','rabbit','cat','dog'] as const:partySize===2?plushIds.slice(0,8):plushIds;
  return Array.from({length:count},()=>pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]);
}
