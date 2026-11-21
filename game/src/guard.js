// Emberlight Heist — the night watch.
// One clear job: one guard's brain. Patrol a loop of waypoints, sweep a
// vision cone, notice the thief, chase when the alarm fills, give up and
// walk back when the trail goes cold. No drawing lives here.

import { GUARD_TUNING } from './config.js';

export const TAU = Math.PI * 2;

export function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function pointBlocked(x, y, blockers) {
  for (const b of blockers) if (pointInRect(x, y, b)) return true;
  return false;
}

// True when no wall or crate stands between (x1,y1) and (x2,y2).
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(dist / 5));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointBlocked(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, blockers)) return false;
  }
  return true;
}

// Distance a ray from (x,y) at `angle` travels before hitting a blocker.
export function castRay(x, y, angle, maxDist, blockers) {
  const step = 4;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x;
  let py = y;
  for (let d = 0; d < maxDist; d += step) {
    px += dx;
    py += dy;
    if (pointBlocked(px, py, blockers)) return d;
  }
  return maxDist;
}

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.x = def.x;
    this.y = def.y;
    this.speed = def.speed;
    this.range = def.range;
    this.fov = def.fov;
    this.waypoints = def.waypoints.map((w) => ({ x: w.x, y: w.y }));
    this.rotate = Boolean(def.rotate);
    this.waypointIndex = 0;
    this.facing = def.waypoints.length > 1
      ? Math.atan2(def.waypoints[1].y - def.y, def.waypoints[1].x - def.x)
      : -Math.PI / 2;
    this.state = 'patrol'; // patrol | suspicious | chase
    this.detection = 0;    // 0 calm .. 1 alarm
    this.loseSightTimer = 0;
    this.stepTimer = 0;
    this.pauseTimer = 0;
    // Where the thief was last glimpsed, and whether the guard sees them now.
    this.lastSeen = null;
    this.seeing = false;
  }

  // The polygon of floor this guard can currently see, for drawing the cone.
  conePolygon(blockers) {
    const rays = 26;
    const pts = [{ x: this.x, y: this.y }];
    const start = this.facing - this.fov / 2;
    for (let i = 0; i <= rays; i++) {
      const a = start + (this.fov * i) / rays;
      const d = castRay(this.x, this.y, a, this.range, blockers);
      pts.push({ x: this.x + Math.cos(a) * d, y: this.y + Math.sin(a) * d });
    }
    return pts;
  }

  seesPlayer(player, blockers) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range) return { seen: false, closeness: 0 };
    const angleTo = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angleTo, this.facing)) > this.fov / 2) return { seen: false, closeness: 0 };
    if (!hasLineOfSight(this.x, this.y, player.x, player.y, blockers)) return { seen: false, closeness: 0 };
    return { seen: true, closeness: 1 - dist / this.range };
  }

  inShadow(player, shadows) {
    for (const s of shadows) if (pointInRect(player.x, player.y, s)) return true;
    return false;
  }

  turnToward(targetAngle, dt) {
    const diff = angleDiff(targetAngle, this.facing);
    const maxTurn = GUARD_TUNING.turnSpeed * dt;
    if (Math.abs(diff) <= maxTurn) this.facing = targetAngle;
    else this.facing += Math.sign(diff) * maxTurn;
  }

  moveToward(tx, ty, speed, dt, blockers, radius) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.tryMove(nx, ny, blockers, radius);
    this.turnToward(Math.atan2(dy, dx), dt);
    return dist - step < 2;
  }

  tryMove(nx, ny, blockers, radius) {
    if (!this.circleHits(nx, this.y, radius, blockers)) this.x = nx;
    if (!this.circleHits(this.x, ny, radius, blockers)) this.y = ny;
  }

  circleHits(cx, cy, r, blockers) {
    for (const b of blockers) {
      const nearX = Math.max(b.x, Math.min(cx, b.x + b.w));
      const nearY = Math.max(b.y, Math.min(cy, b.y + b.h));
      if ((cx - nearX) ** 2 + (cy - nearY) ** 2 < r * r) return true;
    }
    return false;
  }

  update(dt, player, level) {
    const blockers = [...level.walls, ...level.crates];
    const sight = this.seesPlayer(player, blockers);
    const shadowed = sight.seen && this.inShadow(player, level.shadows);
    this.seeing = sight.seen;
    if (sight.seen) this.lastSeen = { x: player.x, y: player.y };

    if (sight.seen) {
      const rate = GUARD_TUNING.detectRate
        * (GUARD_TUNING.detectFalloff + (1 - GUARD_TUNING.detectFalloff) * sight.closeness)
        * (shadowed ? GUARD_TUNING.shadowMult : 1);
      this.detection = Math.min(1, this.detection + rate * dt);
      this.loseSightTimer = 0;
    } else {
      this.detection = Math.max(0, this.detection - GUARD_TUNING.decayRate * dt);
      if (this.state === 'chase') this.loseSightTimer += dt;
    }

    if (this.detection >= 1 && this.state !== 'chase') {
      this.state = 'chase';
      this.loseSightTimer = 0;
    }

    if (this.state === 'chase') {
      this.moveToward(player.x, player.y, this.speed * GUARD_TUNING.chaseSpeedMult, dt, blockers, 13);
      if (this.loseSightTimer > GUARD_TUNING.loseSightSeconds) {
        this.state = 'patrol';
        this.detection = 0.4;
      }
      return;
    }

    if (this.detection > 0.35) {
      // Suspicious: stop and stare at the last place the thief was seen.
      this.state = 'suspicious';
      const look = this.lastSeen ?? player;
      this.turnToward(Math.atan2(look.y - this.y, look.x - this.x), dt);
      if (!sight.seen && this.detection <= 0.35) this.state = 'patrol';
      return;
    }
    this.state = 'patrol';

    if (this.rotate) {
      // A sentry that stands its post and slowly sweeps its lantern.
      this.facing += 0.55 * dt;
      return;
    }
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      return;
    }
    const target = this.waypoints[this.waypointIndex];
    const arrived = this.moveToward(target.x, target.y, this.speed, dt, blockers, 13);
    if (arrived) {
      this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      this.pauseTimer = 0.5;
    }
  }
}
