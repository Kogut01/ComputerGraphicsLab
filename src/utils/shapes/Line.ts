// Import type
import { Shape } from './Shape';

// Line shape class
export class Line extends Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  // Draw shape (line) Bresenham's algorithm
  draw(ctx: CanvasRenderingContext2D): void {
    let x1 = Math.round(this.x1);
    let y1 = Math.round(this.y1);
    let x2 = Math.round(this.x2);
    let y2 = Math.round(this.y2);
    
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
  }

  // Check point inside
  isPointInside(x: number, y: number, tolerance: number = 10): boolean {
    const lineLength = Math.sqrt((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2);
    if (lineLength === 0) return false;
    
    const distance = Math.abs(
      (this.y2 - this.y1) * x - (this.x2 - this.x1) * y + this.x2 * this.y1 - this.y2 * this.x1
    ) / lineLength;
    
    const withinBounds = x >= Math.min(this.x1, this.x2) - tolerance && 
                         x <= Math.max(this.x1, this.x2) + tolerance && 
                         y >= Math.min(this.y1, this.y2) - tolerance && 
                         y <= Math.max(this.y1, this.y2) + tolerance;
                         
    return distance <= tolerance && withinBounds;
  }

  // Move shape
  move(deltaX: number, deltaY: number): void {
    this.x1 += deltaX;
    this.y1 += deltaY;
    this.x2 += deltaX;
    this.y2 += deltaY;
  }

  // Get type
  getType(): string {
    return 'line';
  }
}