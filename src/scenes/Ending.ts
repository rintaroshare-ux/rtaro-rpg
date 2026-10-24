import Phaser from 'phaser';
import {save} from '../game/state';
import {bind,confirmKey,label,panel} from './shared';
import {music} from '../audio/music';
import type {MobileMenu} from '../input/mobileMenu';
const script=['パパ：……あれ？ 会議、終わっていいの？','同僚：残りは明日、みんなで。今日はお帰りください、パパさん。','R太郎：パパ、おつかれさま。伝説の海鮮丼を、届けに来たよ。','パパ：武蔵小杉から、ここまで？ こんなに遠くまで……。','マーモット：遠かったけど、ひとりじゃなかったんだ。','グアムバード：機内食の誘惑にも勝ったよ！','シンガポール太郎：マフラーも保冷ケースも、任務完了だ。','パパ：ありがとう。みんな。……いただきます。','パパ：おいしい。泣くほど、おいしい。','R太郎：それ、わさび入れすぎたんじゃない？','パパ：そ、そうかもしれない。でも、うれしいのも本当だ。','パパ：明日は休もう。一緒にオスロを歩こう。次はぼくが案内するよ。','ママからのメッセージ：ちゃんと食べた？ おかわりは帰ってきてからね！','R太郎：今度は、みんなで「ただいま」を届けよう。','海鮮丼は空っぽに。心は、おなかいっぱいに。\nR太郎と伝説の海鮮丼 — おしまい'];
export class Ending extends Phaser.Scene{
 private index=0;private text!:Phaser.GameObjects.Text;
 constructor(){super('Ending');}
 create():void{music.setTrack('victory');this.index=0;this.cameras.main.setBackgroundColor(0x233f59);const g=this.add.graphics();for(let i=0;i<45;i++)g.fillStyle(0xf8dd9c,.8).fillRect(i*83%640,i*47%175,2,2);label(this,320,30,'海を越えて、食卓へ。',24).setOrigin(.5);['rintaro','marmot','fugu','vanilla','dad'].forEach((key,i)=>{const sprite=this.add.image(200+i*60,155,key);if(key==='dad')sprite.setDisplaySize(64,64);else sprite.setFrame(1);});panel(this,22,210,596,130);this.text=label(this,40,229,'',13).setWordWrapWidth(555);this.draw();bind(this,e=>{if(confirmKey(e))this.next();});if(!save())label(this,320,190,'保存できませんでした。保存ボタンで再試行できます。',10).setOrigin(.5);}
 private draw():void{this.text.setText(`${script[this.index]}\n\n決定でつづける  ${this.index+1}/${script.length}`);}
 private next():void{if(this.index<script.length-1){this.index++;this.draw();}else this.scene.start('Title');}
 saveAnywhere(automatic=false):boolean{return save(automatic);}
 getMobileMenu():MobileMenu{return {key:'Ending',kind:'dialogue',title:'エンディング',description:script[this.index],actions:[{id:'continue',label:this.index===script.length-1?'タイトルへ':'つづける',run:()=>this.next()}]};}
}
