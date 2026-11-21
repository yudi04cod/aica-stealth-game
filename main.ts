// Emberlight Heist — the hand-in program (Node 22, standard library only).
//
// It hands the game to make.fun: copy this repository's game/ and
// screenshots/ into the output directory and write dossier.json there,
// the summary the judge reads, built by the vendored make.fun library.
// The grader runs this program twice and the two runs must agree byte
// for byte, so it does nothing time- or order-dependent: plain copies
// and the library's own deterministic dossier.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in a half-built entry: the game must
// exist and its front door must be a file before anything is copied.
const gameEntry = join(repoRoot, 'game', 'index.html');
if (!existsSync(gameEntry) || !statSync(gameEntry).isFile()) {
  throw new Error(`missing game entry point: ${gameEntry}`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The same caps the gate enforces, so a local run refuses what the
// scorer would refuse: at most 4 screenshots of 256 KiB, game/ at most
// 993 files and 48 MiB with no path over 1000 bytes, and the dossier's
// source text capped at 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
