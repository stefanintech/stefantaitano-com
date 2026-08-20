/**
 * Homepage pixel night landscape.
 * Ordered dither + low-res canvas. Original sprites: chess knight
 * constellation, runner, campfire, pine, and a crossing airplane.
 */
class PixelHero extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.sky = document.createElement('canvas');
    this.ground = document.createElement('canvas');
    this.sky.className = 'pixel-hero__sky';
    this.ground.className = 'pixel-hero__ground';
    this.sky.setAttribute('role', 'img');
    this.ground.setAttribute('aria-hidden', 'true');
    const label = this.querySelector('#pixel-hero-label');
    if (label) {
      this.sky.setAttribute('aria-label', label.textContent.trim());
      label.setAttribute('aria-hidden', 'true');
    }
    this.prepend(this.sky, this.ground);
    this.buildHits();

    this.skyCtx = this.sky.getContext('2d', {alpha: false});
    this.groundCtx = this.ground.getContext('2d', {alpha: false});
    if (!this.skyCtx || !this.groundCtx) return;

    this.skyH = 128;
    this.groundH = 24;
    this.scale = 2;
    this.width = 0;
    this.ridgeFar = [];
    this.ridgeNear = [];
    this.horizon = [];
    this.stars = this.seedStars();
    this.knightX = 28;
    this.knightY = 20;
    this.knightLit = false;
    this.plane = null;
    this.nextPlaneAt = 6 + Math.random() * 10;
    this.questUntil = 0;
    this.nextQuestAt = 4;
    this.runnerDir = 1;
    this.runnerProgress = 0.18;
    this.runnerPauseUntil = 0;

    this.onReduceChange = () => {
      this.stopLoop();
      this.paint(performance.now());
      if (!this.reduceMotion.matches) this.startLoop();
    };
    this.onThemeChange = () => this.paint(performance.now());
    this.reduceMotion.addEventListener('change', this.onReduceChange);
    this.themeObserver = new MutationObserver(this.onThemeChange);
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
    this.schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.schemeQuery.addEventListener('change', this.onThemeChange);

    this.resizeObserver = new ResizeObserver(() => {
      this.rebuild();
      this.paint(performance.now());
    });
    this.resizeObserver.observe(this);

    this.rebuild();
    this.paint(performance.now());
    if (!this.reduceMotion.matches) this.startLoop();
  }

  disconnectedCallback() {
    this.stopLoop();
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    this.reduceMotion?.removeEventListener('change', this.onReduceChange);
    this.schemeQuery?.removeEventListener('change', this.onThemeChange);
  }

  buildHits() {
    this.knightHit = document.createElement('button');
    this.knightHit.type = 'button';
    this.knightHit.className = 'pixel-hero__hit pixel-hero__hit--knight';
    this.knightHit.setAttribute('aria-label', 'Chess knight constellation. Hover or focus to connect the stars.');
    this.knightHit.addEventListener('pointerenter', () => {
      this.knightLit = true;
      this.paint(performance.now());
    });
    this.knightHit.addEventListener('pointerleave', () => {
      if (document.activeElement !== this.knightHit) this.knightLit = false;
    });
    this.knightHit.addEventListener('focus', () => {
      this.knightLit = true;
      this.paint(performance.now());
    });
    this.knightHit.addEventListener('blur', () => {
      this.knightLit = false;
      this.paint(performance.now());
    });

    this.moonHit = document.createElement('button');
    this.moonHit.type = 'button';
    this.moonHit.className = 'pixel-hero__hit pixel-hero__hit--moon';
    this.moonHit.setAttribute('aria-label', 'Moon. Activate to send an airplane across the sky.');
    this.moonHit.addEventListener('click', () => this.spawnPlane(true));

    this.questHit = document.createElement('a');
    this.questHit.className = 'pixel-hero__hit pixel-hero__hit--quest';
    this.questHit.href = '#now-preview';
    this.questHit.setAttribute('aria-label', 'Current quest: learning Ruby. Jump to what I am doing now.');
    this.questHit.addEventListener('pointerenter', () => {
      this.questUntil = Math.max(this.questUntil, performance.now() / 1000 + 2);
    });

    this.append(this.knightHit, this.moonHit, this.questHit);
  }

  startLoop() {
    this.stopLoop();
    this.timer = window.setInterval(() => this.paint(performance.now()), 125);
  }

  stopLoop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  seedStars() {
    const rnd = mulberry32(0x7a17a10);
    const stars = [];
    const fieldW = 2048;
    const cell = 16;
    for (let gy = 0; gy < 80; gy += cell) {
      for (let gx = 0; gx < fieldW; gx += cell) {
        if (rnd() < 0.34) continue;
        stars.push({
          x: gx + Math.floor(rnd() * cell),
          y: gy + Math.floor(rnd() * cell),
          phase: rnd(),
          twinkle: rnd() < 0.14
        });
      }
    }
    return stars;
  }

  colors() {
    if (!this.probe) {
      this.probe = document.createElement('span');
      this.probe.hidden = true;
      this.append(this.probe);
    }
    const resolve = token => {
      this.probe.style.color = token;
      return cssColorToRgb(getComputedStyle(this.probe).color);
    };
    const ground = cssColorToRgb(getComputedStyle(document.body).backgroundColor) || [251, 248, 243];
    return [
      ground,
      resolve('var(--pixel-ink)') || [36, 24, 16],
      resolve('var(--pixel-paper)') || [251, 248, 243],
      resolve('var(--pixel-amber)') || [180, 83, 9],
      resolve('var(--pixel-gold)') || [251, 190, 37]
    ];
  }

  landmarkX() {
    return {
      pine: Math.round(this.width * 0.84),
      fire: Math.round(this.width * 0.78),
      moon: Math.round(this.width * 0.62)
    };
  }

  spawnPlane(fromMoon) {
    if (this.reduceMotion.matches) {
      this.paint(performance.now());
      return;
    }
    const W = this.width;
    const fromRight = fromMoon || Math.random() < 0.45;
    this.plane = {
      x: fromRight ? W + 16 : -16,
      y: 24 + Math.round(Math.random() * 8),
      vx: fromRight ? -1.15 : 1.15
    };
    this.nextPlaneAt = performance.now() / 1000 + 16 + Math.random() * 18;
  }

  rebuild() {
    const cssW = this.clientWidth || document.documentElement.clientWidth;
    this.scale = cssW < 640 ? 1.35 : 2;
    this.width = Math.max(160, Math.ceil(cssW / this.scale));
    this.sky.width = this.width;
    this.sky.height = this.skyH;
    this.sky.style.height = `${Math.round((this.skyH * cssW) / this.width)}px`;
    this.ground.width = this.width;
    this.ground.height = this.groundH;
    this.ground.style.height = `${Math.round((this.groundH * cssW) / this.width)}px`;

    const header = document.querySelector('body.has-pixel-hero > header');
    const headerRows = header ? Math.ceil(header.getBoundingClientRect().height / this.scale) : 28;
    this.knightX = 18;
    this.knightY = Math.min(this.skyH - 56, headerRows + 2);

    this.ridgeFar = [];
    this.ridgeNear = [];
    this.horizon = [];
    for (let x = 0; x < this.width; x++) {
      this.ridgeFar.push(
        84 + Math.round(6 * Math.sin(x * 0.016 + 0.9) + 2.4 * Math.sin(x * 0.058 + 1.7))
      );
      this.ridgeNear.push(
        103 + Math.round(3.6 * Math.sin(x * 0.013 + 2.8) + 2.2 * Math.sin(x * 0.041 + 0.2))
      );
    }
    const span = 20;
    for (let x = 0; x < this.width; x++) {
      let sum = 0;
      for (let k = -span; k <= span; k++) {
        const i = Math.max(0, Math.min(this.width - 1, x + k));
        sum += this.ridgeFar[i];
      }
      this.horizon.push(sum / (span * 2 + 1));
    }
    this.positionHits(cssW);
  }

  positionHits(cssW) {
    const f = cssW / this.width;
    const {pine, fire, moon} = this.landmarkX();
    const moonY = 44;
    placeHit(this.knightHit, (this.knightX - 3) * f, (this.knightY - 3) * f, 20 * f, 24 * f);
    placeHit(this.moonHit, (moon - 16) * f, (moonY - 16) * f, 32 * f, 32 * f);
    const fireY = this.ridgeNear[fire] - 14;
    placeHit(this.questHit, (fire - 10) * f, (fireY - 10) * f, 28 * f, 28 * f);
    void pine;
  }

  darkness(x, y) {
    const xi = Math.max(0, Math.min(this.width - 1, x));
    const gap = this.horizon[xi] - y;
    const dx = (xi - this.width * 0.42) / (this.width * 0.28);
    const dome = 3.1 * Math.exp(-dx * dx);
    return clamp(0.3, 1, 0.5 + (gap - dome) / 38);
  }

  paint(now) {
    const W = this.width;
    const H = this.skyH;
    if (!W) return;

    const palette = this.colors();
    const moving = !this.reduceMotion.matches;
    const t = now / 1000;
    const grid = new Uint8Array(W * H);
    const {pine: pineX, fire: fireX, moon: moonX} = this.landmarkX();
    const moonY = 44;
    const lightRidge = luminance(palette[1]) - luminance(palette[0]) < 48;
    const ridgeValue = lightRidge ? 2 : 1;
    // Cream hills need ink figures; night hills keep cream silhouettes.
    const figureValue = lightRidge ? 1 : 2;
    const pineY = this.ridgeNear[Math.min(W - 1, pineX + 4)] - 10;
    const fireY = this.ridgeNear[Math.min(W - 1, fireX)] - 7;

    this.updateActors(t, moving, fireX);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (y > this.ridgeNear[x]) {
          grid[y * W + x] = 0;
          continue;
        }
        const gap = this.ridgeFar[x] - y;
        const tone = gap > 0 ? this.darkness(x, y) : Math.max(0, 0.18 + gap * 0.05);
        grid[y * W + x] = tone > threshold(x, y, 0.1) ? 1 : 0;
      }
    }

    drawRidge(grid, W, H, this.ridgeFar, ridgeValue);
    drawRidge(grid, W, H, this.ridgeNear, ridgeValue);
    for (let x = 0; x < W; x++) {
      for (let y = this.ridgeNear[x] + 1; y < H; y++) grid[y * W + x] = 0;
    }

    this.stampFireGlow(grid, W, H, fireX, fireY);

    const halo = 20;
    for (const star of this.stars) {
      if (star.x >= W) continue;
      if (this.darkness(star.x, star.y) < 0.78) continue;
      const dx = star.x - moonX;
      const dy = star.y - moonY;
      if (dx * dx + dy * dy < halo * halo) continue;
      const kx = star.x - (this.knightX + 6);
      const ky = star.y - (this.knightY + 10);
      if (kx * kx + ky * ky < 22 * 22) continue;
      if (moving && star.twinkle && (t * 0.09 + star.phase) % 1 < 0.1) continue;
      put(grid, W, H, star.x, star.y, 2);
    }

    const connectKnight = this.knightLit || !moving;
    if (connectKnight) {
      for (const [a, b] of KNIGHT_EDGES) {
        const [ax, ay] = KNIGHT_STARS[a];
        const [bx, by] = KNIGHT_STARS[b];
        drawLine(grid, W, H, this.knightX + ax, this.knightY + ay, this.knightX + bx, this.knightY + by, 3);
      }
    }
    for (const [dx, dy] of KNIGHT_STARS) put(grid, W, H, this.knightX + dx, this.knightY + dy, 2);
    if (moving && (t * 0.12) % 1 > 0.55) {
      const tip = KNIGHT_STARS[4];
      put(grid, W, H, this.knightX + tip[0] + 1, this.knightY + tip[1], 4);
    }

    stampMoon(grid, W, H, moonX, moonY, 12);
    for (const cloud of CLOUDS) {
      const span = W + 90;
      const drift = moving ? t * cloud.speed : 0;
      const x = ((cloud.fx * W + drift) % span) - 44;
      stampCloud(grid, W, H, x, cloud.y, cloud.discs, cloud.bottom);
    }

    this.stampPlane(grid, W, H, t, moving);
    stampSprite(grid, W, H, PINE, pineX, pineY, figureValue);
    this.stampCampfire(grid, W, H, fireX, fireY, t, moving);
    this.stampRunner(grid, W, H, fireX, t, moving, figureValue);
    this.stampQuest(grid, W, H, fireX, fireY, t, moving);

    blit(this.skyCtx, W, H, grid, palette);
    blitGround(this.groundCtx, W, this.groundH, palette[1], palette[0]);
  }

  updateActors(t, moving, fireX) {
    if (!moving) {
      this.runnerProgress = fireX / Math.max(1, this.width) - 0.03;
      this.runnerDir = 1;
      this.plane = this.plane || {x: Math.round(this.width * 0.4), y: 30, vx: 1.6};
      this.questUntil = t + 60;
      return;
    }

    if (!this.plane && t >= this.nextPlaneAt) this.spawnPlane(false);
    if (this.plane) {
      this.plane.x += this.plane.vx;
      if (this.plane.x < -20 || this.plane.x > this.width + 20) {
        this.plane = null;
        this.nextPlaneAt = t + 14 + Math.random() * 20;
      }
    }

    const pause = t < this.runnerPauseUntil;
    if (!pause) {
      this.runnerProgress += this.runnerDir * 0.0016;
      const fireAt = fireX / Math.max(1, this.width);
      const approaching =
        (this.runnerDir > 0 && this.runnerProgress > fireAt - 0.02 && this.runnerProgress < fireAt + 0.01) ||
        (this.runnerDir < 0 && this.runnerProgress < fireAt + 0.02 && this.runnerProgress > fireAt - 0.01);
      if (approaching && Math.random() < 0.08) {
        this.runnerPauseUntil = t + 3.2;
        this.runnerProgress = fireAt - 0.018;
      }
      if (this.runnerProgress > 0.9) this.runnerDir = -1;
      if (this.runnerProgress < 0.08) this.runnerDir = 1;
    }

    if (t >= this.nextQuestAt) {
      this.questUntil = t + 4.5;
      this.nextQuestAt = t + 14 + Math.random() * 10;
    }
  }

  stampFireGlow(grid, W, H, fireX, fireY) {
    const glowR = 16;
    for (let y = fireY - glowR; y <= fireY + 4; y++) {
      for (let x = fireX - glowR; x <= fireX + glowR; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        if (y >= this.ridgeFar[Math.max(0, Math.min(W - 1, x))]) continue;
        const d = Math.hypot(x - fireX, y - fireY);
        if (d > glowR) continue;
        const g = 0.42 * Math.pow(1 - d / glowR, 2);
        if (grid[y * W + x] === 1 && g > threshold(x + 90, y + 90, 0.12)) put(grid, W, H, x, y, 3);
      }
    }
  }

  stampPlane(grid, W, H, t, moving) {
    if (!this.plane) return;
    const flip = this.plane.vx < 0;
    const bob = moving ? Math.round(Math.sin(t * 2.2) * 0.6) : 0;
    stampSprite(grid, W, H, PLANE, Math.round(this.plane.x), Math.round(this.plane.y) + bob, 2, flip);
    const trail = this.plane.vx < 0 ? 1 : -1;
    put(grid, W, H, Math.round(this.plane.x) + (flip ? PLANE[0].length : -1), Math.round(this.plane.y) + 1 + bob, 2);
    put(grid, W, H, Math.round(this.plane.x) + trail * 2, Math.round(this.plane.y) + 2 + bob, 3);
  }

  stampCampfire(grid, W, H, fireX, fireY, t, moving) {
    const frame = moving && Math.floor(t * 6) % 2 === 1 ? FIRE_B : FIRE_A;
    stampColorSprite(grid, W, H, frame, fireX - 3, fireY - 6);
    stampSprite(grid, W, H, LOGS, fireX - 3, fireY + 1, 1);
    // Quest marker diamond above the fire.
    put(grid, W, H, fireX, fireY - 11, 4);
    put(grid, W, H, fireX - 1, fireY - 10, 4);
    put(grid, W, H, fireX + 1, fireY - 10, 4);
    put(grid, W, H, fireX, fireY - 9, 4);
  }

  stampRunner(grid, W, H, fireX, t, moving, figureValue) {
    const x = Math.round(this.runnerProgress * W);
    const y = this.ridgeNear[Math.max(0, Math.min(W - 1, x + 2))] - 7;
    const paused = !moving || t < this.runnerPauseUntil;
    const nearFire = Math.abs(x - fireX) < 14;
    let sprite = RUNNER_STAND;
    if (!paused && !nearFire) sprite = Math.floor(t * 8) % 2 ? RUNNER_B : RUNNER_A;
    const flip = this.runnerDir < 0;
    stampSprite(grid, W, H, sprite, x, y, figureValue, flip);
  }

  stampQuest(grid, W, H, fireX, fireY, t, moving) {
    if (moving && t > this.questUntil) return;
    const text = 'QUEST: RUBY';
    const width = textWidth(text);
    const x = clamp(2, W - width - 2, fireX - Math.floor(width / 2));
    const y = Math.max(2, fireY - 22);
    stampText(grid, W, H, x, y, text, 4);
  }
}

