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

// Matte tiles are chamfered on every corner; dimensions remain inside the
// engine cell so the full twentieth row stays visible, including at small sizes.
export function tileContour({ x, y, width, height }) {
  const inset = Math.min(width, height) * 0.05;
  const cut = Math.min(width, height) * 0.2;
  const left=x+inset, top=y+inset, right=x+width-inset, bottom=y+height-inset;
  return [[left+cut,top],[right-cut,top],[right,top+cut],[right,bottom-cut],
    [right-cut,bottom],[left+cut,bottom],[left,bottom-cut],[left,top+cut]];
}

export function cellRect(x, y, geometry) {
  return {
    x: geometry.offsetX + x * geometry.cellSize,
    y: geometry.offsetY + y * geometry.cellSize,
    width: geometry.cellSize,
    height: geometry.cellSize,
  };
}
