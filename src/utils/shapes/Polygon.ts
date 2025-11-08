import { Shape } from './Shape';

export interface Point {
  x: number;
  y: number;
}

export class Polygon extends Shape {
  public vertices: Point[];
  private filled: boolean;
  
  constructor(vertices: Point[], color: string, filled: boolean = false) {
    super();
    this.color = color;
    this.vertices = vertices;
    this.filled = filled;
  }

  getType(): string {
    return 'polygon';
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.vertices.length < 2) return;

    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    
    // Close the polygon
    ctx.closePath();
    
    if (this.filled) {
      ctx.fill();
    }
    ctx.stroke();

    // Draw vertices as small circles
    this.vertices.forEach((vertex) => {
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = this.selected ? '#00ff00' : '#ff0000';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  isPointInside(x: number, y: number, tolerance: number = 10): boolean {
    // Check if point is near any vertex (for easy selection)
    for (const vertex of this.vertices) {
      const dx = x - vertex.x;
      const dy = y - vertex.y;
      if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
        return true;
      }
    }

    // Check if point is inside polygon using ray casting algorithm
    let inside = false;
    for (let i = 0, j = this.vertices.length - 1; i < this.vertices.length; j = i++) {
      const xi = this.vertices[i].x, yi = this.vertices[i].y;
      const xj = this.vertices[j].x, yj = this.vertices[j].y;

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  move(deltaX: number, deltaY: number): void {
    // Use homogeneous coordinate transformation
    this.translate(deltaX, deltaY);
  }

  getCoordinates(): { x1: number; y1: number; x2: number; y2: number } {
    if (this.vertices.length === 0) {
      return { x1: 0, y1: 0, x2: 0, y2: 0 };
    }
    
    // Return bounding box
    let minX = this.vertices[0].x;
    let maxX = this.vertices[0].x;
    let minY = this.vertices[0].y;
    let maxY = this.vertices[0].y;

    for (const vertex of this.vertices) {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
    }

    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  }

  updateCoordinates(x1: number, y1: number, x2: number, y2: number): void {
    // Scale vertices to fit new bounding box
    const oldCoords = this.getCoordinates();
    const oldWidth = oldCoords.x2 - oldCoords.x1;
    const oldHeight = oldCoords.y2 - oldCoords.y1;
    const newWidth = x2 - x1;
    const newHeight = y2 - y1;

    if (oldWidth === 0 || oldHeight === 0) return;

    this.vertices = this.vertices.map(vertex => ({
      x: x1 + (vertex.x - oldCoords.x1) * newWidth / oldWidth,
      y: y1 + (vertex.y - oldCoords.y1) * newHeight / oldHeight
    }));
  }

  // --- HOMOGENEOUS COORDINATES TRANSFORMATIONS ---
  
  /**
   * Convert 2D point to homogeneous coordinates [x, y, 1]
   */
  private toHomogeneous(point: Point): [number, number, number] {
    return [point.x, point.y, 1];
  }

  /**
   * Convert homogeneous coordinates back to 2D point
   */
  private fromHomogeneous(coords: [number, number, number]): Point {
    return { x: coords[0] / coords[2], y: coords[1] / coords[2] };
  }

  /**
   * Multiply 3x3 matrix with homogeneous point vector
   */
  private multiplyMatrix(matrix: number[][], point: [number, number, number]): [number, number, number] {
    return [
      matrix[0][0] * point[0] + matrix[0][1] * point[1] + matrix[0][2] * point[2],
      matrix[1][0] * point[0] + matrix[1][1] * point[1] + matrix[1][2] * point[2],
      matrix[2][0] * point[0] + matrix[2][1] * point[1] + matrix[2][2] * point[2]
    ];
  }

  /**
   * Apply transformation matrix to all vertices
   */
  private applyTransformation(matrix: number[][]): void {
    this.vertices = this.vertices.map(vertex => {
      const homogeneous = this.toHomogeneous(vertex);
      const transformed = this.multiplyMatrix(matrix, homogeneous);
      return this.fromHomogeneous(transformed);
    });
  }

  /**
   * Translate polygon by vector (dx, dy) using homogeneous coordinates
   * Translation matrix:
   * [ 1  0  dx ]
   * [ 0  1  dy ]
   * [ 0  0  1  ]
   */
  translate(dx: number, dy: number): void {
    const translationMatrix = [
      [1, 0, dx],
      [0, 1, dy],
      [0, 0, 1]
    ];
    this.applyTransformation(translationMatrix);
  }

  /**
   * Rotate polygon around a pivot point by angle (in degrees) using homogeneous coordinates
   * Steps:
   * 1. Translate to origin (move pivot to 0,0)
   * 2. Rotate
   * 3. Translate back
   * 
   * Rotation matrix around origin:
   * [ cos(θ)  -sin(θ)  0 ]
   * [ sin(θ)   cos(θ)  0 ]
   * [   0        0     1 ]
   */
  rotate(angleDegrees: number, pivotX: number, pivotY: number): void {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);

    // Step 1: Translate to origin (T1)
    const translateToOrigin = [
      [1, 0, -pivotX],
      [0, 1, -pivotY],
      [0, 0, 1]
    ];

    // Step 2: Rotate around origin (R)
    const rotationMatrix = [
      [cos, -sin, 0],
      [sin, cos, 0],
      [0, 0, 1]
    ];

    // Step 3: Translate back (T2)
    const translateBack = [
      [1, 0, pivotX],
      [0, 1, pivotY],
      [0, 0, 1]
    ];

    // Combined transformation: T2 * R * T1
    // First apply T1, then R, then T2
    this.vertices = this.vertices.map(vertex => {
      let homogeneous = this.toHomogeneous(vertex);
      homogeneous = this.multiplyMatrix(translateToOrigin, homogeneous);
      homogeneous = this.multiplyMatrix(rotationMatrix, homogeneous);
      homogeneous = this.multiplyMatrix(translateBack, homogeneous);
      return this.fromHomogeneous(homogeneous);
    });
  }

  /**
   * Scale polygon relative to a scale point using homogeneous coordinates
   * Steps:
   * 1. Translate to origin (move scale point to 0,0)
   * 2. Scale
   * 3. Translate back
   * 
   * Scaling matrix around origin:
   * [ sx   0   0 ]
   * [ 0   sy   0 ]
   * [ 0    0   1 ]
   */
  scale(sx: number, sy: number, scalePointX: number, scalePointY: number): void {
    // Step 1: Translate to origin (T1)
    const translateToOrigin = [
      [1, 0, -scalePointX],
      [0, 1, -scalePointY],
      [0, 0, 1]
    ];

    // Step 2: Scale around origin (S)
    const scalingMatrix = [
      [sx, 0, 0],
      [0, sy, 0],
      [0, 0, 1]
    ];

    // Step 3: Translate back (T2)
    const translateBack = [
      [1, 0, scalePointX],
      [0, 1, scalePointY],
      [0, 0, 1]
    ];

    // Combined transformation: T2 * S * T1
    // First apply T1, then S, then T2
    this.vertices = this.vertices.map(vertex => {
      let homogeneous = this.toHomogeneous(vertex);
      homogeneous = this.multiplyMatrix(translateToOrigin, homogeneous);
      homogeneous = this.multiplyMatrix(scalingMatrix, homogeneous);
      homogeneous = this.multiplyMatrix(translateBack, homogeneous);
      return this.fromHomogeneous(homogeneous);
    });
  }

  /**
   * Add a vertex at the end of the polygon
   */
  addVertex(x: number, y: number): void {
    this.vertices.push({ x, y });
  }

  /**
   * Update a specific vertex
   */
  updateVertex(index: number, x: number, y: number): void {
    if (index >= 0 && index < this.vertices.length) {
      this.vertices[index] = { x, y };
    }
  }

  /**
   * Remove a vertex by index
   */
  removeVertex(index: number): void {
    if (this.vertices.length > 3 && index >= 0 && index < this.vertices.length) {
      this.vertices.splice(index, 1);
    }
  }

  /**
   * Get vertex at position (for selection)
   */
  getVertexAt(x: number, y: number): number {
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];
      const dx = x - vertex.x;
      const dy = y - vertex.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Set fill mode
   */
  setFilled(filled: boolean): void {
    this.filled = filled;
  }

  /**
   * Get fill mode
   */
  isFilled(): boolean {
    return this.filled;
  }

  toJSON(): any {
    return {
      type: 'polygon',
      color: this.color,
      vertices: this.vertices,
      filled: this.filled
    };
  }

  static fromJSON(data: any): Polygon {
    const polygon = new Polygon(data.vertices || [], data.color, data.filled || false);
    return polygon;
  }
}
