import { TetrisEngine, SHAPES, COLS, ROWS, levelSpeed } from './engine.js';
import { boardGeometry, cellRect } from './rendering.js';
import { MusicController } from './music.js';

const COLORS = { I:'#29dbe5', J:'#4777ff', L:'#ff9d2e', O:'#f7d744', S:'#53d769', T:'#b667f1', Z:'#f24f62' };
const $ = selector => document.querySelector(selector);

function seeded(seed) {
  let value = (Number(seed) || 1) >>> 0;
  return () => ((value = Math.imul(1664525, value) + 1013904223 >>> 0) / 4294967296);
}

const seed = new URLSearchParams(location.search).get('seed');
const game = new TetrisEngine(seed ? { random: seeded(seed) } : {});
const board = $('#board');
const next = $('#next');
const hold = $('#hold');
const musicToggle = $('#music-toggle');
const music = window.__tetrisMusic || new MusicController();
window.__tetris = game;
window.__tetrisMusic = music;

let showGrid = true;
let last = performance.now();
let dropElapsed = 0;
let raf;

function updateMusicButton() {
  const label = music.enabled ? 'Music On' : 'Music Off';
  musicToggle.textContent = label;
  musicToggle.setAttribute('aria-label', label);
  musicToggle.setAttribute('aria-pressed', String(music.enabled));
}
music.onChange = updateMusicButton;
updateMusicButton();

function fit(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext('2d');
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { context, width: rect.width, height: rect.height };
}

function drawCell(context, x, y, geometry, color, alpha = 1) {
  const rect = cellRect(x, y, geometry);
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);
  context.fillStyle = '#fff3';
  context.fillRect(rect.x + 2, rect.y + 2, rect.width - 4, 2);
  context.globalAlpha = 1;
}

function drawBoard() {
  const { context, width, height } = fit(board);
  const geometry = boardGeometry(width, height);
  window.__boardGeometry = geometry;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#080d1c';
  context.fillRect(geometry.offsetX, geometry.offsetY, geometry.width, geometry.height);
  if (showGrid) {
    context.strokeStyle = '#92a6ce12';
    context.lineWidth = 1;
    for (let x = 1; x < COLS; x += 1) {
      context.beginPath();
      context.moveTo(geometry.offsetX + x * geometry.cellSize, geometry.offsetY);
      context.lineTo(geometry.offsetX + x * geometry.cellSize, geometry.offsetY + geometry.height);
      context.stroke();
    }
    for (let y = 1; y < ROWS; y += 1) {
      context.beginPath();
      context.moveTo(geometry.offsetX, geometry.offsetY + y * geometry.cellSize);
      context.lineTo(geometry.offsetX + geometry.width, geometry.offsetY + y * geometry.cellSize);
      context.stroke();
    }
  }
  game.board.forEach((row, y) => row.forEach((value, x) => {
    if (value) drawCell(context, x, y, geometry, COLORS[value]);
  }));
  if (!game.active) return;
  const ghostY = game.ghostY();
  for (const [dx, dy] of SHAPES[game.active.type][game.active.rotation]) {
    if (ghostY + dy >= 0) drawCell(context, game.active.x + dx, ghostY + dy, geometry, COLORS[game.active.type], 0.2);
  }
  for (const [dx, dy] of SHAPES[game.active.type][game.active.rotation]) {
    if (game.active.y + dy >= 0) drawCell(context, game.active.x + dx, game.active.y + dy, geometry, COLORS[game.active.type]);
  }
}

function drawPreview(canvas, type) {
  const { context, width, height } = fit(canvas);
  context.clearRect(0, 0, width, height);
  if (!type) return;
  const points = SHAPES[type][0];
  const minX = Math.min(...points.map(point => point[0]));
  const maxX = Math.max(...points.map(point => point[0]));
  const minY = Math.min(...points.map(point => point[1]));
  const maxY = Math.max(...points.map(point => point[1]));
  const size = Math.min(width / (maxX - minX + 2), height / (maxY - minY + 2));
  const offsetX = (width - (maxX - minX + 1) * size) / 2 - minX * size;
  const offsetY = (height - (maxY - minY + 1) * size) / 2 - minY * size;
  for (const [x, y] of points) {
    context.fillStyle = COLORS[type];
    context.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, size - 2);
  }
}

