export const COLS = 10;
export const ROWS = 20;
export const PIECES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

const rotations = (states) => states.map(state => state.map(p => [...p]));
export const SHAPES = {
  I: rotations([
    [[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]
  ]),
  J: rotations([
    [[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]
  ]),
  L: rotations([
    [[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]
  ]),
  O: rotations(Array(4).fill(null).map(() => [[1,0],[2,0],[1,1],[2,1]])),
  S: rotations([
    [[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]
  ]),
  T: rotations([
    [[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]
  ]),
  Z: rotations([
    [[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]
  ])
};

const JLSTZ_KICKS = {
  '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]]
};
const I_KICKS = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
};

export class SevenBag {
  constructor(random = Math.random) { this.random = random; this.items = []; }
  refill() {
    this.items = [...PIECES];
    for (let i = this.items.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }
  }
  next() { if (!this.items.length) this.refill(); return this.items.shift(); }
}

export const scoreForClear = (lines, level = 1) => ([0,100,300,500,800][lines] || 0) * level;
export const levelSpeed = level => Math.max(70, 900 * Math.pow(0.82, level - 1));
const blankBoard = () => Array.from({length: ROWS}, () => Array(COLS).fill(null));

export class TetrisEngine {
  constructor(options = {}) {
    const random = options.random ?? Math.random;
    let storage = options.storage;
    if (storage === undefined) {
      try { storage = globalThis.localStorage; } catch { storage = null; }
    }
    this.random = random; this.storage = storage; this.bag = new SevenBag(random);
    this.board = blankBoard(); this.state = 'idle'; this.active = null;
    this.nextType = this.bag.next(); this.held = null; this.canHold = true;
    this.score = 0; this.lines = 0; this.level = 1; this.highScore = this.readHighScore();
  }
  readHighScore() { try { return Math.max(0, Number(this.storage?.getItem('tetris-high-score')) || 0); } catch { return 0; } }
  persistHighScore() { try { this.storage?.setItem('tetris-high-score', String(this.highScore)); } catch {} }
  addScore(points) { this.score += points; if (this.score > this.highScore) { this.highScore = this.score; this.persistHighScore(); } }
  cells(piece = this.active) { return SHAPES[piece.type][piece.rotation].map(([x,y]) => [piece.x+x,piece.y+y]); }
  collides(piece) {
    return this.cells(piece).some(([x,y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.board[y][x]));
  }
  spawn(type, consumeNext = type === undefined) {
    if (type === undefined) type = this.nextType;
    if (consumeNext) this.nextType = this.bag.next();
    this.active = {type, rotation: 0, x: 3, y: -1};
    if (this.collides(this.active)) { this.state = 'gameover'; this.active = null; return false; }
    return true;
  }
  start() { if (this.state !== 'idle') return false; this.state = 'playing'; return this.spawn(); }
  pause() { if (this.state === 'playing') { this.state = 'paused'; return true; } return false; }
  resume() { if (this.state === 'paused') { this.state = 'playing'; return true; } return false; }
  restart() {
    this.board = blankBoard(); this.bag = new SevenBag(this.random); this.nextType = this.bag.next();
    this.held = null; this.canHold = true; this.score = 0; this.lines = 0; this.level = 1; this.state = 'playing'; return this.spawn();
  }
  move(dx, dy) {
    if (!this.active || this.state !== 'playing') return false;
    const candidate = {...this.active, x:this.active.x+dx, y:this.active.y+dy};
    if (!this.collides(candidate)) { this.active = candidate; return true; }
    if (dy > 0) this.lock();
    return false;
  }
  rotate(direction = 1) {
    if (!this.active || this.state !== 'playing') return false;
    const from = this.active.rotation, to = (from + (direction > 0 ? 1 : 3)) % 4;
    if (this.active.type === 'O') { this.active = {...this.active, rotation:to}; return true; }
    const table = this.active.type === 'I' ? I_KICKS : JLSTZ_KICKS;
    for (const [dx,dy] of table[`${from}>${to}`] || [[0,0]]) {
      const candidate = {...this.active, rotation:to, x:this.active.x+dx, y:this.active.y+dy};
      if (!this.collides(candidate)) { this.active = candidate; return true; }
    }
    return false;
  }
  clearLines() {
    const kept = this.board.filter(row => !row.every(Boolean));
    const count = ROWS - kept.length;
    this.board = [...Array.from({length:count}, () => Array(COLS).fill(null)), ...kept];
    return count;
  }
  lock() {
    if (!this.active) return;
    let toppedOut = false;
    for (const [x,y] of this.cells()) { if (y < 0) toppedOut = true; else this.board[y][x] = this.active.type; }
    const cleared = this.clearLines(); this.addScore(scoreForClear(cleared, this.level));
    this.lines += cleared; this.level = Math.floor(this.lines / 10) + 1; this.canHold = true;
    if (toppedOut) { this.active = null; this.state = 'gameover'; } else this.spawn();
  }
  softDrop() { if (this.move(0,1)) { this.addScore(1); return true; } return false; }
  ghostY() {
    if (!this.active) return null; let y = this.active.y;
    while (!this.collides({...this.active,y:y+1})) y++;
    return y;
  }
  hardDrop() {
    if (!this.active || this.state !== 'playing') return 0;
    const distance = this.ghostY() - this.active.y; this.active.y += distance; this.addScore(distance*2); this.lock(); return distance;
  }
  hold() {
    if (!this.active || !this.canHold || this.state !== 'playing') return false;
    const current = this.active.type; this.canHold = false;
    if (this.held) { const swap = this.held; this.held = current; this.spawn(swap); }
    else { this.held = current; this.spawn(); }
    return this.state !== 'gameover';
  }
}
