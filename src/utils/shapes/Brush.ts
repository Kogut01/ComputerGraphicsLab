// Import type
import { Shape } from './Shape';

// Brush shape class
export class Brush extends Shape {
  points: { x: number; y: number }[];
  x1: number;
  y1: number;

  constructor(x1: number, y1: number) {
    super();
    this.points = [{ x: x1, y: y1 }];
    this.x1 = x1;
    this.y1 = y1;
  }

  // Add new point
  addPoint(x: number, y: number): void {
    this.points.push({ x, y });
  }

  // Draw shape (brush) Bresenham's algorithm
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.points.length <= 1) return;

    const drawBresenhamLine = (x1: number, y1: number, x2: number, y2: number): void => {
      x1 = Math.round(x1);
      y1 = Math.round(y1);
      x2 = Math.round(x2);
      y2 = Math.round(y2);
      
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        ctx.fillStyle = this.selected ? '#0054E3' : this.color;
        ctx.fillRect(x1, y1, 2, 2);

        if (x1 === x2 && y1 === y2) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x1 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y1 += sy;
        }
      }
    };

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      drawBresenhamLine(p1.x, p1.y, p2.x, p2.y);
    }
  }

  // Check point inside
  isPointInside(x: number, y: number, tolerance: number = 10): boolean {
    return this.points.some(p => Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2) <= tolerance);
  }

  // Move shape
  move(deltaX: number, deltaY: number): void {
    this.points = this.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
    this.x1 += deltaX;
    this.y1 += deltaY;
  }

  // Get type
  getType(): string {
    return 'brush';
  }
}