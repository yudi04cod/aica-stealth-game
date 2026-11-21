// Emberlight Heist — everything the eye sees.
// One clear job: draw the world, the HUD, the minimap and the screens on
// one canvas. No game logic lives here; game.js tells it what to draw.

import { PALETTE, WORLD } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level) {
  const tile = 48;
  for (let y = 0; y < WORLD.height; y += tile) {
    for (let x = 0; x < WORLD.width; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.width; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke();
  }
  for (let y = 0; y <= WORLD.height; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
  }
  // Dark shadow zones: floor a thief can melt into.
  for (const s of level.shadows) {
    ctx.fillStyle = PALETTE.shadowZone;
    roundRect(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.shadowEdge;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Warm pools of lantern light.
  for (const lamp of level.lanterns) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 196, 110, 0.16)');
    g.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5a33';
    ctx.fillRect(lamp.x - 1.5, lamp.y - 9, 3, 18);
  }
}

function drawWallsAndCover(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
  for (const c of level.crates) {
    ctx.fillStyle = PALETTE.crate;
    roundRect(ctx, c.x, c.y, c.w, c.h, 4);
    ctx.fill();
    ctx.strokeStyle = PALETTE.crateEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = PALETTE.crateDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y + 4); ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.moveTo(c.x + c.w - 4, c.y + 4); ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.stroke();
  }
}