const KNIGHT_SPRITE = [
  '.....##...',
  '....###...',
  '...#####..',
  '..###.###.',
  '.##...##..',
  '.#.....#..',
  '.##.......',
  '..#.......',
  '..###.....',
  '.#####....',
  '#######...',
  '#######...',
  '.#####....',
  '..###.....',
  '.#####....',
  '#######...'
];

const KNIGHT_STARS = [];
KNIGHT_SPRITE.forEach((row, y) => {
  for (let x = 0; x < row.length; x++) {
    if (row[x] === '#') KNIGHT_STARS.push([x, y]);
  }
});

const KNIGHT_EDGES = [];
{
  const indexOf = new Map(KNIGHT_STARS.map(([x, y], i) => [`${x},${y}`, i]));
  KNIGHT_STARS.forEach(([x, y], i) => {
    const right = indexOf.get(`${x + 1},${y}`);
    const down = indexOf.get(`${x},${y + 1}`);
    if (right != null) KNIGHT_EDGES.push([i, right]);
    if (down != null) KNIGHT_EDGES.push([i, down]);
  });
}

const CLOUDS = [
  {
    fx: 0.2,
    y: 40,
    speed: 0.42,
    bottom: 4,
    discs: [
      {dx: 0, dy: 0, r: 6},
      {dx: 8, dy: -3, r: 7},
      {dx: 16, dy: 0, r: 6},
      {dx: 22, dy: 2, r: 4}
    ]
  },
  {
    fx: 0.52,
    y: 58,
    speed: 0.24,
    bottom: 3,
    discs: [
      {dx: 0, dy: 0, r: 5},
      {dx: 7, dy: -2, r: 6},
      {dx: 13, dy: 1, r: 4}
    ]
  },
  {
    fx: 0.84,
    y: 32,
    speed: 0.33,
    bottom: 4,
    discs: [
      {dx: -6, dy: 2, r: 4},
      {dx: 0, dy: 0, r: 6},
      {dx: 8, dy: -3, r: 7},
      {dx: 15, dy: 0, r: 5}
    ]
  }
];

