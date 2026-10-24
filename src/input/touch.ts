import type Phaser from 'phaser';
export const touchDirections={up:false,down:false,left:false,right:false};
type Direction=keyof typeof touchDirections;
/** DOM touch controls are outside the canvas and dispatch into the active scene. */
export function setupTouchControls(game:Phaser.Game):void{
 const root=document.createElement('nav');root.id='touch-controls';root.setAttribute('aria-label','ゲーム操作');
 const dispatch=(code:string)=>{
  const scene=game.scene.getScenes(true).at(-1);
  scene?.input.keyboard?.emit('keydown',new KeyboardEvent('keydown',{code,bubbles:false}));
 };
 const clear=()=>{touchDirections.up=false;touchDirections.down=false;touchDirections.left=false;touchDirections.right=false;};
 const releaseAll:(()=>void)[]=[];
 const dpad=document.createElement('div');dpad.className='dpad';
 const codes:Record<Direction,string>={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
 for(const [direction,symbol] of Object.entries({up:'↑',left:'←',down:'↓',right:'→'}) as [Direction,string][]){
  const button=document.createElement('button');button.type='button';button.textContent=symbol;button.dataset.direction=direction;button.setAttribute('aria-label',`${symbol} 移動・選択`);
  let interval:ReturnType<typeof setInterval>|null=null;
  const release=()=>{touchDirections[direction]=false;if(interval)clearInterval(interval);interval=null;};
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touchDirections[direction]=true;dispatch(codes[direction]);if(interval)clearInterval(interval);interval=setInterval(()=>dispatch(codes[direction]),180);});
  releaseAll.push(release);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);window.addEventListener('blur',release);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});dpad.append(button);
 }
 const actions=document.createElement('div');actions.className='touch-actions';
 for(const [code,text,cls] of [['KeyE','仲間切替','battle-only'],['KeyT','ATB切替','battle-only'],['Escape','戻る / X','cancel'],['Enter','決定 / Z','confirm']]){
  const button=document.createElement('button');button.type='button';button.textContent=text;button.className=cls;button.dataset.code=code;
  button.addEventListener('pointerdown',e=>{e.preventDefault();dispatch(code);});actions.append(button);
 }
 root.append(dpad,actions);document.body.append(root);
 const hint=document.createElement('div');hint.id='rotate-hint';hint.textContent='横向きにすると広い画面で遊べます';document.body.append(hint);
 let previousScene='';game.events.on('step',()=>{const current=game.scene.getScenes(true).at(-1)?.sys.settings.key??'';if(current!==previousScene){for(const release of releaseAll)release();clear();previousScene=current;}});
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});game.events.on('blur',clear);
}
