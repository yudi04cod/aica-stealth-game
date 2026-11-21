// Emberlight Heist — the three museum wings.
// One clear job: pure level data. No logic lives here, only floor plans.
// A wall blocks movement and sight. A crate blocks movement and sight and is
// cover to crouch behind. A shadow zone is dark floor where guards spot you
// much slower. Every guard walks a loop of waypoints.

function rect(x, y, w, h) { return { x, y, w, h }; }

function borderWalls() {
  return [
    rect(0, 0, 960, 16), rect(0, 584, 960, 16),
    rect(0, 0, 16, 600), rect(944, 0, 16, 600),
  ];
}

// Level 1 — The Gallery. Two slow guards, long sightlines, gentle intro.
const GALLERY = {
  name: 'Level 1 — The Gallery',
  brief: 'Slip past the night watch. Grab what glitters. Reach the green exit.',
  playerStart: { x: 70, y: 520 },
  exit: rect(872, 48, 56, 56),
  walls: [
    ...borderWalls(),
    rect(300, 120, 180, 24),
    rect(300, 300, 24, 160),
    rect(560, 420, 200, 24),
    rect(640, 120, 24, 140),
  ],
  crates: [
    rect(180, 220, 64, 64),
    rect(420, 380, 72, 72),
    rect(700, 260, 64, 64),
    rect(120, 420, 56, 56),
  ],
  shadows: [
    rect(96, 96, 150, 90),
    rect(700, 440, 180, 100),
    rect(430, 110, 130, 80),
  ],
  lanterns: [
    { x: 480, y: 210, r: 130 },
    { x: 220, y: 470, r: 110 },
    { x: 780, y: 140, r: 120 },
  ],
  guards: [
    {
      name: 'Mara',
      x: 480, y: 150, speed: 62, range: 150, fov: 1.25,
      waypoints: [{ x: 480, y: 150 }, { x: 480, y: 480 }, { x: 240, y: 480 }, { x: 240, y: 150 }],
    },
    {
      name: 'Bram',
      x: 760, y: 420, speed: 55, range: 140, fov: 1.15,
      waypoints: [{ x: 760, y: 420 }, { x: 760, y: 180 }, { x: 560, y: 180 }],
    },
  ],
  gems: [
    { x: 340, y: 210 }, { x: 600, y: 330 }, { x: 830, y: 500 },
  ],
};

// Level 2 — The Vault Wing. Three guards, tighter corridors, more cover.
const VAULT_WING = {
  name: 'Level 2 — The Vault Wing',
  brief: 'The vault wing is patrolled in pairs. Shadows are your friends.',
  playerStart: { x: 70, y: 520 },
  exit: rect(872, 48, 56, 56),
  walls: [
    ...borderWalls(),
    rect(200, 100, 24, 200),
    rect(200, 400, 24, 140),
    rect(420, 100, 260, 24),
    rect(420, 300, 24, 200),
    rect(620, 420, 240, 24),
    rect(760, 140, 24, 180),
  ],
  crates: [
    rect(300, 220, 64, 64),
    rect(520, 200, 72, 56),
    rect(140, 300, 56, 56),
    rect(660, 300, 64, 64),
    rect(840, 380, 56, 56),
    rect(480, 480, 72, 56),
  ],
  shadows: [
    rect(96, 140, 90, 220),
    rect(300, 440, 150, 100),
    rect(660, 96, 130, 90),
    rect(830, 200, 90, 120),
  ],
  lanterns: [
    { x: 350, y: 140, r: 110 },
    { x: 580, y: 380, r: 120 },
    { x: 830, y: 300, r: 100 },
  ],
  guards: [
    {
      name: 'Mara',
      x: 320, y: 130, speed: 70, range: 155, fov: 1.25,
      waypoints: [{ x: 320, y: 130 }, { x: 320, y: 520 }, { x: 120, y: 520 }, { x: 120, y: 130 }],
    },
    {
      name: 'Bram',
      x: 540, y: 480, speed: 66, range: 150, fov: 1.2,
      waypoints: [{ x: 540, y: 480 }, { x: 540, y: 200 }, { x: 700, y: 200 }, { x: 700, y: 480 }],
    },
    {
      name: 'Ilsa',
      x: 850, y: 300, speed: 60, range: 145, fov: 1.15,
      waypoints: [{ x: 850, y: 300 }, { x: 850, y: 120 }, { x: 700, y: 120 }],
    },
  ],
  gems: [
    { x: 130, y: 90 }, { x: 480, y: 180 }, { x: 700, y: 520 }, { x: 880, y: 240 },
  ],
};

// Level 3 — The Ember Vault. Four guards, one fast warden, one rotating sentry.
const EMBER_VAULT = {
  name: 'Level 3 — The Ember Vault',
  brief: 'The ember vault itself. The warden is fast — never let him see you run.',
  playerStart: { x: 70, y: 520 },
  exit: rect(872, 48, 56, 56),
  walls: [
    ...borderWalls(),
    rect(180, 120, 24, 180),
    rect(180, 420, 24, 120),
    rect(360, 80, 200, 24),
    rect(360, 280, 24, 220),
    rect(560, 160, 24, 200),
    rect(560, 460, 240, 24),
    rect(760, 100, 24, 160),
    rect(700, 300, 180, 24),
  ],
  crates: [
    rect(260, 200, 64, 64),
    rect(440, 160, 56, 56),
    rect(640, 220, 64, 64),
    rect(120, 320, 56, 56),
    rect(440, 380, 72, 56),
    rect(800, 400, 56, 56),
    rect(640, 480, 64, 56),
  ],
  shadows: [
    rect(96, 96, 70, 200),
    rect(280, 440, 130, 100),
    rect(620, 96, 120, 80),
    rect(830, 330, 90, 130),
    rect(470, 250, 70, 110),
  ],
  lanterns: [
    { x: 300, y: 140, r: 100 },
    { x: 500, y: 300, r: 120 },
    { x: 820, y: 200, r: 110 },
    { x: 700, y: 520, r: 100 },
  ],
  guards: [
    {
      name: 'Mara',
      x: 300, y: 110, speed: 78, range: 160, fov: 1.3,
      waypoints: [{ x: 300, y: 110 }, { x: 300, y: 500 }, { x: 110, y: 500 }, { x: 110, y: 110 }],
    },
    {
      name: 'Bram',
      x: 480, y: 480, speed: 74, range: 155, fov: 1.25,
      waypoints: [{ x: 480, y: 480 }, { x: 480, y: 140 }, { x: 660, y: 140 }, { x: 660, y: 480 }],
    },
    {
      name: 'Ilsa',
      x: 840, y: 320, speed: 68, range: 150, fov: 1.2,
      waypoints: [{ x: 840, y: 320 }, { x: 840, y: 120 }, { x: 700, y: 120 }, { x: 700, y: 320 }],
    },
    {
      name: 'Warden Kess',
      x: 640, y: 380, speed: 104, range: 175, fov: 1.35,
      waypoints: [{ x: 640, y: 380 }, { x: 640, y: 520 }, { x: 860, y: 520 }, { x: 860, y: 380 }],
    },
    {
      name: 'Sentry',
      x: 480, y: 300, speed: 0, range: 170, fov: 1.1, rotate: true,
      waypoints: [{ x: 480, y: 300 }],
    },
  ],
  gems: [
    { x: 120, y: 90 }, { x: 420, y: 200 }, { x: 620, y: 420 }, { x: 880, y: 180 }, { x: 760, y: 540 },
  ],
};

export const LEVELS = [GALLERY, VAULT_WING, EMBER_VAULT];

export function levelCount() { return LEVELS.length; }
