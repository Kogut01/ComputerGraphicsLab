import { Shape } from './Shape';

// 3D Point interface
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// RGB Color interface
interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Face interface
interface Face {
  vertices: number[];
  normal: Point3D;
}

export class RGBCube extends Shape {
  private centerX: number;
  private centerY: number;
  private size: number;
  private rotationX: number = -30;
  private rotationY: number = 45;
  private rotationZ: number = 0;
  private vertices: Point3D[] = [];
  private faces: Face[] = [];
  
  // Slice parameters
  private sliceAxis: 'x' | 'y' | 'z' = 'z';
  private slicePosition: number = 0.5; // 0-1 range
  
  constructor(centerX: number, centerY: number, size: number) {
    super();
    this.centerX = centerX;
    this.centerY = centerY;
    this.size = size;
    this.initializeCube();
  }

  private initializeCube(): void {
    // Define 8 vertices of the cube with RGB mapping
    const s = this.size / 2;
    this.vertices = [
      { x: -s, y: -s, z: -s },
      { x:  s, y: -s, z: -s },
      { x:  s, y:  s, z: -s },
      { x: -s, y:  s, z: -s },
      { x: -s, y: -s, z:  s },
      { x:  s, y: -s, z:  s },
      { x:  s, y:  s, z:  s },
      { x: -s, y:  s, z:  s },
    ];

    // Define 6 faces
    this.faces = [
      { 
        vertices: [4, 5, 6, 7], 
        normal: { x: 0, y: 0, z: 1 }
      },
      { 
        vertices: [1, 0, 3, 2], 
        normal: { x: 0, y: 0, z: -1 }
      },
      { 
        vertices: [3, 7, 6, 2], 
        normal: { x: 0, y: 1, z: 0 }
      },
      { 
        vertices: [0, 1, 5, 4], 
        normal: { x: 0, y: -1, z: 0 }
      },
      { 
        vertices: [1, 2, 6, 5], 
        normal: { x: 1, y: 0, z: 0 }
      },
      { 
        vertices: [0, 4, 7, 3], 
        normal: { x: -1, y: 0, z: 0 }
      },
    ];
  }

  // Get RGB color for a vertex based on its index
  private getVertexColor(vertexIndex: number): RGBColor {
    const r = (vertexIndex & 1) ? 255 : 0;
    const g = (vertexIndex & 2) ? 255 : 0;
    const b = (vertexIndex & 4) ? 255 : 0;
    
    return { r, g, b };
  }

  // Get color at any point in 3D space inside the cube
  public getColorAt3D(x: number, y: number, z: number): RGBColor {
    const nx = (x + this.size / 2) / this.size;
    const ny = (y + this.size / 2) / this.size;
    const nz = (z + this.size / 2) / this.size;
    
    const cx = Math.max(0, Math.min(1, nx));
    const cy = Math.max(0, Math.min(1, ny));
    const cz = Math.max(0, Math.min(1, nz));
    
    return {
      r: cx * 255,
      g: cy * 255,
      b: cz * 255,
    };
  }

  // Convert RGB to hex color string
  private rgbToHex(color: RGBColor): string {
    const r = Math.round(Math.max(0, Math.min(255, color.r)));
    const g = Math.round(Math.max(0, Math.min(255, color.g)));
    const b = Math.round(Math.max(0, Math.min(255, color.b)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  // Bilinear interpolation for a quad face
  private interpolateQuadColor(
    u: number, 
    v: number, 
    c0: RGBColor, 
    c1: RGBColor, 
    c2: RGBColor, 
    c3: RGBColor
  ): RGBColor {
    const w0 = (1 - u) * (1 - v);
    const w1 = u * (1 - v);
    const w2 = u * v;
    const w3 = (1 - u) * v;

    return {
      r: w0 * c0.r + w1 * c1.r + w2 * c2.r + w3 * c3.r,
      g: w0 * c0.g + w1 * c1.g + w2 * c2.g + w3 * c3.g,
      b: w0 * c0.b + w1 * c1.b + w2 * c2.b + w3 * c3.b,
    };
  }

  // Rotation matrices
  private rotateX(point: Point3D, angle: number): Point3D {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: point.x,
      y: point.y * cos - point.z * sin,
      z: point.y * sin + point.z * cos,
    };
  }

  private rotateY(point: Point3D, angle: number): Point3D {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: point.x * cos + point.z * sin,
      y: point.y,
      z: -point.x * sin + point.z * cos,
    };
  }

  private rotateZ(point: Point3D, angle: number): Point3D {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos,
      z: point.z,
    };
  }

