import { test, expect } from '@playwright/test';
import { MASTER_MUSIC_VOLUME } from '../src/music.js';

const sizes = [
  {width:1920,height:1080}, {width:1366,height:768}, {width:768,height:1024},
  {width:390,height:844}, {width:320,height:568}, {width:844,height:390}, {width:568,height:320}
];

for (const viewport of sizes) test(`fits ${viewport.width}x${viewport.height}`, async ({page}) => {
  const errors=[]; page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
  page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
  await page.setViewportSize(viewport); await page.goto('/?seed=7');
  await expect(page.locator('#board')).toBeVisible();
  const metrics=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight,board:document.querySelector('#board').getBoundingClientRect().toJSON(),controls:document.querySelector('.touch-controls').getBoundingClientRect().toJSON(),rows:window.__boardGeometry.height/window.__boardGeometry.cellSize}));
  expect(metrics.sw).toBeLessThanOrEqual(metrics.cw);
  expect(metrics.sh).toBeLessThanOrEqual(metrics.ch+1);
  expect(metrics.board.top).toBeGreaterThanOrEqual(0); expect(metrics.board.bottom).toBeLessThanOrEqual(metrics.ch);
  expect(Math.abs(metrics.board.height - metrics.board.width * 2)).toBeLessThanOrEqual(1);
  expect(metrics.rows).toBe(20);
  expect(metrics.controls.bottom).toBeLessThanOrEqual(metrics.ch);
  expect(errors).toEqual([]);
});

test('keyboard controls and game states', async ({page}) => {
  await page.goto('/?seed=3');
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state','idle');
  await page.getByRole('button',{name:'Start game', exact:true}).click();
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state','playing');
  const before=await page.evaluate(()=>window.__tetris.active.x);
  await page.keyboard.press('ArrowLeft'); expect(await page.evaluate(()=>window.__tetris.active.x)).toBe(before-1);
  await page.keyboard.press('ArrowUp'); expect(await page.evaluate(()=>window.__tetris.active.rotation)).toBe(1);
  await page.keyboard.press('KeyC'); expect(await page.evaluate(()=>window.__tetris.held)).toBeTruthy();
  await page.keyboard.press('Space'); expect(await page.evaluate(()=>window.__tetris.score)).toBeGreaterThan(0);
  await page.keyboard.press('KeyP');
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state','paused');
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('suspended');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state','playing');
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('suspended');
  await page.getByRole('button',{name:'Resume game'}).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
  await page.getByRole('button',{name:'Restart game'}).click();
  expect(await page.evaluate(()=>window.__tetris.score)).toBe(0);
});

const touchSizes = [{width:390,height:844}, {width:320,height:568}, {width:844,height:390}];
for (const viewport of touchSizes) test(`touch controls perform actions at ${viewport.width}x${viewport.height}`, async ({page}) => {
  await page.setViewportSize(viewport); await page.goto('/?seed=4');
  await page.getByRole('button',{name:'Start game', exact:true}).click();
  const x=await page.evaluate(()=>window.__tetris.active.x);
  await page.getByRole('button',{name:'Move left'}).tap(); expect(await page.evaluate(()=>window.__tetris.active.x)).toBe(x-1);
  await page.getByRole('button',{name:'Rotate'}).tap(); expect(await page.evaluate(()=>window.__tetris.active.rotation)).toBe(1);
  await page.getByRole('button',{name:'Soft drop'}).tap(); expect(await page.evaluate(()=>window.__tetris.score)).toBe(1);
  await page.getByRole('button',{name:'Hold'}).tap(); expect(await page.evaluate(()=>window.__tetris.held)).toBeTruthy();
  await page.getByRole('button',{name:'Hard drop'}).tap(); expect(await page.evaluate(()=>window.__tetris.score)).toBeGreaterThan(1);
});

