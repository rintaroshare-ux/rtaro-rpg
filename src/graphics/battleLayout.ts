export interface BattlePoint {x:number;y:number}
export function partyPoint(index:number):BattlePoint{return {x:503+(index%2)*22,y:66+index*40};}
export function enemyPoint(index:number,count:number):BattlePoint{
  if(count===1)return {x:185,y:123};
  if(count===2)return {x:108+index*165,y:122};
  return {x:95+(index%2)*180,y:83+Math.floor(index/2)*78};
}
export const COMMAND_BOX={x:8,y:211,width:235,height:99,rowY:236,rowHeight:13};