  // Apply all rotations to a point
  private transformPoint(point: Point3D): Point3D {
    let p = this.rotateX(point, this.rotationX);
    p = this.rotateY(p, this.rotationY);
    p = this.rotateZ(p, this.rotationZ);
    return p;
  }

  // Project 3D point to 2D screen coordinates
  private project(point: Point3D): { x: number; y: number; z: number } {
    const distance = 500; // Camera distance
    const scale = distance / (distance + point.z);
    return {
      x: this.centerX + point.x * scale,
      y: this.centerY + point.y * scale,
      z: point.z,
    };
  }

  // Calculate face depth
  private getFaceDepth(face: Face, transformedVertices: Point3D[]): number {
    let sumZ = 0;
    for (const vertexIndex of face.vertices) {
      sumZ += transformedVertices[vertexIndex].z;
    }
    return sumZ / face.vertices.length;
  }

  // Check if face is visible
  private isFaceVisible(face: Face, transformedVertices: Point3D[]): boolean {
    const normal = this.transformPoint(face.normal);
    
    const v0 = transformedVertices[face.vertices[0]];
    
    const viewDir = { x: -v0.x, y: -v0.y, z: -500 - v0.z };
    
    const dot = normal.x * viewDir.x + normal.y * viewDir.y + normal.z * viewDir.z;
    return dot > 0;
  }

