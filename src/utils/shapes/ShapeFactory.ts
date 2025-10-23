// Import type
import { Shape } from './Shape';
import { Line } from './Line';
import { Rectangle } from './Rectangle';
import { Circle } from './Circle';
import { Brush } from './Brush';

// Shape types
export type ShapeType = 'line' | 'rectangle' | 'circle' | 'brush';

// Shape factory
export class ShapeFactory {
  static createShape(type: ShapeType, x1: number, y1: number, x2: number, y2: number): Shape {
    switch (type) {
      case 'line':
        return new Line(x1, y1, x2, y2);
      case 'rectangle':
        return new Rectangle(x1, y1, x2 - x1, y2 - y1);
      case 'circle': {
        const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        return new Circle(x1, y1, radius);
      }
      case 'brush':
        return new Brush(x1, y1);
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}