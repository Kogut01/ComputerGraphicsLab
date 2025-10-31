// Import type
import { Shape } from './Shape';
import { Line } from './Line';
import { Rectangle } from './Rectangle';
import { Circle } from './Circle';
import { Brush } from './Brush';
import { RGBCube } from './RGBCube';

// Shape types
export type ShapeType = 'line' | 'rectangle' | 'circle' | 'brush' | 'rgbcube';

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
      case 'rgbcube': {
        // Center of cube at click position, size based on drag distance
        const size = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 50);
        return new RGBCube(x1, y1, size);
      }
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}