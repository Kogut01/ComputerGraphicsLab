// Imports
import '../styles/00-main.css';
import '../components/BaseModal';
import '../components/BaseWindow';
import { CanvasManager } from '../utils/BaseCanvas';
import { showModal } from '../core/ModalManager';
import { handleStartPage, handleClearWorkspace } from '../core/NavigateControls';
import { initializeMobileDetection } from '../core/MobileDetection';
import { initializeWindowControls } from '../core/WindowControls';
import { DrawingManager } from '../utils/DrawingManager';
import { ToolManager } from '../utils/ToolManager';
import { UIController } from '../utils/UIController';
import { InteractionManager } from '../utils/InteractionManager';

// Initialize core components
initializeWindowControls();
initializeMobileDetection();

// Setup canvas
const canvasManager = new CanvasManager('canvas');
const canvas = canvasManager.getCanvas();
const ctx = canvasManager.getContext();
const drawingManager = new DrawingManager(ctx);

// UI Elements
const statusText = document.getElementById('status-text') as HTMLSpanElement;
const cursorPosition = document.getElementById('cursor-position') as HTMLSpanElement;

// Tool buttons
const toolButtons = {
  select: document.getElementById('tool-select') as HTMLButtonElement,
  brush: document.getElementById('tool-brush') as HTMLButtonElement,
  line: document.getElementById('tool-line') as HTMLButtonElement,
  rectangle: document.getElementById('tool-rectangle') as HTMLButtonElement,
  circle: document.getElementById('tool-circle') as HTMLButtonElement,
};

// Panels
const panels = {
  drawParams: document.getElementById('draw-params-panel') as HTMLDivElement,
  file: document.getElementById('file-panel') as HTMLDivElement,
  editShape: document.getElementById('edit-shape-panel') as HTMLDivElement,
  zoom: document.getElementById('zoom-panel') as HTMLDivElement,
};

// Initialize managers
const toolManager = new ToolManager(toolButtons, statusText, drawingManager, canvasManager);
const uiController = new UIController(panels, drawingManager, statusText);

// Interaction Manager
new InteractionManager(
  canvas, 
  ctx, 
  drawingManager, 
  toolManager, 
  uiController, 
  statusText, 
  cursorPosition
);

// Navigation
document.getElementById('clear-btn')?.addEventListener('click', () => {
  handleClearWorkspace(() => {
    drawingManager.clear();
    drawingManager.clearBackgroundImage();
    drawingManager.redraw();
    drawingManager.setZoom(1.0);
    drawingManager.resetPan();
    uiController.hideAllPanels();
    statusText.textContent = 'Workspace cleared';
  });
});

document.getElementById('start-page-btn')?.addEventListener('click', handleStartPage);

document.getElementById('help-btn')?.addEventListener('click', () => {
  showModal({
    title: 'Project - Help',
    content: `
      <div class="space-y-3 text-xs">
        <div>
          <p class="font-bold mb-1">🖱️ Tools:</p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li><strong>Select</strong> - Click and drag shapes to move them</li>
            <li><strong>Brush</strong> - Draw freehand lines</li>
            <li><strong>Line</strong> - Draw straight lines</li>
            <li><strong>Rectangle</strong> - Draw rectangles</li>
            <li><strong>Circle</strong> - Draw circles</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">📐 Draw Parameters:</p>
          <ul class="list-disc list-inside ml-2">
            <li>Enter exact coordinates to draw shapes</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">✏️ Edit Shape:</p>
          <ul class="list-disc list-inside ml-2">
            <li>Select a shape to edit its parameters</li>
            <li>Update coordinates in real-time</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">💾 File Operations:</p>
          <ul class="list-disc list-inside ml-2">
            <li><strong>Save</strong> - Export drawing to JSON file</li>
            <li><strong>Load</strong> - Import drawing from JSON file</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">🗑️ Clear Workspace:</p>
          <ul class="list-disc list-inside ml-2">
            <li>Remove all shapes from canvas</li>
          </ul>
        </div>
      </div>
    `,
    icon: 'fas fa-question-circle',
  });
});

// Initialize default state
statusText.textContent = 'For help, click Help Topics on the Help menu.';
canvasManager.setCursor('default');