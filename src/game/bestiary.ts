/** Original plush enemies. Balance stays close to the original chapter-one foes. */
interface PlushDefinition {name:string;hp:number;atk:number;speed:number;xp:number;money:number;resists:Partial<Record<'lightning'|'water'|'dark',number>>;drop:'bowl'|'ether'|'revive';color:number}
export const plushEnemies={
 bear:{name:'くまのぬいぐるみ',hp:65,atk:10,speed:10,xp:30,money:12,resists:{lightning:1.5,water:.65},drop:'bowl',color:0xc0926c},
 rabbit:{name:'うさぎのぬいぐるみ',hp:72,atk:11,speed:15,xp:36,money:16,resists:{water:1.5,dark:.65},drop:'ether',color:0xf2bad0},
 fox:{name:'いたずらキツネ',hp:70,atk:11,speed:16,xp:36,money:16,resists:{water:1.5},drop:'bowl',color:0xdb9558},
 cat:{name:'ねぼすけネコ',hp:62,atk:10,speed:14,xp:30,money:14,resists:{dark:1.5},drop:'ether',color:0x9299aa},
 dog:{name:'おつかいワンコ',hp:68,atk:10,speed:12,xp:32,money:14,resists:{lightning:1.5},drop:'bowl',color:0xd8b176},
 panda:{name:'もちもちパンダ',hp:85,atk:11,speed:9,xp:40,money:19,resists:{dark:1.5,water:.7},drop:'bowl',color:0xd9d9d4},
 penguin:{name:'ひんやりペンギン',hp:76,atk:11,speed:13,xp:38,money:17,resists:{lightning:1.5,water:.5},drop:'ether',color:0x405e83},
 owl:{name:'よふかしフクロウ',hp:70,atk:12,speed:15,xp:38,money:19,resists:{water:1.5,dark:.7},drop:'ether',color:0x9b80b0},
 seal:{name:'ぷかぷかアザラシ',hp:82,atk:11,speed:10,xp:40,money:18,resists:{lightning:1.5,water:.5},drop:'bowl',color:0xa9d3c9},
 turtle:{name:'のんびりカメ',hp:95,atk:12,speed:8,xp:44,money:20,resists:{lightning:1.5,dark:.7},drop:'bowl',color:0x7ca57a},
 frog:{name:'あまおとカエル',hp:72,atk:11,speed:17,xp:40,money:19,resists:{lightning:1.5,water:.5},drop:'ether',color:0x9bbb5d},
 sheep:{name:'くるくるヒツジ',hp:88,atk:11,speed:10,xp:42,money:20,resists:{dark:1.5},drop:'bowl',color:0xe1d3b0},
 raccoon:{name:'こそどろアライグマ',hp:78,atk:12,speed:15,xp:42,money:24,resists:{water:1.5},drop:'ether',color:0xa39080},
 hedgehog:{name:'ちくちくハリネズミ',hp:84,atk:12,speed:12,xp:42,money:20,resists:{water:1.5,lightning:.7},drop:'bowl',color:0xba956e},
 otter:{name:'かいがらラッコ',hp:80,atk:11,speed:14,xp:40,money:22,resists:{lightning:1.5,water:.5},drop:'ether',color:0xa57957},
 redPanda:{name:'しっぽレッサー',hp:86,atk:12,speed:15,xp:44,money:24,resists:{dark:1.5},drop:'revive',color:0xbd7953},
} satisfies Record<string,PlushDefinition>;
export type PlushEnemyId=keyof typeof plushEnemies;
export const plushIds=Object.keys(plushEnemies) as PlushEnemyId[];
export const plushNames=Object.fromEntries(plushIds.map(id=>[id,{name:plushEnemies[id].name,texture:id}])) as Record<PlushEnemyId,{name:string;texture:string}>;
