export type Direction='up'|'down'|'left'|'right';
export type DirectionFlags=Record<Direction,boolean>;
/** Multiple fingers may hold a direction; releasing one must not release the others. */
export class TouchState {
 private readonly pointers=new Map<number,Direction>();
 press(id:number,direction:Direction):void{this.pointers.set(id,direction);}
 release(id:number):void{this.pointers.delete(id);}
 clear():void{this.pointers.clear();}
 get flags():DirectionFlags{
  const result:DirectionFlags={up:false,down:false,left:false,right:false};
  for(const direction of this.pointers.values())result[direction]=true;
  return result;
 }
}
