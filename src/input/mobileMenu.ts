import type Phaser from 'phaser';
export interface MobileAction {id:string;label:string;detail?:string;selected?:boolean;disabled?:boolean;run:()=>void}
export interface MobileMenu {key:string;kind:'dialogue'|'commands'|'screen';title:string;description?:string;actions:MobileAction[];tabs?:MobileAction[];back?:()=>void}
export type MobileScene=Phaser.Scene&{getMobileMenu?:()=>MobileMenu|null};
/** Large DOM buttons supplement the unchanged canvas/keyboard UI on phones. */
export function setupMobileMenu(game:Phaser.Game):void{
 const panel=document.createElement('section');panel.id='mobile-panel';panel.hidden=true;panel.setAttribute('aria-label','タッチメニュー');document.body.append(panel);
 let signature='',pressed=false,latest:MobileMenu|null=null,renderedKey='';
 panel.addEventListener('pointerdown',()=>{pressed=true;});
 const release=()=>setTimeout(()=>{pressed=false;},0);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',()=>{pressed=false;});
 const metadata=(a:MobileAction)=>({id:a.id,label:a.label,detail:a.detail,selected:a.selected,disabled:a.disabled});
 const makeButton=(action:MobileAction,tab=false)=>{
  const button=document.createElement('button');button.type='button';button.dataset.action=action.id;button.disabled=!!action.disabled;button.className=action.selected?'selected':'';
  const name=document.createElement('span');name.textContent=action.label;button.append(name);
  if(action.detail){const detail=document.createElement('small');detail.textContent=action.detail;button.append(detail);}
  button.setAttribute('aria-pressed',String(!!action.selected));
  button.addEventListener('click',()=>{const active=game.scene.getScenes(true).at(-1) as MobileScene|undefined;const now=active?.getMobileMenu?.();if(!now||now.key!==renderedKey)return;const current=(tab?now.tabs:now.actions)?.find(a=>a.id===action.id);if(current&&!current.disabled)current.run();});return button;
 };
 game.events.on('step',()=>{
  const enabled=document.body.dataset.touch==='true'&&document.body.dataset.largeMenu!=='false'&&document.body.dataset.paused!=='true';
  const scene=game.scene.getScenes(true).at(-1) as MobileScene|undefined;
  latest=enabled?(scene?.getMobileMenu?.()??null):null;
  if(!latest){panel.hidden=true;document.body.dataset.menuKind='';signature='';return;}
  const key=JSON.stringify({key:latest.key,kind:latest.kind,title:latest.title,description:latest.description,actions:latest.actions.map(metadata),tabs:latest.tabs?.map(metadata)});
  if(pressed||signature===key)return;signature=key;renderedKey=latest.key;panel.hidden=false;panel.dataset.kind=latest.kind;document.body.dataset.menuKind=latest.kind;
  const header=document.createElement('div');header.className='mobile-menu-header';const title=document.createElement('strong');title.textContent=latest.title;header.append(title);
  if(latest.back){const back=document.createElement('button');back.type='button';back.textContent='戻る';back.dataset.action='back';back.addEventListener('click',()=>latest?.back?.());header.append(back);}
  const content=document.createElement('div');content.className='mobile-menu-body';
  if(latest.description){const description=document.createElement('p');description.textContent=latest.description;content.append(description);}
  if(latest.tabs?.length){const tabs=document.createElement('div');tabs.className='mobile-menu-tabs';latest.tabs.forEach(a=>tabs.append(makeButton(a,true)));content.append(tabs);}
  const actions=document.createElement('div');actions.className='mobile-menu-actions';latest.actions.forEach(a=>actions.append(makeButton(a)));content.append(actions);
  const scroll=panel.querySelector('.mobile-menu-body')?.scrollTop??0;panel.replaceChildren(header,content);content.scrollTop=scroll;
 });
}
