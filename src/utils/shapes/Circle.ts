// Import type
import { Shape } from './Shape';

// Circle shape class
export class Circle extends Shape {
  x1: number;
  y1: number;
  radius: number;

  constructor(x1: number, y1: number, radius: number) {
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.radius = radius;
  }

  // Draw shape (circle) Bresenham's algorithm
  draw(ctx: CanvasRenderingContext2D): void {
    const centerX = Math.round(this.x1);
    const centerY = Math.round(this.y1);
    const radius = Math.round(this.radius);
    
    let x = 0;
    let y = radius;
    let d = 3 - 2  * radius;
    ctx.fillStyle = this.selected ? '#0054E3' : this.color;

    const drawCirclePoints = (cx: number, cy: number, x: number, y: number) => {
      ctx.fillRect(cx + x, cy + y, 2, 2);
      ctx.fillRect(cx - x, cy + y, 2, 2);
      ctx.fillRect(cx + x, cy - y, 2, 2);
      ctx.fillRect(cx - x, cy - y, 2, 2);
      ctx.fillRect(cx + y, cy + x, 2, 2);
      ctx.fillRect(cx - y, cy + x, 2, 2);
      ctx.fillRect(cx + y, cy - x, 2, 2);
      ctx.fillRect(cx - y, cy - x, 2, 2);
    };

    drawCirclePoints(centerX, centerY, x, y);

    while (x < y) {
      if (d < 0) {
        d += 4 * x + 6;
      } else {
        d += 4 * (x - y) + 10;
        y--;
      }
      x++;
      drawCirclePoints(centerX, centerY, x, y);
    }
  }

  //Check point inside
  isPointInside(x: number, y: number, tolerance: number = 10): boolean {
    const distance = Math.sqrt((x - this.x1) ** 2 + (y - this.y1) ** 2);
    return distance <= this.radius + tolerance;
  }

  // Move shape
  move(deltaX: number, deltaY: number): void {
    this.x1 += deltaX;
    this.y1 += deltaY;
  }

  // Get type
  getType(): string {
    return 'circle';
  }
}