function drawExit(ctx, level, time) {
  const e = level.exit;
  const pulse = 0.55 + 0.25 * Math.sin(time * 3);
  const g = ctx.createRadialGradient(
    e.x + e.w / 2, e.y + e.h / 2, 6,
    e.x + e.w / 2, e.y + e.h / 2, 70,
  );
  g.addColorStop(0, `rgba(55, 224, 138, ${pulse})`);
  g.addColorStop(1, 'rgba(55, 224, 138, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(e.x - 50, e.y - 50, e.w + 100, e.h + 100);
  ctx.fillStyle = PALETTE.exitDoor;
  roundRect(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.strokeStyle = PALETTE.exitGlow;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2);
}

function drawGems(ctx, gems, time) {
  for (const gem of gems) {
    if (gem.taken) continue;
    const bob = Math.sin(time * 2.4 + gem.x) * 2;
    const gy = gem.y + bob;
    const glow = ctx.createRadialGradient(gem.x, gy, 2, gem.x, gy, 26);
    glow.addColorStop(0, 'rgba(255, 181, 46, 0.5)');
    glow.addColorStop(1, 'rgba(255, 181, 46, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(gem.x, gy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.gem;
    ctx.beginPath();
    ctx.moveTo(gem.x, gy - 11);
    ctx.lineTo(gem.x + 8, gy);
    ctx.lineTo(gem.x, gy + 11);
    ctx.lineTo(gem.x - 8, gy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.gemCore;
    ctx.beginPath();
    ctx.moveTo(gem.x, gy - 5);
    ctx.lineTo(gem.x + 3.5, gy);
    ctx.lineTo(gem.x, gy + 5);
    ctx.lineTo(gem.x - 3.5, gy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGuard(ctx, guard, blockers) {
  // Vision cone, hugging the walls it hits.
  const hot = guard.state === 'chase' || guard.detection > 0.6;
  const poly = guard.conePolygon(blockers);
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = hot ? PALETTE.coneHot : PALETTE.coneCalm;
  ctx.fill();
  ctx.strokeStyle = hot ? PALETTE.coneHotEdge : PALETTE.coneEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // The guard: a red watchman with a lantern dot and a facing tick.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath(); ctx.ellipse(guard.x, guard.y + 9, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PALETTE.guardDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PALETTE.guardDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * 17, guard.y + Math.sin(guard.facing) * 17);
  ctx.stroke();

  // Detection ring over the guard's head.
  if (guard.detection > 0.05) {
    const w = 30;
    const x = guard.x - w / 2;
    const y = guard.y - 28;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x - 1, y - 1, w + 2, 7);
    ctx.fillStyle = guard.detection > 0.6 ? PALETTE.alertHot : PALETTE.alertWarm;
    ctx.fillRect(x, y, w * guard.detection, 5);
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, guard.x, guard.y + 26);
}

function drawPlayer(ctx, player, time) {
  const glow = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, 34);
  glow.addColorStop(0, 'rgba(47, 216, 200, 0.28)');
  glow.addColorStop(1, 'rgba(47, 216, 200, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(player.x, player.y, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 9, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  const bob = player.moving ? Math.sin(player.stepPhase * Math.PI) * 1.5 : 0;
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath(); ctx.arc(player.x, player.y + bob, player.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PALETTE.playerDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood point showing which way the thief faces.
  ctx.fillStyle = '#e8fffa';
  ctx.beginPath();
  ctx.arc(
    player.x + Math.cos(player.facing) * 8,
    player.y + bob + Math.sin(player.facing) * 8,
    3.5, 0, Math.PI * 2,
  );
  ctx.fill();
  if (player.sneaking) {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y + 26);
  }
  void time;
}

// --- HUD, minimap and screens -------------------------------------------

export function drawHud(ctx, hud) {
  ctx.fillStyle = 'rgba(8, 10, 16, 0.92)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.hudHeight);
  ctx.fillStyle = '#2c3342';
  ctx.fillRect(0, WORLD.hudHeight - 2, WORLD.width, 2);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(hud.levelName, 16, 20);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px sans-serif';
  ctx.fillText(hud.brief, 16, 42);

  // Alert meter: the highest detection among the guards.
  const alert = hud.alert;
  const label = alert >= 1 ? 'HUNTED' : alert > 0.35 ? 'SUSPICIOUS' : 'UNSEEN';
  const color = alert >= 1 ? PALETTE.alertHot : alert > 0.35 ? PALETTE.alertWarm : PALETTE.alertCalm;
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px sans-serif';
  ctx.fillText('ALERT', 560, 16);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(560, 26, 130, 9);
  ctx.fillStyle = color;
  ctx.fillRect(560, 26, 130 * Math.min(1, alert), 9);
  // The alert word sits under its meter, clear of the score column.
  ctx.fillStyle = color;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, 560, 48);

  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`◆ ${hud.gemsGot}/${hud.gemsTotal}`, 800, 18);
  ctx.fillText(`Score ${hud.score}`, 800, 40);
  ctx.fillText(formatTime(hud.seconds), 944, 18);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px sans-serif';
  ctx.fillText('M mute · R restart', 944, 40);
  ctx.textAlign = 'left';
}

export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function drawMinimap(ctx, level, player, guards, gems) {
  const w = 150;
  const h = 94;
  const x0 = WORLD.width - w - 12;
  const y0 = WORLD.height - h - 12;
  const sx = w / WORLD.width;
  const sy = h / WORLD.height;
  ctx.fillStyle = 'rgba(8, 10, 16, 0.85)';
  roundRect(ctx, x0 - 4, y0 - 4, w + 8, h + 8, 6);
  ctx.fill();
  ctx.strokeStyle = '#39415a';
  ctx.lineWidth = 1;
  ctx.stroke();
  for (const wall of level.walls) {
    ctx.fillStyle = '#565f75';
    ctx.fillRect(x0 + wall.x * sx, y0 + wall.y * sy, Math.max(1, wall.w * sx), Math.max(1, wall.h * sy));
  }
  for (const gem of gems) {
    if (gem.taken) continue;
    ctx.fillStyle = PALETTE.gem;
    ctx.fillRect(x0 + gem.x * sx - 2, y0 + gem.y * sy - 2, 4, 4);
  }
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.fillRect(x0 + level.exit.x * sx - 2, y0 + level.exit.y * sy - 2, 5, 5);
  for (const g of guards) {
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath(); ctx.arc(x0 + g.x * sx, y0 + g.y * sy, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath(); ctx.arc(x0 + player.x * sx, y0 + player.y * sy, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e8fffa';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MAP — green is the exit', x0, y0 - 8);
}

function overlay(ctx, title, lines, accent) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  ctx.fillStyle = 'rgba(6, 8, 13, 0.78)';
  ctx.fillRect(0, 0, cw, ch);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, cw / 2, 200);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, cw / 2, 262 + i * 28);
  });
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '14px sans-serif';
  ctx.fillText('Press Enter or click to continue', cw / 2, 262 + lines.length * 28 + 26);
}

