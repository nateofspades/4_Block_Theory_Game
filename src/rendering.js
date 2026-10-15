import { COLS, ROWS } from './engine.js';

export function boardGeometry(canvasWidth, canvasHeight) {
  const cellSize = Math.min(canvasWidth / COLS, canvasHeight / ROWS);
  const width = cellSize * COLS;
  const height = cellSize * ROWS;
  return {
    cellSize,
    width,
    height,
    offsetX: (canvasWidth - width) / 2,
    offsetY: (canvasHeight - height) / 2,
  };
}

export function cellRect(x, y, geometry) {
  return {
    x: geometry.offsetX + x * geometry.cellSize,
    y: geometry.offsetY + y * geometry.cellSize,
    width: geometry.cellSize,
    height: geometry.cellSize,
  };
}
