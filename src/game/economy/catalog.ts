import type {HeroId} from '../data';
export type ConsumableId='bowl'|'deluxe'|'ether'|'revive';
export type GearSlot='weapon'|'armor'|'accessory';
export const heroIds:HeroId[]=['rintaro','marmot','fugu','vanilla'];
export const consumables:Record<ConsumableId,{name:string;price:number;description:string}>={
 bowl:{name:'海鮮丼',price:18,description:'生存中の仲間のHPを80回復'},
 deluxe:{name:'特上海鮮丼',price:48,description:'生存中の仲間のHPを180回復'},
 ether:{name:'潮風ソーダ',price:25,description:'生存中の仲間のMPを25回復'},
 revive:{name:'目覚めの塩',price:40,description:'戦闘不能からHP半分で復帰'},
};
export interface Gear {name:string;slot:GearSlot;price:number;allowed:readonly HeroId[];bonuses:{hp?:number;mp?:number;attack?:number;magic?:number;defense?:number;speed?:number}}
export const gear={
 littleBat:{name:'旅立ちのバット',slot:'weapon',price:65,allowed:['rintaro'],bonuses:{attack:6}},
 leafStaff:{name:'若葉のつえ',slot:'weapon',price:60,allowed:['marmot'],bonuses:{magic:8}},
 tideWand:{name:'しおさいの杖',slot:'weapon',price:70,allowed:['fugu'],bonuses:{magic:9}},
 nightBlade:{name:'夜明けの短剣',slot:'weapon',price:85,allowed:['vanilla'],bonuses:{attack:8,magic:4}},
 travelVest:{name:'旅人のベスト',slot:'armor',price:55,allowed:heroIds,bonuses:{defense:5}},
 shellCoat:{name:'貝がらコート',slot:'armor',price:110,allowed:heroIds,bonuses:{defense:8,hp:20}},
 windPin:{name:'追い風のピン',slot:'accessory',price:75,allowed:heroIds,bonuses:{speed:3}},
 mofuBadge:{name:'もふもふバッジ',slot:'accessory',price:90,allowed:heroIds,bonuses:{hp:25,mp:8}},
 prismRing:{name:'潮色のリング',slot:'accessory',price:80,allowed:['marmot','fugu','vanilla'],bonuses:{magic:5,mp:8}},
} as const satisfies Record<string,Gear>;
export type GearId=keyof typeof gear;
export type StockId=ConsumableId|GearId;
export type Equipment=Record<GearSlot,GearId|null>;
export const emptyEquipment=():Equipment=>({weapon:null,armor:null,accessory:null});
export const isGear=(id:string):id is GearId=>Object.hasOwn(gear,id);
export const isConsumable=(id:string):id is ConsumableId=>Object.hasOwn(consumables,id);
export function stockDefinition(id:StockId):{name:string;price:number}{return isGear(id)?gear[id]:consumables[id];}
export const shopCatalog={items:Object.keys(consumables) as ConsumableId[],equipment:Object.keys(gear) as GearId[]};
export const slotNames:Record<GearSlot,string>={weapon:'武器',armor:'防具',accessory:'アクセサリー'};
