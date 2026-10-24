import {resumeScene} from '../game/campaign';
import type {MobileMenu} from '../input/mobileMenu';
import Phaser from 'phaser';
import {music} from '../audio/music';
import { faceDown } from '../graphics/assets';
import { CHARACTER_ORIGIN_Y, CHARACTER_SCALE, characterAssets } from '../graphics/spec';
import { heroes } from '../game/data';
import { load, reset, state } from '../game/state';
import { bind, confirmKey, label, panel } from './shared';

export class Title extends Phaser.Scene {
  private choice = 0;
  private options!: Phaser.GameObjects.Text;
  private notice!: Phaser.GameObjects.Text;
  constructor() { super('Title'); }

  create(): void {
    music.setTrack('title');
    this.choice = 0;
    this.cameras.main.setBackgroundColor(0xa7c8b2);
    const g = this.add.graphics();
    g.fillStyle(0xf7dfaa).fillCircle(531, 55, 30);
    g.fillStyle(0x89afa4).fillRect(0, 154, 640, 112);
    for (let i = 0; i < 12; i++) {
      const x = i * 58, y = 163 - i % 3 * 13;
      g.fillStyle(i % 2 ? 0x7c9d98 : 0x72928d).fillRect(x, y, 44, 95);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) g.fillStyle(0xbcd1b3).fillRect(x + 6 + col * 11, y + 9 + row * 15, 5, 7);
    }
    g.fillStyle(0x749772).fillRect(0, 211, 640, 149);
    g.fillStyle(0xd5c19b).fillRect(0, 218, 640, 23);
    g.fillStyle(0xe7d6b0).fillRect(0, 218, 640, 2);
    for (let x = 0; x < 640; x += 20) g.fillStyle(0xb3a584).fillRect(x, 230, 12, 1);
    // Text blocks have explicit, separate vertical regions at 640x360.
    label(this, 320, 15, 'KOSUGI  →  NORWAY  /  ORIGINAL PIXEL RPG', 9, '#284e4c').setOrigin(.5);
    label(this, 320, 51, 'R太郎と', 28, '#234944').setOrigin(.5).setName('title-first');
    label(this, 320, 96, '伝説の海鮮丼', 38, '#234944').setOrigin(.5).setName('title-second').setShadow(1, 2, '#f6e4b7', 0);
    label(this, 320, 142, '第１章「武蔵小杉のぬいぐるみ大騒動」', 11, '#234944').setOrigin(.5).setName('chapter-title');
    characterAssets.forEach((asset, i) => {
      const x = 224 + i * 64;
      faceDown(this.add.image(x, 204, asset.key).setOrigin(.5, CHARACTER_ORIGIN_Y).setScale(CHARACTER_SCALE));
      label(this, x, 231, heroes[asset.key].name, 8, '#28443e').setOrigin(.5);
    });
    panel(this, 197, 249, 246, 67);
    this.options = label(this, 320, 282, '', 13).setOrigin(.5).setName('title-options');
    this.notice = label(this, 320, 326, '', 10, '#fff0be').setOrigin(.5);
    label(this, 320, 347, '↑ ↓ / W S 選択    Z / ENTER 決定', 9, '#e8ead0').setOrigin(.5);
    this.render();
    bind(this, e => {
      if (e.repeat) return;
      if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        this.choice = (this.choice + (['ArrowUp','KeyW'].includes(e.code)?2:1)) % 3; this.notice.setText(''); this.render();
      }
      if (!confirmKey(e)) return;
      if (this.choice === 0) { reset(); this.scene.start('Field'); }
      else if (load(this.choice===2?'auto':'manual')) this.scene.start(resumeScene(state));
      else this.notice.setText('セーブデータがありません。「はじめから」を選んでください。');
    });
  }

  getMobileMenu():MobileMenu{
    const names=['はじめから','つづきから','中断から'];
    return {key:'Title',kind:'commands',title:'冒険をはじめる',description:this.notice.text||undefined,actions:names.map((name,i)=>({id:`title-${i}`,label:name,detail:i===1?'通常セーブ':i===2?'アプリ切替時の自動保存':undefined,selected:this.choice===i,run:()=>{this.choice=i;this.render();this.input.keyboard?.emit('keydown',new KeyboardEvent('keydown',{code:'Enter'}));}}))};
  }
  private render(): void {
    this.options.setText(`${this.choice === 0 ? '>' : '　'} はじめから\n${this.choice === 1 ? '>' : '　'} つづきから\n${this.choice === 2 ? '>' : '　'} 中断から（自動保存）`);
  }
}
