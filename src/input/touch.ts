import type Phaser from 'phaser';
import {TouchState,type Direction} from './touchState';
export const touchDirections={up:false,down:false,left:false,right:false};
export function setupTouchControls(game:Phaser.Game):void{
 const root=document.createElement('nav');root.id='touch-controls';root.setAttribute('aria-label','ゲーム操作');
 const currentDirections=new Map<number,Direction>();const cancelled=new Set<number>();
 const tracker=new TouchState(),timers=new Map<number,ReturnType<typeof setInterval>>();
 const codes:Record<Direction,string>={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
 const sync=()=>Object.assign(touchDirections,tracker.flags);
 const dispatch=(code:string)=>{if(document.body.dataset.paused==='true')return;game.scene.getScenes(true).at(-1)?.input.keyboard?.emit('keydown',new KeyboardEvent('keydown',{code}));};
 const release=(id:number)=>{tracker.release(id);const timer=timers.get(id);if(timer)clearInterval(timer);timers.delete(id);sync();};
 const clear=()=>{for(const id of currentDirections.keys())cancelled.add(id);currentDirections.clear();tracker.clear();for(const timer of timers.values())clearInterval(timer);timers.clear();sync();};
 game.registry.set('releaseTouch',clear);
 const dpad=document.createElement('div');dpad.className='dpad';
 const change=(id:number,direction:Direction|null)=>{
  if(currentDirections.get(id)===direction)return;
  release(id);currentDirections.delete(id);
  if(direction){currentDirections.set(id,direction);tracker.press(id,direction);sync();dispatch(codes[direction]);timers.set(id,setInterval(()=>dispatch(codes[direction]),180));}
 };
 const releasePointer=(id:number)=>{cancelled.delete(id);currentDirections.delete(id);release(id);};
 for(const [direction,symbol] of Object.entries({up:'↑',left:'←',down:'↓',right:'→'}) as [Direction,string][]){
  const button=document.createElement('button');button.type='button';button.textContent=symbol;button.dataset.direction=direction;button.setAttribute('aria-label',`${symbol} 移動・選択`);
  button.addEventListener('pointerdown',e=>{if(e.button!==0)return;cancelled.delete(e.pointerId);e.preventDefault();button.setPointerCapture(e.pointerId);change(e.pointerId,direction);});
  button.addEventListener('pointermove',e=>{
   if(cancelled.has(e.pointerId)||!button.hasPointerCapture(e.pointerId))return;
   const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLButtonElement>('button[data-direction]');
   change(e.pointerId,target?.dataset.direction as Direction??null);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>releasePointer((e as PointerEvent).pointerId));
  dpad.append(button);
 }
 const actions=document.createElement('div');actions.className='touch-actions';
 for(const [code,text,cls] of [['KeyE','仲間','battle-only'],['KeyT','ATB','battle-only'],['Escape','戻る','cancel'],['Enter','決定','confirm']]){
  const button=document.createElement('button');button.type='button';button.textContent=text;button.className=cls;button.dataset.code=code;
  button.addEventListener('pointerdown',e=>{e.preventDefault();dispatch(code);});actions.append(button);
 }
 root.append(dpad,actions);document.body.append(root);
 const hint=document.createElement('div');hint.id='rotate-hint';hint.textContent='横向きにすると広い画面で遊べます';document.body.append(hint);
 let previous='';game.events.on('step',()=>{
  const scene=game.scene.getScenes(true).at(-1) as (Phaser.Scene&{mode?:string;selection?:string;actor?:number|null})|undefined;
  const current=`${scene?.sys.settings.key}:${scene?.mode??''}:${scene?.selection??''}:${scene?.actor??''}`;
  if(current!==previous){clear();previous=current;}
 });
 window.addEventListener('blur',()=>{clear();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();}});game.events.on('blur',clear);
 window.addEventListener('resize',()=>{clear();});
 root.addEventListener('contextmenu',e=>e.preventDefault());
}
