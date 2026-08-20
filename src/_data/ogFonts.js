import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const fontsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/fonts');

const woff2DataUri = relativePath => {
  const file = path.join(fontsDir, relativePath);
  const base64 = fs.readFileSync(file).toString('base64');
  return `data:font/woff2;base64,${base64}`;
};

export const atkinson = woff2DataUri('atkinson/atkinson-hyperlegible-regular.woff2');
export const fraunces = woff2DataUri('fraunces/fraunces-latin-900.woff2');
export const caveat = woff2DataUri('caveat/caveat-latin-600.woff2');
