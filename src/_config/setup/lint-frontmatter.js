/**
 * Front matter has to parse. Schema rules for check-ins stay in
 * src/_config/utils/checkins.js; this only catches broken YAML.
 *
 *   node ./src/_config/setup/lint-frontmatter.js
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fg from 'fast-glob';
import yaml from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const files = await fg(['src/**/*.{md,njk}'], {cwd: root, dot: false});
const problems = [];

for (const rel of files) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) continue;

  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    problems.push(`${rel}: front matter does not close`);
    continue;
  }

  try {
    const data = yaml.load(match[1]);
    if (data !== null && data !== undefined && (typeof data !== 'object' || Array.isArray(data))) {
      problems.push(`${rel}: front matter must be a mapping`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : 'invalid YAML';
    problems.push(`${rel}: ${message}`);
  }
}

if (problems.length) {
  console.error(`[lint] front matter:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}

console.log(`[lint] front matter ok (${files.length} markdown and nunjucks files)`);
