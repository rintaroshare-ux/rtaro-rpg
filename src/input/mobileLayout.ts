export interface Insets {top:number;right:number;bottom:number;left:number}
export interface MobileLayout {x:number;y:number;width:number;height:number;portrait:boolean;compact:boolean;buttonSize:number}
/** CSS-pixel layout, independent from Phaser and device pixel ratio. */
export function mobileLayout(width:number,height:number,insets:Insets={top:0,right:0,bottom:0,left:0}):MobileLayout{
 const w=Math.max(240,Number.isFinite(width)?width:640),h=Math.max(240,Number.isFinite(height)?height:360);
 const left=Math.max(0,insets.left),right=Math.max(0,insets.right),top=Math.max(0,insets.top),bottom=Math.max(0,insets.bottom);
 const portrait=h>w,compact=!portrait&&w<820;
 const availableW=Math.max(160,w-left-right-(portrait||compact?16:288));
 const availableH=Math.max(90,h-top-bottom-(portrait?246:68));
 const gameW=Math.floor(Math.min(availableW,availableH*16/9));
 const gameH=gameW*9/16;
 return {x:Math.round(left+(w-left-right-gameW)/2),y:top+(portrait?78:52),width:gameW,height:gameH,portrait,compact,buttonSize:portrait?52:44};
}
