import {chapters,chapterFor,isJourneyMap,type Quest} from './campaignData';
import type {State} from './state';
import {maxHp,maxMp} from './state';
export const questFlag=(id:string)=>`quest:${id}`;
export const won=(s:State,id:string)=>s.flags.includes(`won:${id}`);
export function completeQuest(s:State,q:Quest,answer:number):{ok:boolean;text:string}{
 if(s.flags.includes(questFlag(q.id)))return {ok:false,text:'もう手伝ってくれたね。ありがとう！'};
 if(q.requires?.some(id=>!s.flags.includes(questFlag(id))))return {ok:false,text:'先にほかの人の話を聞いて、手がかりを集めよう。'};
 if(answer!==q.answer)return {ok:false,text:'もう一度、話の中の手がかりを考えよう。何度でも試せるよ。'};
 s.flags.push(questFlag(q.id));s.money=Math.min(99999999,s.money+55);const chapter=chapterFor(q.map)!;
 for(const m of s.party){m.xp+=70+chapter.level*12;while(m.level<99&&m.xp>=m.level*35){m.xp-=m.level*35;m.level++;}m.hp=maxHp(m);m.mp=maxMp(m);}
 return {ok:true,text:'ありがとう！ 問題がひとつ解決した。55Gと経験値を獲得し、全員回復！'};
}
export function gateReady(s:State,dungeon=false):boolean{const c=chapterFor(s.map);return !!c&&c.quests.filter(q=>q.map===(dungeon?c.dungeon:c.field)).every(q=>s.flags.includes(questFlag(q.id)));}
export function campaignFormation(s:State,random:()=>number=Math.random):string[]{
 const c=chapterFor(s.map);if(!c)return ['bear'];const avg=s.party.reduce((n,m)=>n+m.level,0)/s.party.length;
 const tier=Math.max(0,Math.min(2,Math.floor((avg-c.level)/2))),prefix=['airport','sky','oslo','office'][chapters.indexOf(c)];
 return Array.from({length:1+Math.min(2,Math.floor(random()*3))},()=>`${prefix}${Math.min(2,Math.max(0,tier+(random()>.7?1:0)))}`);
}
export function enterChapter(s:State,index:number):boolean{
 const c=chapters[index];if(!c)return false;
 if(index===0&&!s.flags.includes('clear'))return false;
 if(index>0&&!won(s,chapters[index-1].boss))return false;
 s.map=c.field;s.x=130;s.y=370;s.resumeBattle=null;if(!s.flags.includes('journey:started'))s.flags.push('journey:started');return true;
}
export function checkpoint(s:State):void{const c=chapterFor(s.map);if(c){s.map=c.field;s.x=130;s.y=370;}for(const m of s.party){m.hp=maxHp(m);m.mp=maxMp(m);}s.bowls=Math.max(3,s.bowls);s.inventory.ether=Math.max(3,s.inventory.ether);s.inventory.revive=Math.max(2,s.inventory.revive);s.resumeBattle=null;}
export function recordCampaignVictory(s:State,ids:string[]):void{for(const id of ids)if(!s.flags.includes(`won:${id}`))s.flags.push(`won:${id}`);}
export function deliver(s:State):boolean{if(!won(s,'dad'))return false;if(!s.flags.includes('delivered'))s.flags.push('delivered');return true;}
export function resumeScene(s:State):string{return s.resumeBattle?'Battle':s.flags.includes('delivered')?'Ending':isJourneyMap(s.map)?'Campaign':s.flags.includes('clear')?'Clear':'Field';}
