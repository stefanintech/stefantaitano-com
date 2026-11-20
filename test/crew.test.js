// The crew section's data and vendored avatar script. Source files only, no build.
// The smoke test checks the built /ai page renders these cards.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREW_FILE = path.join(ROOT, 'src/_data/crew.yaml');
const VENDOR_FILE = path.join(ROOT, 'src/assets/scripts/vendor/open-bot-avatar.js');
const LICENSE_FILE = path.join(ROOT, 'src/assets/scripts/vendor/open-bot-avatar.LICENSE');

const CREW_STATES = ['working', 'thinking', 'waiting', 'blocked', 'done', 'idle'];
const MOODS = ['neutral', 'happy'];

const loadCrew = () => /** @type {any} */ (yaml.load(readFileSync(CREW_FILE, 'utf8')));

const loadVendored = () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(VENDOR_FILE, 'utf8'), context);
  return context.OpenBotAvatar;
};

describe('crew data', () => {
  it('lists the five crew members in order', () => {
    const crew = loadCrew();
    assert.deepEqual(
      crew.members.map(member => member.slug),
      ['bolt', 'inky', 'postcard', 'imogen', 'captain']
    );
  });

  it('gives every member a name, a job, a known state, and a known mood', () => {
    for (const member of loadCrew().members) {
      assert.ok(member.name?.trim(), `${member.slug}: no name`);
      assert.ok(member.job?.trim(), `${member.slug}: no job`);
      assert.ok(CREW_STATES.includes(member.state), `${member.slug}: unknown state ${member.state}`);
      if (member.mood !== undefined) assert.ok(MOODS.includes(member.mood), `${member.slug}: unknown mood ${member.mood}`);
    }
  });

  it('says the statuses are samples', () => {
    assert.equal(loadCrew().note, 'Sample statuses, not live.');
  });

  it('has no em or en dashes in the crew copy', () => {
    assert.doesNotMatch(readFileSync(CREW_FILE, 'utf8'), /[\u2013\u2014]/);
  });

  it('passes every avatar through the vendored validateAvatar', () => {
    const {validateAvatar} = loadVendored();
    for (const member of loadCrew().members) {
      const result = validateAvatar(member.avatar);
      assert.ok(result.ok, `${member.slug}: ${result.ok ? '' : result.errors.join('; ')}`);
    }
  });

  it('rejects a broken avatar, so the check above can fail', () => {
    const {validateAvatar} = loadVendored();
    const result = validateAvatar({version: 1, id: 'x', name: 'X', body: {path: 'M20 20 H80 V80 H20 Z'}, eyes: {x: 5, y: 5, spacing: 15, scale: 1}});
    assert.equal(result.ok, false);
  });
});

describe('vendored open-bot-avatar', () => {
  it('names the version, license, and source at the top of the file', () => {
    const head = readFileSync(VENDOR_FILE, 'utf8').slice(0, 600);
    assert.match(head, /open-bot-avatar 0\.3\.0/);
    assert.match(head, /MIT License/);
    assert.match(head, /https:\/\/github\.com\/DominikScholz\/open-bot-avatar/);
  });

  it('ships the MIT license text next to it', () => {
    assert.match(readFileSync(LICENSE_FILE, 'utf8'), /^MIT License/);
  });

  it('is vendored, not an npm dependency', () => {
    assert.doesNotMatch(readFileSync(path.join(ROOT, 'package.json'), 'utf8'), /open-bot-avatar/);
    assert.doesNotMatch(readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'), /open-bot-avatar/);
  });
});