const PINE = [
  '....#....',
  '...###...',
  '..#####..',
  '...###...',
  '..#####..',
  '.#######.',
  '..#####..',
  '.#######.',
  '#########',
  '....#....',
  '....#....'
];

const PLANE = ['........#.', '#......###', '.#########', '.....##...'];

const FIRE_A = ['...4...', '..434..', '.44444.', '3333333'];
const FIRE_B = ['.4.4.4.', '...4...', '..434..', '3333333'];
const LOGS = ['..###..'];

const RUNNER_A = ['..##.', '.####', '..##.', '.#.##', '#..#.'];
const RUNNER_B = ['..##.', '.####', '..##.', '.##..', '..#.#'];
const RUNNER_STAND = ['..##.', '.####', '..##.', '.#.#.', '.#.#.'];

const FONT = {
  Q: ['###', '#.#', '#.#', '##.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  E: ['###', '#..', '##.', '#..', '###'],
  S: ['.##', '#..', '.##', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  ':': ['.', '#', '.', '#', '.']
};

const BAYER8 = (() => {
  const build = n => {
    if (n === 1) return [[0]];
    const prev = build(n / 2);
    const out = [];
    for (let y = 0; y < n; y++) {
      out[y] = [];
      for (let x = 0; x < n; x++) {
        const q = prev[y % (n / 2)][x % (n / 2)] * 4;
        out[y][x] = q + (y < n / 2 ? (x < n / 2 ? 0 : 2) : x < n / 2 ? 3 : 1);
      }
    }
    return out;
  };
  return build(8);
})();

function placeHit(el, left, top, width, height) {
  if (!el) return;
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  el.style.width = `${Math.max(24, Math.round(width))}px`;
  el.style.height = `${Math.max(24, Math.round(height))}px`;
}

function threshold(x, y, jitter) {
  const t = (BAYER8[(y + 40) % 8][(x + 40) % 8] + 0.5) / 64 + (hash2(x, y) - 0.5) * jitter;
  return clamp(0.015, 0.985, t);
}

function put(grid, w, h, x, y, value) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi >= 0 && xi < w && yi >= 0 && yi < h) grid[yi * w + xi] = value;
}

