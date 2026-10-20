import {test,expect} from '@playwright/test';
const sizes=[{width:1920,height:1080},{width:1366,height:768},{width:768,height:1024},{width:390,height:844},{width:320,height:568},{width:844,height:390}];
for(const viewport of sizes)test(`release identity contained ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/?seed=7');
 await expect(page).toHaveTitle('4 Block Theory');await expect(page.locator('h1')).toHaveText('4 Block Theory');
 expect(await page.locator('h1').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('header').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.bottom<=b.bottom})).toBe(true);
});
test('same-origin old and final paths retain seeded legacy records',async({page})=>{
 await page.goto('/tetris_game/');await page.evaluate(()=>{localStorage.setItem('tetris-high-score','6543');localStorage.setItem('tetris-music','off')});
 await page.goto('/4_Block_Theory_Game/');await expect(page.locator('#high-score')).toHaveText('6,543');await expect(page.locator('#music-toggle')).toHaveText('Music Off');
 await page.getByRole('button',{name:'Start game',exact:true}).click();expect(await page.evaluate(()=>window.__tetrisMusic.context)).toBeNull();
});
test('real audio signal and transport survive orientation restart and mute',async({page})=>{
 await page.goto('/?seed=5');expect(await page.evaluate(()=>window.__tetrisMusic.context)).toBeNull();
 await page.getByRole('button',{name:'Start game',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__tetrisMusic.context?.state)).toBe('running');
 await page.evaluate(()=>{const m=window.__tetrisMusic;window.__audioContext=m.context;window.__audioSource=m.source;window.__clock=m.context.currentTime;window.__analyser=m.context.createAnalyser();m.gain.connect(window.__analyser)});
 await expect.poll(()=>page.evaluate(()=>{const b=new Float32Array(window.__analyser.fftSize);window.__analyser.getFloatTimeDomainData(b);return Math.max(...b.map(Math.abs))})).toBeGreaterThan(.001);
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){await page.setViewportSize(viewport);await page.getByRole('button',{name:'Restart game'}).click();expect(await page.evaluate(()=>window.__tetrisMusic.source===window.__audioSource&&window.__tetrisMusic.context===window.__audioContext)).toBe(true)}
 expect(await page.evaluate(()=>window.__audioContext.currentTime>window.__clock)).toBe(true);
 await page.locator('#music-toggle').click();await expect.poll(()=>page.evaluate(()=>window.__audioContext.state)).toBe('suspended');
 await page.locator('#music-toggle').click();await expect.poll(()=>page.evaluate(()=>window.__audioContext.state)).toBe('running');
 expect(await page.evaluate(()=>window.__tetrisMusic.source===window.__audioSource)).toBe(true);
});
test('true mobile context supports play pause line clear and gameover',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto('/?seed=3');await page.getByRole('button',{name:'Start game',exact:true}).tap();await page.getByRole('button',{name:'Pause game'}).tap();await expect(page.locator('.app')).toHaveAttribute('data-state','paused');await page.getByRole('button',{name:'Resume game'}).tap();
 await page.evaluate(()=>{const g=window.__tetris;g.board.forEach(r=>r.fill(null));g.board[19].fill('J');for(let x=3;x<7;x++)g.board[19][x]=null;g.active={type:'I',rotation:0,x:3,y:16}});await page.getByRole('button',{name:'Hard drop'}).tap();expect(await page.evaluate(()=>window.__tetris.lines)).toBe(1);expect(await page.evaluate(()=>window.__tetris.score)).toBeGreaterThanOrEqual(100);
 await page.evaluate(()=>{const g=window.__tetris;g.board[0].fill('Z');g.active={type:'I',rotation:0,x:3,y:-2}});await page.getByRole('button',{name:'Soft drop'}).tap();await expect(page.locator('.app')).toHaveAttribute('data-state','gameover');await page.getByRole('button',{name:'Start game',exact:true}).tap();await expect(page.locator('.app')).toHaveAttribute('data-state','playing');expect(errors).toEqual([]);await context.close();
});
