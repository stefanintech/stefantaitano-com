// Joins the sample board JSON to crew.yaml for the /next-2027/ mockup.
// Postcard is a fixed line. Time fields are never copied onto that card.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(readFileSync(path.join(dir, 'next2027Board.json'), 'utf8'));
const crew = yaml.load(readFileSync(path.join(dir, 'crew.yaml'), 'utf8'));

const POSTCARD_LINE = 'check-ins post a day later';

const bySlug = new Map(crew.members.map(member => [member.slug, member]));

const members = sample.members.flatMap(row => {
  const person = bySlug.get(row.slug);
  if (!person) return [];

  const picture = {
    slug: person.slug,
    name: person.name,
    state: person.state,
    mood: person.mood || 'neutral',
    avatar: person.avatar
  };

  if (row.slug === 'postcard') {
    return [{...picture, line: POSTCARD_LINE}];
  }

  return [
    {
      ...picture,
      doing: row.doing,
      lastJobAt: row.lastJobAt,
      lastJobLabel: row.lastJobLabel
    }
  ];
});

export default {
  source: sample.source,
  members
};
