import type Phaser from 'phaser';
/** Always available during play, including dialogues, shops and battle animations. */
export function setupSaveControls(game:Phaser.Game):void{
 const root=document.createElement('div');root.id='save-controls';
 const button=document.createElement('button');button.type='button';button.id='quick-save';button.textContent='保存 [P]';button.setAttribute('aria-label','今の進行を保存');root.append(button);
 const notice=document.createElement('div');notice.id='save-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');document.body.append(root,notice);
 let timer:ReturnType<typeof setTimeout>|null=null;
 const scene=()=>game.scene.getScenes(true).at(-1) as (Phaser.Scene&{saveAnywhere?:()=>boolean})|undefined;
 const perform=()=>{
  const active=scene();if(!active?.saveAnywhere)return;
  try{const ok=active.saveAnywhere();notice.textContent=ok?(active.sys.settings.key==='Battle'?'戦闘の続きから再開できるよう保存しました':'保存しました'):'保存できませんでした。ブラウザの保存設定を確認してください。';}catch{notice.textContent='保存できませんでした。ゲームは続けられます。';}
  notice.classList.add('visible');if(timer)clearTimeout(timer);timer=setTimeout(()=>notice.classList.remove('visible'),3500);
 };
 button.addEventListener('click',()=>{perform();button.blur();});
 document.addEventListener('keydown',e=>{if(e.code==='KeyP'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopPropagation();perform();}});
 game.events.on('step',()=>{button.disabled=typeof scene()?.saveAnywhere!=='function';});
}
