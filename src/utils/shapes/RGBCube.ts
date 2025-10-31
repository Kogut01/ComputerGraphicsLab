import { Shape } from './Shape';

// 3D Point interface
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Face interface
interface Face {
  vertices: number[];
  color: string;
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
  
  constructor(centerX: number, centerY: number, size: number) {
    super();
    this.centerX = centerX;
    this.centerY = centerY;
    this.size = size;
    this.initializeCube();
  }

  private initializeCube(): void {
    // Define 8 vertices of the cube centered at origin
    const s = this.size / 2;
    this.vertices = [
      { x: -s, y: -s, z: -s }, // 0: Black (0,0,0)
      { x:  s, y: -s, z: -s }, // 1: Red (1,0,0)
      { x:  s, y:  s, z: -s }, // 2: Yellow (1,1,0)
      { x: -s, y:  s, z: -s }, // 3: Green (0,1,0)
      { x: -s, y: -s, z:  s }, // 4: Blue (0,0,1)
      { x:  s, y: -s, z:  s }, // 5: Magenta (1,0,1)
      { x:  s, y:  s, z:  s }, // 6: White (1,1,1)
      { x: -s, y:  s, z:  s }, // 7: Cyan (0,1,1)
    ];

    // Define 6 faces (each face is a quad made of 4 vertices)
    this.faces = [
      // Front face (z = +s)
      { 
        vertices: [4, 5, 6, 7], 
        color: '#4080FF',
        normal: { x: 0, y: 0, z: 1 }
      },
      // Back face (z = -s)
      { 
        vertices: [1, 0, 3, 2], 
        color: '#FF8040',
        normal: { x: 0, y: 0, z: -1 }
      },
      // Top face (y = +s)
      { 
        vertices: [3, 7, 6, 2], 
        color: '#80FF40',
        normal: { x: 0, y: 1, z: 0 }
      },
      // Bottom face (y = -s)
      { 
        vertices: [0, 1, 5, 4], 
        color: '#FF40FF',
        normal: { x: 0, y: -1, z: 0 }
      },
      // Right face (x = +s)
      { 
        vertices: [1, 2, 6, 5], 
        color: '#FF4040',
        normal: { x: 1, y: 0, z: 0 }
      },
      // Left face (x = -s)
      { 
        vertices: [0, 4, 7, 3], 
        color: '#40FFFF',
        normal: { x: -1, y: 0, z: 0 }
      },
    ];
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

  // Project 3D point to 2D screen coordinates (perspective projection)
  private project(point: Point3D): { x: number; y: number; z: number } {
    const distance = 500; // Camera distance
    const scale = distance / (distance + point.z);
    return {
      x: this.centerX + point.x * scale,
      y: this.centerY + point.y * scale,
      z: point.z,
    };
  }

  // Calculate face depth (average z of vertices)
  private getFaceDepth(face: Face, transformedVertices: Point3D[]): number {
    let sumZ = 0;
    for (const vertexIndex of face.vertices) {
      sumZ += transformedVertices[vertexIndex].z;
    }
    return sumZ / face.vertices.length;
  }

  // Check if face is visible (backface culling)
  private isFaceVisible(face: Face, transformedVertices: Point3D[]): boolean {
    // Transform face normal
    const normal = this.transformPoint(face.normal);
    
    // Get first vertex of face
    const v0 = transformedVertices[face.vertices[0]];
    
    // Camera is at (0, 0, -distance), looking at positive z
    // View direction to vertex
    const viewDir = { x: -v0.x, y: -v0.y, z: -500 - v0.z };
    
    // Dot product: if positive, face is visible
    const dot = normal.x * viewDir.x + normal.y * viewDir.y + normal.z * viewDir.z;
    return dot > 0;
  }

  // Get vertex color based on RGB position
  private getVertexColor(vertexIndex: number): string {
    const colors = [
      '#000000', // 0: Black (0,0,0)
      '#FF0000', // 1: Red (1,0,0)
      '#FFFF00', // 2: Yellow (1,1,0)
      '#00FF00', // 3: Green (0,1,0)
      '#0000FF', // 4: Blue (0,0,1)
      '#FF00FF', // 5: Magenta (1,0,1)
      '#FFFFFF', // 6: White (1,1,1)
      '#00FFFF', // 7: Cyan (0,1,1)
    ];
    return colors[vertexIndex];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Transform all vertices
    const transformedVertices = this.vertices.map(v => this.transformPoint(v));
    
    // Project vertices to 2D
    const projectedVertices = transformedVertices.map(v => this.project(v));

    // Create array of faces with their depths for sorting
    const facesWithDepth = this.faces
      .map(face => ({
        face,
        depth: this.getFaceDepth(face, transformedVertices),
        visible: this.isFaceVisible(face, transformedVertices),
      }))
      .filter(item => item.visible) // Only draw visible faces
      .sort((a, b) => a.depth - b.depth); // Sort by depth (painter's algorithm)

    // Draw faces (back to front)
    for (const { face } of facesWithDepth) {
      ctx.beginPath();
      const firstVertex = projectedVertices[face.vertices[0]];
      ctx.moveTo(firstVertex.x, firstVertex.y);
      
      for (let i = 1; i < face.vertices.length; i++) {
        const vertex = projectedVertices[face.vertices[i]];
        ctx.lineTo(vertex.x, vertex.y);
      }
      ctx.closePath();
      
      // Fill face with base color
      ctx.fillStyle = face.color;
      ctx.fill();
      
      // Draw edges
      ctx.strokeStyle = this.selected ? '#0000FF' : '#000000';
      ctx.lineWidth = this.selected ? 3 : 1.5;
      ctx.stroke();
    }

    // Draw vertices as colored dots
    for (let i = 0; i < projectedVertices.length; i++) {
      const vertex = projectedVertices[i];
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = this.getVertexColor(i);
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

  isPointInside(x: number, y: number, _tolerance?: number): boolean {
    // Check if point is inside bounding box
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
    return cube;
  }
}
