// Import type
import { Shape } from './Shape';
import { Line } from './Line';
import { Rectangle } from './Rectangle';
import { Circle } from './Circle';
import { Brush } from './Brush';
import { RGBCube } from './RGBCube';
import { BezierCurve, type Point } from './BezierCurve';
import { Polygon, type Point as PolygonPoint } from './Polygon';

// Shape types
export type ShapeType = 'line' | 'rectangle' | 'circle' | 'brush' | 'rgbcube' | 'bezier' | 'polygon';

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
      case 'bezier':
        // Start with two control points
        return new BezierCurve([{ x: x1, y: y1 }, { x: x2, y: y2 }]);
      case 'polygon':
        // Start with first vertex
        return new Polygon([{ x: x1, y: y1 }], '#000000');
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }

  // Helper method to create bezier with custom control points
  static createBezierCurve(points: Point[], color: string = '#000000'): BezierCurve {
    return new BezierCurve(points, color);
  }

  // Helper method to create polygon with custom vertices
  static createPolygon(vertices: PolygonPoint[], color: string = '#000000', filled: boolean = false): Polygon {
    return new Polygon(vertices, color, filled);
  }
}