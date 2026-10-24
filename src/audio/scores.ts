/** Archived Phase 1 score data. Not imported by the runtime music player. */
export type TrackId='title'|'field'|'battle'|'boss'|'victory'|'defeat';
export interface Score {name:string;bpm:number;notes:readonly number[];roots:readonly number[];drums:boolean;loop:boolean}
// Original eight-bar melodies. MIDI 0 = rest. No borrowed tunes or recordings.
const journey=[72,76,79,76,74,72,69,67, 69,72,76,79,81,79,76,0, 74,77,81,77,76,74,71,69, 67,71,74,79,76,74,72,0,
 76,79,84,83,81,79,76,72, 74,76,79,81,79,76,74,0, 72,69,65,69,72,76,74,71, 72,76,79,76,74,71,72,0];
const skirmish=[74,0,77,81,79,77,74,72, 74,77,79,81,84,81,79,77, 76,0,79,83,81,79,76,74, 72,76,79,76,74,72,69,0,
 81,79,77,74,77,79,81,84, 86,84,81,79,77,74,72,69, 70,74,77,81,79,77,74,72, 69,72,76,79,77,76,74,0];
const royal=[64,67,71,76,74,71,67,66, 64,0,71,74,76,79,78,76, 72,76,79,83,81,79,76,72, 71,69,66,63,66,69,71,0,
 76,79,83,86,83,79,78,76, 74,78,81,84,81,78,74,71, 72,76,79,76,74,72,69,66, 67,71,74,71,67,66,64,0];
export const scores:Record<TrackId,Score>={
 title:{name:'海を越える小さな約束',bpm:96,notes:journey,roots:[48,45,53,55,48,45,53,55],drums:false,loop:true},
 field:{name:'こすぎの散歩道',bpm:112,notes:journey,roots:[48,45,53,55,48,45,53,55],drums:true,loop:true},
 battle:{name:'ぬいぐるみ大行進',bpm:148,notes:skirmish,roots:[38,46,41,45,38,46,43,45],drums:true,loop:true},
 boss:{name:'モフモフの王冠',bpm:158,notes:royal,roots:[40,40,48,47,40,50,48,47],drums:true,loop:true},
 victory:{name:'ひとさじの勇気',bpm:128,notes:[72,76,79,84,0,79,81,84,86,84,81,79,76,79,84,0,79,81,84,88,86,84,81,79,76,79,84,0,84,0,0,0],roots:[48,53,55,48],drums:false,loop:false},
 defeat:{name:'また、家から',bpm:76,notes:[72,0,69,67,65,0,64,0,62,0,64,67,60,0,0,0],roots:[45,41],drums:false,loop:false},
};
export const midiHz=(note:number):number=>440*2**((note-69)/12);
