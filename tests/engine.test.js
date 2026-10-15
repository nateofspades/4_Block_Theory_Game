import { beforeEach, describe, expect, it } from 'vitest';
import { TetrisEngine, PIECES, SevenBag, SHAPES, scoreForClear, levelSpeed } from '../src/engine.js';

const empty = () => Array.from({ length: 20 }, () => Array(10).fill(null));
const engine = (opts = {}) => new TetrisEngine({ random: () => 0, storage: null, ...opts });

describe('tetromino definitions', () => {
  it('defines all seven tetrominoes with four rotation states', () => {
    expect(PIECES).toEqual(['I','J','L','O','S','T','Z']);
    for (const type of PIECES) {
      expect(SHAPES[type]).toHaveLength(4);
      for (const state of SHAPES[type]) expect(state).toHaveLength(4);
    }
  });
  it('each rotation consists of four unique blocks', () => {
    for (const type of PIECES) for (const state of SHAPES[type]) {
      expect(new Set(state.map(([x,y]) => `${x},${y}`)).size).toBe(4);
    }
  });
});

describe('seven bag', () => {
  it('returns each piece exactly once per bag', () => {
    const bag = new SevenBag(() => 0.42);
    const fourteen = Array.from({length: 14}, () => bag.next());
    expect([...fourteen.slice(0,7)].sort()).toEqual(PIECES);
    expect([...fourteen.slice(7)].sort()).toEqual(PIECES);
  });
  it('supports deterministic random injection', () => {
    expect(Array.from({length: 7}, () => new SevenBag(() => 0).next())).toEqual(Array(7).fill('J'));
    const bag = new SevenBag(() => 0);
    expect(Array.from({length: 7}, () => bag.next())).toEqual(['J','L','O','S','T','Z','I']);
  });
});

describe('movement and collision', () => {
  it('moves left/right inside the board and rejects walls', () => {
    const g = engine(); g.start();
    expect(g.move(-1, 0)).toBe(true); expect(g.active.x).toBe(2);
    while (g.move(-1, 0));
    expect(g.move(-1, 0)).toBe(false);
    while (g.move(1, 0));
    expect(g.move(1, 0)).toBe(false);
  });
  it('rejects occupied cells and locks on a blocked gravity step', () => {
    const g = engine(); g.start(); g.board[1][4] = 'Z';
    expect(g.move(0,1)).toBe(false);
    expect(g.board.flat().filter(Boolean).length).toBe(4);
    expect(g.state).toBe('gameover');
  });
  it('permits cells above the visible board but rejects below it', () => {
    const g = engine();
    expect(g.collides({type:'I', rotation:0, x:3, y:-2})).toBe(false);
    expect(g.collides({type:'I', rotation:0, x:3, y:19})).toBe(true);
  });
});

describe('SRS rotation and kicks', () => {
  it('rotates a T clockwise and counterclockwise', () => {
    const g = engine(); g.start(); g.active = {type:'T', rotation:0, x:3, y:1};
    expect(g.rotate(1)).toBe(true); expect(g.active.rotation).toBe(1);
    expect(g.rotate(-1)).toBe(true); expect(g.active.rotation).toBe(0);
  });
  it('wall-kicks a JLSTZ piece', () => {
    const g = engine(); g.start(); g.active = {type:'T', rotation:1, x:-1, y:2};
    expect(g.rotate(-1)).toBe(true); expect(g.active.x).toBe(0);
  });
  it('uses the distinct I-piece kick table', () => {
    const g = engine(); g.start(); g.active = {type:'I', rotation:1, x:-2, y:2};
    expect(g.rotate(-1)).toBe(true); expect(g.active.x).toBe(0);
  });
  it('does not rotate when all kick positions collide', () => {
    const g = engine(); g.start(); g.active = {type:'T', rotation:0, x:3, y:2};
    for (let y=0;y<7;y++) for(let x=0;x<10;x++) g.board[y][x] = 'Z';
    g.board[3][4]=g.board[3][5]=g.board[3][6]=g.board[4][5]=null;
    expect(g.rotate(1)).toBe(false); expect(g.active.rotation).toBe(0);
  });
});