function drawRidge(grid, w, h, ridge, value) {
  for (let x = 0; x < w; x++) {
    const y0 = ridge[x];
    const y1 = ridge[Math.min(x + 1, w - 1)];
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) put(grid, w, h, x, y, value);
  }
}

function drawLine(grid, w, h, x0, y0, x1, y1, value) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xEnd = Math.round(x1);
  const yEnd = Math.round(y1);
  const dx = Math.abs(xEnd - x);
  const dy = Math.abs(yEnd - y);
  const sx = x < xEnd ? 1 : -1;
  const sy = y < yEnd ? 1 : -1;
  let err = dx - dy;
  while (true) {
    put(grid, w, h, x, y, value);
    if (x === xEnd && y === yEnd) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function stampSprite(grid, w, h, sprite, ox, oy, value, flip = false) {
  sprite.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '#') continue;
      const px = flip ? ox + (row.length - 1 - x) : ox + x;
      put(grid, w, h, px, oy + y, value);
    }
  });
}

function stampColorSprite(grid, w, h, sprite, ox, oy) {
  sprite.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '3') put(grid, w, h, ox + x, oy + y, 3);
      if (ch === '4') put(grid, w, h, ox + x, oy + y, 4);
    }
  });
}

function textWidth(text) {
  return [...text].reduce((sum, ch) => sum + (ch === ' ' ? 2 : (FONT[ch]?.[0].length || 3) + 1), 0);
}

