import { heroes, spells, type EnemyId } from './data';
import { maxHp, maxMp, type State } from './state';
import { AtbClock, type AtbActor } from './combat/atb';
import { ActionQueue } from './combat/queue';
import { battleItems, bossPhases, combatEnemies, heroSpeed, spellElements, type BattleItem, type Element } from './combat/data';
export type Command='attack'|'magic'|'item'|'guard'|'flee';
export type Effect='hit'|'thunder'|'water'|'heal'|'void'|'revive'|'guard'|'flee'|'sweep';
export interface Foe {kind:EnemyId;hp:number;phase:number;actions:number}
export interface Action {side:'hero'|'enemy';actor:number;command:Command;target:number;item:BattleItem}
export interface BattleEvent {ok:boolean;text:string;effect?:Effect;heroes:number[];enemies:number[];amount?:number}
export interface Rewards {xp:number;money:number;drops:Partial<Record<BattleItem,number>>;levels:string[]}
const key=(side:'hero'|'enemy',index:number)=>`${side}:${index}`;
const failure=(text:string):BattleEvent=>({ok:false,text,heroes:[],enemies:[]});
/** Simulation controller. Only tick advances gauges; resolveNext executes one queued action. */
export class Battle {
  readonly clock=new AtbClock();
  readonly queue=new ActionQueue<Action>();
  readonly foes:Foe[];
  readonly guards=new Set<number>();
  private escaped=false;
  private escapeAttempts=0;
  private rewards:Rewards|null=null;
  constructor(readonly state:State,formation:EnemyId[]|EnemyId,private readonly random:()=>number=Math.random){
    const kinds=typeof formation==='string'?[formation]:formation;
    if(kinds.length<1||kinds.length>4||kinds.some(kind=>!combatEnemies[kind]))throw new Error('Formation must contain 1–4 defined enemies');
    this.foes=kinds.map(kind=>({kind,hp:combatEnemies[kind].hp,phase:0,actions:0}));
    state.party.forEach((_,i)=>this.clock.set(key('hero',i),.35));
    this.foes.forEach((_,i)=>this.clock.set(key('enemy',i),.05));
  }
  get boss():boolean{return this.foes.some(f=>f.kind==='king')}
  get outcome():'win'|'lose'|'escape'|null{
    if(this.escaped)return 'escape';
    if(this.state.party.every(m=>m.hp<=0))return 'lose';
    if(this.foes.every(f=>f.hp<=0))return 'win';
    return null;
  }
  get readyHeroes():number[]{return this.state.party.flatMap((m,i)=>m.hp>0&&this.clock.value(key('hero',i))>=1&&!this.queue.has(key('hero',i))?[i]:[])}
  gauge(side:'hero'|'enemy',index:number):number{return this.clock.value(key(side,index))}
  private speed(side:'hero'|'enemy',index:number):number{
    if(side==='hero'){const m=this.state.party[index];return heroSpeed[m.id]+m.level-1;}
    const f=this.foes[index];return combatEnemies[f.kind].speed*(f.kind==='king'?bossPhases[f.phase].speed:1);
  }
  tick(deltaMs:number,selecting=false):void{
    if(this.outcome)return;
    const actors:AtbActor[]=[];
    this.state.party.forEach((m,i)=>actors.push({id:key('hero',i),speed:this.speed('hero',i),alive:m.hp>0,queued:this.queue.has(key('hero',i))}));
    this.foes.forEach((f,i)=>actors.push({id:key('enemy',i),speed:this.speed('enemy',i),alive:f.hp>0,queued:this.queue.has(key('enemy',i))}));
    this.clock.advance(deltaMs,actors,this.state.atbMode==='wait'&&selecting);
    this.foes.forEach((f,i)=>{if(f.hp>0&&this.gauge('enemy',i)>=1)this.queue.enqueue(key('enemy',i),{side:'enemy',actor:i,command:'attack',target:0,item:'bowl'})});
  }
  count(item:BattleItem):number{return item==='bowl'?this.state.bowls:this.state.inventory[item]}
  resistance(index:number,element:Element):number{
    const f=this.foes[index];
    if(f.kind==='king'&&f.phase===1){if(element==='water')return .5;if(element==='dark')return 1.5;}
    return combatEnemies[f.kind].resists[element]??1;
  }
  private validate(action:Action):string|null{
    const m=this.state.party[action.actor];
    if(!m||m.hp<=0)return '戦闘不能の仲間は行動できない。';
    if(action.command==='magic'&&m.mp<spells[heroes[m.id].spell].cost)return 'MP不足！ 防御でMPを回復できます。';
    if(action.command==='flee'&&this.boss)return 'ボス戦からは逃げられません。';
    if(action.command==='item'){
      if(this.count(action.item)<1)return 'そのアイテムは持っていません。';
      const t=this.state.party[action.target];
      if(!t)return '対象を選んでください。';
      if(action.item==='revive'&&t.hp>0)return '目覚めの塩は戦闘不能の仲間に使えます。';
      if(action.item!=='revive'&&t.hp<=0)return '戦闘不能の仲間には目覚めの塩を使ってください。';
    }
    return null;
  }
  submit(actor:number,command:Command,target=0,item:BattleItem='bowl'):BattleEvent{
    if(this.outcome)return failure('戦闘は終了しています。');
    if(!this.readyHeroes.includes(actor))return failure('ATBが満タンになるまで待ってください。');
    const action:Action={side:'hero',actor,command,target,item};
    const invalid=this.validate(action);
    if(invalid)return failure(invalid);
    this.queue.enqueue(key('hero',actor),action);
    return {ok:true,text:'行動を予約しました。',heroes:[],enemies:[]};
  }
  resolveNext():BattleEvent|null{
    if(this.outcome){this.queue.clear();return null;}
    const action=this.queue.shift();
    if(!action)return null;
    const actorKey=key(action.side,action.actor);
    if(action.side==='enemy'){
      this.clock.set(actorKey,0);
      if(this.foes[action.actor].hp<=0)return failure('倒れた敵の行動はキャンセルされた。');
      return this.enemyAction(action.actor);
    }
    const invalid=this.validate(action);
    if(invalid){if(this.state.party[action.actor].hp<=0)this.clock.set(actorKey,0);return failure(invalid);}
    this.clock.set(actorKey,0);
    if(action.command!=='guard')this.guards.delete(action.actor);
    const result=this.heroAction(action);
    if(this.outcome)this.queue.clear();
    return result;
  }
  private heroAction(a:Action):BattleEvent{
    const m=this.state.party[a.actor],h=heroes[m.id];
    const base:BattleEvent={ok:true,text:'',heroes:[],enemies:[]};
    if(a.command==='guard'){
      this.guards.add(a.actor);m.mp=Math.min(maxMp(m),m.mp+3);
      return {...base,text:`${h.name}は防御！ 次の行動まで被ダメージ軽減・MP+3。`,effect:'guard',heroes:[a.actor]};
    }
    if(a.command==='flee'){
      this.escapeAttempts++;
      const average=this.state.party.filter(t=>t.hp>0).reduce((sum,t)=>sum+heroSpeed[t.id],0)/this.state.party.filter(t=>t.hp>0).length;
      const chance=Math.min(.9,Math.max(.35,.6+(average-this.speed('enemy',0))*.02));
      this.escaped=this.escapeAttempts>=3||this.random()<chance;
      return {...base,text:this.escaped?'うまく逃げきった！':'逃げられなかった！',effect:'flee',heroes:[a.actor]};
    }
    if(a.command==='item'){
      if(a.item==='bowl')this.state.bowls--;else this.state.inventory[a.item]--;
      const t=this.state.party[a.target];
      if(a.item==='revive'){
        t.hp=Math.ceil(maxHp(t)/2);this.clock.set(key('hero',a.target),0);this.guards.delete(a.target);
      }else if(a.item==='bowl')t.hp=Math.min(maxHp(t),t.hp+80);
      else t.mp=Math.min(maxMp(t),t.mp+25);
      return {...base,text:`${heroes[t.id].name}に${battleItems[a.item].name}！ ${a.item==='revive'?'蘇生した！':a.item==='ether'?'MP25回復！':'HP80回復！'}`,effect:a.item==='revive'?'revive':'heal',heroes:[a.target]};
    }
    let damage=h.atk+(m.level-1)*4+Math.floor(this.random()*7),element:Element='physical',effect:Effect='hit';
    if(a.command==='magic'){
      const spell=spells[h.spell];m.mp-=spell.cost;damage=spell.power+(m.level-1)*5;effect=h.spell;
      if(h.spell==='heal'){
        const targets=this.state.party.flatMap((t,i)=>{if(t.hp<=0)return [];t.hp=Math.min(maxHp(t),t.hp+damage);return [i]});
        return {...base,text:`もふもふヒール！ 生存中の全員のHP${damage}回復！`,effect,heroes:targets,amount:damage};
      }
      element=spellElements[h.spell]??'physical';
    }
    // An enemy may fall while this action waits: automatically retarget a living one.
    const index=this.foes[a.target]?.hp>0?a.target:this.foes.findIndex(f=>f.hp>0);
    const f=this.foes[index];
    const multiplier=this.resistance(index,element);
    damage=Math.max(1,Math.floor(damage*multiplier));f.hp=Math.max(0,f.hp-damage);
    const phase=this.updateBossPhase(f);
    if(f.hp===0){this.clock.set(key('enemy',index),0);this.queue.cancel(key('enemy',index));}
    return {...base,text:`${a.command==='magic'?spells[h.spell].name:h.name+'の攻撃'}！ ${combatEnemies[f.kind].name}に${damage}！${multiplier>1?' 弱点！':multiplier<1?' 耐性あり。':''}${phase}`,effect,enemies:[index],amount:damage};
  }
  private updateBossPhase(f:Foe):string{
    if(f.kind!=='king'||f.hp<=0)return '';
    const ratio=f.hp/combatEnemies.king.hp;
    const phase=Math.max(f.phase,ratio>bossPhases[0].threshold?0:ratio>bossPhases[1].threshold?1:2);
    if(phase===f.phase)return '';
    f.phase=phase;f.actions=0;return ` 【形態${phase+1}：${bossPhases[phase].name}】`;
  }
  private enemyAction(index:number):BattleEvent{
    const f=this.foes[index],def=combatEnemies[f.kind];
    const alive=this.state.party.flatMap((m,i)=>m.hp>0?[i]:[]);
    const pattern=f.kind==='king'?bossPhases[f.phase].pattern:['attack'];
    const command=pattern[f.actions++%pattern.length];
    const targets=command==='sweep'?alive:[alive[Math.floor(this.random()*alive.length)]];
    const hits:string[]=[];
    let total=0;
    for(const i of targets){
      const m=this.state.party[i];
      const damage=Math.max(1,Math.floor((def.atk+f.phase*3+Math.floor(this.random()*5))*(this.guards.has(i)?.4:1)));
      m.hp=Math.max(0,m.hp-damage);total+=damage;hits.push(`${heroes[m.id].name} ${damage}`);
      if(m.hp<=0){this.clock.set(key('hero',i),0);this.queue.cancel(key('hero',i));this.guards.delete(i);}
    }
    if(command==='drain')f.hp=Math.min(def.hp,f.hp+Math.floor(total*.6));
    return {ok:true,text:`${def.name}の${command==='sweep'?'モフモフ大旋風':command==='drain'?'綿わたドレイン':'攻撃'}！ ${hits.join(' / ')}`,effect:command==='sweep'?'sweep':'hit',heroes:targets,enemies:[],amount:total};
  }
  reward():Rewards|null{
    if(this.outcome!=='win')return null;
    if(this.rewards)return this.rewards;
    const xp=this.foes.reduce((sum,f)=>sum+combatEnemies[f.kind].xp,0),money=this.foes.reduce((sum,f)=>sum+combatEnemies[f.kind].money,0);
    const drops:Partial<Record<BattleItem,number>>={},levels:string[]=[];
    for(const f of this.foes){const drop=combatEnemies[f.kind].drop;if(f.kind==='king'||this.random()<.6)drops[drop]=(drops[drop]??0)+1;}
    // One guaranteed bowl per victory keeps first-chapter recovery sustainable.
    drops.bowl=(drops.bowl??0)+1;
    this.state.money=Math.min(99999999,this.state.money+money);
    for(const [item,count] of Object.entries(drops)){if(item==='bowl')this.state.bowls=Math.min(99999999,this.state.bowls+count);else this.state.inventory[item as 'revive'|'ether']=Math.min(99999999,this.state.inventory[item as 'revive'|'ether']+count);}
    for(const m of this.state.party){m.xp=Math.min(99999999,m.xp+xp);while(m.level<99&&m.xp>=m.level*35){m.xp-=m.level*35;m.level++;m.hp=maxHp(m);m.mp=maxMp(m);levels.push(`${heroes[m.id].name} Lv.${m.level}`);}}
    this.rewards={xp,money,drops,levels};return this.rewards;
  }
}
