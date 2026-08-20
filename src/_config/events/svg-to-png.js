// Rasterize OG SVGs with the site fonts. Sharp/librsvg will not load the
// self-hosted woff2 files from @font-face, so TrueType copies live in
// src/_config/og-fonts/ and are registered with fontconfig for this step.
import {promises as fs} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const socialPreviewImagesDir = path.resolve('dist/assets/og-images');
const ogFontsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../og-fonts');

const fontconfigXml = (fontsDir, cacheDir) => `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>${fontsDir}</dir>
  <cachedir>${cacheDir}</cachedir>
</fontconfig>
`;

const withOgFonts = async fn => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'og-fontconfig-'));
  const cacheDir = path.join(tmp, 'cache');
  const confPath = path.join(tmp, 'fonts.conf');
  await fs.mkdir(cacheDir);
  await fs.writeFile(confPath, fontconfigXml(ogFontsDir, cacheDir));

  const previous = process.env.FONTCONFIG_FILE;
  process.env.FONTCONFIG_FILE = confPath;

  try {
    await fn();
  } finally {
    if (previous === undefined) {
      delete process.env.FONTCONFIG_FILE;
    } else {
      process.env.FONTCONFIG_FILE = previous;
    }
    await fs.rm(tmp, {recursive: true, force: true});
  }
};

export const svgToPng = async () => {
  let files;

  try {
    files = await fs.readdir(socialPreviewImagesDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No OG images directory found');
      return;
    }

    throw error;
  }

  const svgFiles = files.filter(filename => filename.endsWith('.svg'));

  await withOgFonts(async () => {
    await Promise.all(
      svgFiles.map(async filename => {
        const source = path.join(socialPreviewImagesDir, filename);
        const destination = path.join(socialPreviewImagesDir, filename.replace(/\.svg$/, '.png'));

        await sharp(source).png().toFile(destination);
      })
    );
  });
};
