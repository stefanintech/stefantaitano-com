import {promises as fs} from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const socialPreviewImagesDir = path.resolve('dist/assets/og-images');

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

  await Promise.all(
    svgFiles.map(async filename => {
      const source = path.join(socialPreviewImagesDir, filename);
      const destination = path.join(socialPreviewImagesDir, filename.replace(/\.svg$/, '.png'));

      await sharp(source).png().toFile(destination);
    })
  );
};
