/**
 * Re-encodes a check-in's day and night images to the site's image contract.
 *
 *   npm run checkins:images -- <slug> <day-source> <night-source>
 *   npm run checkins:images -- --check
 *
 * <slug> is the entry's filename without `.md`, e.g. 2024-11-29-minnehaha-falls.
 * Output: src/assets/images/checkins/<slug>-day.webp and <slug>-night.webp,
 * 1600×1067 WebP, no metadata, at most 250,000 bytes each. Sources stay where
 * they are and are never copied into the repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {IMAGES_DIR, IMAGE_SPEC, imageFileProblems, validateCheckinImages} from '../utils/checkins.js';

const QUALITIES = [80, 75, 70];

const encode = async (source, target) => {
  const input = await fs.promises.readFile(source);
  const meta = await sharp(input).metadata();
  const sourceRatio = (meta.autoOrient?.width ?? meta.width) / (meta.autoOrient?.height ?? meta.height);
  const targetRatio = IMAGE_SPEC.width / IMAGE_SPEC.height;
  if (Math.abs(sourceRatio - targetRatio) / targetRatio > 0.01) {
    console.warn(`  ${path.basename(source)} isn't 3:2 (${meta.width}×${meta.height}); cropping to fill`);
  }

  for (const quality of QUALITIES) {
    const output = await sharp(input)
      .rotate()
      .resize(IMAGE_SPEC.width, IMAGE_SPEC.height, {fit: 'cover'})
      .webp({quality})
      .toBuffer();
    if (output.length <= IMAGE_SPEC.maxBytes) {
      await fs.promises.writeFile(target, output);
      return {quality, bytes: output.length};
    }
  }
  throw new Error(`${source} is still over ${IMAGE_SPEC.maxBytes} bytes at quality ${QUALITIES.at(-1)}`);
};

const run = async () => {
  const args = process.argv.slice(2);

  if (args[0] === '--check') {
    await validateCheckinImages();
    console.log(`[checkins:images] ${IMAGES_DIR} passes the image checks`);
    return;
  }

  const [slug, daySource, nightSource] = args;
  if (!slug || !daySource || !nightSource || !/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(slug)) {
    console.error('Usage: npm run checkins:images -- <slug> <day-source> <night-source>');
    console.error('       npm run checkins:images -- --check');
    process.exitCode = 1;
    return;
  }

  await fs.promises.mkdir(IMAGES_DIR, {recursive: true});
  for (const [variant, source] of [
    ['day', daySource],
    ['night', nightSource]
  ]) {
    const target = path.join(IMAGES_DIR, `${slug}-${variant}.webp`);
    const {quality, bytes} = await encode(source, target);
    const problems = await imageFileProblems(target);
    if (problems.length) throw new Error(`${target}\n  - ${problems.join('\n  - ')}`);
    console.log(
      `[checkins:images] ${target}: ${IMAGE_SPEC.width}×${IMAGE_SPEC.height}, q${quality}, ${bytes} bytes`
    );
  }
};

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
