// Emberlight Heist — keyboard and mouse input.
// One clear job: turn raw DOM events into one tidy input state the game
// reads each frame. No game logic lives here.

import { KEYS } from './config.js';

export function createInput(canvas) {
  const state = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    // A click-to-move target in world coordinates, or null.
    clickTarget: null,
    // True for one frame when the player presses a confirm key or clicks.
    confirmPressed: false,
    restartPressed: false,
    mutePressed: false,
  };

  function setKey(code, pressed) {
    if (KEYS.up.includes(code)) state.up = pressed;
    else if (KEYS.down.includes(code)) state.down = pressed;
    else if (KEYS.left.includes(code)) state.left = pressed;
    else if (KEYS.right.includes(code)) state.right = pressed;
    else if (KEYS.sneak.includes(code)) state.sneak = pressed;
  }

  function worldPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return {
      x: (clientX - r.left) * scaleX,
      y: (clientY - r.top) * scaleY,
    };
  }

  function onKeyDown(event) {
    if (KEYS.confirm.includes(event.code)) {
      if (!event.repeat) state.confirmPressed = true;
      event.preventDefault();
      return;
    }
    if (KEYS.restart.includes(event.code)) {
      if (!event.repeat) state.restartPressed = true;
      return;
    }
    if (event.code === 'KeyM') {
      if (!event.repeat) state.mutePressed = true;
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    setKey(event.code, true);
  }

  function onKeyUp(event) {
    setKey(event.code, false);
  }

  function onMouseDown(event) {
    state.clickTarget = worldPoint(event.clientX, event.clientY);
    state.confirmPressed = true;
  }

  function onBlur() {
    state.up = state.down = state.left = state.right = state.sneak = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('blur', onBlur);

  // The game calls this once per frame after reading the one-shot flags.
  state.consumeOneShots = function consumeOneShots() {
    state.confirmPressed = false;
    state.restartPressed = false;
    state.mutePressed = false;
  };

  // True while any movement key is held.
  state.hasMoveKeys = function hasMoveKeys() {
    return state.up || state.down || state.left || state.right;
  };

  state.moveVector = function moveVector() {
    let x = 0;
    let y = 0;
    if (state.left) x -= 1;
    if (state.right) x += 1;
    if (state.up) y -= 1;
    if (state.down) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y };
  };

  return state;
}
