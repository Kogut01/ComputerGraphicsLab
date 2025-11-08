import { Shape } from './Shape';

export interface Point {
  x: number;
  y: number;
}

export class BezierCurve extends Shape {
  controlPoints: Point[];
  selectedPointIndex: number = -1;

  constructor(controlPoints: Point[], color: string = '#000000') {
    super();
    this.controlPoints = controlPoints;
    this.color = color;
  }

  // Calculate binomial coefficient (n choose k)
  private binomialCoefficient(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 1; i <= k; i++) {
      result *= (n - i + 1) / i;
    }
    return result;
  }

  // Bernstein polynomial
  private bernstein(n: number, i: number, t: number): number {
    return this.binomialCoefficient(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
  }

  // Calculate point on Bezier curve at parameter t (0 <= t <= 1)
  calculatePoint(t: number): Point {
    const n = this.controlPoints.length - 1;
    let x = 0;
    let y = 0;

    for (let i = 0; i <= n; i++) {
      const b = this.bernstein(n, i, t);
      x += b * this.controlPoints[i].x;
      y += b * this.controlPoints[i].y;
    }

    return { x, y };
  }

  // Generate points along the curve for drawing
  private generateCurvePoints(numPoints: number = 100): Point[] {
    const points: Point[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      points.push(this.calculatePoint(t));
    }
    return points;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.controlPoints.length < 2) return;

    // Draw the Bezier curve
    const curvePoints = this.generateCurvePoints();
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.selected ? 3 : 2;
    ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
    
    for (let i = 1; i < curvePoints.length; i++) {
      ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
    ctx.stroke();

    // Draw control polygon (dashed line connecting control points)
    if (this.selected) {
      ctx.beginPath();
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);
      
      for (let i = 1; i < this.controlPoints.length; i++) {
        ctx.lineTo(this.controlPoints[i].x, this.controlPoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw control points
      for (let i = 0; i < this.controlPoints.length; i++) {
        const point = this.controlPoints[i];
        const isSelected = i === this.selectedPointIndex;
        const radius = isSelected ? 7 : 5;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        
        // First and last points in red, others in blue
        if (i === 0 || i === this.controlPoints.length - 1) {
          ctx.fillStyle = '#ff0000';
        } else {
          ctx.fillStyle = '#0000ff';
        }
        ctx.fill();
        
        // Highlight selected point with thicker border
        ctx.strokeStyle = isSelected ? '#00ff00' : '#000000';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.stroke();

        // Draw point labels
        ctx.fillStyle = isSelected ? '#00ff00' : '#000000';
        ctx.font = isSelected ? 'bold 11px Tahoma' : '10px Tahoma';
        ctx.fillText(`P${i}`, point.x + 8, point.y - 8);
      }
    }
  }

  // Check if a point is near the curve
  isPointInside(x: number, y: number, tolerance: number = 10): boolean {
    const curvePoints = this.generateCurvePoints(200); // More points for better accuracy
    
    for (const point of curvePoints) {
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
      if (distance <= tolerance) {
        return true;
      }
    }
    return false;
  }

  // Check if a point is near a control point
  getControlPointAt(x: number, y: number, tolerance: number = 15): number {
    for (let i = 0; i < this.controlPoints.length; i++) {
      const point = this.controlPoints[i];
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
      if (distance <= tolerance) {
        return i;
      }
    }
    return -1;
  }

  // Update a specific control point
  updateControlPoint(index: number, x: number, y: number): void {
    if (index >= 0 && index < this.controlPoints.length) {
      this.controlPoints[index] = { x, y };
    }
  }

  // Move all control points
  move(deltaX: number, deltaY: number): void {
    for (const point of this.controlPoints) {
      point.x += deltaX;
      point.y += deltaY;
    }
  }

  getType(): string {
    return 'bezier';
  }

  toJSON(): any {
    return {
      type: 'bezier',
      id: this.id,
      color: this.color,
      controlPoints: this.controlPoints,
      selected: this.selected
    };
  }

  static fromJSON(json: any): BezierCurve {
    const curve = new BezierCurve(json.controlPoints, json.color);
    curve.id = json.id;
    curve.selected = json.selected;
    return curve;
  }
}
