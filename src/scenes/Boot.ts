import Phaser from 'phaser';
import { preloadAssets, prepareAssets } from '../graphics/assets';
import { label } from './shared';
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload(): void {
    this.cameras.main.setBackgroundColor('#183746');
    label(this, 320, 164, 'R太郎と伝説の海鮮丼', 20).setOrigin(.5);
    label(this, 320, 203, '街と仲間たちを準備しています…', 11).setOrigin(.5);
    preloadAssets(this);
  }
  create(): void { prepareAssets(this); this.scene.start('Title'); }
}
