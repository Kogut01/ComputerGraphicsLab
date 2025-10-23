// Absract Shape class
export abstract class Shape {
  id: string;
  selected: boolean;
  color: string;

  constructor() {
    this.id = crypto.randomUUID();
    this.selected = false;
    this.color = '#000000';
  }

  // Methotds to implement in subclasses
  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract isPointInside(x: number, y: number, tolerance?: number): boolean;
  abstract move(deltaX: number, deltaY: number): void;
  abstract getType(): string;
}