function stampText(grid, w, h, ox, oy, text, value) {
  let x = ox;
  for (const ch of text) {
    if (ch === ' ') {
      x += 2;
      continue;
    }
    const glyph = FONT[ch];
    if (!glyph) continue;
    glyph.forEach((row, y) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === '#') put(grid, w, h, x + i, oy + y, value);
      }
    });
    x += glyph[0].length + 1;
  }
}

function stampMoon(grid, w, h, cx, cy, r) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      let value = 2;
      const chord = Math.sqrt(Math.max(0, r * r - y * y));
      const terminator = 0.22 * chord;
      if (x > terminator && chord - terminator > 0.5) {
        const shade = Math.min(0.58, (0.65 * (x - terminator)) / (chord - terminator));
        if (shade > threshold(x + 220, y + 220, 0.16)) value = 1;
      }
      put(grid, w, h, cx + x, cy + y, value);
    }
  }
  for (const [dx, dy] of [
    [-5, -3],
    [1, 4],
    [-3, 6],
    [3, -6]
  ]) {
    put(grid, w, h, cx + dx, cy + dy, 1);
    put(grid, w, h, cx + dx + 1, cy + dy, 1);
    put(grid, w, h, cx + dx, cy + dy + 1, 1);
  }
}

function stampCloud(grid, w, h, cx, cy, discs, bottom) {
  const inside = (x, y) =>
    y <= bottom &&
    discs.some(d => {
      const dx = x - d.dx;
      const dy = y - d.dy;
      return dx * dx + dy * dy <= d.r * d.r;
    });
  const x0 = Math.min(...discs.map(d => d.dx - d.r)) - 1;
  const x1 = Math.max(...discs.map(d => d.dx + d.r)) + 1;
  const y0 = Math.min(...discs.map(d => d.dy - d.r)) - 1;
  for (let y = y0; y <= bottom; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      put(grid, w, h, cx + x, cy + y, edge ? 1 : 2);
    }
  }
}

