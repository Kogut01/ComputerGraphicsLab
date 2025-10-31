import { DrawingManager } from './DrawingManager';
import { ToolManager } from './ToolManager';
import { UIController } from './UIController';
import { type ShapeType, ShapeFactory, Brush, RGBCube } from './shapes/Import';

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
      const wasSelected = this.drawingManager.selectShapeAt(pos.x, pos.y);
      if (wasSelected) {
        const shape = this.drawingManager.getSelectedShape();
        this.isDragging = true;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.statusText.textContent = `Selected ${shape?.getType?.()}`;
        this.drawingManager.redraw();
        // Ukryj wszystkie panele po zaznaczeniu kostki RGB
        if (shape && shape.getType() === 'rgbcube') {
          this.uiController.hideAllPanels();
          this.uiController.showRotateCubePanel(shape);
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
      return;
    }
    
    if (e.shiftKey) {
      this.canvas.style.cursor = 'grab';
    } else if (currentTool === 'select') {
      this.canvas.style.cursor = this.drawingManager.isShapeAt(world.x, world.y) ? 'pointer' : 'default';
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
    
    if (this.isDragging) {
      this.isDragging = false;
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
}