import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, it} from 'node:test';
import handler, {HOOK_ENV, triggerCheckinRebuild} from '../netlify/functions/checkin-rebuild.js';

const FAKE_HOOK = 'https://example.test/build_hooks/not-a-real-hook';

function capture() {
  const lines = [];
  return {
    lines,
    log: {
      warn(message) {
        lines.push(String(message));
      }
    }
  };
}

function joined(lines) {
  return lines.join('\n');
}

describe('check-in rebuild', () => {
  it('names the hook env var and does not embed a Netlify hook URL', () => {
    const source = readFileSync(new URL('../netlify/functions/checkin-rebuild.js', import.meta.url), 'utf8');
    assert.equal(HOOK_ENV, 'CHECKIN_REBUILD_HOOK_URL');
    assert.match(source, /CHECKIN_REBUILD_HOOK_URL/);
    assert.doesNotMatch(source, /api\.netlify\.com/);
    assert.doesNotMatch(source, /build_hooks/);
    assert.doesNotMatch(source, /example\.test/);
  });

  it('schedules the function hourly in netlify.toml only', () => {
    const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
    const source = readFileSync(new URL('../netlify/functions/checkin-rebuild.js', import.meta.url), 'utf8');
    assert.match(toml, /\[functions\."checkin-rebuild"\]/);
    assert.match(toml, /schedule = "@hourly"/);
    assert.doesNotMatch(source, /schedule/);
  });

  it('skips the POST when the env var is missing', async () => {
    const {lines, log} = capture();
    let called = false;
    const result = await triggerCheckinRebuild({
      env: {},
      fetchImpl() {
        called = true;
      },
      log
    });

    assert.equal(called, false);
    assert.deepEqual(result, {ok: false, skipped: true});
    assert.match(joined(lines), /CHECKIN_REBUILD_HOOK_URL is not set/);
    assert.doesNotMatch(joined(lines), /example\.test|build_hooks/);
  });

  it('skips the POST when the env var is blank', async () => {
    const {lines, log} = capture();
    let called = false;
    const result = await triggerCheckinRebuild({
      env: {[HOOK_ENV]: '   '},
      fetchImpl() {
        called = true;
      },
      log
    });

    assert.equal(called, false);
    assert.equal(result.skipped, true);
    assert.match(joined(lines), /CHECKIN_REBUILD_HOOK_URL is not set/);
    assert.doesNotMatch(joined(lines), /example\.test|build_hooks/);
  });

  it('POSTs the hook URL and does not log it', async () => {
    const {lines, log} = capture();
    const calls = [];
    const result = await triggerCheckinRebuild({
      env: {[HOOK_ENV]: `  ${FAKE_HOOK}  `},
      fetchImpl(url, init) {
        calls.push({url, init});
        return {ok: true, status: 200};
      },
      log
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, FAKE_HOOK);
    assert.equal(calls[0].init.method, 'POST');
    assert.deepEqual(result, {ok: true, skipped: false, status: 200});
    assert.equal(lines.length, 0);
    assert.doesNotMatch(joined(lines), /example\.test|build_hooks/);
  });

  it('logs the status when the hook responds with an error', async () => {
    const {lines, log} = capture();
    const result = await triggerCheckinRebuild({
      env: {[HOOK_ENV]: FAKE_HOOK},
      fetchImpl() {
        return {ok: false, status: 404};
      },
      log
    });

    assert.equal(result.ok, false);
    assert.equal(result.skipped, false);
    assert.equal(result.status, 404);
    assert.match(joined(lines), /responded 404/);
    assert.doesNotMatch(joined(lines), /example\.test|build_hooks/);
  });

  it('does not log a thrown fetch error', async () => {
    const {lines, log} = capture();
    const result = await triggerCheckinRebuild({
      env: {[HOOK_ENV]: FAKE_HOOK},
      fetchImpl() {
        throw new Error(`request to ${FAKE_HOOK} failed`);
      },
      log
    });

    assert.deepEqual(result, {ok: false, skipped: false});
    assert.match(joined(lines), /the build hook request failed/);
    assert.doesNotMatch(joined(lines), /example\.test|build_hooks/);
  });

  it('returns 200 from the handler when the env var is missing', async () => {
    const previous = process.env[HOOK_ENV];
    delete process.env[HOOK_ENV];
    try {
      const response = await handler();
      assert.equal(response.status, 200);
      assert.equal(await response.text(), '');
    } finally {
      if (previous === undefined) {
        delete process.env[HOOK_ENV];
      } else {
        process.env[HOOK_ENV] = previous;
      }
    }
  });
});