const mobileLayouts = [{width:320,height:568}, {width:390,height:844}, {width:844,height:390}, {width:568,height:320}];
for (const viewport of mobileLayouts) test(`mobile controls use two thumb-sized rows at ${viewport.width}x${viewport.height}`, async ({page}) => {
  await page.setViewportSize(viewport);
  await page.goto('/?seed=4');

  const layout = await page.evaluate(() => {
    const rect = element => element.getBoundingClientRect().toJSON();
    const controls = [...document.querySelectorAll('.touch-controls button')];
    const pause = document.querySelector('[data-action="pause"]');
    const restart = document.querySelector('#restart');
    return {
      labels: controls.map(button => button.getAttribute('aria-label')),
      buttons: controls.map(rect),
      pause: rect(pause),
      pauseParent: pause.parentElement.className,
      restart: rect(restart),
      board: rect(document.querySelector('#board')),
      stats: rect(document.querySelector('.stats')),
      previews: rect(document.querySelector('.previews')),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    };
  });

  expect(layout.labels).toEqual(['Move left', 'Move right', 'Soft drop', 'Rotate', 'Hold', 'Hard drop']);
  expect(layout.pauseParent).toContain('previews');
  expect(layout.pause.top).toBeGreaterThanOrEqual(layout.restart.bottom);
  for (const button of layout.buttons) {
    expect(button.width).toBeGreaterThanOrEqual(48);
    expect(button.height).toBeGreaterThanOrEqual(48);
    expect(button.bottom).toBeLessThanOrEqual(layout.clientHeight);
  }
  expect(layout.pause.height).toBeGreaterThanOrEqual(48);
  expect(layout.pause.width).toBeGreaterThanOrEqual(48);
  expect(layout.pause.bottom).toBeLessThanOrEqual(layout.clientHeight);
  expect(layout.restart.width).toBeGreaterThanOrEqual(48);
  expect(layout.restart.height).toBeGreaterThanOrEqual(48);
  for (const element of [...layout.buttons, layout.pause, layout.restart, layout.board, layout.stats, layout.previews]) {
    expect(element.left).toBeGreaterThanOrEqual(0);
    expect(element.right).toBeLessThanOrEqual(layout.clientWidth);
  }
  expect(layout.buttons.slice(0, 3).map(button => Math.round(button.top))).toEqual([
    Math.round(layout.buttons[0].top), Math.round(layout.buttons[0].top), Math.round(layout.buttons[0].top),
  ]);
  expect(layout.buttons.slice(3).map(button => Math.round(button.top))).toEqual([
    Math.round(layout.buttons[3].top), Math.round(layout.buttons[3].top), Math.round(layout.buttons[3].top),
  ]);
  expect(layout.buttons[3].top).toBeGreaterThan(layout.buttons[0].top);
  expect(layout.buttons[0].left).toBeLessThan(layout.buttons[1].left);
  expect(layout.buttons[1].left).toBeLessThan(layout.buttons[2].left);
  expect(layout.buttons[3].left).toBeLessThan(layout.buttons[4].left);
  expect(layout.buttons[4].left).toBeLessThan(layout.buttons[5].left);
  expect(layout.board.width).toBeGreaterThanOrEqual(Math.min(180, (viewport.height - 20) / 2));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.clientHeight + 1);
});

