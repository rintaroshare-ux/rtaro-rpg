import type Phaser from 'phaser';
import {music} from '../audio/music';
export interface PausableScene extends Phaser.Scene {saveAnywhere?:(automatic?:boolean)=>boolean}
export class PauseController {
 private keys:string[]=[];
 private readonly overlay:HTMLDivElement;
 private readonly message:HTMLParagraphElement;
 private readonly resumeButton:HTMLButtonElement;
 private readonly saveButton:HTMLButtonElement;
 private readonly menuButton:HTMLButtonElement;
 constructor(private readonly game:Phaser.Game){
  this.overlay=document.createElement('div');this.overlay.id='pause-overlay';this.overlay.hidden=true;this.overlay.setAttribute('role','dialog');this.overlay.setAttribute('aria-modal','true');this.overlay.setAttribute('aria-label','一時停止');
  const box=document.createElement('div');box.className='pause-card';const title=document.createElement('h2');title.textContent='ひとやすみ';this.message=document.createElement('p');
  this.resumeButton=document.createElement('button');this.resumeButton.type='button';this.resumeButton.textContent='ゲームを再開';this.resumeButton.addEventListener('click',()=>this.resume());
  this.saveButton=document.createElement('button');this.saveButton.type='button';this.saveButton.textContent='通常セーブに保存';this.saveButton.addEventListener('click',()=>{const scene=this.lastScene();this.message.textContent=scene?.saveAnywhere?.()?'通常セーブに保存しました。':'保存できませんでした。ゲームは再開できます。';});
  this.menuButton=document.createElement('button');this.menuButton.type='button';this.menuButton.id='large-menu-toggle';this.menuButton.addEventListener('click',()=>{
   const large=document.body.dataset.largeMenu==='false';document.body.dataset.largeMenu=String(large);try{localStorage.setItem('rtaro.mobile.menu',large?'large':'canvas');}catch{/* Optional preference. */}this.renderMenuButton();
  });
  const volumeLabel=document.createElement('label');volumeLabel.textContent='音楽の音量';const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='1';volume.step='.05';volume.value=String(music.level);volume.setAttribute('aria-label','音楽の音量（設定）');volume.addEventListener('input',()=>music.setVolume(Number(volume.value)));volumeLabel.append(volume);const seLabel=document.createElement('label');seLabel.textContent='効果音の音量';const se=document.createElement('input');se.type='range';se.min='0';se.max='1';se.step='.05';se.value=String(music.sfxLevel);se.setAttribute('aria-label','効果音の音量');se.addEventListener('input',()=>music.setEffectVolume(Number(se.value)));seLabel.append(se);box.append(seLabel);box.append(title,this.message,this.resumeButton,this.saveButton,this.menuButton,volumeLabel);this.overlay.append(box);document.body.append(this.overlay);
  this.overlay.addEventListener('keydown',e=>{if(e.code==='Tab'){const controls=Array.from(this.overlay.querySelectorAll<HTMLInputElement|HTMLButtonElement>('button,input')).filter(b=>!b.disabled);const i=controls.indexOf(document.activeElement as HTMLButtonElement|HTMLInputElement);controls[(i+(e.shiftKey?controls.length-1:1))%controls.length].focus();e.preventDefault();e.stopPropagation();}if(e.code==='Escape'){this.resume();e.preventDefault();e.stopPropagation();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause('アプリを切り替えたので中断しました。',true);});
  window.addEventListener('pagehide',()=>{this.checkpoint();this.pause('中断しました。',false);});
  window.addEventListener('blur',()=>this.pause('画面を離れたので中断しました。',true));
  window.addEventListener('pageshow',e=>{if(e.persisted)this.pause('おかえりなさい。再開を押してください。',false);});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();this.paused?this.resume():this.pause('操作を休止しています。',false);}});
 }
 addControl(button:HTMLButtonElement):void{this.overlay.querySelector('.pause-card')?.append(button);}
 get paused():boolean{return this.keys.length>0;}
 private lastScene():PausableScene|undefined{const key=this.keys.at(-1);return key?this.game.scene.getScene(key) as PausableScene:gameplayScene(this.game);}
 checkpoint():boolean|null{try{const scene=this.lastScene();return scene?.saveAnywhere?scene.saveAnywhere(true):null;}catch{return false;}}
 pause(reason='操作を休止しています。',automatic=false):void{
  if(this.paused)return;
  const scenes=this.game.scene.getScenes(true).filter(s=>!['Boot'].includes(s.sys.settings.key));if(!scenes.length)return;
  const saved=automatic?this.checkpoint():null;
  this.keys=scenes.map(s=>s.sys.settings.key);for(const key of this.keys)this.game.scene.pause(key);
  const release=this.game.registry.get('releaseTouch') as (()=>void)|undefined;release?.();
  document.body.dataset.paused='true';this.overlay.hidden=false;this.saveButton.disabled=typeof this.lastScene()?.saveAnywhere!=='function';
  this.message.textContent=reason+(saved===true?' 中断データを別枠に保存しました。':saved===false?' 中断データを保存できませんでした。':'');this.renderMenuButton();music.setPaused(true);this.resumeButton.focus();
 }
 resume():void{
  if(!this.paused)return;const keys=this.keys;this.keys=[];this.overlay.hidden=true;document.body.dataset.paused='false';for(const key of keys)this.game.scene.resume(key);music.setPaused(false);this.resumeButton.blur();
 }
 private renderMenuButton():void{this.menuButton.textContent=`大きなタッチメニュー：${document.body.dataset.largeMenu==='false'?'OFF':'ON'}`;this.menuButton.setAttribute('aria-pressed',String(document.body.dataset.largeMenu!=='false'));}
}
function gameplayScene(game:Phaser.Game):PausableScene|undefined{return game.scene.getScenes(true).at(-1) as PausableScene|undefined;}
