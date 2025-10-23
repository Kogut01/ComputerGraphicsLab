// Canvas Manager class
export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not found');
    }

    this.canvas = canvas;
    this.ctx = ctx;
  }

  // Get Canvas
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  // Get Context
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  // Get Width
  getWidth(): number {
    return this.canvas.width;
  }

  // Get Height
  getHeight(): number {
    return this.canvas.height;
  }

  // Clear Canvas
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Get Mouse Position
  getMousePosition(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  // Set Cursor Style
  setCursor(cursor: string): void {
    this.canvas.style.cursor = cursor;
  }
}