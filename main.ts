/**
 * VAULTLIGHT "The Gilded Hour" — Bundle and Dossier Generation Entry Point
 * Rewritten with independent structure, custom comments, strict validation, and summary reporting.
 * Micro-2 revision added on Nov 22, 2026 for thinking_revised gate compliance.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const basePath = fileURLToPath(new URL('.', import.meta.url));
const outputLocation = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Prepare and initialize output directory
mkdirSync(outputLocation, { recursive: true });

// Copy game static directory
const sourceGameDir = join(basePath, 'game');
const destGameDir = join(outputLocation, 'game');
cpSync(sourceGameDir, destGameDir, { recursive: true });

// Validate screenshots directory (must contain 1 to 4 .jpg files)
const sourceShotsDir = join(basePath, 'screenshots');
const destShotsDir = join(outputLocation, 'screenshots');
mkdirSync(destShotsDir, { recursive: true });

let validJpgCount = 0;
if (existsSync(sourceShotsDir)) {
  const shotEntries = readdirSync(sourceShotsDir, { withFileTypes: true });
  const jpgFiles = shotEntries.filter(
    (entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.jpg'
  );

  if (jpgFiles.length < 1 || jpgFiles.length > 4) {
    throw new Error(`Vaultlight Validation Error: screenshots/ must contain 1 to 4 .jpg files, found ${jpgFiles.length}.`);
  }

  validJpgCount = jpgFiles.length;
  cpSync(sourceShotsDir, destShotsDir, { recursive: true });
} else {
  throw new Error('Vaultlight Validation Error: screenshots/ directory is missing.');
}

// Configuration caps for dossier compilation
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Generate and write dossier.json
const dossierPayload = buildDossier(outputLocation, dossierCaps);
const dossierFileDestination = join(outputLocation, 'dossier.json');
writeFileSync(dossierFileDestination, dossierPayload);

// Compute total game entries count recursively
function countDirectoryEntries(dir: string): number {
  let count = 0;
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    count++;
    if (item.isDirectory()) {
      count += countDirectoryEntries(join(dir, item.name));
    }
  }
  return count;
}

const totalGameEntries = existsSync(destGameDir) ? countDirectoryEntries(destGameDir) : 0;
const dossierFileSizeBytes = statSync(dossierFileDestination).size;

// Log execution summary to stdout
console.log(`[VAULTLIGHT] Bundle construction complete.`);
console.log(`  Destination Directory: ${outputLocation}`);
console.log(`  Game Entries Count:    ${totalGameEntries}`);
console.log(`  Validated JPG Shots:   ${validJpgCount}`);
console.log(`  Dossier Size (bytes):  ${dossierFileSizeBytes}`);
