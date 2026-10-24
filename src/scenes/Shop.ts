import Phaser from 'phaser';
import {state,save} from '../game/state';
import {shopCatalog,stockDefinition,isGear,gear,consumables,type StockId,type Gear} from '../game/economy/catalog';
import {count,trade} from '../game/economy/model';
import {heroes} from '../game/data';
import {bind,cancelKey,confirmKey,label,panel} from './shared';
import {uiButton} from './uiButton';
export class Shop extends Phaser.Scene{
 private kind:'items'|'equipment'='items';private side:'buy'|'sell'='buy';private index=0;private quantity=1;private notice='↑↓ 選択 / ←→ 売買 / Q・E 個数 / 決定で取引';private ui:Phaser.GameObjects.GameObject[]=[];
 constructor(){super('Shop')}
 create(data:{kind?:'items'|'equipment'}={}):void{this.kind=data.kind??'items';this.side='buy';this.index=0;this.quantity=1;this.notice='いらっしゃい！ 装備は購入後「どうぐ・装備」で身につけられます。';this.ui=[];this.draw();bind(this,e=>this.key(e));}
 saveAnywhere():boolean{return save();}
 private entries():StockId[]{return this.side==='buy'?shopCatalog[this.kind]:shopCatalog[this.kind].filter(id=>count(state,id)>0);}
 private button(x:number,y:number,w:number,h:number,text:string,fn:()=>void,selected=false):void{this.ui.push(...uiButton(this,x,y,w,h,text,fn,selected));}
 private draw():void{
  this.ui.forEach(o=>o.destroy());this.ui=[];this.ui.push(panel(this,20,17,600,329),label(this,40,30,this.kind==='items'?'ふくふく海鮮店 / 道具':'こすぎ旅道具店 / 装備',18,'#efd092'),label(this,600,67,`${state.money} G`,13).setOrigin(1,0),label(this,40,83,this.notice,10,'#e3d6b4').setWordWrapWidth(552));
  this.button(83,65,86,27,'買う',()=>{this.side='buy';this.index=0;this.draw();},this.side==='buy');this.button(175,65,86,27,'売る',()=>{this.side='sell';this.index=0;this.draw();},this.side==='sell');
  this.button(297,65,128,27,`個数 ×${this.quantity}`,()=>{this.quantity=this.quantity===1?5:1;this.draw();});this.button(575,33,65,27,'戻る',()=>this.close());
  const entries=this.entries();this.index=Math.min(this.index,Math.max(0,entries.length-1));const page=Math.floor(this.index/4),pages=Math.max(1,Math.ceil(entries.length/4));
  for(let row=0;row<4;row++){
   const i=page*4+row,id=entries[i];if(!id)continue;const def=stockDefinition(id),price=this.side==='buy'?def.price:Math.floor(def.price/2);
   this.button(198,130+row*39,315,34,`${def.name}  ${price}G  [${count(state,id)}]`,()=>{this.index=i;this.draw();},this.index===i);
  }
  if(!entries.length)this.ui.push(label(this,45,128,'売れる品はありません。\n装備中の品は、外してから売ってください。',11));
  const id=entries[this.index];
  if(id){
   const def=stockDefinition(id);let detail:string;
   if(isGear(id)){const item=gear[id] as Gear;const names:Record<string,string>={hp:'HP',mp:'MP',attack:'攻撃',magic:'魔法',defense:'防御',speed:'すばやさ'};detail=Object.entries(item.bonuses).map(([key,n])=>`${names[key]} +${n}`).join(' / ')+'\n装備できる仲間：\n'+item.allowed.map(h=>heroes[h].name).join('\n');}
   else detail=consumables[id].description;
   const price=(this.side==='buy'?def.price:Math.floor(def.price/2))*this.quantity;
   this.ui.push(label(this,375,116,def.name,14,'#f3cf8b'),label(this,375,146,detail,11).setLineSpacing(1).setWordWrapWidth(218),label(this,375,236,`合計 ${price} G`,14));
   this.button(481,277,214,34,this.side==='buy'?'購入する':'売却する',()=>this.transact());
  }
  this.button(86,304,88,27,'前の頁',()=>{this.index=Math.max(0,(page-1)*4);this.draw();});this.button(274,304,88,27,'次の頁',()=>{this.index=Math.min(Math.max(0,entries.length-1),(page+1)*4);this.draw();});this.ui.push(label(this,183,299,`${page+1}/${pages}`,11).setOrigin(.5,0));
 }
 private transact():void{const id=this.entries()[this.index];if(!id)return;this.notice=trade(state,id,this.side,this.quantity).text;this.draw();}
 private key(e:KeyboardEvent):void{
  if(e.repeat)return;if(cancelKey(e)){this.close();return;}
  const n=this.entries().length;
  if(['ArrowUp','KeyW','ArrowDown','KeyS'].includes(e.code)&&n){this.index=(this.index+(['ArrowUp','KeyW'].includes(e.code)?n-1:1))%n;this.draw();}
  if(['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code)){this.side=this.side==='buy'?'sell':'buy';this.index=0;this.draw();}
  if(['KeyQ','KeyE'].includes(e.code)){this.quantity=this.quantity===1?5:1;this.draw();}
  if(confirmKey(e))this.transact();
 }
 private close():void{this.scene.resume('Field');this.scene.stop();}
}
