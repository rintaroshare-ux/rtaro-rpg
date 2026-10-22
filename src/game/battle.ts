import {enemies,heroes,spells,type EnemyId} from './data';
import {maxHp,maxMp,type State} from './state';
export type Command='attack'|'magic'|'item'|'guard';
export class Battle {
 hp:number;turn=1;guard=new Set<number>();
 constructor(public state:State,public kind:EnemyId,private random= Math.random){this.hp=enemies[kind].hp}
 get alive(){return this.state.party.map((m,i)=>({m,i})).filter(({m})=>m.hp>0)}
 get won(){return this.hp<=0}get lost(){return this.alive.length===0}
 act(index:number,command:Command,target=index):{ok:boolean;text:string;effect?:string;amount?:number}{const m=this.state.party[index];if(!m||m.hp<=0)return {ok:false,text:'動けない！'};const h=heroes[m.id],s=spells[h.spell];let amount=0;let text='';let effect:string|undefined;
 if(command==='attack'){amount=h.atk+(m.level-1)*4+Math.floor(this.random()*7);this.hp=Math.max(0,this.hp-amount);text=`${h.name}の攻撃！ ${amount}ダメージ！`;effect='hit'}
 if(command==='magic'){if(m.mp<s.cost)return{ok:false,text:'MPが足りない！ 防御でMPを回復できる。'};m.mp-=s.cost;amount=s.power+(m.level-1)*5;effect=h.spell;if(h.spell==='heal'){this.state.party.forEach(t=>{if(t.hp>0)t.hp=Math.min(maxHp(t),t.hp+amount)});text=`${s.name}！ 全員のHPを${amount}回復！`}else{this.hp=Math.max(0,this.hp-amount);text=`${s.name}！ ${amount}ダメージ！`}}
 if(command==='item'){if(this.state.bowls<=0)return{ok:false,text:'海鮮丼がない！'};const t=this.state.party[target];if(!t)return{ok:false,text:'相手を選んでね。'};this.state.bowls--;t.hp=Math.min(maxHp(t),t.hp+80);text=`${heroes[t.id].name}に海鮮丼！ HP80回復！`;effect='heal'}
 if(command==='guard'){this.guard.add(index);m.mp=Math.min(maxMp(m),m.mp+3);text=`${h.name}は身を守った。MPが3回復！`}
 return {ok:true,text,effect,amount}}
 enemyTurn(){const lines:string[]=[];const attacks=this.kind==='king'&&this.turn%3===0?this.alive.length:1;for(let n=0;n<attacks;n++){const alive=this.alive;if(!alive.length)break;const target=attacks>1?alive[Math.min(n,alive.length-1)]:alive[Math.floor(this.random()*alive.length)];const damage=Math.max(1,Math.floor((enemies[this.kind].atk+Math.floor(this.random()*7))*(this.guard.has(target.i)?0.4:1)));target.m.hp=Math.max(0,target.m.hp-damage);lines.push(`${heroes[target.m.id].name}に${damage}ダメージ！`)}this.guard.clear();this.turn++;return `${attacks>1?'モフモフ大旋風！':enemies[this.kind].name+'の攻撃！'} ${lines.join(' ')}`}
 reward(){const lines:string[]=[];this.state.party.forEach(m=>{m.xp+=enemies[this.kind].xp;while(m.xp>=m.level*35){m.xp-=m.level*35;m.level++;m.hp=maxHp(m);m.mp=maxMp(m);lines.push(`${heroes[m.id].name}はレベル${m.level}になった！`)}});this.state.bowls++;return lines}
}
