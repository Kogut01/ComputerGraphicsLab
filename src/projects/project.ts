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
import { RGBCube } from '../utils/shapes/RGBCube';

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
  rgbcube: document.getElementById('tool-rgb-cube') as HTMLButtonElement,
};

// Panels
const panels = {
  drawParams: document.getElementById('draw-params-panel') as HTMLDivElement,
  file: document.getElementById('file-panel') as HTMLDivElement,
  editShape: document.getElementById('edit-shape-panel') as HTMLDivElement,
  zoom: document.getElementById('zoom-panel') as HTMLDivElement,
  colorPicker: document.getElementById('color-picker-panel') as HTMLDivElement,
  rotateCube: document.getElementById('rotate-cube-panel') as HTMLDivElement,
  imageProcessing: document.getElementById('image-processing-panel') as HTMLDivElement,
  histogram: document.getElementById('histogram-panel') as HTMLDivElement,
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
            <li><strong>RGB Cube</strong> - Draw interactive 3D RGB color cube</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">🎨 RGB Cube:</p>
          <ul class="list-disc list-inside ml-2">
            <li>Click and drag to create cube</li>
            <li>Select cube to rotate and view slices</li>
            <li>Use slice controls to explore color space</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">📐 Draw Parameters:</p>
          <ul class="list-disc list-inside ml-2">
            <li>Enter exact coordinates to draw shapes</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">💾 File Operations:</p>
          <ul class="list-disc list-inside ml-2">
            <li><strong>Save</strong> - Export to JSON or JPEG</li>
            <li><strong>Load</strong> - Import from JSON, PPM-P3, PPM-P6, or JPEG files</li>
            <li><strong>JPEG</strong> - Adjustable compression quality (0-100)</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">🖼️ Image Processing:</p>
          <ul class="list-disc list-inside ml-2">
            <li><strong>Point Operations</strong> - Add, subtract, multiply, divide RGB values</li>
            <li><strong>Brightness</strong> - Adjust image brightness (-255 to +255)</li>
            <li><strong>Grayscale</strong> - Convert to grayscale (Average, Luminance, Desaturation)</li>
            <li><strong>Filters</strong> - Smoothing, Median, Sobel Edge, Sharpen, Gaussian Blur</li>
            <li><strong>Reset</strong> - Return to original image anytime</li>
          </ul>
        </div>
        
        <div>
          <p class="font-bold mb-1">📊 Histogram & Binarization:</p>
          <ul class="list-disc list-inside ml-2">
            <li><strong>Histogram</strong> - View RGB channel distribution</li>
            <li><strong>Stretch</strong> - Enhance contrast by stretching histogram</li>
            <li><strong>Equalize</strong> - Improve distribution for better contrast</li>
            <li><strong>Binarization</strong> - Convert to black & white:</li>
            <li class="ml-4">• Manual Threshold - Set custom threshold (0-255)</li>
            <li class="ml-4">• Percent Black - Auto threshold by % of black pixels</li>
            <li class="ml-4">• Mean Iterative - Automatic optimal threshold</li>
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

// Current selected cube reference
let currentCube: RGBCube | null = null;

// Obsługa panelu Rotate Cube z przekrojem
function showRotateCubePanel(cube: RGBCube) {
  currentCube = cube;
  panels.rotateCube.classList.remove('hidden');
  
  const xSlider = document.getElementById('rotate-x-slider') as HTMLInputElement | null;
  const ySlider = document.getElementById('rotate-y-slider') as HTMLInputElement | null;
  const xValue = document.getElementById('rotate-x-value') as HTMLElement | null;
  const yValue = document.getElementById('rotate-y-value') as HTMLElement | null;
  
  const sliceAxisSelect = document.getElementById('slice-axis-select') as HTMLSelectElement | null;
  const slicePositionSlider = document.getElementById('slice-position-slider') as HTMLInputElement | null;
  const slicePositionValue = document.getElementById('slice-position-value') as HTMLElement | null;
  
  if (xSlider && ySlider && xValue && yValue) {
    xSlider.value = Math.round(cube.getRotation().x).toString();
    ySlider.value = Math.round(cube.getRotation().y).toString();
    xValue.textContent = `${Math.round(cube.getRotation().x)}°`;
    yValue.textContent = `${Math.round(cube.getRotation().y)}°`;
  }
  
  if (sliceAxisSelect && slicePositionSlider && slicePositionValue) {
    sliceAxisSelect.value = cube.getSliceAxis();
    slicePositionSlider.value = Math.round(cube.getSlicePosition() * 100).toString();
    slicePositionValue.textContent = `${Math.round(cube.getSlicePosition() * 100)}%`;
  }
  
  updateSlicePreview();
}

function hideRotateCubePanel() {
  currentCube = null;
  panels.rotateCube.classList.add('hidden');
}

function updateSlicePreview() {
  if (!currentCube) return;
  
  const sliceCanvas = document.getElementById('slice-canvas') as HTMLCanvasElement | null;
  if (sliceCanvas) {
    currentCube.drawSlice(sliceCanvas);
  }
}

document.getElementById('close-rotate-cube-btn')?.addEventListener('click', hideRotateCubePanel);

// Rotation sliders
document.getElementById('rotate-x-slider')?.addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  const xValue = document.getElementById('rotate-x-value') as HTMLElement | null;
  if (xValue) xValue.textContent = `${val}°`;
  
  const selected = drawingManager.getSelectedShape();
  if (selected && selected.getType && selected.getType() === 'rgbcube') {
    const cube = selected as RGBCube;
    cube.setRotation(val, cube.getRotation().y, 0);
    drawingManager.redraw();
  }
});

document.getElementById('rotate-y-slider')?.addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  const yValue = document.getElementById('rotate-y-value') as HTMLElement | null;
  if (yValue) yValue.textContent = `${val}°`;
  
  const selected = drawingManager.getSelectedShape();
  if (selected && selected.getType && selected.getType() === 'rgbcube') {
    const cube = selected as RGBCube;
    cube.setRotation(cube.getRotation().x, val, 0);
    drawingManager.redraw();
  }
});

// Slice controls
document.getElementById('slice-axis-select')?.addEventListener('change', (e) => {
  const axis = (e.target as HTMLSelectElement).value as 'x' | 'y' | 'z';
  
  if (currentCube) {
    currentCube.setSliceAxis(axis);
    updateSlicePreview();
    statusText.textContent = `Slice axis changed to ${axis.toUpperCase()}`;
  }
});

document.getElementById('slice-position-slider')?.addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  const slicePositionValue = document.getElementById('slice-position-value') as HTMLElement | null;
  if (slicePositionValue) slicePositionValue.textContent = `${val}%`;
  
  if (currentCube) {
    currentCube.setSlicePosition(val / 100);
    updateSlicePreview();
  }
});

// Open Rotate Cube panel on cube selection
const origSelectShapeAt = drawingManager.selectShapeAt.bind(drawingManager);
drawingManager.selectShapeAt = function(x, y) {
  const result = origSelectShapeAt(x, y);
  const selected = this.getSelectedShape();
  if (selected && selected.getType && selected.getType() === 'rgbcube') {
    showRotateCubePanel(selected as RGBCube);
  } else {
    hideRotateCubePanel();
  }
  return result;
};

window.addEventListener('show-rotate-cube-panel', (e) => {
  const customEvent = e as CustomEvent;
  const cube = customEvent.detail as RGBCube;
  showRotateCubePanel(cube);
});