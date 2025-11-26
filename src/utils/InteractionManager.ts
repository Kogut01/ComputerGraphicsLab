import { DrawingManager } from './DrawingManager';
import { ToolManager } from './ToolManager';
import { UIController } from './UIController';
import { type ShapeType, ShapeFactory, Brush, RGBCube, BezierCurve, Polygon } from './shapes/Import';

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drawingManager: DrawingManager;
  private toolManager: ToolManager;
  private uiController: UIController;
  private statusText: HTMLElement;
  private cursorPosition: HTMLElement;
  
  private isPanning: boolean = false;
  private lastPanX: number = 0;
  private lastPanY: number = 0;

  // State
  private isDrawing = false;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private currentBrushPoints: { x: number; y: number }[] = [];
  private previewCube: RGBCube | null = null;
  private previewAnimationFrame: number | null = null;

  // Bezier state
  private draggedControlPointIndex: number = -1;
  private selectedControlPointIndex: number = -1;

  // Polygon state
  private currentPolygonVertices: { x: number; y: number }[] = [];
  private isCreatingPolygon: boolean = false;
  private polygonPivotPoint: { x: number; y: number } | null = null;
  private isRotatingPolygon: boolean = false;
  private rotationStartAngle: number = 0;
  private polygonScalePoint: { x: number; y: number } | null = null;
  private isScalingPolygon: boolean = false;
  private scaleStartDistance: number = 0;
  
  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    drawingManager: DrawingManager,
    toolManager: ToolManager,
    uiController: UIController,
    statusText: HTMLElement,
    cursorPosition: HTMLElement
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.drawingManager = drawingManager;
    this.toolManager = toolManager;
    this.uiController = uiController;
    this.statusText = statusText;
    this.cursorPosition = cursorPosition;
    
    this.initializeEvents();
  }
  
  private initializeEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    
    // Keyboard events for polygon
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  // Event coords to canvas pixel coords
  private getCanvasPixelFromEvent(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  // Event coords to world coords
  private getWorldFromEvent(e: MouseEvent): { x: number; y: number } {
    const s = this.getCanvasPixelFromEvent(e);
    return this.drawingManager.screenToCanvas(s.x, s.y);
  }
  
  private handleMouseDown(e: MouseEvent): void {
    const currentTool = this.toolManager.getCurrentTool();
    if (!currentTool) return;

    if (currentTool === 'rgbcube') {
      this.statusText.textContent = 'Kliknij i przeciągnij, aby narysować kostkę RGB.';
    }

    if (e.button === 0 && e.shiftKey) {
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }
    
    const pos = this.getWorldFromEvent(e);
    
    if (currentTool === 'select') {
      // Check if Alt is pressed and we have a polygon selected - start scaling
      if (e.altKey) {
        const selectedShape = this.drawingManager.getSelectedShape();
        if (selectedShape && selectedShape.getType() === 'polygon' && this.polygonScalePoint) {
          this.isScalingPolygon = true;
          this.isDrawing = true;
          // Calculate initial distance from scale point to mouse
          const dx = pos.x - this.polygonScalePoint.x;
          const dy = pos.y - this.polygonScalePoint.y;
          this.scaleStartDistance = Math.sqrt(dx * dx + dy * dy);
          this.canvas.style.cursor = 'grabbing';
          this.statusText.textContent = 'Scaling polygon... Release to finish';
          return;
        }
      }
      
      // Check if Ctrl is pressed and we have a polygon selected - start rotation
      if (e.ctrlKey) {
        const selectedShape = this.drawingManager.getSelectedShape();
        if (selectedShape && selectedShape.getType() === 'polygon' && this.polygonPivotPoint) {
          this.isRotatingPolygon = true;
          this.isDrawing = true;
          // Calculate initial angle from pivot to mouse
          const dx = pos.x - this.polygonPivotPoint.x;
          const dy = pos.y - this.polygonPivotPoint.y;
          this.rotationStartAngle = Math.atan2(dy, dx) * 180 / Math.PI;
          this.canvas.style.cursor = 'grabbing';
          this.statusText.textContent = 'Rotating polygon... Release to finish';
          return;
        }
      }
      
      // First check if we're clicking on a control point of an already selected Bezier curve
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'bezier') {
        const bezier = selectedShape as BezierCurve;
        const controlPointIndex = bezier.getControlPointAt(pos.x, pos.y);
        if (controlPointIndex >= 0) {
          // Clicking on a control point - start dragging
          this.isDrawing = true;
          this.draggedControlPointIndex = controlPointIndex;
          this.selectedControlPointIndex = controlPointIndex;
          bezier.selectedPointIndex = controlPointIndex;
          this.statusText.textContent = `Dragging control point P${controlPointIndex}`;
          this.drawingManager.redraw();
          this.uiController.updateBezierPanel(bezier, controlPointIndex);
          return;
        }
      }
      
      // Now try to select a shape at this position
      const wasSelected = this.drawingManager.selectShapeAt(pos.x, pos.y);
      if (wasSelected) {
        const shape = this.drawingManager.getSelectedShape();
        
        // Check again if it's a Bezier curve and if we clicked on a control point
        if (shape && shape.getType() === 'bezier') {
          const bezier = shape as BezierCurve;
          const controlPointIndex = bezier.getControlPointAt(pos.x, pos.y);
          if (controlPointIndex >= 0) {
            // Clicking on a control point of newly selected curve
            this.isDrawing = true;
            this.draggedControlPointIndex = controlPointIndex;
            this.selectedControlPointIndex = controlPointIndex;
            bezier.selectedPointIndex = controlPointIndex;
            this.statusText.textContent = `Dragging control point P${controlPointIndex}`;
            this.drawingManager.redraw();
            this.uiController.hideAllPanels();
            const bezierPanel = document.getElementById('bezier-panel');
            if (bezierPanel) {
              bezierPanel.classList.remove('hidden');
              this.uiController.updateBezierPanel(bezier, controlPointIndex);
            }
            return;
          }
        }
        
        // Not clicking on a control point, so start dragging the whole shape
        this.isDragging = true;
        this.isDrawing = true;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.statusText.textContent = `Selected ${shape?.getType?.()}`;
        this.drawingManager.redraw();
        // Ukryj wszystkie panele po zaznaczeniu kostki RGB
        if (shape && shape.getType() === 'rgbcube') {
          this.uiController.hideAllPanels();
          this.uiController.showRotateCubePanel(shape);
        } else if (shape && shape.getType() === 'bezier') {
          this.uiController.hideAllPanels();
          const bezierPanel = document.getElementById('bezier-panel');
          if (bezierPanel) {
            bezierPanel.classList.remove('hidden');
            this.selectedControlPointIndex = -1; // Reset selection when selecting curve
            const bezier = shape as BezierCurve;
            bezier.selectedPointIndex = -1;
            this.uiController.updateBezierPanel(bezier, -1);
          }
          this.uiController.hideRotateCubePanel();
        } else if (shape && shape.getType() === 'polygon') {
          this.uiController.hideAllPanels();
          const polygonPanel = document.getElementById('polygon-panel');
          if (polygonPanel) {
            polygonPanel.classList.remove('hidden');
            // Show edit and transform sections, hide create section
            const createSection = document.getElementById('polygon-create-section');
            const editSection = document.getElementById('polygon-edit-section');
            const transformSection = document.getElementById('polygon-transform-section');
            if (createSection) createSection.classList.add('hidden');
            if (editSection) editSection.classList.remove('hidden');
            if (transformSection) transformSection.classList.remove('hidden');
            
            // Update polygon info in panel
            const polygon = shape as Polygon;
            const verticesCount = document.getElementById('polygon-vertices-count');
            if (verticesCount) {
              verticesCount.textContent = `${polygon.vertices.length} vertices`;
            }
            
            // Update filled checkbox
            const filledCheckbox = document.getElementById('polygon-edit-filled') as HTMLInputElement;
            if (filledCheckbox) {
              filledCheckbox.checked = polygon.isFilled();
            }
            
            // Initialize pivot point to polygon center if not set
            if (!this.polygonPivotPoint) {
              const coords = polygon.getCoordinates();
              const centerX = (coords.x1 + coords.x2) / 2;
              const centerY = (coords.y1 + coords.y2) / 2;
              this.polygonPivotPoint = { x: centerX, y: centerY };
              
              const pivotXInput = document.getElementById('polygon-pivot-x') as HTMLInputElement;
              const pivotYInput = document.getElementById('polygon-pivot-y') as HTMLInputElement;
              if (pivotXInput) pivotXInput.value = Math.round(centerX).toString();
              if (pivotYInput) pivotYInput.value = Math.round(centerY).toString();
              
              this.uiController.updatePolygonPivotDisplay(this.polygonPivotPoint);
            }
            
            // Initialize scale point to polygon center if not set
            if (!this.polygonScalePoint) {
              const coords = polygon.getCoordinates();
              const centerX = (coords.x1 + coords.x2) / 2;
              const centerY = (coords.y1 + coords.y2) / 2;
              this.polygonScalePoint = { x: centerX, y: centerY };
              
              const scalePointXInput = document.getElementById('polygon-scale-point-x') as HTMLInputElement;
              const scalePointYInput = document.getElementById('polygon-scale-point-y') as HTMLInputElement;
              if (scalePointXInput) scalePointXInput.value = Math.round(centerX).toString();
              if (scalePointYInput) scalePointYInput.value = Math.round(centerY).toString();
              
              this.uiController.updatePolygonScalePointDisplay(this.polygonScalePoint);
            }
          }
          this.uiController.hideRotateCubePanel();
        } else if (shape && shape.getType() !== 'brush') {
          this.uiController.hideAllPanels();
          document.getElementById('edit-shape-panel')?.classList.remove('hidden');
          this.uiController.updateEditPanel();
          this.uiController.hideRotateCubePanel();
        } else {
          this.uiController.hideAllPanels();
          this.uiController.hideRotateCubePanel();
          this.statusText.textContent = `Selected ${shape?.getType?.()} (cannot edit)`;
        }
      } else {
        this.uiController.hideAllPanels();
        this.uiController.hideRotateCubePanel();
        this.statusText.textContent = 'No shape selected';
        this.drawingManager.redraw();
      }
    } else if (currentTool === 'bezier') {
      // Check if there's already a selected bezier curve
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'bezier') {
        // Add point to existing curve by clicking on canvas
        const bezier = selectedShape as BezierCurve;
        bezier.controlPoints.push({ x: pos.x, y: pos.y });
        bezier.selectedPointIndex = -1;
        this.selectedControlPointIndex = -1;
        this.drawingManager.redraw();
        this.uiController.updateBezierPanel(bezier, -1);
        const degree = bezier.controlPoints.length - 1;
        this.statusText.textContent = `Added point P${bezier.controlPoints.length - 1}. Degree: ${degree}`;
      } else {
        // Inform user to use the panel to create a new curve
        this.statusText.textContent = 'Use the Bezier panel to create a new curve with specified degree and coordinates';
      }
    } else if (currentTool === 'polygon') {
      // Add vertex to polygon
      this.currentPolygonVertices.push({ x: pos.x, y: pos.y });
      this.isCreatingPolygon = true;
      
      // Update preview counter
      this.uiController.updatePolygonVertexCount(this.currentPolygonVertices.length);
      
      // Draw preview
      this.drawPolygonPreview();
      
      this.statusText.textContent = `Vertex ${this.currentPolygonVertices.length} added. Click to add more, press Enter or double-click to finish (min 3 vertices)`;
    } else {
      document.getElementById('draw-params-panel')?.classList.add('hidden');
      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      if (currentTool === 'brush') this.currentBrushPoints = [{x: pos.x, y: pos.y}];
    }
  }
  
  private handleMouseMove(e: MouseEvent): void {
    const world = this.getWorldFromEvent(e);
    this.cursorPosition.textContent = `${Math.round(world.x)}, ${Math.round(world.y)}`;

    if (this.isPanning) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      const deltaClientX = e.clientX - this.lastPanX;
      const deltaClientY = e.clientY - this.lastPanY;

      const zoom = this.drawingManager.getZoom();
      this.drawingManager.pan((deltaClientX * scaleX) / zoom, (deltaClientY * scaleY) / zoom);

      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      e.preventDefault();
      return;
    }

    const zoomPanel = document.getElementById('zoom-panel');
    if (zoomPanel && !zoomPanel.classList.contains('hidden')) {
      const zoomLevel = this.drawingManager.getZoom();
      if (zoomLevel >= 5) {
        const canvasPx = this.getCanvasPixelFromEvent(e);
        const x = Math.max(0, Math.min(this.canvas.width - 1, Math.round(canvasPx.x)));
        const y = Math.max(0, Math.min(this.canvas.height - 1, Math.round(canvasPx.y)));
        const pixelData = this.ctx.getImageData(x, y, 1, 1).data;
        this.uiController.updatePixelValues(pixelData[0], pixelData[1], pixelData[2]);
      }
    }

    const currentTool = this.toolManager.getCurrentTool();
    if (!currentTool) return;

    // Handle polygon scaling with mouse
    if (this.isScalingPolygon && this.isDrawing && this.polygonScalePoint) {
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'polygon') {
        // Calculate current distance from scale point to mouse
        const dx = world.x - this.polygonScalePoint.x;
        const dy = world.y - this.polygonScalePoint.y;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate scale factor based on distance change
        const scaleFactor = currentDistance / this.scaleStartDistance;
        
        // Apply scaling (uniform scaling)
        const polygon = selectedShape as Polygon;
        polygon.scale(scaleFactor, scaleFactor, this.polygonScalePoint.x, this.polygonScalePoint.y);
        
        // Update start distance for next frame
        this.scaleStartDistance = currentDistance;
        
        this.drawingManager.redraw();
        this.drawScalePoint();
        this.statusText.textContent = `Scaling: ${scaleFactor.toFixed(2)}x`;
        return;
      }
    }

    // Handle polygon rotation with mouse
    if (this.isRotatingPolygon && this.isDrawing && this.polygonPivotPoint) {
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'polygon') {
        // Calculate current angle from pivot to mouse
        const dx = world.x - this.polygonPivotPoint.x;
        const dy = world.y - this.polygonPivotPoint.y;
        const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Calculate angle difference
        const angleDelta = currentAngle - this.rotationStartAngle;
        
        // Apply rotation
        const polygon = selectedShape as Polygon;
        polygon.rotate(angleDelta, this.polygonPivotPoint.x, this.polygonPivotPoint.y);
        
        // Update start angle for next frame
        this.rotationStartAngle = currentAngle;
        
        this.drawingManager.redraw();
        this.drawPivotPoint();
        this.statusText.textContent = `Rotating: ${Math.round(angleDelta)}° (total rotation applied)`;
        return;
      }
    }

    // Handle Bezier control point dragging
    if (this.draggedControlPointIndex >= 0 && this.isDrawing && currentTool === 'select') {
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'bezier') {
        const bezier = selectedShape as BezierCurve;
        bezier.updateControlPoint(this.draggedControlPointIndex, world.x, world.y);
        this.drawingManager.redraw();
        this.uiController.updateBezierPanel(bezier, this.selectedControlPointIndex);
        return;
      }
    }

    if (this.isDragging && currentTool === 'select') {
      this.canvas.style.cursor = 'move';
      const deltaX = world.x - this.dragStartX;
      const deltaY = world.y - this.dragStartY;
      // Przesuwanie kostki RGB
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'rgbcube') {
        selectedShape.move(deltaX, deltaY);
        this.uiController.showRotateCubePanel(selectedShape);
      } else {
        this.drawingManager.moveSelectedShape(deltaX, deltaY);
        if (!document.getElementById('edit-shape-panel')?.classList.contains('hidden')) {
          this.uiController.updateEditPanel();
        }
        this.uiController.hideRotateCubePanel();
      }
      this.dragStartX = world.x;
      this.dragStartY = world.y;
      this.drawingManager.redraw();
      
      // Redraw pivot and scale points if we're moving a polygon
      const currentShape = this.drawingManager.getSelectedShape();
      if (currentShape && currentShape.getType() === 'polygon') {
        if (this.polygonPivotPoint) {
          this.drawPivotPoint();
        }
        if (this.polygonScalePoint) {
          this.drawScalePoint();
        }
      }
      return;
    }
    
    // Update cursor based on modifiers and context
    if (currentTool === 'select') {
      const selectedShape = this.drawingManager.getSelectedShape();
      
      // Alt over polygon with scale point = scale cursor
      if (e.altKey && selectedShape && selectedShape.getType() === 'polygon' && this.polygonScalePoint) {
        this.canvas.style.cursor = 'nwse-resize';
      }
      // Ctrl over polygon with pivot = rotate cursor
      else if (e.ctrlKey && selectedShape && selectedShape.getType() === 'polygon' && this.polygonPivotPoint) {
        this.canvas.style.cursor = 'grab';
      }
      // Pan cursor (Shift)
      else if (e.shiftKey) {
        this.canvas.style.cursor = 'grab';
      }
      // Default select cursor
      else {
        this.canvas.style.cursor = this.drawingManager.isShapeAt(world.x, world.y) ? 'pointer' : 'default';
      }
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
    
    if (this.isDrawing) {
      this.drawingManager.redraw();

      const { x: panX, y: panY } = this.drawingManager.getPan();
      const zoom = this.drawingManager.getZoom();

      this.ctx.save();
      this.ctx.translate(panX, panY);
      this.ctx.scale(zoom, zoom);

      const currentColor = this.uiController.getCurrentColor();
      this.ctx.strokeStyle = currentColor;
      this.ctx.lineWidth = 2 / zoom; 
      this.ctx.lineCap = 'round';

      if (currentTool === 'brush') {
        const pts = [...this.currentBrushPoints, world];
        if (pts.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            this.ctx.lineTo(pts[i].x, pts[i].y);
          }
          this.ctx.stroke();
        }
      } else if (currentTool === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(world.x, world.y);
        this.ctx.stroke();
      } else if (currentTool === 'rectangle') {
        const w = world.x - this.startX;
        const h = world.y - this.startY;
        this.ctx.strokeRect(this.startX, this.startY, w, h);
      } else if (currentTool === 'circle') {
        const radius = Math.hypot(world.x - this.startX, world.y - this.startY);
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      } else if (currentTool === 'rgbcube') {
        const size = Math.max(Math.abs(world.x - this.startX), Math.abs(world.y - this.startY), 50);
        this.previewCube = new RGBCube(this.startX, this.startY, size);
        this.drawingManager.redraw();
        this.previewCube.draw(this.ctx);
        this.statusText.textContent = `Podgląd kostki RGB: rozmiar ${Math.round(size)}px`;
      }

      this.ctx.restore();

      if (currentTool === 'brush') {
        this.currentBrushPoints.push({ x: world.x, y: world.y });
      }
    }
  }
  
  private handleMouseUp(e: MouseEvent): void {
    const currentTool = this.toolManager.getCurrentTool();
    if (!currentTool) return;

    // Handle polygon scaling end
    if (this.isScalingPolygon) {
      this.isScalingPolygon = false;
      this.isDrawing = false;
      this.canvas.style.cursor = 'default';
      this.statusText.textContent = 'Scaling complete';
      return;
    }

    // Handle polygon rotation end
    if (this.isRotatingPolygon) {
      this.isRotatingPolygon = false;
      this.isDrawing = false;
      this.canvas.style.cursor = 'default';
      this.statusText.textContent = 'Rotation complete';
      return;
    }

    if (this.isPanning) {
      this.isPanning = false;
      const pos = this.getWorldFromEvent(e);
      if (currentTool === 'select') {
        this.canvas.style.cursor = this.drawingManager.isShapeAt(pos.x, pos.y) ? 'pointer' : 'default';
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
      e.preventDefault();
      return;
    }
    
    // Reset Bezier control point dragging
    if (this.draggedControlPointIndex >= 0) {
      const pointIndex = this.draggedControlPointIndex;
      this.draggedControlPointIndex = -1;
      this.isDrawing = false;
      this.statusText.textContent = `Control point P${pointIndex} moved (still selected)`;
      return;
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.isDrawing = false;
      this.statusText.textContent = 'Tool: Select';
      const pos = this.getWorldFromEvent(e);
      this.canvas.style.cursor = this.drawingManager.isShapeAt(pos.x, pos.y) ? 'pointer' : 'default';
      return;
    }

    if (this.isDrawing) {
      const pos = this.getWorldFromEvent(e);
      const currentColor = this.uiController.getCurrentColor();
      if (currentTool === 'rgbcube' && this.previewCube) {
        this.previewCube.color = currentColor;
        this.drawingManager.addShape(this.previewCube);
        this.statusText.textContent = 'Kostka RGB została dodana.';
        this.previewCube = null;
      } else if (currentTool === 'brush' && this.currentBrushPoints.length > 0) {
        const brush = new Brush(this.currentBrushPoints[0].x, this.currentBrushPoints[0].y);
        brush.color = currentColor;
        for (let i = 1; i < this.currentBrushPoints.length; i++) {
          brush.addPoint(this.currentBrushPoints[i].x, this.currentBrushPoints[i].y);
        }
        this.drawingManager.addShape(brush);
        this.currentBrushPoints = [];
      } else if (currentTool !== 'brush' && currentTool !== 'select') {
        const shape = ShapeFactory.createShape(currentTool as ShapeType, this.startX, this.startY, pos.x, pos.y);
        shape.color = currentColor;
        this.drawingManager.addShape(shape);
      }
      
      this.drawingManager.redraw();
      this.isDrawing = false;
    }
  }

  public createBezierFromPanel(degree: number, startX: number, startY: number): void {
    const numPoints = degree + 1; // degree n requires n+1 control points
    const points = [];
    
    // Create points horizontally from the start point
    const horizontalSpacing = 50; // pixels between points
    for (let i = 0; i < numPoints; i++) {
      const x = startX + i * horizontalSpacing;
      const y = startY;
      points.push({ x, y });
    }
    
    const currentColor = this.uiController.getCurrentColor();
    const bezier = new BezierCurve(points, currentColor);
    this.drawingManager.addShape(bezier);
    this.drawingManager.selectShapeAt(startX, startY);
    
    // Show edit section, hide create section
    const createSection = document.getElementById('bezier-create-section');
    const editSection = document.getElementById('bezier-edit-section');
    if (createSection) createSection.classList.add('hidden');
    if (editSection) editSection.classList.remove('hidden');
    
    this.uiController.updateBezierPanel(bezier, -1);
    this.statusText.textContent = `Created Bézier curve of degree ${degree} with ${numPoints} control points`;
  }

  public addBezierPoint(): void {
    const bezierPanel = document.getElementById('bezier-panel');
    if (bezierPanel && !bezierPanel.classList.contains('hidden')) {
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'bezier') {
        const bezier = selectedShape as BezierCurve;
        // Add a new point at the end
        const lastPoint = bezier.controlPoints[bezier.controlPoints.length - 1];
        bezier.controlPoints.push({ x: lastPoint.x + 50, y: lastPoint.y });
        this.selectedControlPointIndex = -1;
        bezier.selectedPointIndex = -1;
        this.drawingManager.redraw();
        this.uiController.updateBezierPanel(bezier, -1);
      }
    }
  }

  public removeSelectedBezierPoint(): void {
    const bezierPanel = document.getElementById('bezier-panel');
    if (bezierPanel && !bezierPanel.classList.contains('hidden')) {
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'bezier') {
        const bezier = selectedShape as BezierCurve;
        if (this.selectedControlPointIndex >= 0 && bezier.controlPoints.length > 2) {
          bezier.controlPoints.splice(this.selectedControlPointIndex, 1);
          this.selectedControlPointIndex = -1;
          bezier.selectedPointIndex = -1;
          this.drawingManager.redraw();
          this.uiController.updateBezierPanel(bezier, -1);
          this.statusText.textContent = 'Control point removed';
        } else if (this.selectedControlPointIndex < 0) {
          this.statusText.textContent = 'Please select a control point first';
        } else {
          this.statusText.textContent = 'Cannot remove point - minimum 2 points required';
        }
      }
    }
  }

  public removeBezierPoint(): void {
    const bezierPanel = document.getElementById('bezier-panel');
    if (bezierPanel && !bezierPanel.classList.contains('hidden')) {
      const selectedShape = this.drawingManager.getSelectedShape();
      if (selectedShape && selectedShape.getType() === 'bezier') {
        const bezier = selectedShape as BezierCurve;
        if (bezier.controlPoints.length > 2) {
          bezier.controlPoints.pop();
          this.selectedControlPointIndex = -1;
          bezier.selectedPointIndex = -1;
          this.drawingManager.redraw();
          this.uiController.updateBezierPanel(bezier, -1);
        }
      }
    }
  }

  private handleMouseLeave(): void {
    this.isDrawing = false;
    this.isDragging = false;
    this.isPanning = false;
    this.canvas.style.cursor = 'default';
    this.currentBrushPoints = [];
    this.cursorPosition.textContent = '0, 0';

    if (this.previewAnimationFrame) {
      cancelAnimationFrame(this.previewAnimationFrame);
      this.previewAnimationFrame = null;
    }
    this.previewCube = null;
  }

  // Polygon methods
  private handleDoubleClick(_e: MouseEvent): void {
    const currentTool = this.toolManager.getCurrentTool();
    if (currentTool === 'polygon' && this.isCreatingPolygon) {
      this.finishPolygon();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const currentTool = this.toolManager.getCurrentTool();
    if (currentTool === 'polygon' && this.isCreatingPolygon) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.finishPolygon();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.removeLastPolygonVertex();
      }
    }
  }

  private drawPolygonPreview(): void {
    if (this.currentPolygonVertices.length < 1) return;
    
    this.drawingManager.redraw();
    
    // Draw preview lines connecting vertices
    this.ctx.save();
    this.ctx.strokeStyle = '#0000ff';
    this.ctx.fillStyle = '#ff0000';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.currentPolygonVertices[0].x, this.currentPolygonVertices[0].y);
    
    for (let i = 1; i < this.currentPolygonVertices.length; i++) {
      this.ctx.lineTo(this.currentPolygonVertices[i].x, this.currentPolygonVertices[i].y);
    }
    
    this.ctx.stroke();
    
    // Draw vertices
    this.currentPolygonVertices.forEach(vertex => {
      this.ctx.beginPath();
      this.ctx.arc(vertex.x, vertex.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    });
    
    this.ctx.restore();
  }

  private finishPolygon(): void {
    if (this.currentPolygonVertices.length < 3) {
      this.statusText.textContent = 'A polygon must have at least 3 vertices. Add more points or use the panel.';
      return;
    }
    
    // Get fill checkbox state
    const filledCheckbox = document.getElementById('polygon-filled-checkbox') as HTMLInputElement;
    const filled = filledCheckbox ? filledCheckbox.checked : false;
    
    // Create polygon shape
    const currentColor = this.uiController.getCurrentColor();
    const polygon = ShapeFactory.createPolygon(this.currentPolygonVertices, currentColor, filled);
    
    this.drawingManager.addShape(polygon);
    // Select the polygon by clicking on first vertex
    this.drawingManager.selectShapeAt(this.currentPolygonVertices[0].x, this.currentPolygonVertices[0].y);
    
    // Reset state
    this.currentPolygonVertices = [];
    this.isCreatingPolygon = false;
    
    // Update vertex counter
    this.uiController.updatePolygonVertexCount(0);
    
    // Switch to edit mode
    const createSection = document.getElementById('polygon-create-section');
    const editSection = document.getElementById('polygon-edit-section');
    const transformSection = document.getElementById('polygon-transform-section');
    
    if (createSection) createSection.classList.add('hidden');
    if (editSection) editSection.classList.remove('hidden');
    if (transformSection) transformSection.classList.remove('hidden');
    
    // Update polygon panel will be implemented in UIController
    // this.uiController.updatePolygonPanel();
    
    this.statusText.textContent = `Polygon created with ${polygon.vertices.length} vertices`;
    this.drawingManager.redraw();
    
    // Draw pivot point if set
    if (this.polygonPivotPoint) {
      this.drawPivotPoint();
    }
  }

  public cancelPolygon(): void {
    this.currentPolygonVertices = [];
    this.isCreatingPolygon = false;
    this.polygonPivotPoint = null;
    
    this.uiController.updatePolygonVertexCount(0);
    
    this.canvas.style.cursor = 'default';
    this.statusText.textContent = 'Polygon creation cancelled';
    this.drawingManager.redraw();
  }

  public addPolygonVertexFromPanel(x: number, y: number): void {
    this.currentPolygonVertices.push({ x, y });
    this.isCreatingPolygon = true;
    
    // Update preview counter
    this.uiController.updatePolygonVertexCount(this.currentPolygonVertices.length);
    
    // Draw preview
    this.drawPolygonPreview();
    
    this.statusText.textContent = `Vertex ${this.currentPolygonVertices.length} added from panel. Click to add more, press Enter or double-click to finish (min 3 vertices)`;
  }

  public finishPolygonFromPanel(): void {
    this.finishPolygon();
  }

  public removeLastPolygonVertex(): void {
    if (this.currentPolygonVertices.length > 0) {
      this.currentPolygonVertices.pop();
      
      // Update preview counter
      this.uiController.updatePolygonVertexCount(this.currentPolygonVertices.length);
      
      // Redraw preview
      this.drawPolygonPreview();
      
      this.statusText.textContent = `Removed last vertex. Current vertices: ${this.currentPolygonVertices.length}`;
    } else {
      this.statusText.textContent = 'No vertices to remove';
    }
  }

  public translateSelectedPolygon(dx: number, dy: number): void {
    const selectedShape = this.drawingManager.getSelectedShape();
    if (selectedShape && selectedShape.getType() === 'polygon') {
      // Use the Polygon's translate method (homogeneous coordinates)
      const polygon = selectedShape as Polygon;
      polygon.translate(dx, dy);
      
      this.drawingManager.redraw();
      this.statusText.textContent = `Polygon translated by (${dx}, ${dy}) using homogeneous coordinates`;
      
      // Reset translation inputs
      const dxInput = document.getElementById('polygon-translate-dx') as HTMLInputElement;
      const dyInput = document.getElementById('polygon-translate-dy') as HTMLInputElement;
      if (dxInput) dxInput.value = '0';
      if (dyInput) dyInput.value = '0';
    } else {
      this.statusText.textContent = 'No polygon selected';
    }
  }

  public setPivotFromInput(x: number, y: number): void {
    const selectedShape = this.drawingManager.getSelectedShape();
    if (selectedShape && selectedShape.getType() === 'polygon') {
      this.polygonPivotPoint = { x, y };
      this.uiController.updatePolygonPivotDisplay(this.polygonPivotPoint);
      this.drawingManager.redraw();
      this.drawPivotPoint();
      this.statusText.textContent = `Pivot point set to (${Math.round(x)}, ${Math.round(y)})`;
    } else {
      this.statusText.textContent = 'No polygon selected';
    }
  }

  public rotateSelectedPolygon(angle: number): void {
    const selectedShape = this.drawingManager.getSelectedShape();
    if (!selectedShape || selectedShape.getType() !== 'polygon') {
      this.statusText.textContent = 'No polygon selected';
      return;
    }

    if (!this.polygonPivotPoint) {
      this.statusText.textContent = 'Please set a pivot point first';
      return;
    }

    const polygon = selectedShape as Polygon;
    polygon.rotate(angle, this.polygonPivotPoint.x, this.polygonPivotPoint.y);
    
    this.drawingManager.redraw();
    this.drawPivotPoint();
    this.statusText.textContent = `Polygon rotated by ${angle}° around pivot (${Math.round(this.polygonPivotPoint.x)}, ${Math.round(this.polygonPivotPoint.y)})`;
    
    // Reset angle input
    const angleInput = document.getElementById('polygon-rotate-angle') as HTMLInputElement;
    if (angleInput) angleInput.value = '0';
  }

  public setScalePointFromInput(x: number, y: number): void {
    const selectedShape = this.drawingManager.getSelectedShape();
    if (selectedShape && selectedShape.getType() === 'polygon') {
      this.polygonScalePoint = { x, y };
      this.uiController.updatePolygonScalePointDisplay(this.polygonScalePoint);
      this.drawingManager.redraw();
      this.drawScalePoint();
      this.statusText.textContent = `Scale point set to (${Math.round(x)}, ${Math.round(y)})`;
    } else {
      this.statusText.textContent = 'No polygon selected';
    }
  }

  public scaleSelectedPolygon(sx: number, sy: number): void {
    const selectedShape = this.drawingManager.getSelectedShape();
    if (!selectedShape || selectedShape.getType() !== 'polygon') {
      this.statusText.textContent = 'No polygon selected';
      return;
    }

    if (!this.polygonScalePoint) {
      this.statusText.textContent = 'Please set a scale point first';
      return;
    }

    const polygon = selectedShape as Polygon;
    polygon.scale(sx, sy, this.polygonScalePoint.x, this.polygonScalePoint.y);
    
    this.drawingManager.redraw();
    this.drawScalePoint();
    this.statusText.textContent = `Polygon scaled by (${sx}, ${sy}) around point (${Math.round(this.polygonScalePoint.x)}, ${Math.round(this.polygonScalePoint.y)})`;
    
    // Reset scale inputs
    const sxInput = document.getElementById('polygon-scale-sx') as HTMLInputElement;
    const syInput = document.getElementById('polygon-scale-sy') as HTMLInputElement;
    if (sxInput) sxInput.value = '1';
    if (syInput) syInput.value = '1';
  }

  private drawPivotPoint(): void {
    if (!this.polygonPivotPoint) return;

    this.ctx.save();
    const { x: panX, y: panY } = this.drawingManager.getPan();
    const zoom = this.drawingManager.getZoom();
    this.ctx.translate(panX, panY);
    this.ctx.scale(zoom, zoom);

    // Draw crosshair for pivot point
    const size = 10;
    this.ctx.strokeStyle = '#ff00ff'; // Magenta
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    // Horizontal line
    this.ctx.moveTo(this.polygonPivotPoint.x - size, this.polygonPivotPoint.y);
    this.ctx.lineTo(this.polygonPivotPoint.x + size, this.polygonPivotPoint.y);
    // Vertical line
    this.ctx.moveTo(this.polygonPivotPoint.x, this.polygonPivotPoint.y - size);
    this.ctx.lineTo(this.polygonPivotPoint.x, this.polygonPivotPoint.y + size);
    this.ctx.stroke();

    // Draw circle around pivot
    this.ctx.beginPath();
    this.ctx.arc(this.polygonPivotPoint.x, this.polygonPivotPoint.y, 5, 0, 2 * Math.PI);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawScalePoint(): void {
    if (!this.polygonScalePoint) return;

    this.ctx.save();
    const { x: panX, y: panY } = this.drawingManager.getPan();
    const zoom = this.drawingManager.getZoom();
    this.ctx.translate(panX, panY);
    this.ctx.scale(zoom, zoom);

    // Draw square for scale point (different from pivot crosshair)
    const size = 8;
    this.ctx.strokeStyle = '#00ff00'; // Green
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    // Draw square
    this.ctx.rect(
      this.polygonScalePoint.x - size / 2,
      this.polygonScalePoint.y - size / 2,
      size,
      size
    );
    this.ctx.stroke();

    // Draw diagonal lines inside square
    this.ctx.beginPath();
    this.ctx.moveTo(this.polygonScalePoint.x - size / 2, this.polygonScalePoint.y - size / 2);
    this.ctx.lineTo(this.polygonScalePoint.x + size / 2, this.polygonScalePoint.y + size / 2);
    this.ctx.moveTo(this.polygonScalePoint.x + size / 2, this.polygonScalePoint.y - size / 2);
    this.ctx.lineTo(this.polygonScalePoint.x - size / 2, this.polygonScalePoint.y + size / 2);
    this.ctx.stroke();

    this.ctx.restore();
  }
}