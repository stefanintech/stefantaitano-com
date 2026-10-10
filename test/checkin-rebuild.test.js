import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {describe, it} from 'node:test';

describe('check-in rebuild', () => {
  it('does not schedule a rebuild or keep a build-hook function', () => {
    const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
    const functionsDir = new URL('../netlify/functions/', import.meta.url);

    assert.doesNotMatch(toml, /checkin-rebuild/);
    assert.doesNotMatch(toml, /@hourly/);
    assert.equal(existsSync(new URL('checkin-rebuild.js', functionsDir)), false);

    for (const name of ['lichess-status.js']) {
      const source = readFileSync(new URL(name, functionsDir), 'utf8');
      assert.doesNotMatch(source, /CHECKIN_REBUILD_HOOK_URL/);
      assert.doesNotMatch(source, /build_hooks/);
    }
  });
});
