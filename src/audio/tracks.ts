export const tracks={
 title:{name:'海を越える約束',file:'title.ogg',loop:true},field:{name:'こすぎの小さな旅人',file:'field.ogg',loop:true},
 airport:{name:'北の翼の搭乗券',file:'airport.ogg',loop:true},sky:{name:'わたあめの航路',file:'sky.ogg',loop:true},
 oslo:{name:'雪どけの灯り',file:'oslo.ogg',loop:true},office:{name:'まだ明るい窓',file:'office.ogg',loop:true},
 battle:{name:'ほどけた糸の行進',file:'battle.ogg',loop:true},elite:{name:'道をふさぐもの',file:'elite.ogg',loop:true},
 boss:{name:'約束を越える勇気',file:'boss.ogg',loop:true},final:{name:'おかえりを聞かせて',file:'final.ogg',loop:true},
 shop:{name:'旅のポケット',file:'shop.ogg',loop:true},emotion:{name:'机の裏の家族の絵',file:'emotion.ogg',loop:true},
 victory:{name:'ひとさじの勝利',file:'victory.ogg',loop:false},ending:{name:'おなかいっぱいの帰り道',file:'ending.ogg',loop:true},
 defeat:{name:'休んで、もう一度',file:'defeat.ogg',loop:false},
} as const;
export type TrackId=keyof typeof tracks;
export function fieldTrack(map:string):TrackId{if(['airport','baggage'].includes(map))return 'airport';if(['cabin','cloud'].includes(map))return 'sky';if(['oslo','fjord'].includes(map))return 'oslo';if(['office','boardroom'].includes(map))return 'office';return 'field';}
export function battleTrack(ids:readonly string[],boss:boolean):TrackId{return ids.includes('dad')?'final':ids.some(id=>id.endsWith('Mid'))?'elite':boss?'boss':'battle';}
