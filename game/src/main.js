// Emberlight Heist — boot and frame loop.
// One clear job: wire the canvas, input, game and renderer together and
// run the animation loop. No rules live here, only plumbing.

import { createInput } from './input.js';
import { Game } from './game.js';
import { stageShot } from './shots.js';
import {
  drawWorld, drawTitle, drawLevelIntro,
  drawLevelClear, drawCaught, drawHeistComplete,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const input = createInput(canvas);
const game = new Game(input);

// A handle for automated play-testing (and for curious players in the
// console). It changes nothing about the game itself.
window.__emberlight = game;

// Fit the 960x656 canvas into the window, keeping its aspect ratio.
function fitCanvas() {
  const scale = Math.min(
    window.innerWidth / canvas.width,
    window.innerHeight / canvas.height,
  );
  canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
  canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
  canvas.style.left = `${Math.floor((window.innerWidth - canvas.width * scale) / 2)}px`;
  canvas.style.top = `${Math.floor((window.innerHeight - canvas.height * scale) / 2)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// A screenshot pose freezes the simulation: the frame is the pose.
// (The loop still runs so the canvas paints; update() is skipped.)
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotStaged = shotName ? stageShot(game, shotName) : false;

let lastTime = performance.now();
let lastStatus = '';

function renderFrame() {
  switch (game.state) {
    case 'title':
      drawTitle(ctx);
      break;
    case 'intro':
      drawWorld(ctx, game, game.time);
      drawLevelIntro(ctx, game.level, game.levelIndex);
      break;
    case 'play':
      drawWorld(ctx, game, game.time);
      break;
    case 'cleared':
      drawWorld(ctx, game, game.time);
      drawLevelClear(ctx, game.clearScore, game.clearTimeBonus, game.clearGhost);
      break;
    case 'caught':
      drawWorld(ctx, game, game.time);
      drawCaught(ctx, game.caughtBy);
      break;
    case 'complete':
      drawWorld(ctx, game, game.time);
      drawHeistComplete(ctx, game.score);
      break;
    default:
      drawTitle(ctx);
      break;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (!shotStaged) game.update(dt);
  renderFrame();
  const status = game.statusText();
  if (status !== lastStatus) {
    statusEl.textContent = status;
    lastStatus = status;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
