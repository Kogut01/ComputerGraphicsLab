import { type Tool, DrawingManager } from './DrawingManager';
import { CanvasManager } from './BaseCanvas';

export class ToolManager {
  private currentTool: Tool | null = null;
  private toolButtons: Record<Tool, HTMLButtonElement>;
  private statusText: HTMLElement;
  private drawingManager: DrawingManager;
  private canvasManager: CanvasManager;
  
  constructor(
    toolButtons: Record<Tool, HTMLButtonElement>,
    statusText: HTMLElement,
    drawingManager: DrawingManager,
    canvasManager: CanvasManager
  ) {
    this.toolButtons = toolButtons;
    this.statusText = statusText;
    this.drawingManager = drawingManager;
    this.canvasManager = canvasManager;
    this.initializeButtons();
  }

  private initializeButtons(): void {
    Object.entries(this.toolButtons).forEach(([tool, btn]) => {
      btn.addEventListener('click', () => this.selectTool(tool as Tool));
    });
  }

  selectTool(tool: Tool): void {
    this.currentTool = tool;
    this.drawingManager.clearSelection();
    this.drawingManager.redraw();
    
    Object.values(this.toolButtons).forEach(btn => btn.classList.remove('xp-button-tool-active'));
    this.toolButtons[tool].classList.add('xp-button-tool-active');
    
    this.statusText.textContent = `Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`;
    this.canvasManager.setCursor(tool === 'select' ? 'pointer' : 'crosshair');
  }
  
  getCurrentTool(): Tool | null {
    return this.currentTool;
  }
}