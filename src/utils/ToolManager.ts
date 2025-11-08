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
    
    // Show Bezier panel when Bezier tool is selected
    if (tool === 'bezier') {
      // Hide all other panels
      document.querySelectorAll('[id$="-panel"]').forEach(panel => {
        panel.classList.add('hidden');
      });
      
      // Show Bezier panel with create section
      const bezierPanel = document.getElementById('bezier-panel');
      const createSection = document.getElementById('bezier-create-section');
      const editSection = document.getElementById('bezier-edit-section');
      
      if (bezierPanel) bezierPanel.classList.remove('hidden');
      if (createSection) createSection.classList.remove('hidden');
      if (editSection) editSection.classList.add('hidden');
    }

    // Show Polygon panel when Polygon tool is selected
    if (tool === 'polygon') {
      // Hide all other panels
      document.querySelectorAll('[id$="-panel"]').forEach(panel => {
        panel.classList.add('hidden');
      });
      
      // Show Polygon panel with create section
      const polygonPanel = document.getElementById('polygon-panel');
      const createSection = document.getElementById('polygon-create-section');
      const editSection = document.getElementById('polygon-edit-section');
      const transformSection = document.getElementById('polygon-transform-section');
      
      if (polygonPanel) polygonPanel.classList.remove('hidden');
      if (createSection) createSection.classList.remove('hidden');
      if (editSection) editSection.classList.add('hidden');
      if (transformSection) transformSection.classList.add('hidden');
    }
  }
  
  getCurrentTool(): Tool | null {
    return this.currentTool;
  }
}