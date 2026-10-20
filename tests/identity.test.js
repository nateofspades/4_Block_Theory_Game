import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
test('approved public identity is consistent', () => {
 const html = readFileSync('index.html', 'utf8');
 expect(html).toContain('<title>4 Block Theory</title>');
 expect(html).toContain('4 Block Theory</h1>');
 expect(JSON.parse(readFileSync('package.json')).name).toBe('4-block-theory-game');
});
