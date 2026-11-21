// Emberlight Heist — shared tuning and palette.
// One clear job: every number and colour the rest of the game agrees on.

export const WORLD = { width: 960, height: 600, hudHeight: 56, canvasHeight: 656 };

export const PALETTE = {
  floorA: '#20242e',
  floorB: '#1b1f28',
  floorLine: '#262b37',
  wall: '#3a4152',
  wallTop: '#565f75',
  crate: '#7a5a33',
  crateEdge: '#a97f45',
  crateDark: '#5d4423',
  shadowZone: '#101a2e',
  shadowEdge: '#1d2c4d',
  exitGlow: '#37e08a',
  exitDoor: '#0d3d24',
  gem: '#ffb52e',
  gemCore: '#ffe9a8',
  player: '#2fd8c8',
  playerDark: '#0f7a70',
  guard: '#e5484d',
  guardDark: '#8f1d22',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneEdge: 'rgba(255, 214, 90, 0.55)',
  coneHot: 'rgba(255, 84, 64, 0.30)',
  coneHotEdge: 'rgba(255, 84, 64, 0.65)',
  text: '#f2ead8',
  textDim: '#a9b0c0',
  alertCalm: '#37e08a',
  alertWarm: '#ffb52e',
  alertHot: '#ff5440',
};

export const PLAYER = {
  radius: 13,
  walkSpeed: 165,
  sneakSpeed: 78,
  grabRadius: 20,
  caughtRadius: 20,
};

export const GUARD_TUNING = {
  chaseSpeedMult: 1.38,
  detectRate: 0.85,      // detection per second, point blank in the cone
  detectFalloff: 0.55,   // detection rate at the far edge of the cone
  decayRate: 0.30,       // detection lost per second while unseen
  shadowMult: 0.45,      // detection builds slower in a shadow zone
  loseSightSeconds: 3.0, // chase gives up after this long without sight
  turnSpeed: 3.4,        // radians per second a guard can turn its head
};

export const SCORING = {
  gem: 100,
  levelClear: 500,
  timeBonusRate: 2,      // points lost per second on the level clock
  timeBonusCap: 300,
  ghostBonus: 200,       // finishing a level without ever raising the alarm
};

export const KEYS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sneak: ['ShiftLeft', 'ShiftRight'],
  restart: ['KeyR'],
  confirm: ['Enter', 'Space'],
};
