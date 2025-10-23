import { Shape, ShapeFactory, type ShapeType, Line, Rectangle, Circle, Brush } from './shapes/Import';

// Tool types
export type Tool = 'select' | 'brush' | 'line' | 'rectangle' | 'circle';

// Drawing Manager class
export class DrawingManager {
  private shapes: Shape[] = [];
  private selectedShapeIndex: number | null = null;
  private ctx: CanvasRenderingContext2D;
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  
  // Add shape
  addShape(shape: Shape): void {
    this.shapes.push(shape);
  }
  
  // Create shape
  createShape(type: ShapeType, x1: number, y1: number, x2: number, y2: number): Shape {
    return ShapeFactory.createShape(type, x1, y1, x2, y2);
  }
  
  // Get shapes
  getShapes(): Shape[] {
    return this.shapes;
  }
  
  // Set shapes
  setShapes(shapes: Shape[]): void {
    this.shapes = shapes;
  }
  
  // Select shape at point
  selectShapeAt(x: number, y: number): boolean {
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
  
  // Get selected shape
  getSelectedShape(): Shape | null {
    if (this.selectedShapeIndex === null) return null;
    return this.shapes[this.selectedShapeIndex];
  }
  
  // Get selected shape index
  getSelectedShapeIndex(): number | null {
    return this.selectedShapeIndex;
  }
  
  // Clear selection
  clearSelection(): void {
    if (this.selectedShapeIndex !== null) {
      this.shapes[this.selectedShapeIndex].selected = false;
      this.selectedShapeIndex = null;
    }
  }
  
  // Move selected shape
  moveSelectedShape(deltaX: number, deltaY: number): void {
    if (this.selectedShapeIndex === null) return;
    this.shapes[this.selectedShapeIndex].move(deltaX, deltaY);
  }
  
  // Update selected shape
  updateSelectedShape(x1: number, y1: number, x2: number, y2: number): boolean {
    if (this.selectedShapeIndex === null) return false;
    
    const shape = this.shapes[this.selectedShapeIndex];
    const type = shape.getType();
    
    const newShape = ShapeFactory.createShape(type as ShapeType, x1, y1, x2, y2);
    newShape.color = shape.color;
    newShape.selected = true;
    
    this.shapes[this.selectedShapeIndex] = newShape;
    return true;
  }
  
  // Add point to brush
  addPointToBrush(x: number, y: number): boolean {
    if (this.selectedShapeIndex === null) return false;
    
    const shape = this.shapes[this.selectedShapeIndex];
    if (shape.getType() !== 'brush') return false;
    
    (shape as Brush).addPoint(x, y);
    return true;
  }
  
  // Redraw all shapes
  redraw(): void {
    const canvas = this.ctx.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.shapes.forEach(shape => {
      shape.draw(this.ctx);
    });
  }
  
  // Clear all shapes
  clear(): void {
    this.shapes = [];
    this.selectedShapeIndex = null;
    this.redraw();
  }
  
  // Delete selected shape
  deleteSelectedShape(): boolean {
    if (this.selectedShapeIndex === null) return false;
    
    this.shapes.splice(this.selectedShapeIndex, 1);
    this.selectedShapeIndex = null;
    this.redraw();
    return true;
  }
  
  // Export shapes to JSON
  exportToJSON(): string {
    const shapesData = this.shapes.map(shape => {
      const type = shape.getType();
      const baseData = {
        id: shape.id,
        type,
        color: shape.color
      };
      
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
  
  // Import shapes from JSON
  importFromJSON(json: string): boolean {
    try {
      const shapesData = JSON.parse(json);
      this.shapes = [];
      
      shapesData.forEach((data: any) => {
        let shape: Shape | null = null;
        
        switch (data.type) {
          case 'line':
            shape = new Line(data.x1, data.y1, data.x2, data.y2);
            break;
          case 'rectangle':
            shape = new Rectangle(data.x1, data.y1, data.width, data.height);
            break;
          case 'circle':
            shape = new Circle(data.x1, data.y1, data.radius);
            break;
          case 'brush': {
            shape = new Brush(data.points[0].x, data.points[0].y);
            for (let i = 1; i < data.points.length; i++) {
              (shape as Brush).addPoint(data.points[i].x, data.points[i].y);
            }
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
    } catch (error) {
      console.error('Błąd importowania kształtów:', error);
      return false;
    }
  }
}