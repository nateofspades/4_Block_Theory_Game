import { describe, expect, it } from 'vitest';
import { boardGeometry, cellRect } from '../src/rendering.js';

describe('board rendering geometry', () => {
  it('maps the canvas to exactly ten columns and twenty visible rows', () => {
    const geometry = boardGeometry(300, 600);

    expect(geometry).toEqual({ cellSize: 30, width: 300, height: 600, offsetX: 0, offsetY: 0 });
    expect(geometry.width / geometry.cellSize).toBe(10);
    expect(geometry.height / geometry.cellSize).toBe(20);
  });

  it('centers a square playfield when a canvas is not exactly 1:2', () => {
    expect(boardGeometry(226, 540)).toEqual({
      cellSize: 22.6,
      width: 226,
      height: 452,
      offsetX: 0,
      offsetY: 44,
    });
  });

  it('places the bottom-right cell inside the visible playfield', () => {
    const geometry = boardGeometry(300, 600);
    expect(cellRect(9, 19, geometry)).toEqual({ x: 270, y: 570, width: 30, height: 30 });
  });
});
