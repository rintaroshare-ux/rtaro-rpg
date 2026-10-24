export const WIDTH=640, HEIGHT=360, SPEED=115, SAVE_KEY='rintaro.chapter1.v3';
export const PREVIOUS_SAVE_KEY='rintaro.chapter1.v2';
export const LEGACY_SAVE_KEY='rintaro.chapter1.v1';
export type HeroId='rintaro'|'marmot'|'fugu'|'vanilla';
export type SpellId='thunder'|'water'|'heal'|'void';
export const heroes:Record<HeroId,{name:string;hp:number;mp:number;atk:number;spell:SpellId;color:number}>={
 rintaro:{name:'R太郎',hp:125,mp:35,atk:19,spell:'thunder',color:0xed7358},
 marmot:{name:'マーモット',hp:110,mp:48,atk:12,spell:'heal',color:0xc19b68},
 fugu:{name:'ふぐ',hp:105,mp:42,atk:14,spell:'water',color:0x72c4df},
 vanilla:{name:'ヴァニラ・アイス',hp:135,mp:36,atk:23,spell:'void',color:0xa18bd4}
};
export const spells:Record<SpellId,{name:string;cost:number;power:number;color:number}>={thunder:{name:'サンダー',cost:5,power:37,color:0xffdf70},water:{name:'ウォーターバースト',cost:6,power:43,color:0x69d3ff},heal:{name:'もふもふヒール',cost:7,power:65,color:0x8ff0a1},void:{name:'亜空間攻撃',cost:8,power:58,color:0x9676d9}};
export const enemies={bear:{name:'くまのぬいぐるみ',texture:'bear'},rabbit:{name:'うさぎのぬいぐるみ',texture:'rabbit'},king:{name:'モフモフキング',texture:'king'}};
export type EnemyId=keyof typeof enemies;
export type MapId='home'|'park'|'market'|'station';
export interface Person {x:number;y:number;name:string;texture:string;lines:string[];join?:HeroId;event?:'boss'|'shop';shop?:'items'|'equipment'}
export interface MapDef {name:string;subtitle:string;color:number;path:number;people:Person[];buildings:{x:number;y:number;w:number;h:number;label:string;color:number}[];}
export const order:MapId[]=['home','park','market','station'];
export const maps:Record<MapId,MapDef>={
 home:{name:'R太郎の家',subtitle:'冒険は、いつも「ただいま」の場所から。',color:0x80b98a,path:0xe6cf9e,people:[{x:270,y:270,name:'ママ',texture:'mom',lines:['パパ、ノルウェーでお仕事が大変みたい。','この「伝説の海鮮丼」を届けてあげて。冷めない魔法つきよ！','したく金100Gは一度だけよ。まずは東の公園へ！']},{x:420,y:150,name:'ベッド',texture:'bed',lines:['ふかふかのベッドで、ひと休み。','みんなのHPとMPが全回復した！']}],buildings:[{x:170,y:85,w:180,h:130,label:'R太郎の家',color:0xe7ab82},{x:610,y:100,w:180,h:120,label:'おとなりさん',color:0xe5cf83}]},
 park:{name:'こすぎの公園',subtitle:'ぬいぐるみたちが、なんだかそわそわ。',color:0x78b989,path:0xe4d3a3,people:[{x:220,y:280,name:'マーモット',texture:'marmot',join:'marmot',lines:['た、助けて！ ぬいぐるみが急に動きだしたんだ。','ぼくはマーモット。ふわふわの回復なら任せて！','マーモットが仲間になった！ 次は商店街へ行こう。']},{x:520,y:300,name:'公園のおじさん',texture:'old',lines:['草地を歩くと、ぬいぐるみが現れるよ。道や人のそばは安全だ。','魔法はMPを使う。防御するとMPが3回復するぞ。','商店街のふぐくんが、不思議な水を研究しているらしい。']}],buildings:[{x:395,y:70,w:160,h:110,label:'こすぎの池',color:0x65bacc}]},
 market:{name:'こすぎ商店街',subtitle:'本日のおすすめ：勇気、ひとつ。',color:0x99b6a0,path:0xe3c6a0,people:[{x:270,y:290,name:'ふぐ',texture:'fugu',join:'fugu',lines:['ぼくの水魔法で、おさかなの鮮度はいつでも抜群！','ノルウェーへ？ おいしい冒険の予感がするね。','ふぐが仲間になった！ 駅前で不思議な人が待っている。']},{x:540,y:290,name:'魚屋さん',texture:'mom',event:'shop',shop:'items',lines:['海鮮丼、持っていきな！ 冒険する子は大歓迎だ。','海鮮丼を3個もらった！ HPが80回復するよ。']},{x:700,y:290,name:'旅道具屋',texture:'old',event:'shop',shop:'equipment',lines:['駅前のモフモフキングが、ぬいぐるみを操っているんだ。','4人そろったら駅前広場のベルを調べよう。回復と防御も忘れずにね。']}],buildings:[{x:160,y:80,w:175,h:140,label:'さかなの ふくふく',color:0xe99b88},{x:390,y:80,w:160,h:140,label:'こすぎベーカリー',color:0xe8c66c},{x:620,y:80,w:160,h:140,label:'喫茶 しおかぜ',color:0x94bcce}]},
 station:{name:'武蔵小杉駅',subtitle:'旅立ちのホームに、モフモフの影。',color:0x98b4a5,path:0xd3c9b3,people:[{x:490,y:235,name:'広場のベル',texture:'bell',event:'boss',lines:['広場のベルを鳴らした！ モフモフキングが現れた！']},{x:240,y:300,name:'ヴァニラ・アイス',texture:'vanilla',join:'vanilla',lines:['我が名はヴァニラ・アイス。闇の向こうから来た旅人。','……その海鮮丼、いい香りだな。同行させてもらおう。','ヴァニラ・アイスが仲間になった！ 北の広場のベルでキングを呼ぼう。']},{x:730,y:310,name:'駅員さん',texture:'old',lines:['空港へ行く道が、ぬいぐるみにふさがれてしまってね。','北の広場のベルを調べるとキングが現れるよ。どうか頼んだ！']}],buildings:[{x:325,y:65,w:340,h:110,label:'武蔵小杉駅 → 羽田空港',color:0xa8b9c5}]}
};
