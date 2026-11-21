// Emberlight Heist — all sound is synthesized with WebAudio.
// One clear job: tiny bleeps and chimes, no audio files, no network.
// The context is created lazily on the first user gesture, so the page
// stays silent (and error-free) until the player actually plays.

let ctx = null;
let muted = false;

function audioContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

export function unlockAudio() {
  const ac = audioContext();
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

// A short two-note blip when the player confirms a screen (start, next wing).
export function playConfirm() {
  tone(520, 0.08, 'sine', 0.045);
  tone(780, 0.12, 'sine', 0.045, 0.07);
}

// A soft tap each time the thief's foot lands while moving.
export function playFootstep(sneaking) {
  tone(sneaking ? 150 : 190, 0.05, 'triangle', sneaking ? 0.015 : 0.03);
}

// The rising "someone is watching" tick, pitched by detection 0..1.
export function playSuspicionTick(detection) {
  const freq = 320 + detection * 420;
  tone(freq, 0.07, 'square', 0.02);
}

// Two-tone alarm when a guard's detection fills and the chase begins.
export function playAlarm() {
  tone(620, 0.16, 'sawtooth', 0.05, 0, 880);
  tone(880, 0.2, 'sawtooth', 0.05, 0.16, 620);
}

// A bright chime for an ember gem.
export function playPickup() {
  tone(740, 0.1, 'sine', 0.06);
  tone(1108, 0.16, 'sine', 0.05, 0.08);
}

// A low thud when the thief is caught.
export function playCaught() {
  tone(220, 0.35, 'sawtooth', 0.07, 0, 70);
  tone(110, 0.4, 'triangle', 0.06, 0.1, 55);
}

// A short rising arpeggio for clearing a level.
export function playLevelClear() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'sine', 0.055, i * 0.09));
}

// A longer fanfare for finishing the whole heist.
export function playHeistComplete() {
  [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.22, 'triangle', 0.05, i * 0.11));
}
