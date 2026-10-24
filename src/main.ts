import Phaser from 'phaser';
import './style.css';
import {setupAudioControls} from './audio/music';
import {setupTouchControls} from './input/touch';
setupAudioControls();
import {Boot} from './scenes/Boot';
import {Title} from './scenes/Title';
import {Field} from './scenes/Field';
import {BattleScene} from './scenes/BattleScene';
import {Clear} from './scenes/Clear';
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:640,height:360,pixelArt:true,roundPixels:true,backgroundColor:'#183746',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{debug:false}},scene:[Boot,Title,Field,BattleScene,Clear],input:{keyboard:true},render:{antialias:false}});

setupTouchControls(game);