export function drawTitle(ctx) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  ctx.fillStyle = '#0d1017';
  ctx.fillRect(0, 0, cw, ch);
  // A decorative title backdrop: a dark hall, one cone, one thief.
  // Kept to the empty corners so no decoration ever covers the text.
  ctx.fillStyle = 'rgba(255, 214, 90, 0.10)';
  ctx.beginPath();
  ctx.moveTo(850, 585);
  ctx.lineTo(690, 505);
  ctx.lineTo(690, 650);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath(); ctx.arc(850, 585, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath(); ctx.arc(260, 420, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.gem;
  ctx.beginPath();
  ctx.moveTo(480, 530); ctx.lineTo(492, 544); ctx.lineTo(480, 558); ctx.lineTo(468, 544);
  ctx.closePath(); ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.gem;
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText('EMBERLIGHT HEIST', cw / 2, 160);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '19px sans-serif';
  ctx.fillText('A top-down stealth game — steal the ember gems, dodge the lantern cones,', cw / 2, 222);
  ctx.fillText('hide behind crates and shadows, and reach the green exit unseen.', cw / 2, 250);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '15px sans-serif';
  ctx.fillText('Move: WASD / arrows — or click anywhere to walk there', cw / 2, 312);
  ctx.fillText('Hold Shift to sneak (slower, harder to spot)  ·  M mute  ·  R restart', cw / 2, 338);
  ctx.fillText('Yellow cones are guard sight. Fill a guard’s meter and the hunt is on.', cw / 2, 364);
  ctx.fillText('Three wings: The Gallery, The Vault Wing, The Ember Vault.', cw / 2, 390);
  ctx.fillStyle = PALETTE.exitGlow;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press Enter or click to begin the heist', cw / 2, 460);
}

export function drawLevelIntro(ctx, level, index) {
  overlay(ctx, level.name, [level.brief, `Wing ${index + 1} of 3 — ${level.gems.length} ember gems hide here.`], PALETTE.gem);
}

export function drawLevelClear(ctx, score, timeBonus, ghost) {
  overlay(ctx, 'WING CLEARED', [
    `Level score ${score}  ·  time bonus +${timeBonus}`,
    ghost ? 'GHOST — no guard ever raised the alarm. +200' : 'The alarm sounded at least once — no ghost bonus this time.',
    'The next wing is darker, and the patrols are faster.',
  ], PALETTE.exitGlow);
}

export function drawCaught(ctx, guardName) {
  overlay(ctx, 'CAUGHT!', [
    `${guardName} grabbed your collar under the lantern light.`,
    'The ember gems scatter across the floor. The night watch wins this round.',
    'Press R or Enter to try the wing again.',
  ], PALETTE.alertHot);
}

export function drawHeistComplete(ctx, score) {
  overlay(ctx, 'HEIST COMPLETE', [
    'Every wing cleared. The ember vault is empty, and the night watch',
    'never knew your name. The museum will miss its gems by morning.',
    `Final score: ${score}`,
  ], PALETTE.gem);
}

// Draw one whole frame of live play.
export function drawWorld(ctx, game, time) {
  const level = game.level;
  const blockers = [...level.walls, ...level.crates];
  ctx.save();
  ctx.translate(0, WORLD.hudHeight);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WORLD.width, WORLD.height);
  ctx.clip();
  drawFloor(ctx, level);
  drawWallsAndCover(ctx, level);
  drawExit(ctx, level, time);
  drawGems(ctx, game.gems, time);
  for (const guard of game.guards) drawGuard(ctx, guard, blockers);
  drawPlayer(ctx, game.player, time);
  drawMinimap(ctx, level, game.player, game.guards, game.gems);
  ctx.restore();
  ctx.restore();
  drawHud(ctx, {
    levelName: level.name,
    brief: level.brief,
    alert: game.maxDetection(),
    gemsGot: game.gems.filter((g) => g.taken).length,
    gemsTotal: game.gems.length,
    score: game.score,
    seconds: game.levelSeconds,
  });
}

