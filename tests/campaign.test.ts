import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,member,migrateSave} from '../src/game/state';
import {chapters,journeyMaps} from '../src/game/campaignData';
import {enterChapter,completeQuest,gateReady,recordCampaignVictory,deliver,resumeScene,checkpoint,campaignFormation} from '../src/game/campaign';
import {Battle} from '../src/game/battle';
test('all four chapters gate progress, reward tasks once, save every map and deliver only after dad',()=>{
 const s=fresh();assert.equal(enterChapter(s,0),false);s.flags.push('clear');s.party=['rintaro','marmot','fugu','vanilla'].map(id=>member(id as 'rintaro',3));assert.equal(deliver(s),false);
 for(let i=0;i<4;i++){const c=chapters[i];assert.ok(enterChapter(s,i));assert.equal(resumeScene(s),'Campaign');assert.equal(gateReady(s),false);
  for(const q of c.quests){s.map=q.map;const before=s.money;assert.equal(completeQuest(s,q,(q.answer+1)%3).ok,false);assert.equal(s.money,before);assert.ok(completeQuest(s,q,q.answer).ok);assert.equal(completeQuest(s,q,q.answer).ok,false);assert.equal(s.money,before+55);assert.ok(migrateSave(JSON.parse(JSON.stringify(s))));}
  assert.ok(gateReady(s,true));recordCampaignVictory(s,[c.mid,c.boss]);assert.ok(campaignFormation(s,()=>.99).length<=3);
 }
 assert.ok(deliver(s));assert.equal(resumeScene(s),'Ending');assert.equal(journeyMaps.length,8);
});
test('defeat restores current chapter hub and every new boss is saved with valid AI phases',()=>{
 const s=fresh();s.flags=['clear'];s.party=[member('rintaro',9),member('marmot',9),member('fugu',9),member('vanilla',9)];
 for(const c of chapters){s.map=c.dungeon;s.party[0].hp=0;checkpoint(s);assert.equal(s.map,c.field);assert.ok(s.party.every(m=>m.hp>0));const b=new Battle(s,[c.boss as 'king']);assert.ok(b.boss);s.resumeBattle=b.snapshot();assert.ok(migrateSave(JSON.parse(JSON.stringify(s))));s.resumeBattle=null;}
});
test('all eight campaign bosses can be beaten with quest-earned levels and real ATB simulation',()=>{
 const s=fresh();s.flags=['clear'];s.party=[member('rintaro',3),member('marmot',3),member('fugu',3),member('vanilla',3)];
 for(let cIndex=0;cIndex<chapters.length;cIndex++){const c=chapters[cIndex];enterChapter(s,cIndex);
  for(const q of c.quests){s.map=q.map;assert.ok(completeQuest(s,q,q.answer).ok);}
  for(const id of [c.mid,c.boss]){checkpoint(s);const b=new Battle(s,[id as 'king'],()=>.1),phases=new Set<number>();
   for(let t=0;t<18000&&!b.outcome;t++){b.tick(50,false);for(const i of b.readyHeroes){const m=s.party[i];b.submit(i,m.mp>=8?'magic':'attack');}let e=b.resolveNext();while(e){phases.add(b.foes[0].phase);e=b.resolveNext();}}
   assert.equal(b.outcome,'win',id);assert.ok(phases.has(1)&&phases.has(2),id);b.reward();recordCampaignVictory(s,[id]);
  }
 }
});