function sync() {
  $('.app').dataset.state = game.state;
  void music.setGamePaused(game.state === 'paused');
  $('#score').textContent = game.score.toLocaleString();
  $('#high-score').textContent = game.highScore.toLocaleString();
  $('#lines').textContent = game.lines;
  $('#level').textContent = game.level;
  drawPreview(next, game.nextType);
  drawPreview(hold, game.held);
  const overlay = $('#overlay');
  const primary = $('#primary');
  if (game.state === 'playing') {
    overlay.classList.add('hidden');
    return;
  }
  overlay.classList.remove('hidden');
  const states = {
    idle: ['Ready?', 'Stack blocks. Clear lines.', 'Start', 'Start game'],
    paused: ['Paused', 'Take a breath.', 'Resume', 'Resume game'],
    gameover: ['Game over', `Score ${game.score.toLocaleString()}`, 'Play again', 'Start game'],
  };
  const [title, copy, label, aria] = states[game.state];
  $('#state-title').textContent = title;
  $('#state-copy').textContent = copy;
  primary.textContent = label;
  primary.setAttribute('aria-label', aria);
}

function act(action) {
  if (game.state !== 'playing' && action !== 'pause') return;
  ({
    left: () => game.move(-1, 0),
    right: () => game.move(1, 0),
    rotate: () => game.rotate(1),
    soft: () => game.softDrop(),
    hard: () => game.hardDrop(),
    hold: () => game.hold(),
    pause: () => game.pause(),
  })[action]?.();
  sync();
  drawBoard();
}

function loop(now) {
  const delta = Math.min(now - last, 100);
  last = now;
  if (game.state === 'playing') {
    dropElapsed += delta;
    if (dropElapsed >= levelSpeed(game.level)) {
      game.move(0, 1);
      dropElapsed = 0;
      sync();
    }
  }
  drawBoard();
  raf = requestAnimationFrame(loop);
}

for (const eventName of ['pointerdown', 'touchstart', 'keydown']) {
  addEventListener(eventName, () => { void music.handleInteraction(); }, { capture: true, passive: true });
}

$('#primary').addEventListener('click', () => {
  void music.handleInteraction();
  if (game.state === 'idle') game.start();
  else if (game.state === 'paused') game.resume();
  else game.restart();
  sync();
});
$('#restart').addEventListener('click', () => { game.restart(); sync(); });
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('pointerdown', event => {
  event.preventDefault();
  act(button.dataset.action);
}));
addEventListener('keydown', event => {
  const actions = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate', ArrowDown: 'soft',
    Space: 'hard', KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold',
  };
  if (actions[event.code]) {
    event.preventDefault();
    act(actions[event.code]);
  } else if (event.code === 'KeyP' || event.code === 'Escape') {
    event.preventDefault();
    if (game.state === 'playing') game.pause();
    else if (game.state === 'paused') game.resume();
    sync();
  }
});
$('#grid-toggle').addEventListener('click', event => {
  showGrid = !showGrid;
  event.currentTarget.setAttribute('aria-pressed', String(showGrid));
  drawBoard();
});
musicToggle.addEventListener('click', async () => {
  await music.toggle();
  updateMusicButton();
});
document.addEventListener('visibilitychange', () => {
  if (game.state === 'playing' && document.hidden) {
    game.pause();
    sync();
  }
  void music.handleVisibilityChange();
});
addEventListener('pageshow', () => { void music.handleVisibilityChange(); });
addEventListener('resize', () => {
  drawBoard();
  drawPreview(next, game.nextType);
  drawPreview(hold, game.held);
});

sync();
drawBoard();
raf = requestAnimationFrame(loop);
