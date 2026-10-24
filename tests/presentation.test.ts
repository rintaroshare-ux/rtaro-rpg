import {test} from 'node:test';
import assert from 'node:assert/strict';
import {partyPoint,enemyPoint} from '../src/graphics/battleLayout';
import {tracks,fieldTrack,battleTrack} from '../src/audio/tracks';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('all enemies are on the left and four allies fit the right battlefield',()=>{
 for(let count=1;count<=4;count++)for(let i=0;i<count;i++){const e=enemyPoint(i,count);assert.ok(e.x>40&&e.x<400);assert.ok(e.y>55&&e.y<170);}
 const allies=Array.from({length:4},(_,i)=>partyPoint(i));assert.ok(allies.every(p=>p.x>470&&p.x<570&&p.y>=60&&p.y+24<211));assert.equal(new Set(allies.map(p=>p.y)).size,4);
});
test('fifteen distinct external music assets and compositions replace the old oscillator scores',()=>{
 const compositions=JSON.parse(readFileSync(new URL('../public/audio/compositions.json',import.meta.url),'utf8'));
 const hashes=new Set<string>();assert.equal(Object.keys(tracks).length,15);assert.equal(compositions.length,15);
 for(const track of Object.values(tracks)){const bytes=readFileSync(new URL('../public/audio/'+track.file,import.meta.url));assert.equal(bytes.subarray(0,4).toString(),'OggS');assert.ok(bytes.length>10000);hashes.add(createHash('sha256').update(bytes).digest('hex'));}
 assert.equal(hashes.size,15);assert.equal(new Set(compositions.map((c:{motif:number[]})=>JSON.stringify(c.motif))).size,15);
 assert.equal(fieldTrack('home'),'field');assert.equal(fieldTrack('airport'),'airport');assert.equal(fieldTrack('cloud'),'sky');assert.equal(fieldTrack('fjord'),'oslo');assert.equal(fieldTrack('boardroom'),'office');
 assert.equal(battleTrack(['dad'],true),'final');assert.equal(battleTrack(['skyMid'],true),'elite');assert.equal(battleTrack(['king'],true),'boss');
});