function blit(ctx, w, h, grid, palette) {
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const color = palette[grid[i]] || palette[0];
    const j = i * 4;
    img.data[j] = color[0];
    img.data[j + 1] = color[1];
    img.data[j + 2] = color[2];
    img.data[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function blitGround(ctx, w, h, ink, ground) {
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const tone = Math.min(1, 0.06 + (y / (h - 1)) * 1.2);
    for (let x = 0; x < w; x++) {
      const color = tone > threshold(x, y + 2048, 0.1) ? ink : ground;
      const j = (y * w + x) * 4;
      img.data[j] = color[0];
      img.data[j + 1] = color[1];
      img.data[j + 2] = color[2];
      img.data[j + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function cssColorToRgb(value) {
  const raw = value.trim();
  if (!raw) return null;
  if (raw.startsWith('#')) {
    const hex = raw.slice(1);
    if (hex.length === 3) {
      return [0, 1, 2].map(i => Number.parseInt(hex[i] + hex[i], 16));
    }
    if (hex.length >= 6) {
      return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(part => Number.parseInt(part, 16));
    }
  }
  const rgb = raw.match(/rgba?\(\s*([\d.]+)[,\s/]+([\d.]+)[,\s/]+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function luminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function clamp(min, max, value) {
  return Math.min(max, Math.max(min, value));
}

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5f3759df;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

customElements.define('pixel-hero', PixelHero);
