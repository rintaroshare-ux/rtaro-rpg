import { maps, type MapId } from '../game/data';
import { MAP_COLUMNS, MAP_ROWS, Tiles, TILE_SIZE } from './spec';
export type TileGrid = number[][];
export const grid = (fill = -1, width = MAP_COLUMNS, height = MAP_ROWS): TileGrid => Array.from({ length: height }, () => Array<number>(width).fill(fill));
export function groundLayout(id: MapId = 'home'): { ground: TileGrid; roads: TileGrid; decorations: TileGrid } {
  const ground = grid(), roads = grid(), decorations = grid();
  for (let y = 0; y < MAP_ROWS; y++) for (let x = 0; x < MAP_COLUMNS; x++) {
    const seed = (x * 17 + y * 31) % 29;
    ground[y][x] = seed === 0 ? Tiles.flowers : seed < 5 ? Tiles.grassDetail : Tiles.grass;
    if (y >= 10 && y <= 12) roads[y][x] = y === 10 ? Tiles.curbTop : y === 12 ? Tiles.curbBottom : Tiles.road;
    if (x >= 14 && x <= 16 && y >= 5) roads[y][x] = Tiles.paving;
  }
  // Door-to-street paths and a paved station forecourt, without new collision.
  if (id !== 'park') for (const b of maps[id].buildings) {
    const column = Math.floor((b.x + b.w / 2) / TILE_SIZE);
    for (let y = Math.ceil((b.y + b.h) / TILE_SIZE); y < 10; y++) roads[y][column] = Tiles.paving;
  }
  if (id === 'station') for (let y = 5; y < 10; y++) for (let x = 9; x <= 21; x++) roads[y][x] = Tiles.paving;
  return { ground, roads, decorations };
}
export function buildingLayout(width: number, height: number, pond = false): TileGrid {
  const columns = Math.max(2, Math.round(width / TILE_SIZE)), rows = Math.max(2, Math.round(height / TILE_SIZE));
  const cells = grid(Tiles.wall, columns, rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    cells[y][x] = pond ? (y === 0 ? Tiles.pondEdge : Tiles.water) : y === 0 ? Tiles.roof : y === 1 ? Tiles.roofEdge : y === rows - 1 && x === Math.floor(columns / 2) ? Tiles.door : y >= 2 && x % 2 === 0 ? Tiles.window : Tiles.wall;
  }
  return cells;
}
export const treeLayout: TileGrid = [[Tiles.treeTL, Tiles.treeTR], [Tiles.treeML, Tiles.treeMR], [Tiles.treeBL, Tiles.treeBR]];
export function treePositions(map: MapId): { x: number; y: number; park: boolean }[] {
  const result: { x: number; y: number; park: boolean }[] = [];
  for (let i = 0; i < 29; i++) for (const y of [48, 510]) result.push({ x: 32 + i * 33, y, park: false });
  if (map === 'park') for (const [x, y] of [[95, 180], [770, 130], [820, 380], [330, 450], [110, 440]]) result.push({ x, y, park: true });
  return result;
}
