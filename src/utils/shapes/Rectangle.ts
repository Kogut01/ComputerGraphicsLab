// Import type
import { Shape } from './Shape';

// Rectangle shape class
export class Rectangle extends Shape {
  x1: number;
  y1: number;
  width: number;
  height: number;

  constructor(x1: number, y1: number, width: number, height: number) {
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.width = width;
    this.height = height;
  }

  // Draw shape (rectangle) Bresenham's algorithm
  draw(ctx: CanvasRenderingContext2D): void {
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

    const x2 = this.x1 + this.width;
    const y2 = this.y1 + this.height;
    
    drawBresenhamLine(this.x1, this.y1, x2, this.y1); 
    drawBresenhamLine(x2, this.y1, x2, y2);       
    drawBresenhamLine(x2, y2, this.x1, y2);           
    drawBresenhamLine(this.x1, y2, this.x1, this.y1); 
  }

  // Check point inside
  isPointInside(x: number, y: number, tolerance: number = 10): boolean {
    return x >= this.x1 - tolerance && 
           x <= this.x1 + this.width + tolerance && 
           y >= this.y1 - tolerance && 
           y <= this.y1 + this.height + tolerance;
  }

  // Move shape
  move(deltaX: number, deltaY: number): void {
    this.x1 += deltaX;
    this.y1 += deltaY;
  }

  // Get type
  getType(): string {
    return 'rectangle';
  }
}