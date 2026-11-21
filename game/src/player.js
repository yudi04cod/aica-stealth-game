// Emberlight Heist — the thief.
// One clear job: where the player is and how they move. Keyboard steps,
// click-to-move, sneaking, and sliding along walls and crates. No drawing,
// no detection — the guards own that.

import { PLAYER, WORLD } from './config.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.radius = PLAYER.radius;
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.sneaking = false;
    this.stepPhase = 0;
    this.stepAccum = 0;
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.sneaking = false;
    this.stepAccum = 0;
  }

  circleHits(cx, cy, blockers) {
    for (const b of blockers) {
      const nearX = Math.max(b.x, Math.min(cx, b.x + b.w));
      const nearY = Math.max(b.y, Math.min(cy, b.y + b.h));
      if ((cx - nearX) ** 2 + (cy - nearY) ** 2 < this.radius * this.radius) return true;
    }
    return false;
  }

  // Returns true when a footstep sound should play this frame.
  update(dt, input, level) {
    const blockers = [...level.walls, ...level.crates];
    let dx = 0;
    let dy = 0;

    if (input.hasMoveKeys()) {
      const v = input.moveVector();
      dx = v.x;
      dy = v.y;
      input.clickTarget = null;
    } else if (input.clickTarget) {
      // Clicks arrive in canvas coordinates; the playfield starts below
      // the HUD strip, so shift the target down into world coordinates.
      const tx = input.clickTarget.x - this.x;
      const ty = input.clickTarget.y - WORLD.hudHeight - this.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 6) {
        input.clickTarget = null;
      } else {
        dx = tx / dist;
        dy = ty / dist;
      }
    }

    this.sneaking = Boolean(input.sneak);
    const speed = this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    this.moving = dx !== 0 || dy !== 0;

    let stepped = false;
    if (this.moving) {
      this.facing = Math.atan2(dy, dx);
      const nx = this.x + dx * speed * dt;
      const ny = this.y + dy * speed * dt;
      if (!this.circleHits(nx, this.y, blockers)) this.x = nx;
      if (!this.circleHits(this.x, ny, blockers)) this.y = ny;
      this.stepAccum += speed * dt;
      const stride = this.sneaking ? 34 : 26;
      if (this.stepAccum >= stride) {
        this.stepAccum = 0;
        this.stepPhase += 1;
        stepped = true;
      }
    }
    return stepped;
  }
}