  // Draw a quad face with color interpolation
  private drawInterpolatedQuad(
    ctx: CanvasRenderingContext2D,
    projectedVertices: { x: number; y: number; z: number }[],
    vertexIndices: number[],
    resolution: number = 20
  ): void {
    const c0 = this.getVertexColor(vertexIndices[0]);
    const c1 = this.getVertexColor(vertexIndices[1]);
    const c2 = this.getVertexColor(vertexIndices[2]);
    const c3 = this.getVertexColor(vertexIndices[3]);

    const p0 = projectedVertices[vertexIndices[0]];
    const p1 = projectedVertices[vertexIndices[1]];
    const p2 = projectedVertices[vertexIndices[2]];
    const p3 = projectedVertices[vertexIndices[3]];

    const step = 1 / resolution;
    
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const u0 = i * step;
        const v0 = j * step;
        const u1 = (i + 1) * step;
        const v1 = (j + 1) * step;

        const pos00 = this.interpolateQuadPosition(u0, v0, p0, p1, p2, p3);
        const pos10 = this.interpolateQuadPosition(u1, v0, p0, p1, p2, p3);
        const pos11 = this.interpolateQuadPosition(u1, v1, p0, p1, p2, p3);
        const pos01 = this.interpolateQuadPosition(u0, v1, p0, p1, p2, p3);

        const uCenter = (u0 + u1) / 2;
        const vCenter = (v0 + v1) / 2;
        const color = this.interpolateQuadColor(uCenter, vCenter, c0, c1, c2, c3);

        ctx.fillStyle = this.rgbToHex(color);
        ctx.beginPath();
        ctx.moveTo(pos00.x, pos00.y);
        ctx.lineTo(pos10.x, pos10.y);
        ctx.lineTo(pos11.x, pos11.y);
        ctx.lineTo(pos01.x, pos01.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw edges
    ctx.strokeStyle = this.selected ? '#0000FF' : '#000000';
    ctx.lineWidth = this.selected ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.stroke();
  }

  // Bilinear interpolation for position
  private interpolateQuadPosition(
    u: number,
    v: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ): { x: number; y: number } {
    const w0 = (1 - u) * (1 - v);
    const w1 = u * (1 - v);
    const w2 = u * v;
    const w3 = (1 - u) * v;

    return {
      x: w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
      y: w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const transformedVertices = this.vertices.map(v => this.transformPoint(v));
    
    const projectedVertices = transformedVertices.map(v => this.project(v));

    const facesWithDepth = this.faces
      .map(face => ({
        face,
        depth: this.getFaceDepth(face, transformedVertices),
        visible: this.isFaceVisible(face, transformedVertices),
      }))
      .filter(item => item.visible)
      .sort((a, b) => a.depth - b.depth);

    // Draw faces with color interpolation
    for (const { face } of facesWithDepth) {
      this.drawInterpolatedQuad(ctx, projectedVertices, face.vertices, 30);
    }

    // Draw vertices as colored dots
    for (let i = 0; i < projectedVertices.length; i++) {
      const vertex = projectedVertices[i];
      const color = this.getVertexColor(i);
      
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = this.rgbToHex(color);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw selection indicator
    if (this.selected) {
      const padding = 40;
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        this.centerX - this.size - padding,
        this.centerY - this.size - padding,
        this.size * 2 + padding * 2,
        this.size * 2 + padding * 2
      );
      ctx.setLineDash([]);
    }
  }

  // Draw slice on a separate canvas
  public drawSlice(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const resolution = 100;

    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sliceValue = (this.slicePosition - 0.5) * this.size;

    const pixelSize = Math.min(canvas.width, canvas.height) / resolution;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        let x, y, z;
        
        const u = (i / resolution - 0.5) * this.size;
        const v = (j / resolution - 0.5) * this.size;

        switch (this.sliceAxis) {
          case 'x':
            x = sliceValue;
            y = u;
            z = v;
            break;
          case 'y':
            x = u;
            y = sliceValue;
            z = v;
            break;
          case 'z':
            x = u;
            y = v;
            z = sliceValue;
            break;
        }

        const color = this.getColorAt3D(x, y, z);

        ctx.fillStyle = this.rgbToHex(color);
        ctx.fillRect(
          i * pixelSize,
          j * pixelSize,
          pixelSize + 1,
          pixelSize + 1
        );
      }
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Tahoma';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = this.getSliceLabel();
    ctx.fillText(label, canvas.width / 2, 20);
  }

  // Get label for current slice
  private getSliceLabel(): string {
    const percentage = Math.round(this.slicePosition * 100);
    const axisNames = {
      'x': 'Red',
      'y': 'Green',
      'z': 'Blue'
    };
    return `${axisNames[this.sliceAxis]} slice at ${percentage}%`;
  }

  // Set slice parameters
  public setSliceAxis(axis: 'x' | 'y' | 'z'): void {
    this.sliceAxis = axis;
  }

  public setSlicePosition(position: number): void {
    this.slicePosition = Math.max(0, Math.min(1, position));
  }

  public getSliceAxis(): 'x' | 'y' | 'z' {
    return this.sliceAxis;
  }

  public getSlicePosition(): number {
    return this.slicePosition;
  }

  isPointInside(x: number, y: number, _tolerance?: number): boolean {
    const padding = 40;
    return (
      x >= this.centerX - this.size - padding &&
      x <= this.centerX + this.size + padding &&
      y >= this.centerY - this.size - padding &&
      y <= this.centerY + this.size + padding
    );
  }

  move(deltaX: number, deltaY: number): void {
    this.centerX += deltaX;
    this.centerY += deltaY;
  }

  // Rotate the cube based on mouse drag
  rotate(deltaX: number, deltaY: number): void {
    this.rotationY += deltaX * 0.5;
    this.rotationX += deltaY * 0.5;
    
    // Keep angles in reasonable range
    this.rotationX = this.rotationX % 360;
    this.rotationY = this.rotationY % 360;
  }

  // Get rotation angles
  getRotation(): { x: number; y: number; z: number } {
    return {
      x: this.rotationX,
      y: this.rotationY,
      z: this.rotationZ,
    };
  }

  // Set rotation angles
  setRotation(x: number, y: number, z: number): void {
    this.rotationX = x;
    this.rotationY = y;
    this.rotationZ = z;
  }

  // Get position
  getPosition(): { x: number; y: number } {
    return { x: this.centerX, y: this.centerY };
  }

  // Get size
  getSize(): number {
    return this.size;
  }

  getType(): string {
    return 'rgbcube';
  }

  // Serialize for JSON export
  toJSON(): any {
    return {
      type: 'rgbcube',
      id: this.id,
      centerX: this.centerX,
      centerY: this.centerY,
      size: this.size,
      rotationX: this.rotationX,
      rotationY: this.rotationY,
      rotationZ: this.rotationZ,
      color: this.color,
      sliceAxis: this.sliceAxis,
      slicePosition: this.slicePosition,
    };
  }

  // Deserialize from JSON
  static fromJSON(data: any): RGBCube {
    const cube = new RGBCube(data.centerX, data.centerY, data.size);
    cube.id = data.id;
    cube.rotationX = data.rotationX || -30;
    cube.rotationY = data.rotationY || 45;
    cube.rotationZ = data.rotationZ || 0;
    cube.color = data.color || '#000000';
    cube.sliceAxis = data.sliceAxis || 'z';
    cube.slicePosition = data.slicePosition || 0.5;
    return cube;
  }
}