import Phaser from 'phaser';
import { maps, type MapId } from '../game/data';
import { label } from '../scenes/shared';
import { buildingLayout, groundLayout, treeLayout, treePositions, type TileGrid } from './mapLayout';
import { MAP_COLUMNS, MAP_ROWS, TILE_SIZE, TILESET_KEY, Tiles } from './spec';
export type CollisionRect = (x: number, y: number, width: number, height: number) => void;
/** Tile imagery and collision geometry are separate: old save coordinates stay valid. */
export function renderMap(scene: Phaser.Scene, id: MapId, block: CollisionRect): Phaser.Tilemaps.Tilemap {
  const map = scene.make.tilemap({ tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, width: MAP_COLUMNS, height: MAP_ROWS });
  const tiles = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, 0, 0, 0);
  if (!tiles) throw new Error('Tile atlas was not initialized in Boot');
  const layer = (name: string, cells: TileGrid, depth: number, x = 0, y = 0) => {
    const result = map.createBlankLayer(name, tiles, x, y, cells[0].length, cells.length, TILE_SIZE, TILE_SIZE);
    if (!result) throw new Error(`Cannot create tile layer ${name}`);
    result.putTilesAt(cells, 0, 0); result.setDepth(depth); return result;
  };
  const layout = groundLayout(id);
  layer('ground', layout.ground, -30);
  layer('roads', layout.roads, -29);
  const decorations = layer('decorations', layout.decorations, -27);
  const signs = layer('signs', layout.decorations, 3);
  const shadows = layer('shadows', layout.decorations, -28);
  const definition = maps[id];
  definition.buildings.forEach((b, i) => {
    const pond = id === 'park';
    layer(`buildings-${i}`, buildingLayout(b.w, b.h, pond), 0, b.x, b.y);
    const cols = Math.max(2, Math.round(b.w / TILE_SIZE));
    const rows = Math.max(2, Math.round(b.h / TILE_SIZE));
    const baseColor = Phaser.Display.Color.IntegerToColor(b.color);
    // Keep map-specific architecture colors while preserving atlas shading.
    if (!pond) map.getLayer(`buildings-${i}`)?.tilemapLayer?.setTint(Phaser.Display.Color.GetColor(Math.min(255, baseColor.red + 35), Math.min(255, baseColor.green + 40), Math.min(255, baseColor.blue + 45)));
    for (let x = 0; x < cols; x++) shadows.putTileAt(Tiles.shadow, Math.floor(b.x / TILE_SIZE) + x, Math.floor(b.y / TILE_SIZE) + rows);
    const text = label(scene, b.x + cols * TILE_SIZE / 2, b.y + (pond ? 13 : 42), b.label, 10, '#fff1c9').setOrigin(.5).setDepth(4);
    text.setBackgroundColor('#3f575b').setPadding(5, 3, 5, 3);
    if (id === 'market') layer(`shopfront-${i}`, [Array<number>(cols).fill(Tiles.awning)], 2, b.x, b.y + 64);
    if (id === 'station') layer(`entrance-${i}`, [[Tiles.steps, Tiles.steps, Tiles.steps]], -26, b.x + Math.floor(cols / 2 - 1) * TILE_SIZE, b.y + b.h);
    block(b.x, b.y, b.w, b.h);
    if (!pond) {
      decorations.putTileAt(Tiles.planter, Math.floor((b.x - 32) / TILE_SIZE), Math.floor((b.y + b.h) / TILE_SIZE));
    }
  });
  for (const [i, tree] of treePositions(id).entries()) {
    layer(`foliage-${i}`, treeLayout, tree.y, tree.x - 32, tree.y - 76);
    if (tree.park) block(tree.x - 17, tree.y - 12, 34, 24);
    else block(tree.x - 11, tree.y - 7, 23, 15);
  }
  if (id === 'park') {
    decorations.putTileAt(Tiles.bench, 17, 8); decorations.putTileAt(Tiles.bench, 18, 8);
    block(565, 250, 58, 28);
  }
  for (const x of [3, 11, 22, 27]) decorations.putTileAt(Tiles.planter, x, 9);
  signs.putTileAt(Tiles.sign, 27, 13);
  for (const x of [6, 23]) signs.putTileAt(Tiles.lamp, x, 13);
  label(scene, 27 * TILE_SIZE + 16, 13 * TILE_SIZE + 8, '駅 →', 8, '#3b554f').setOrigin(.5).setDepth(4);
  return map;
}
