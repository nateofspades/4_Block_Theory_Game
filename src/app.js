import { TetrisEngine, SHAPES, COLS, ROWS, levelSpeed } from './engine.js';
import { boardGeometry, cellRect, tileContour } from './rendering.js';
import { MusicController } from './music.js';

// Color communicates material/state, never the seven-piece identity.
const MATERIAL = { fired: '#e1c8a1', moving: '#d77855', guide: '#bcae94' };
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
  const points = tileContour(rect);
  context.beginPath();
  points.forEach(([px, py], i) => i ? context.lineTo(px, py) : context.moveTo(px, py));
  context.closePath();
  context.lineWidth = Math.max(0.7, geometry.cellSize * 0.035);
  if (alpha < 1) {
    context.strokeStyle = color;
    context.setLineDash([geometry.cellSize * .12, geometry.cellSize * .1]);
    context.stroke(); context.setLineDash([]);
    return;
  }
  context.fillStyle = color; context.fill();
  context.strokeStyle = "#302f2a"; context.stroke();
  // A stamped spindle, not a glossy square highlight. The same material is
  // used by every shape and both instrument previews.
  const cx=rect.x+rect.width/2, cy=rect.y+rect.height/2, r=rect.width*.16;
  context.beginPath(); context.moveTo(cx,cy-r); context.lineTo(cx+r,cy);
  context.lineTo(cx,cy+r); context.lineTo(cx-r,cy); context.closePath();
  context.strokeStyle="#594e3c"; context.stroke();

}

function drawBoard() {
  const { context, width, height } = fit(board);
  const geometry = boardGeometry(width, height);
  window.__boardGeometry = geometry;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#292e2c';
  context.fillRect(geometry.offsetX, geometry.offsetY, geometry.width, geometry.height);
  if (showGrid) {
    // Registration points on a fabrication bed, not a luminous square cage.
    context.fillStyle = "#d8cdb033";
    const dot = Math.max(0.8, geometry.cellSize * .045);
    for (let y = 1; y < ROWS; y += 1) {
      for (let x = 1; x < COLS; x += 1) {
        context.fillRect(geometry.offsetX + x * geometry.cellSize - dot / 2,
          geometry.offsetY + y * geometry.cellSize - dot / 2, dot, dot);
      }
    }
  }
  game.board.forEach((row, y) => row.forEach((value, x) => {
    if (value) drawCell(context, x, y, geometry, MATERIAL.fired);
  }));
  if (!game.active) return;
  const ghostY = game.ghostY();
  for (const [dx, dy] of SHAPES[game.active.type][game.active.rotation]) {
    if (ghostY + dy >= 0) drawCell(context, game.active.x + dx, ghostY + dy, geometry, MATERIAL.guide, 0.2);
  }
  for (const [dx, dy] of SHAPES[game.active.type][game.active.rotation]) {
    if (game.active.y + dy >= 0) drawCell(context, game.active.x + dx, game.active.y + dy, geometry, MATERIAL.moving);
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
    drawCell(context, x, y, {cellSize:size, offsetX, offsetY}, MATERIAL.moving);
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
    idle: ['Load the kiln', 'Fit. Fire. Make room.', 'Start', 'Start game'],
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
