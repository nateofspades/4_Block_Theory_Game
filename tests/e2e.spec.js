import { test, expect } from '@playwright/test';

const sizes = [
  {width:1920,height:1080}, {width:1366,height:768}, {width:768,height:1024},
  {width:390,height:844}, {width:320,height:568}, {width:844,height:390}
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
  await page.keyboard.press('KeyP'); await expect(page.locator('[data-state]')).toHaveAttribute('data-state','paused');
  await page.getByRole('button',{name:'Resume game'}).click();
  await page.getByRole('button',{name:'Restart game'}).click();
  expect(await page.evaluate(()=>window.__tetris.score)).toBe(0);
});

const touchSizes = [{width:390,height:844}, {width:320,height:568}, {width:844,height:390}];
for (const viewport of touchSizes) test(`touch controls perform actions at ${viewport.width}x${viewport.height}`, async ({page}) => {
  await page.setViewportSize(viewport); await page.goto('/?seed=4');
  await page.getByRole('button',{name:'Start game', exact:true}).click();
  const x=await page.evaluate(()=>window.__tetris.active.x);
  await page.getByRole('button',{name:'Move left'}).click(); expect(await page.evaluate(()=>window.__tetris.active.x)).toBe(x-1);
  await page.getByRole('button',{name:'Rotate'}).click(); expect(await page.evaluate(()=>window.__tetris.active.rotation)).toBe(1);
  await page.getByRole('button',{name:'Soft drop'}).click(); expect(await page.evaluate(()=>window.__tetris.score)).toBe(1);
  await page.getByRole('button',{name:'Hold'}).click(); expect(await page.evaluate(()=>window.__tetris.held)).toBeTruthy();
  await page.getByRole('button',{name:'Hard drop'}).click(); expect(await page.evaluate(()=>window.__tetris.score)).toBeGreaterThan(1);
});

test('visibility change pauses an active game', async ({page}) => {
  await page.goto('/?seed=2'); await page.getByRole('button',{name:'Start game', exact:true}).click();
  await page.evaluate(()=>{
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('[data-state]')).toHaveAttribute('data-state','paused');
});

test('deterministic fixture exposes stable first piece', async ({page}) => {
  await page.goto('/?seed=123'); await page.getByRole('button',{name:'Start game', exact:true}).click();
  const a=await page.evaluate(()=>window.__tetris.active.type);
  await page.reload(); await page.getByRole('button',{name:'Start game', exact:true}).click();
  expect(await page.evaluate(()=>window.__tetris.active.type)).toBe(a);
});

test('music starts once after interaction and keeps its source through restart and resize', async ({page}) => {
  await page.goto('/?seed=9');
  await expect(page.getByRole('button', { name: 'Music On' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveCount(0);
  expect(await page.evaluate(() => window.__tetrisMusic.context)).toBeNull();

  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__tetrisMusic.context?.state)).toBe('running');
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
