/** Asset contract. Keep texture keys stable for save/scene compatibility. */
export const CHARACTER_WIDTH = 32;
export const CHARACTER_HEIGHT = 48;
export const CHARACTER_SCALE = 1;
export const CHARACTER_ORIGIN_Y = 2 / 3;
export const WALK_FPS = 8;
export const TILE_SIZE = 32;
export const MAP_COLUMNS = 30;
export const MAP_ROWS = 17;
export const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type Direction = typeof DIRECTIONS[number];
export const characterAssets = [
  { key: 'rintaro', file: 'rtaro.png' },
  { key: 'marmot', file: 'marmot.png' },
  { key: 'fugu', file: 'fugu.png' },
  { key: 'vanilla', file: 'vanilla.png' },
] as const;
export type CharacterKey = typeof characterAssets[number]['key'];
export function idleFrame(direction: Direction): number { return DIRECTIONS.indexOf(direction) * 3 + 1; }
export function walkFrames(direction: Direction): number[] {
  const first = DIRECTIONS.indexOf(direction) * 3;
  return [first + 1, first, first + 1, first + 2];
}
export const TILESET_KEY = 'kosugi-tiles';
export const TILESET_COLUMNS = 8;
export const TILESET_ROWS = 6;
export const Tiles = {
  grass: 0, grassDetail: 1, flowers: 2, paving: 3, road: 4, curbTop: 5, curbBottom: 6, water: 7,
  wall: 8, window: 9, door: 10, roof: 11, roofEdge: 12, awning: 13, brick: 14, sign: 15,
  treeTL: 16, treeTR: 17, treeML: 18, treeMR: 19, treeBL: 20, treeBR: 21,
  hedge: 22, planter: 23, bench: 24, lamp: 25, steps: 26, pondEdge: 27, shadow: 28,
} as const;
