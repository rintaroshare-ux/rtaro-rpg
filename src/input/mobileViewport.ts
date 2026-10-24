import type Phaser from 'phaser';
import {mobileLayout} from './mobileLayout';
import {PauseController} from './pause';
import {setupMobileMenu} from './mobileMenu';
export function setupMobileViewport(game:Phaser.Game):void{
 const pause=new PauseController(game);game.registry.set('pauseController',pause);
 const query=window.matchMedia('(pointer:coarse)');
 let preference:'auto'|'touch'|'keyboard'='auto';try{const v=localStorage.getItem('rtaro.controls.mode');if(v==='touch'||v==='keyboard')preference=v;document.body.dataset.largeMenu=String(localStorage.getItem('rtaro.mobile.menu')!=='canvas');}catch{document.body.dataset.largeMenu='true';}
 const probe=document.createElement('div');probe.id='safe-area-probe';document.body.append(probe);
 const controls=document.createElement('div');controls.id='device-controls';
 const pauseButton=document.createElement('button');pauseButton.type='button';pauseButton.id='pause-button';pauseButton.innerHTML='Ⅱ<span> 一時停止</span>';pauseButton.setAttribute('aria-label','一時停止');pauseButton.addEventListener('click',()=>pause.pause());
 const full=document.createElement('button');full.type='button';full.id='fullscreen-button';full.innerHTML='⛶<span> 全画面</span>';full.setAttribute('aria-label','全画面表示');
 const mode=document.createElement('button');mode.type='button';mode.id='input-mode-toggle';
 const modeSetting=document.createElement('button');modeSetting.type='button';modeSetting.id='input-mode-setting';
 controls.append(pauseButton,full,mode);document.body.append(controls);pause.addControl(modeSetting);
 let previousPortrait:boolean|undefined;
 const apply=()=>{
  const touch=preference==='touch'||(preference==='auto'&&query.matches);document.body.dataset.touch=String(touch);
  mode.textContent=`操作：${touch?'タッチ':'キー'}`;mode.setAttribute('aria-pressed',String(touch));modeSetting.textContent=`操作方法：${touch?'タッチ':'キーボード'}（切替）`;
  if(touch){
   const viewport=window.visualViewport,w=Math.min(window.innerWidth,viewport?.width??Infinity),h=Math.min(window.innerHeight,viewport?.height??Infinity);
   const style=getComputedStyle(probe),insets={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
   const layout=mobileLayout(w,h,insets);const root=document.documentElement.style;
   for(const [key,value] of Object.entries({x:layout.x+(viewport?.offsetLeft??0),y:layout.y+(viewport?.offsetTop??0),w:layout.width,h:layout.height,button:layout.buttonSize,safeLeft:insets.left,safeRight:insets.right,safeBottom:insets.bottom,viewportH:h}))root.setProperty(`--mobile-${key}`,`${value}px`);
   document.body.dataset.orientation=layout.portrait?'portrait':'landscape';document.body.dataset.compact=String(layout.compact);
   if(previousPortrait!==undefined&&previousPortrait!==layout.portrait)pause.pause('画面の向きが変わりました。準備ができたら再開してください。',true);
   previousPortrait=layout.portrait;
  }else{previousPortrait=undefined;document.body.dataset.orientation='';}
  (game.registry.get('releaseTouch') as (()=>void)|undefined)?.();if(game.scale?.canvas){game.scale.getParentBounds();game.scale.refresh();}
 };
 const toggle=()=>{preference=document.body.dataset.touch==='true'?'keyboard':'touch';try{localStorage.setItem('rtaro.controls.mode',preference);}catch{/* Optional. */}apply();};mode.addEventListener('click',()=>{toggle();mode.blur();});modeSetting.addEventListener('click',toggle);
 full.addEventListener('click',async()=>{
  try{
   if(document.fullscreenElement){await document.exitFullscreen();screen.orientation?.unlock?.();}
   else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen({navigationUI:'hide'});const orientation=screen.orientation as ScreenOrientation&{lock?:(mode:'landscape')=>Promise<void>};try{await orientation.lock?.('landscape');}catch{/* Browser may require manual rotation. */}}
   else pause.pause('このブラウザでは全画面表示が使えません。横向きでも遊べます。');
  }catch{pause.pause('全画面表示が許可されませんでした。通常表示で続けられます。');}
  full.blur();apply();
 });
 let pending=0;const resize=()=>{if(pending)cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{pending=0;apply();});};
 window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);query.addEventListener('change',resize);
 document.addEventListener('touchmove',e=>{if(document.body.dataset.touch==='true'&&!(e.target as Element).closest('.mobile-menu-body,.pause-card,input[type=range]'))e.preventDefault();},{passive:false});
 document.addEventListener('contextmenu',e=>{if((e.target as Element).closest('#game,#touch-controls'))e.preventDefault();});
 setupMobileMenu(game);apply();game.events.once('ready',apply);
}