test('music toggle stays visible and usable at 844x390', async ({page}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/?seed=8');

  const musicToggle = page.getByRole('button', { name: 'Music On' });
  await expect(musicToggle).toBeVisible();
  await musicToggle.click();
  await expect(page.getByRole('button', { name: 'Music Off' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('tetris-music'))).toBe('off');
});

test('pause control suspends music and overlay resume continues it', async ({page}) => {
  await page.goto('/?seed=2');
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');

  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state', 'paused');
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('suspended');

  await page.getByRole('button', { name: 'Resume game' }).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
});

test('visibility change pauses an active game', async ({page}) => {
  await page.goto('/?seed=2'); await page.getByRole('button',{name:'Start game', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
  await page.evaluate(()=>{
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state','paused');
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('suspended');

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('suspended');
  await page.getByRole('button', { name: 'Resume game' }).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
});

test('deterministic fixture exposes stable first piece', async ({page}) => {
  await page.goto('/?seed=123'); await page.getByRole('button',{name:'Start game', exact:true}).click();
  const a=await page.evaluate(()=>window.__tetris.active.type);
  await page.reload(); await page.getByRole('button',{name:'Start game', exact:true}).click();
  expect(await page.evaluate(()=>window.__tetris.active.type)).toBe(a);
});

test('click-only Start activates music from that first click', async ({page}) => {
  await page.goto('/?seed=9');
  expect(await page.evaluate(() => window.__tetrisMusic.activated)).toBe(false);

  await page.getByRole('button', { name: 'Start game', exact: true }).dispatchEvent('click');

  await expect(page.locator('[data-state]')).toHaveAttribute('data-state', 'playing');
  expect(await page.evaluate(() => window.__tetrisMusic.activated)).toBe(true);
  expect(await page.evaluate(() => Boolean(window.__tetrisMusic.context))).toBe(true);
});

test('music starts once after interaction and keeps its source through restart and resize', async ({page}) => {
  await page.goto('/?seed=9');
  await expect(page.getByRole('button', { name: 'Music On' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveCount(0);
  expect(await page.evaluate(() => window.__tetrisMusic.context)).toBeNull();

  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
  expect(await page.evaluate(() => window.__tetrisMusic.gain?.gain.value)).toBeCloseTo(MASTER_MUSIC_VOLUME, 5);
  const sourceIsStable = await page.evaluate(() => {
    window.__musicSource = window.__tetrisMusic.source;
    return Boolean(window.__musicSource?.loop);
  });
  expect(sourceIsStable).toBe(true);
  await page.waitForTimeout(250);
  const positionBefore = await page.evaluate(() => window.__tetrisMusic.position);

  await page.getByRole('button', { name: 'Restart game' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => window.__tetrisMusic.source === window.__musicSource)).toBe(true);
  expect(await page.evaluate(() => window.__tetrisMusic.gain?.gain.value)).toBeCloseTo(MASTER_MUSIC_VOLUME, 5);
  expect(await page.evaluate(() => window.__tetrisMusic.position)).toBeGreaterThanOrEqual(positionBefore);

  await page.evaluate(() => {
    window.__tetris.active = { type: 'I', rotation: 0, x: 3, y: -2 };
    window.__tetris.board[0].fill('Z');
  });
  await page.getByRole('button', { name: 'Soft drop' }).click();
  expect(await page.evaluate(() => window.__tetris.state)).toBe('gameover');
  expect(await page.evaluate(() => window.__tetrisMusic.source === window.__musicSource)).toBe(true);

  await page.getByRole('button', { name: 'Music On' }).click();
  await expect(page.getByRole('button', { name: 'Music Off' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('tetris-music'))).toBe('off');
  await page.getByRole('button', { name: 'Music Off' }).click();
  expect(await page.evaluate(() => window.__tetrisMusic.source === window.__musicSource)).toBe(true);
  expect(await page.evaluate(() => window.__tetrisMusic.gain?.gain.value)).toBeCloseTo(MASTER_MUSIC_VOLUME, 5);
});

test('stored Music Off preference survives reload until explicitly enabled', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Music On' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Music Off' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  expect(await page.evaluate(() => window.__tetrisMusic.context)).toBeNull();

  await page.getByRole('button', { name: 'Music Off' }).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
  expect(await page.evaluate(() => localStorage.getItem('tetris-music'))).toBe('on');
});

for (const viewport of sizes) test(`all music toggle corners are usable at ${viewport.width}x${viewport.height}`, async ({page}) => {
  await page.setViewportSize(viewport); await page.goto("/?seed=7");
  const bounds = await page.locator("#music-toggle").evaluate(el => {
    const r = el.getBoundingClientRect();
    const header=el.closest('header').getBoundingClientRect();
    const heading=el.closest('header').querySelector('h1').getBoundingClientRect();
    if (r.right>header.right || r.left<header.left || (r.top<heading.bottom && r.left<heading.right)) return {inside:false,reachable:false};
    const points = [[r.left+5,r.top+5],[r.right-5,r.top+5],[r.left+5,r.bottom-5],[r.right-5,r.bottom-5]];
    return { inside: r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight,
      reachable: points.every(([x,y]) => el.contains(document.elementFromPoint(x,y))) };
  });
  expect(bounds).toEqual({inside:true,reachable:true});
  await page.locator("#music-toggle").click();
  await expect(page.locator("#music-toggle")).toHaveAttribute("aria-pressed","false");
});

for (const viewport of sizes) test(`bottom row really locks, renders and clears at ${viewport.width}x${viewport.height}`, async ({page}) => {
  await page.setViewportSize(viewport); await page.goto("/?seed=7");
  await page.getByRole("button", {name:"Start game",exact:true}).click();
  await page.evaluate(() => {
    const g=window.__tetris;
    g.board.forEach(r=>r.fill(null));
    g.active={type:"O",rotation:0,x:3,y:16};
  });
  await page.getByRole("button",{name:"Hard drop"}).click();
  expect(await page.evaluate(()=>window.__tetris.board[19].filter(Boolean).length)).toBe(2);
  await expect.poll(()=>page.evaluate(()=>{
    const c=document.querySelector("#board"), g=window.__boardGeometry;
    const d=c.width/c.getBoundingClientRect().width;
    const at=x=>Array.from(c.getContext("2d").getImageData(Math.floor((g.offsetX+(x+.5)*g.cellSize)*d),Math.floor((g.offsetY+19.5*g.cellSize)*d),1,1).data).join();
    return at(4)!==at(0);
  })).toBe(true);
  await page.evaluate(()=>{
    const g=window.__tetris;
    g.board.forEach(r=>r.fill(null));
    g.board[19].fill("J"); for(let x=3;x<7;x++)g.board[19][x]=null;
    g.board[18][0]="O"; g.active={type:"I",rotation:0,x:3,y:16};
  });
  await page.getByRole("button",{name:"Hard drop"}).click();
  expect(await page.evaluate(()=>window.__tetris.lines)).toBe(1);
  expect(await page.evaluate(()=>window.__tetris.board[19][0])).toBe("O");
  expect(await page.evaluate(()=>window.__tetris.board[19].filter(Boolean).length)).toBe(1);
});

test("portrait-landscape-portrait and restart preserve audio source and legacy records", async ({page})=>{
  await page.addInitScript(()=>{localStorage.setItem("tetris-high-score","4321");localStorage.setItem("tetris-music","on");});
  await page.setViewportSize({width:390,height:844}); await page.goto("/?seed=3");
  await expect(page.locator("#high-score")).toHaveText("4,321");
  await page.getByRole("button",{name:"Start game",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__tetrisMusic.context?.state)).toBe("running");
  await page.evaluate(()=>{window.__savedSource=window.__tetrisMusic.source;window.__savedClock=window.__tetrisMusic.context.currentTime;});
  for(const size of [{width:844,height:390},{width:568,height:320},{width:320,height:568},{width:390,height:844}]){
    await page.setViewportSize(size);
    await expect.poll(()=>page.evaluate(()=>Math.abs(document.querySelector("#board").width/document.querySelector("#board").getBoundingClientRect().width-Math.min(devicePixelRatio,2))<.02)).toBe(true);
    expect(await page.evaluate(()=>window.__tetrisMusic.source===window.__savedSource)).toBe(true);
    await page.getByRole("button",{name:"Restart game"}).click();
    expect(await page.evaluate(()=>window.__tetrisMusic.context.currentTime>=window.__savedClock)).toBe(true);
    expect(await page.evaluate(()=>window.__tetris.highScore)).toBe(4321);
  }
});

test("capture private gameplay evidence across all layout sizes",async({page},testInfo)=>{
  await page.goto("/?seed=15");
  await page.getByRole("button",{name:"Start game",exact:true}).click();
  for(const direction of ["ArrowLeft","ArrowRight","ArrowLeft","ArrowRight"]){
    await page.keyboard.press(direction); await page.keyboard.press(direction); await page.keyboard.press("ArrowUp"); await page.keyboard.press("Space");
  }
  for(const size of sizes){
    await page.setViewportSize(size);
    await expect.poll(()=>page.evaluate(()=>Math.abs(document.querySelector("#board").width/document.querySelector("#board").getBoundingClientRect().width-Math.min(devicePixelRatio,2))<.02)).toBe(true);
    await page.screenshot({path:`${process.env.STACK_EVIDENCE_DIR || testInfo.outputDir}/stack-${size.width}x${size.height}.png`});
  }
});
