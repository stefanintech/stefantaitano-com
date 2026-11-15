// Runs the pa11y accessibility tests: `npm run test:a11y`.
//
// 1. Builds the site with ELEVENTY_ENV=test (`npm run pa11y:build`), which also writes dist/pa11y.json.
// 2. Serves dist/ with `eleventy --serve --ignore-initial` on port 8080.
// 3. Waits until http://localhost:8080/ answers.
// 4. Runs pa11y-ci with ./dist/pa11y.json.
// 5. Always stops the server (the whole process tree, on Windows too) and exits with pa11y-ci's code.
//
// Node built-ins only, so it behaves the same on Windows, macOS and Linux.

import {spawn, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}/`;
const READY_TIMEOUT_MS = 60_000;
const isWindows = process.platform === 'win32';

/** Absolute path to a package's bin script, read from its package.json. */
function binPath(pkg, name) {
  const pkgDir = path.join(root, 'node_modules', pkg);
  const {bin} = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  return path.join(pkgDir, typeof bin === 'string' ? bin : bin[name]);
}

/** Runs a command to completion with inherited stdio and resolves with its exit code. */
function run(command, args, options = {}) {
  return new Promise(resolve => {
    const child = spawn(command, args, {cwd: root, stdio: 'inherit', ...options});
    child.on('error', error => {
      console.error(`[test:a11y] Could not start ${command}: ${error.message}`);
      resolve(1);
    });
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

/** Resolves true if nothing is accepting connections on the port. */
function portIsFree(port) {
  return new Promise(resolve => {
    const socket = net.connect({port, host: 'localhost'});
    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(true));
  });
}

/** Resolves true once BASE_URL answers, false on timeout or if the server exits first. */
async function waitForServer(server) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) return false;
    const ok = await new Promise(resolve => {
      const req = http.get(BASE_URL, res => {
        res.resume();
        resolve(res.statusCode < 500);
      });
      req.setTimeout(2000, () => req.destroy());
      req.on('error', () => resolve(false));
    });
    if (ok) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

/** Stops the server and everything it started. Safe to call more than once. */
function stopServer(server) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return Promise.resolve();
  const exited = new Promise(resolve => server.once('exit', resolve));
  if (isWindows) {
    // /T kills the whole tree, /F forces it. taskkill waits for the kill itself.
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], {stdio: 'ignore'});
  } else {
    // The server was spawned detached, so it leads its own process group: kill the group.
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
    const force = setTimeout(() => {
      try {
        process.kill(-server.pid, 'SIGKILL');
      } catch {
        // Already gone.
      }
    }, 5000);
    exited.then(() => clearTimeout(force));
  }
  return exited;
}

let server;

async function main() {
  // Same as before: a test-env build that writes dist/pa11y.json.
  // `npm` is npm.cmd on Windows, which needs a shell. The arguments are fixed strings.
  const buildCode = await run('npm', ['run', 'pa11y:build'], {shell: true});
  if (buildCode !== 0) {
    console.error(`[test:a11y] pa11y:build failed with exit code ${buildCode}.`);
    return buildCode;
  }

  // eleventy-dev-server moves to another port if 8080 is taken, and pa11y.json points at 8080.
  if (!(await portIsFree(PORT))) {
    console.error(`[test:a11y] Port ${PORT} is already in use. Stop whatever is running there and try again.`);
    return 1;
  }

  // Same as `pa11y:serve`, without the POSIX-only inline env var.
  server = spawn(
    process.execPath,
    [binPath('@11ty/eleventy', 'eleventy'), '--serve', '--ignore-initial', `--port=${PORT}`],
    {
      cwd: root,
      stdio: 'inherit',
      env: {...process.env, ELEVENTY_ENV: 'test'},
      detached: !isWindows
    }
  );
  server.on('error', error => console.error(`[test:a11y] Could not start the server: ${error.message}`));

  if (!(await waitForServer(server))) {
    console.error(`[test:a11y] The server did not answer at ${BASE_URL} within ${READY_TIMEOUT_MS / 1000}s.`);
    return 1;
  }

  return run(process.execPath, [binPath('pa11y-ci', 'pa11y-ci'), '--config', './dist/pa11y.json']);
}

// Ctrl+C or a CI cancel: stop the server before leaving.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, async () => {
    await stopServer(server);
    process.exit(130);
  });
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (error) {
  console.error('[test:a11y]', error);
} finally {
  await stopServer(server);
}
process.exit(exitCode);
