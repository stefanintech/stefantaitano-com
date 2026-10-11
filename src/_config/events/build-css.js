import fs from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import cssnano from 'cssnano';
import fg from 'fast-glob';

const buildCss = async (inputPath, outputPath) => {
  const inputContent = await fs.readFile(inputPath, 'utf-8');
  const result = await postcss([postcssImport, cssnano]).process(inputContent, {from: inputPath});

  await fs.mkdir(path.dirname(outputPath), {recursive: true});
  await fs.writeFile(outputPath, result.css);

  return result.css;
};

// Plain CSS, no Tailwind. Each file becomes an include that pages inline through the "rasa" bundle.
export const buildAllCss = async () => {
  const files = await fg(['src/assets/css/rasa/**/*.css']);
  await Promise.all(files.map(inputPath => buildCss(inputPath, `src/_includes/css/rasa-${path.basename(inputPath)}`)));
};
