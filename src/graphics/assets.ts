import Phaser from 'phaser';
import { generateArt } from '../game/art';
import { CHARACTER_HEIGHT, CHARACTER_WIDTH, characterAssets, DIRECTIONS, idleFrame, TILE_SIZE, TILESET_COLUMNS, TILESET_KEY, TILESET_ROWS, WALK_FPS, walkFrames } from './spec';

export function preloadAssets(scene: Phaser.Scene): void {
  const base = `${import.meta.env.BASE_URL}assets/`;
  for (const asset of characterAssets) {
    if (!scene.textures.exists(asset.key)) scene.load.spritesheet(asset.key, `${base}characters/${asset.file}`, {
      frameWidth: CHARACTER_WIDTH, frameHeight: CHARACTER_HEIGHT,
    });
  }
  if (!scene.textures.exists(TILESET_KEY)) scene.load.image(TILESET_KEY, `${base}tilesets/kosugi.png`);
}

/** Individual missing/invalid PNGs are replaced, without blocking other assets. */
export function prepareAssets(scene: Phaser.Scene): void {
  const missing = characterAssets.filter(({ key }) => {
    if (!scene.textures.exists(key)) return true;
    const texture = scene.textures.get(key);
    if (texture.source[0].width === 96 && texture.source[0].height === 192) return false;
    scene.textures.remove(key);
    return true;
  });
  generateArt(scene); // Legacy enemies/NPCs remain supported during this migration.
  for (const { key } of missing) {
    const source = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const canvas = document.createElement('canvas');
    canvas.width = CHARACTER_WIDTH * 3;
    canvas.height = CHARACTER_HEIGHT * 4;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
      ctx.save();
      ctx.translate(col * CHARACTER_WIDTH, row * CHARACTER_HEIGHT);
      if (row === 1) { ctx.translate(CHARACTER_WIDTH, 0); ctx.scale(-1, 1); }
      ctx.drawImage(source, 0, col === 1 ? 0 : -1, CHARACTER_WIDTH, CHARACTER_HEIGHT);
      ctx.restore();
    }
    scene.textures.remove(key);
    const texture = scene.textures.addCanvas(key, canvas);
    if (!texture) throw new Error(`Cannot create fallback for ${key}`);
    scene.textures.addSpriteSheet(key, texture, { frameWidth: CHARACTER_WIDTH, frameHeight: CHARACTER_HEIGHT });
  }
  if (scene.textures.exists(TILESET_KEY)) {
    const source = scene.textures.get(TILESET_KEY).source[0];
    if (source.width !== TILE_SIZE * TILESET_COLUMNS || source.height !== TILE_SIZE * TILESET_ROWS) scene.textures.remove(TILESET_KEY);
  }
  if (!scene.textures.exists(TILESET_KEY)) fallbackTiles(scene);
  for (const { key } of characterAssets) {
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    for (const direction of DIRECTIONS) {
      const name = `${key}:walk:${direction}`;
      if (!scene.anims.exists(name)) scene.anims.create({ key: name, frames: walkFrames(direction).map(frame => ({ key, frame })), frameRate: WALK_FPS, repeat: -1 });
    }
  }
  scene.textures.get(TILESET_KEY).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function fallbackTiles(scene: Phaser.Scene): void {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE * TILESET_COLUMNS;
  canvas.height = TILE_SIZE * TILESET_ROWS;
  const ctx = canvas.getContext('2d')!;
  const colors = ['#7fa577','#739b6b','#87ad7c','#b6b8a3','#cfbb94','#d5c7a6','#d5c7a6','#599eae', '#d6b58e','#709eaa','#927b68','#5a6579','#66717e','#d99c83','#b79b81','#f5dcab'];
  for (let id = 0; id < 48; id++) {
    const x = id % TILESET_COLUMNS * TILE_SIZE, y = Math.floor(id / TILESET_COLUMNS) * TILE_SIZE;
    ctx.save(); ctx.translate(x, y);
    if (id < 16 || id === 26 || id === 27) {
      ctx.fillStyle = colors[id] ?? '#a5b5aa'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ffffff20'; ctx.fillRect(0, 0, 32, 2);
      ctx.fillStyle = '#253b4220'; ctx.fillRect(0, 30, 32, 2);
      if (id === 9) { ctx.fillStyle = '#325b72'; ctx.fillRect(5, 5, 22, 22); }
    } else if (id >= 16 && id <= 21) {
      const tree = scene.textures.get('tree').getSourceImage() as HTMLCanvasElement;
      ctx.imageSmoothingEnabled = false;
      const n = id - 16;
      ctx.drawImage(tree, -(n % 2) * 32, -Math.floor(n / 2) * 32, 64, 96);
    } else if (id === 28) { ctx.fillStyle = '#172e2c30'; ctx.fillRect(0, 0, 32, 32); }
    else { ctx.fillStyle = id === 23 ? '#c29b73' : '#4d775b'; ctx.fillRect(4, 12, 24, 18); }
    ctx.restore();
  }
  scene.textures.addCanvas(TILESET_KEY, canvas);
}

export function isCharacter(key: string): boolean { return characterAssets.some(asset => asset.key === key); }
export function faceDown(image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
  if (isCharacter(image.texture.key)) image.setFrame(idleFrame('down'));
}
