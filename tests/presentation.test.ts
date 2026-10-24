import {test} from 'node:test';
import assert from 'node:assert/strict';
import {partyPoint,enemyPoint} from '../src/graphics/battleLayout';
import {scores,midiHz} from '../src/audio/scores';
test('all enemies are on the left and four allies fit the right battlefield',()=>{
 for(let count=1;count<=4;count++)for(let i=0;i<count;i++){const e=enemyPoint(i,count);assert.ok(e.x>40&&e.x<400);assert.ok(e.y>55&&e.y<170);}
 const allies=Array.from({length:4},(_,i)=>partyPoint(i));assert.ok(allies.every(p=>p.x>470&&p.x<570&&p.y>=60&&p.y+24<211));assert.equal(new Set(allies.map(p=>p.y)).size,4);
});
test('original music scores contain valid complete phrases and supported MIDI notes',()=>{
 for(const score of Object.values(scores)){assert.ok(score.bpm>=60&&score.bpm<=180);assert.ok(score.notes.length>=16&&score.notes.length%8===0);assert.ok(score.roots.length>0);assert.ok(score.notes.every(n=>Number.isInteger(n)&&n>=0&&n<=100));}
 assert.equal(midiHz(69),440);assert.ok(Math.abs(midiHz(81)-880)<.01);assert.notDeepEqual(scores.battle.notes,scores.boss.notes);
});
