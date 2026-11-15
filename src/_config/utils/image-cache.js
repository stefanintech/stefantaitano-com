// Keeps eleventy-img output between builds.
//
// `npm run clean` deletes `dist/`, and eleventy-img only skips an encode when the output file already
// exists. So images are written to `.cache/img/` instead (Netlify restores `.cache` through
// netlify-plugin-cache), and after the build only the files this build used are copied into `dist/`
// at the same URLs. Anything left over in the cache is deleted so it can't keep growing.
import fs from 'node:fs/promises';
import path from 'node:path';

export const IMAGE_CACHE_DIR = '.cache/img';

/** @type {Map<string, string>} output URL -> cached file */
const used = new Map();

/**
 * Wraps an eleventy-img `filenameFormat` so every output file is remembered, cache hit or not.
 * eleventy-img calls it for each output with the instance options, including `outputDir` and `urlPath`.
 * @param {(id: string, src: string, width: number, format: string) => string} [format]
 */
export const trackFilename =
  (format = (id, _src, width, ext) => (width ? `${id}-${width}.${ext}` : `${id}.${ext}`)) =>
  /** @param {string} id @param {string} src @param {number} width @param {string} ext @param {any} options */
  (id, src, width, ext, options) => {
    const filename = format(id, src, width, ext);
    // The dev server's on-request images are dry runs and never write a file.
    if (!options.dryRun)
      used.set(path.posix.join(options.urlPath, filename), path.join(options.outputDir, filename));
    return filename;
  };

/**
 * Copies this build's images from the cache into the output folder. On a full build, also deletes
 * cached files the build didn't use.
 * @param {{dir: {output: string}, runMode: string}} event
 */
export const copyCachedImages = async ({dir, runMode}) => {
  await Promise.all(
    [...used].map(async ([url, cached]) => {
      const target = path.join(dir.output, url);
      await fs.mkdir(path.dirname(target), {recursive: true});
      await fs.copyFile(cached, target);
    })
  );

  if (runMode !== 'build') return;

  const keep = new Set([...used.values()].map(file => path.resolve(file)));
  const entries = await fs.readdir(IMAGE_CACHE_DIR, {recursive: true, withFileTypes: true}).catch(() => []);
  for (const entry of entries) {
    const file = path.resolve(entry.parentPath, entry.name);
    if (entry.isFile() && !keep.has(file)) await fs.rm(file);
  }
  // Deepest first, so a folder emptied above is gone before its parent is tried. rmdir fails on a non-empty folder.
  const folders = entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.resolve(entry.parentPath, entry.name));
  for (const folder of folders.sort((a, b) => b.length - a.length)) await fs.rmdir(folder).catch(() => {});
};
