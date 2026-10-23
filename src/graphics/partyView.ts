import Phaser from 'phaser';
import type { Member } from '../game/state';
import { CHARACTER_SCALE, CHARACTER_ORIGIN_Y, idleFrame, type Direction } from './spec';

const SPACING = 30;
const SAMPLE_DISTANCE = 3;
interface Point { x: number; y: number }
interface Follower { sprite: Phaser.GameObjects.Sprite; facing: Direction }

/** Cosmetic party trail. No extra physics bodies, collision or saved state. */
export class PartyView {
  private readonly followers: Follower[];
  private readonly trail: Point[];

  constructor(scene: Phaser.Scene, party: Member[], start: Point) {
    // At map entrance lay the party along the road rather than outside the map.
    const sign = start.x < 140 ? 1 : -1;
    this.trail = Array.from({ length: Math.ceil(party.length * SPACING / SAMPLE_DISTANCE) + 2 }, (_, i) => ({
      x: Phaser.Math.Clamp(start.x + sign * i * SAMPLE_DISTANCE, 32, 928), y: start.y,
    }));
    this.followers = party.slice(1).map((member, i) => {
      const p = this.pointAt((i + 1) * SPACING, start);
      return {
        sprite: scene.add.sprite(p.x, p.y, member.id, idleFrame('down'))
          .setOrigin(.5, CHARACTER_ORIGIN_Y).setScale(CHARACTER_SCALE).setDepth(p.y),
        facing: 'down',
      };
    });
  }

  update(leader: Point, delta: number): void {
    const first = this.trail[0];
    if (Phaser.Math.Distance.Between(first.x, first.y, leader.x, leader.y) >= SAMPLE_DISTANCE) {
      this.trail.unshift({ x: leader.x, y: leader.y });
      this.trail.length = Math.min(this.trail.length, Math.ceil((this.followers.length + 1) * SPACING / SAMPLE_DISTANCE) + 8);
    }
    this.followers.forEach((follower, index) => {
      const { sprite } = follower;
      const target = this.pointAt((index + 1) * SPACING, leader);
      const dx = target.x - sprite.x, dy = target.y - sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance > .2) {
        // Smooth short gaps after turns while keeping the leader's walked path.
        const step = Math.min(distance, 150 * Math.min(delta, 50) / 1000);
        sprite.x += dx / distance * step;
        sprite.y += dy / distance * step;
        follower.facing = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down';
        sprite.play(`${sprite.texture.key}:walk:${follower.facing}`, true);
      } else {
        sprite.anims.stop();
        sprite.setFrame(idleFrame(follower.facing));
      }
      sprite.setDepth(sprite.y);
    });
  }

  stop(): void {
    for (const { sprite, facing } of this.followers) {
      sprite.anims.stop(); sprite.setFrame(idleFrame(facing));
    }
  }

  private pointAt(distance: number, leader: Point): Point {
    let previous = leader;
    for (const point of this.trail) {
      const length = Math.hypot(point.x - previous.x, point.y - previous.y);
      if (length > 0 && distance <= length) {
        const t = distance / length;
        return { x: previous.x + (point.x - previous.x) * t, y: previous.y + (point.y - previous.y) * t };
      }
      distance -= length;
      previous = point;
    }
    return previous;
  }
}
