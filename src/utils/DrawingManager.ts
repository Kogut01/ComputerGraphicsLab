import { Shape, ShapeFactory, type ShapeType, Line, Rectangle, Circle, Brush } from './shapes/Import';

// Tool types
export type Tool = 'select' | 'brush' | 'line' | 'rectangle' | 'circle';

export class DrawingManager {
  private shapes: Shape[] = [];
  private selectedShapeIndex: number | null = null;
  private ctx: CanvasRenderingContext2D;

  private backgroundImage: CanvasImageSource | null = null;
  private backgroundRect: { x: number; y: number; width: number; height: number } | null = null;

  private scale: number = 1.0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public isShapeAt(x: number, y: number): boolean {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      if (this.shapes[i].isPointInside(x, y)) {
        return true;
      }
    }
    return false;
  }

  // Convert canvas coordinates to screen coordinates
  public screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    };
  }

  public getZoom(): number {
    return this.scale;
  }

  public setZoom(scale: number): void {
    this.scale = Math.max(0.1, Math.min(20, scale));
    this.redraw();
  }

  public getPan(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  public pan(deltaX: number, deltaY: number): void {
    this.offsetX += deltaX;
    this.offsetY += deltaY;
    this.redraw();
  }
  
  public resetPan(): void {
    this.offsetX = 0;
    this.offsetY = 0;
    this.redraw();
  }

  public setBackgroundImage(img: CanvasImageSource, x: number, y: number, width: number, height: number): void {
    this.backgroundImage = img;
    this.backgroundRect = { x, y, width, height };
  }

  public clearBackgroundImage(): void {
    this.backgroundImage = null;
    this.backgroundRect = null;
  }
  
  public addShape(shape: Shape): void {
    this.shapes.push(shape);
  }
  
  public createShape(type: ShapeType, x1: number, y1: number, x2: number, y2: number): Shape {
    return ShapeFactory.createShape(type, x1, y1, x2, y2);
  }
  
  public getShapes(): Shape[] {
    return this.shapes;
  }
  
  public setShapes(shapes: Shape[]): void {
    this.shapes = shapes;
  }
  
  public selectShapeAt(x: number, y: number): boolean {
    if (this.selectedShapeIndex !== null) {
      this.shapes[this.selectedShapeIndex].selected = false;
    }
    this.selectedShapeIndex = null;
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      if (this.shapes[i].isPointInside(x, y)) {
        this.selectedShapeIndex = i;
        this.shapes[i].selected = true;
        return true;
      }
    }
    return false;
  }
  
  public getSelectedShape(): Shape | null {
    if (this.selectedShapeIndex === null) return null;
    return this.shapes[this.selectedShapeIndex];
  }
  
  public clearSelection(): void {
    if (this.selectedShapeIndex !== null) {
      this.shapes[this.selectedShapeIndex].selected = false;
      this.selectedShapeIndex = null;
    }
  }
  
  public moveSelectedShape(deltaX: number, deltaY: number): void {
    if (this.selectedShapeIndex === null) return;
    this.shapes[this.selectedShapeIndex].move(deltaX, deltaY);
  }
  
  public updateSelectedShape(x1: number, y1: number, x2: number, y2: number): boolean {
    if (this.selectedShapeIndex === null) return false;
    const shape = this.shapes[this.selectedShapeIndex];
    const type = shape.getType();
    const newShape = ShapeFactory.createShape(type as ShapeType, x1, y1, x2, y2);
    newShape.color = shape.color;
    newShape.selected = true;
    this.shapes[this.selectedShapeIndex] = newShape;
    return true;
  }
  
  public redraw(): void {
    const canvas = this.ctx.canvas;
    this.ctx.save();
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    if (this.backgroundImage && this.backgroundRect) {
      this.ctx.drawImage(
        this.backgroundImage,
        this.backgroundRect.x,
        this.backgroundRect.y,
        this.backgroundRect.width,
        this.backgroundRect.height
      );
    }
    this.shapes.forEach(shape => shape.draw(this.ctx));
    this.ctx.restore();
  }
  
  public clear(): void {
    this.shapes = [];
    this.selectedShapeIndex = null;
    this.redraw();
  }
  
  public deleteSelectedShape(): boolean {
    if (this.selectedShapeIndex === null) return false;
    this.shapes.splice(this.selectedShapeIndex, 1);
    this.selectedShapeIndex = null;
    this.redraw();
    return true;
  }
  
  public exportToJSON(): string {
    const shapesData = this.shapes.map(shape => {
      const type = shape.getType();
      const baseData = { id: shape.id, type, color: shape.color };
      switch (type) {
        case 'line': {
          const line = shape as Line;
          return { ...baseData, x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 };
        }
        case 'rectangle': {
          const rect = shape as Rectangle;
          return { ...baseData, x1: rect.x1, y1: rect.y1, width: rect.width, height: rect.height };
        }
        case 'circle': {
          const circle = shape as Circle;
          return { ...baseData, x1: circle.x1, y1: circle.y1, radius: circle.radius };
        }
        case 'brush': {
          const brush = shape as Brush;
          return { ...baseData, points: brush.points };
        }
        default:
          return baseData;
      }
    });
    return JSON.stringify(shapesData, null, 2);
  }
  
  public importFromJSON(json: string): boolean {
    try {
      const shapesData = JSON.parse(json);
      this.shapes = [];
      shapesData.forEach((data: any) => {
        let shape: Shape | null = null;
        switch (data.type) {
          case 'line': shape = new Line(data.x1, data.y1, data.x2, data.y2); break;
          case 'rectangle': shape = new Rectangle(data.x1, data.y1, data.width, data.height); break;
          case 'circle': shape = new Circle(data.x1, data.y1, data.radius); break;
          case 'brush': {
            shape = new Brush(data.points[0].x, data.points[0].y);
            for (let i = 1; i < data.points.length; i++) (shape as Brush).addPoint(data.points[i].x, data.points[i].y);
            break;
          }
        }
        if (shape) {
          shape.color = data.color || '#000000';
          this.shapes.push(shape);
        }
      });
      this.selectedShapeIndex = null;
      this.redraw();
      return true;
    } catch {
      console.error('Błąd importowania kształtów');
      return false;
    }
  }
}