import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTER_HEIGHT, CHARACTER_WIDTH, characterAssets, sceneAssets, DIRECTIONS, idleFrame, MAP_COLUMNS, MAP_ROWS, TILESET_COLUMNS, TILESET_ROWS, walkFrames } from '../src/graphics/spec';
import { buildingLayout, groundLayout, treePositions } from '../src/graphics/mapLayout';
import { order, maps } from '../src/game/data';
test('all original PNGs satisfy the fixed atlas/frame contract', () => {
  const dimensions = (path: string) => {
    const png = readFileSync(new URL(`../public/assets/${path}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png[25], 6, 'RGBA PNG');
    return [png.readUInt32BE(16), png.readUInt32BE(20)];
  };
  for (const asset of characterAssets) assert.deepEqual(dimensions(`characters/${asset.file}`), [CHARACTER_WIDTH * 3, CHARACTER_HEIGHT * 4]);
  for(const asset of sceneAssets)assert.deepEqual(dimensions(asset.file),[asset.width,asset.height]);
  assert.deepEqual(dimensions('tilesets/kosugi.png'), [TILESET_COLUMNS * 32, TILESET_ROWS * 32]);
});
test('walk loops remain inside their direction row and stop on neutral frame', () => {
  DIRECTIONS.forEach((direction, row) => {
    assert.equal(idleFrame(direction), row * 3 + 1);
    assert.deepEqual(walkFrames(direction), [row * 3 + 1, row * 3, row * 3 + 1, row * 3 + 2]);
  });
});
test('all map layers use valid tiles and leave the east-west road open', () => {
  const { ground, roads } = groundLayout();
  for (const grid of [ground, roads]) {
    assert.equal(grid.length, MAP_ROWS);
    for (const row of grid) { assert.equal(row.length, MAP_COLUMNS); assert.ok(row.every(id => id >= -1 && id < 48)); }
  }
  assert.ok(roads[11].every(id => id >= 0));
  for (const id of order) {
    assert.equal(treePositions(id).length, id === 'park' ? 63 : 58);
    for (const b of maps[id].buildings) assert.ok(buildingLayout(b.w, b.h, id === 'park').flat().every(tile => tile >= 0 && tile < 48));
  }
});
