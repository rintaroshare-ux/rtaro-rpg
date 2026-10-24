import type {Person} from './data';
import type {State} from './state';
const MAX_STOCK=99999999;
/** Flags and reward are changed together so reopening cannot duplicate treasure. */
export function claimTreasure(state:State,chest:Person):boolean{
 if(chest.event!=='chest'||!chest.chestId||!chest.reward)return false;
 const flag=`chest:${chest.chestId}`;if(state.flags.includes(flag))return false;
 const reward=chest.reward;
 if(Object.values(reward).some(n=>!Number.isInteger(n)||n<0))return false;
 state.money=Math.min(MAX_STOCK,state.money+(reward.money??0));
 state.bowls=Math.min(MAX_STOCK,state.bowls+(reward.bowls??0));
 state.inventory.ether=Math.min(MAX_STOCK,state.inventory.ether+(reward.ether??0));
 state.flags.push(flag);return true;
}
