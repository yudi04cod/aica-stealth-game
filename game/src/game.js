// Emberlight Heist — the game itself.
// One clear job: the state machine and the rules. Title → intro → play →
// wing cleared / caught → next wing → heist complete. Scoring, gems,
// alarms and the clock live here; drawing lives in render.js.

import { LEVELS, levelCount } from './levels.js';
import { Guard } from './guard.js';
import { Player } from './player.js';
import { SCORING, PLAYER } from './config.js';
import {
  playFootstep, playSuspicionTick, playAlarm, playPickup,
  playCaught, playLevelClear, playHeistComplete, playConfirm,
  unlockAudio, toggleMute,
} from './audio.js';

export class Game {
  constructor(input) {
    this.input = input;
    this.state = 'title'; // title | intro | play | cleared | caught | complete
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.player = new Player(LEVELS[0].playerStart);
    this.guards = [];
    this.gems = [];
    this.score = 0;
    this.levelSeconds = 0;
    this.time = 0;
    this.alarmed = false;
    this.caughtBy = '';
    this.clearScore = 0;
    this.clearTimeBonus = 0;
    this.clearGhost = false;
    this.lastSuspicionTick = 0;
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.player.reset(this.level.playerStart);
    this.guards = this.level.guards.map((def) => new Guard(def));
    this.gems = this.level.gems.map((g) => ({ x: g.x, y: g.y, taken: false }));
    this.levelSeconds = 0;
    this.alarmed = false;
    this.caughtBy = '';
    this.input.clickTarget = null;
  }

  maxDetection() {
    let max = 0;
    for (const g of this.guards) max = Math.max(max, g.detection);
    return max;
  }

  startGame() {
    this.score = 0;
    this.loadLevel(0);
    this.state = 'intro';
  }

  nextLevel() {
    if (this.levelIndex + 1 >= levelCount()) {
      this.state = 'complete';
      playHeistComplete();
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.state = 'intro';
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.state = 'intro';
  }

  update(dt) {
    this.time += dt;
    const input = this.input;

    if (input.mutePressed) {
      toggleMute();
    }
    if (input.restartPressed && (this.state === 'play' || this.state === 'caught')) {
      this.restartLevel();
      input.consumeOneShots();
      return;
    }

    switch (this.state) {
      case 'title':
        if (input.confirmPressed) {
          unlockAudio();
          playConfirm();
          this.startGame();
        }
        break;

      case 'intro':
        if (input.confirmPressed) {
          unlockAudio();
          playConfirm();
          this.state = 'play';
        }
        break;

      case 'play':
        this.updatePlay(dt);
        break;

      case 'cleared':
        if (input.confirmPressed) this.nextLevel();
        break;

      case 'caught':
        if (input.confirmPressed) this.restartLevel();
        break;

      case 'complete':
        if (input.confirmPressed) this.startGame();
        break;
      default:
        break;
    }
    input.consumeOneShots();
  }

  updatePlay(dt) {
    this.levelSeconds += dt;
    const input = this.input;

    const stepped = this.player.update(dt, input, this.level);
    if (stepped) playFootstep(this.player.sneaking);

    let alarmNow = false;
    for (const guard of this.guards) {
      const before = guard.detection;
      guard.update(dt, this.player, this.level);
      if (guard.detection >= 1 && before < 1) alarmNow = true;
      // A rising suspicion tick, pitched by how close the guard is to alarm,
      // sounded only while the guard can actually see the thief.
      if (guard.seeing && guard.detection > 0.3 && this.time - this.lastSuspicionTick > 0.45) {
        this.lastSuspicionTick = this.time;
        playSuspicionTick(guard.detection);
      }
    }
    if (alarmNow) {
      this.alarmed = true;
      playAlarm();
    }

    // Gems: close enough and the thief pockets one.
    for (const gem of this.gems) {
      if (gem.taken) continue;
      const d = Math.hypot(gem.x - this.player.x, gem.y - this.player.y);
      if (d < PLAYER.grabRadius + 8) {
        gem.taken = true;
        this.score += SCORING.gem;
        playPickup();
      }
    }

    // Caught: a chasing guard closes to arm's reach.
    for (const guard of this.guards) {
      const d = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (guard.state === 'chase' && d < PLAYER.caughtRadius + 8) {
        this.state = 'caught';
        this.caughtBy = guard.name;
        playCaught();
        return;
      }
    }

    // The exit: step onto the glowing doorway to clear the wing.
    const e = this.level.exit;
    const insideExit = this.player.x > e.x && this.player.x < e.x + e.w
      && this.player.y > e.y && this.player.y < e.y + e.h;
    if (insideExit) this.clearLevel();
  }

  clearLevel() {
    const timeBonus = Math.max(0, SCORING.timeBonusCap - Math.floor(this.levelSeconds) * SCORING.timeBonusRate);
    const ghost = !this.alarmed;
    const gained = SCORING.levelClear + timeBonus + (ghost ? SCORING.ghostBonus : 0);
    this.score += gained;
    this.clearScore = this.score;
    this.clearTimeBonus = timeBonus;
    this.clearGhost = ghost;
    this.state = 'cleared';
    playLevelClear();
  }

  statusText() {
    if (this.state === 'caught') return `Caught by ${this.caughtBy}! Press R to retry.`;
    if (this.state === 'complete') return `Heist complete! Final score ${this.score}.`;
    return `${this.level.name} — score ${this.score}`;
  }
}
