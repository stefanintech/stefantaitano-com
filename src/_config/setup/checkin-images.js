/**
 * Re-encodes a check-in's day and night images to the site's image contract.
 *
 *   npm run checkins:images -- <slug> <day-source> <night-source>
 *   npm run checkins:images -- --check
 *
 * <slug> is the entry's filename without `.md`, e.g. 2026-04-02-place-name.
 * Output: src/assets/images/checkins/<slug>-day.webp and <slug>-night.webp,
 * 1600×1067 WebP, no metadata, at most 250,000 bytes each. Sources stay where
 * they are and are never copied into the repo.
 *
 * When a source has transparent padding, both images are trimmed to one shared
 * alpha box (so day and night stay registered), given a small even margin, and
 * fit to 3:2. Opaque sources are cover-cropped, as before.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {IMAGES_DIR, IMAGE_SPEC, imageFileProblems, validateCheckinImages} from '../utils/checkins.js';

const QUALITIES = [80, 75, 70];
const ALPHA_CUTOFF = 10;
const MARGIN_OF_CONTENT = 0.04;

const alphaBounds = ({data, info}) => {
  const {width, height} = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= ALPHA_CUTOFF) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return null;
  return {minX, minY, maxX, maxY};
};

const hasTransparentPadding = (bounds, info) =>
  bounds.minX > 0 || bounds.minY > 0 || bounds.maxX < info.width - 1 || bounds.maxY < info.height - 1;

/**
 * One crop for both images: the union of their opaque pixels, a small margin
 * on every side, then expanded evenly on the short axis to 3:2.
 */
const sharedFrame = (day, night) => {
  const minX = Math.min(day.bounds.minX, night.bounds.minX);
  const minY = Math.min(day.bounds.minY, night.bounds.minY);
  const maxX = Math.max(day.bounds.maxX, night.bounds.maxX);
  const maxY = Math.max(day.bounds.maxY, night.bounds.maxY);
  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  const margin = Math.max(2, Math.round(Math.min(contentW, contentH) * MARGIN_OF_CONTENT));

  let left = minX - margin;
  let top = minY - margin;
  let width = contentW + margin * 2;
  let height = contentH + margin * 2;
  const target = IMAGE_SPEC.width / IMAGE_SPEC.height;

  if (width / height > target) {
    const nextH = Math.round((width * IMAGE_SPEC.height) / IMAGE_SPEC.width);
    top -= Math.floor((nextH - height) / 2);
    height = nextH;
  } else {
    const nextW = Math.round((height * IMAGE_SPEC.width) / IMAGE_SPEC.height);
    left -= Math.floor((nextW - width) / 2);
    width = nextW;
  }

  return {left, top, width, height, margin};
};

const readOriented = async source => {
  const png = await sharp(source).rotate().png().toBuffer();
  const meta = await sharp(png).metadata();
  const {data, info} = await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const bounds = alphaBounds({data, info});
  if (!bounds) throw new Error(`${source} has no opaque pixels`);
  return {png, info, bounds, hasAlpha: Boolean(meta.hasAlpha)};
};

const extractFrame = async (png, frame, sourceWidth, sourceHeight) => {
  const left = Math.max(0, frame.left);
  const top = Math.max(0, frame.top);
  const right = Math.min(sourceWidth, frame.left + frame.width);
  const bottom = Math.min(sourceHeight, frame.top + frame.height);
  const width = right - left;
  const height = bottom - top;
  if (width < 1 || height < 1) throw new Error('shared crop misses the image');

  const piece = await sharp(png).extract({left, top, width, height}).png().toBuffer();
  return sharp({
    create: {
      width: frame.width,
      height: frame.height,
      channels: 4,
      background: {r: 0, g: 0, b: 0, alpha: 0}
    }
  })
    .composite([{input: piece, left: left - frame.left, top: top - frame.top}])
    .png()
    .toBuffer();
};

const writeWebp = async (input, target, fit) => {
  for (const quality of QUALITIES) {
    const output = await sharp(input).resize(IMAGE_SPEC.width, IMAGE_SPEC.height, {fit}).webp({quality}).toBuffer();
    if (output.length <= IMAGE_SPEC.maxBytes) {
      await fs.promises.writeFile(target, output);
      return {quality, bytes: output.length};
    }
  }
  throw new Error(`${target} is still over ${IMAGE_SPEC.maxBytes} bytes at quality ${QUALITIES.at(-1)}`);
};

const report = async (target, result) => {
  const problems = await imageFileProblems(target);
  if (problems.length) throw new Error(`${target}\n  - ${problems.join('\n  - ')}`);
  console.log(
    `[checkins:images] ${target}: ${IMAGE_SPEC.width}×${IMAGE_SPEC.height}, q${result.quality}, ${result.bytes} bytes`
  );
};

const encodeCover = async (source, target) => {
  const meta = await sharp(source).metadata();
  const sourceRatio = (meta.autoOrient?.width ?? meta.width) / (meta.autoOrient?.height ?? meta.height);
  const targetRatio = IMAGE_SPEC.width / IMAGE_SPEC.height;
  if (Math.abs(sourceRatio - targetRatio) / targetRatio > 0.01) {
    console.warn(`  ${path.basename(source)} isn't 3:2 (${meta.width}×${meta.height}); cropping to fill`);
  }
  const rotated = await sharp(source).rotate().toBuffer();
  return writeWebp(rotated, target, 'cover');
};

const encodePair = async (daySource, nightSource, dayTarget, nightTarget) => {
  const day = await readOriented(daySource);
  const night = await readOriented(nightSource);
  const trim =
    day.hasAlpha &&
    night.hasAlpha &&
    (hasTransparentPadding(day.bounds, day.info) || hasTransparentPadding(night.bounds, night.info));

  if (!trim) {
    await report(dayTarget, await encodeCover(daySource, dayTarget));
    await report(nightTarget, await encodeCover(nightSource, nightTarget));
    return;
  }

  if (day.info.width !== night.info.width || day.info.height !== night.info.height) {
    throw new Error('day and night sources must be the same size so the trimmed crop stays registered');
  }

  const frame = sharedFrame(day, night);
  console.log(
    `[checkins:images] trimmed transparent padding; shared crop ${frame.width}×${frame.height} at ${frame.left},${frame.top} with a ${frame.margin}px margin`
  );

  for (const [image, target] of [
    [day, dayTarget],
    [night, nightTarget]
  ]) {
    const framed = await extractFrame(image.png, frame, image.info.width, image.info.height);
    await report(target, await writeWebp(framed, target, 'fill'));
  }
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
  await encodePair(
    daySource,
    nightSource,
    path.join(IMAGES_DIR, `${slug}-day.webp`),
    path.join(IMAGES_DIR, `${slug}-night.webp`)
  );
};

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
