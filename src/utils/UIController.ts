// Imports
import { DrawingManager } from './DrawingManager';
import { Line, Rectangle, Circle } from './shapes/Import';

// UI Controller class
export class UIController {
  private panels: {
    drawParams: HTMLElement;
    file: HTMLElement;
    editShape: HTMLElement;
  };
  private drawingManager: DrawingManager;
  private statusText: HTMLElement;
  
  constructor(
    panels: { drawParams: HTMLElement; file: HTMLElement; editShape: HTMLElement },
    drawingManager: DrawingManager,
    statusText: HTMLElement
  ) {
    this.panels = panels;
    this.drawingManager = drawingManager;
    this.statusText = statusText;
    this.initializePanelButtons();
  }
  
  // Initialize panel buttons
  private initializePanelButtons(): void {
    document.getElementById('draw-params-btn')?.addEventListener('click', () => {
      this.panels.drawParams.classList.toggle('hidden');
      this.panels.file.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
    });
    
    document.getElementById('close-params-btn')?.addEventListener('click', () => {
      this.panels.drawParams.classList.add('hidden');
    });
    
    document.getElementById('file-btn')?.addEventListener('click', () => {
      this.panels.file.classList.toggle('hidden');
      this.panels.drawParams.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
    });
    
    document.getElementById('close-file-btn')?.addEventListener('click', () => {
      this.panels.file.classList.add('hidden');
    });
    
    document.getElementById('close-edit-btn')?.addEventListener('click', () => {
      this.panels.editShape.classList.add('hidden');
      this.drawingManager.clearSelection();
      this.drawingManager.redraw();
    });
    
    document.getElementById('draw-shape-btn')?.addEventListener('click', () => this.handleDrawShapeFromParams());
    document.getElementById('update-shape-btn')?.addEventListener('click', () => this.handleUpdateShapeFromParams());
    
    document.getElementById('save-file-btn')?.addEventListener('click', () => this.handleSaveFile());
    document.getElementById('load-file-btn')?.addEventListener('click', () => 
      document.getElementById('file-input')?.click());
      
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.addEventListener('change', (e) => this.handleLoadFile(e));
  }
  
  // Hide all panels
  hideAllPanels(): void {
    Object.values(this.panels).forEach(panel => panel.classList.add('hidden'));
  }
  
  // Update edit panel
  updateEditPanel(): void {
    const shape = this.drawingManager.getSelectedShape();
    if (!shape) return;

    const shapeTypeSpan = document.getElementById('edit-shape-type') as HTMLSpanElement;
    const inputs = {
      x1: document.getElementById('edit-x1') as HTMLInputElement,
      y1: document.getElementById('edit-y1') as HTMLInputElement,
      x2: document.getElementById('edit-x2') as HTMLInputElement,
      y2: document.getElementById('edit-y2') as HTMLInputElement,
    };

    const type = shape.getType();
    shapeTypeSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1);

    if (type === 'line') {
      const line = shape as Line;
      inputs.x1.value = Math.round(line.x1).toString();
      inputs.y1.value = Math.round(line.y1).toString();
      inputs.x2.value = Math.round(line.x2).toString();
      inputs.y2.value = Math.round(line.y2).toString();
    } else if (type === 'rectangle') {
      const rect = shape as Rectangle;
      inputs.x1.value = Math.round(rect.x1).toString();
      inputs.y1.value = Math.round(rect.y1).toString();
      inputs.x2.value = Math.round(rect.x1 + rect.width).toString();
      inputs.y2.value = Math.round(rect.y1 + rect.height).toString();
    } else if (type === 'circle') {
      const circle = shape as Circle;
      inputs.x1.value = Math.round(circle.x1).toString();
      inputs.y1.value = Math.round(circle.y1).toString();
      inputs.x2.value = Math.round(circle.x1 + circle.radius).toString();
      inputs.y2.value = Math.round(circle.y1).toString();
    }
  }
  
  // Handle drawing shape from parameters
  private handleDrawShapeFromParams(): void {
    const shapeType = (document.getElementById('param-shape') as HTMLSelectElement).value as any;
    const x1 = parseFloat((document.getElementById('param-x1') as HTMLInputElement).value) || 0;
    const y1 = parseFloat((document.getElementById('param-y1') as HTMLInputElement).value) || 0;
    const x2 = parseFloat((document.getElementById('param-x2') as HTMLInputElement).value) || 100;
    const y2 = parseFloat((document.getElementById('param-y2') as HTMLInputElement).value) || 100;

    this.drawingManager.addShape(this.drawingManager.createShape(shapeType, x1, y1, x2, y2));
    this.drawingManager.redraw();
    this.statusText.textContent = `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} drawn`;
  }
  
  // Handle updating shape from parameters
  private handleUpdateShapeFromParams(): void {
    const x1 = parseFloat((document.getElementById('edit-x1') as HTMLInputElement).value) || 0;
    const y1 = parseFloat((document.getElementById('edit-y1') as HTMLInputElement).value) || 0;
    const x2 = parseFloat((document.getElementById('edit-x2') as HTMLInputElement).value) || 100;
    const y2 = parseFloat((document.getElementById('edit-y2') as HTMLInputElement).value) || 100;

    if (this.drawingManager.updateSelectedShape(x1, y1, x2, y2)) {
      this.drawingManager.redraw();
      this.statusText.textContent = 'Shape updated';
    }
  }
  
  // Handle saving file
  private handleSaveFile(): void {
    const blob = new Blob([this.drawingManager.exportToJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.statusText.textContent = 'Drawing saved!';
  }
  
  // Handle loading file
  private handleLoadFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.drawingManager.importFromJSON(e.target?.result as string)) {
          this.statusText.textContent = `Loaded ${this.drawingManager.getShapes().length} shapes`;
        } else {
          this.statusText.textContent = 'Error loading file';
        }
      };
      reader.readAsText(file);
    }
  }
}