describe('locking and line clears', () => {
  function clearCount(lines) {
    const g=engine(); g.start(); g.board=empty();
    for(let y=20-lines;y<20;y++) g.board[y].fill('J');
    for(let y=20-lines;y<20;y++) g.board[y][4]=null;
    g.active={type:'I',rotation:1,x:2,y:16};
    g.lock(); return g;
  }
  it.each([[1,100],[2,300],[3,500],[4,800]])('clears %i lines and awards %i base points', (n,score) => {
    const g=clearCount(n); expect(g.lines).toBe(n); expect(g.score).toBe(score);
    expect(g.board.slice(-n).every(r=>r.some(v=>!v))).toBe(true);
  });
  it('scores clears at the current level', () => expect(scoreForClear(4,3)).toBe(2400));
  it('advances a level every ten lines and accelerates', () => {
    const g=engine(); g.lines=9; g.level=1; g.board=empty(); g.start();
    g.board[19].fill('L'); g.board[19][4]=null; g.active={type:'I',rotation:1,x:2,y:16}; g.lock();
    expect(g.level).toBe(2); expect(levelSpeed(2)).toBeLessThan(levelSpeed(1));
  });
});

describe('drop, ghost, hold, and lifecycle', () => {
  it('computes ghost landing position without mutating active piece', () => {
    const g=engine(); g.start(); const y=g.active.y;
    expect(g.ghostY()).toBeGreaterThan(y); expect(g.active.y).toBe(y);
  });
  it('soft drop gives one point per successful row', () => {
    const g=engine(); g.start(); expect(g.softDrop()).toBe(true); expect(g.score).toBe(1);
  });
  it('hard drops, scores two per row, and spawns the next piece', () => {
    const g=engine(); g.start(); const first=g.active.type; const distance=g.ghostY()-g.active.y;
    expect(g.hardDrop()).toBe(distance); expect(g.score).toBe(distance*2); expect(g.active.type).not.toBe(first);
  });
  it('allows hold once per drop and resets after lock', () => {
    const g=engine(); g.start(); const first=g.active.type;
    expect(g.hold()).toBe(true); expect(g.held).toBe(first); expect(g.hold()).toBe(false);
    g.hardDrop(); expect(g.hold()).toBe(true);
  });
  it('swaps held piece without consuming next', () => {
    const g=engine(); g.start(); g.hold(); g.hardDrop(); const next=g.nextType;
    const before=g.active.type; expect(g.hold()).toBe(true); expect(g.active.type).not.toBe(before); expect(g.nextType).toBe(next);
  });
  it('does not consume next when the held piece has the same type', () => {
    const g=engine(); g.start();
    g.held = g.nextType; g.canHold = true;
    const next = g.nextType, remaining = g.bag.items.length;
    expect(g.hold()).toBe(true);
    expect(g.active.type).toBe(next);
    expect(g.nextType).toBe(next);
    expect(g.bag.items).toHaveLength(remaining);
  });
  it('detects game over when a piece cannot spawn', () => {
    const g=engine(); g.board[0].fill('Z'); g.start();
    expect(g.state).toBe('gameover');
  });
  it('starts, pauses, resumes, and restarts', () => {
    const g=engine(); expect(g.state).toBe('idle'); g.start(); expect(g.state).toBe('playing');
    g.pause(); expect(g.state).toBe('paused'); g.resume(); expect(g.state).toBe('playing');
    g.score=99; g.restart(); expect(g.score).toBe(0); expect(g.state).toBe('playing');
  });
});

describe('high score persistence', () => {
  beforeEach(() => localStorage.clear());
  it('loads a stored high score', () => {
    localStorage.setItem('tetris-high-score','1234');
    expect(new TetrisEngine({random:()=>0,storage:localStorage}).highScore).toBe(1234);
  });
  it('saves a new high score when score changes', () => {
    const g=new TetrisEngine({random:()=>0,storage:localStorage}); g.addScore(42);
    expect(g.highScore).toBe(42); expect(localStorage.getItem('tetris-high-score')).toBe('42');
  });
  it('tolerates unavailable storage', () => {
    const storage={getItem(){throw Error('no')},setItem(){throw Error('no')}};
    expect(()=>new TetrisEngine({storage})).not.toThrow();
  });
  it('tolerates a denied global localStorage getter', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('denied', 'SecurityError'); },
    });
    try {
      expect(() => new TetrisEngine({ random: () => 0 })).not.toThrow();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
      else delete globalThis.localStorage;
    }
  });
});
