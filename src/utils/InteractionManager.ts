// Imports
import { DrawingManager } from './DrawingManager';
import { ToolManager } from './ToolManager';
import { UIController } from './UIController';
import { type ShapeType, ShapeFactory, Brush } from './shapes/Import';

// Interaction Manager class
export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drawingManager: DrawingManager;
  private toolManager: ToolManager;
  private uiController: UIController;
  private statusText: HTMLElement;
  private cursorPosition: HTMLElement;
  
  // State
  private isDrawing = false;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private savedImageData: ImageData | null = null;
  private currentBrushPoints: { x: number; y: number }[] = [];
  
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
  
  // Initialize mouse events
  private initializeEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
  }
  
  // Get mouse position
  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
  
  // Mouse event handlers
  private handleMouseDown(e: MouseEvent): void {
    const currentTool = this.toolManager.getCurrentTool();
    if (!currentTool) return;
    
    const pos = this.getMousePos(e);
    
    if (currentTool === 'select') {
      const wasSelected = this.drawingManager.selectShapeAt(pos.x, pos.y);
      
      if (wasSelected) {
        const shape = this.drawingManager.getSelectedShape()!;
        this.isDragging = true;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.statusText.textContent = `Selected ${shape.getType()}`;
        this.drawingManager.redraw();
        
        if (shape.getType() !== 'brush') {
          this.uiController.hideAllPanels();
          document.getElementById('edit-shape-panel')?.classList.remove('hidden');
          this.uiController.updateEditPanel();
        } else {
          this.uiController.hideAllPanels();
          this.statusText.textContent = `Selected ${shape.getType()} (cannot edit)`;
        }
      } else {
        this.uiController.hideAllPanels();
        this.statusText.textContent = 'No shape selected';
        this.drawingManager.redraw();
      }
    } else {
      document.getElementById('draw-params-panel')?.classList.add('hidden');
      this.isDrawing = true;
      this.startX = pos.x;
      this.startY = pos.y;
      this.savedImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      if (currentTool === 'brush') this.currentBrushPoints = [{x: pos.x, y: pos.y}];
    }
  }
  
  // Mouse move handler
  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    this.cursorPosition.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}`;
    
    const currentTool = this.toolManager.getCurrentTool();
    if (!currentTool) return;
    
    if (this.isDragging && currentTool === 'select') {
      const deltaX = pos.x - this.dragStartX;
      const deltaY = pos.y - this.dragStartY;
      this.drawingManager.moveSelectedShape(deltaX, deltaY);
      this.dragStartX = pos.x;
      this.dragStartY = pos.y;
      this.drawingManager.redraw();
      
      if (!document.getElementById('edit-shape-panel')?.classList.contains('hidden')) {
        this.uiController.updateEditPanel();
      }
    }
    
    if (this.isDrawing && this.savedImageData) {
      this.ctx.putImageData(this.savedImageData, 0, 0);
      
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      
      if (currentTool === 'brush') {
        this.currentBrushPoints.push(pos);
        this.ctx.beginPath();
        this.ctx.lineCap = 'round';
        this.ctx.moveTo(this.currentBrushPoints[0].x, this.currentBrushPoints[0].y);
        this.currentBrushPoints.forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.stroke();
      } else if (currentTool === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      } else if (currentTool === 'rectangle') {
        this.ctx.strokeRect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt((pos.x - this.startX) ** 2 + (pos.y - this.startY) ** 2);
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      }
    }
  }
  
  // Mouse up handler
  private handleMouseUp(e: MouseEvent): void {
    const currentTool = this.toolManager.getCurrentTool();
    if (!currentTool) return;
    
    if (this.isDragging && currentTool === 'select') {
      this.isDragging = false;
      this.statusText.textContent = 'Tool: Select';
    } else if (this.isDrawing) {
      const pos = this.getMousePos(e);
      
      if (currentTool === 'brush' && this.currentBrushPoints.length > 0) {
        const brush = new Brush(this.currentBrushPoints[0].x, this.currentBrushPoints[0].y);
        for (let i = 1; i < this.currentBrushPoints.length; i++) {
          brush.addPoint(this.currentBrushPoints[i].x, this.currentBrushPoints[i].y);
        }
        this.drawingManager.addShape(brush);
        this.currentBrushPoints = [];
      } else if (currentTool !== 'brush' && currentTool !== 'select') {
        this.drawingManager.addShape(
          ShapeFactory.createShape(currentTool as ShapeType, this.startX, this.startY, pos.x, pos.y)
        );
      }
      
      this.drawingManager.redraw();
      this.isDrawing = false;
      this.savedImageData = null;
    }
  }
  
  private handleMouseLeave(): void {
    this.isDrawing = false;
    this.isDragging = false;
    this.savedImageData = null;
    this.currentBrushPoints = [];
    this.cursorPosition.textContent = '0, 0';
  }
}