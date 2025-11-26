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
  bezier: document.getElementById('tool-bezier') as HTMLButtonElement,
  polygon: document.getElementById('tool-polygon') as HTMLButtonElement,
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
  bezier: document.getElementById('bezier-panel') as HTMLDivElement,
  polygon: document.getElementById('polygon-panel') as HTMLDivElement,
  morphological: document.getElementById('morphological-panel') as HTMLDivElement,
};

// Initialize managers
const toolManager = new ToolManager(toolButtons, statusText, drawingManager, canvasManager);
const uiController = new UIController(panels, drawingManager, statusText);

// Interaction Manager
const interactionManager = new InteractionManager(
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
            <li><strong>Bezier Curve</strong> - Draw Bézier curves with control points</li>
            <li><strong>RGB Cube</strong> - Draw interactive 3D RGB color cube</li>
          </ul>
        </div>

        <div>
          <p class="font-bold mb-1">📈 Bézier Curves:</p>
          <ul class="list-disc list-inside ml-2">
            <li><strong>Creating:</strong> Click Bezier tool → Panel opens → Enter degree, start point (X,Y), end point (X,Y) → Click "Create Curve"</li>
            <li><strong>Degree:</strong> Determines curve complexity (1=linear, 2=quadratic, 3=cubic, etc.). Points are evenly spaced between start and end</li>
            <li><strong>Adding Points (Mouse):</strong> With Bezier tool active and curve selected, click on canvas to add points at clicked position</li>
            <li><strong>Adding Points (Coordinates):</strong> In edit section, enter X,Y values and click "Add" to add point at specific location</li>
            <li><strong>Selecting Point:</strong> Use Select tool, click on any control point (red/blue circle) to select it (green highlight)</li>
            <li><strong>Dragging:</strong> Click and drag selected point - curve updates in real-time</li>
            <li><strong>Editing Coordinates:</strong> When point is selected, edit X/Y values in panel for precision</li>
            <li><strong>Removing Point:</strong> Select a point, then click "Remove Selected Point" (minimum 2 points required)</li>
            <li><strong>Panel Info:</strong> Shows number of control points and current curve degree</li>
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

// Bezier curve event handlers
document.getElementById('btn-create-bezier')?.addEventListener('click', () => {
  const degreeInput = document.getElementById('bezier-degree-input') as HTMLInputElement;
  const startXInput = document.getElementById('bezier-start-x') as HTMLInputElement;
  const startYInput = document.getElementById('bezier-start-y') as HTMLInputElement;
  
  if (!degreeInput || !startXInput || !startYInput) return;
  
  const degree = parseInt(degreeInput.value);
  const startX = parseFloat(startXInput.value);
  const startY = parseFloat(startYInput.value);
  
  if (isNaN(degree) || degree < 1) {
    alert('Please enter a valid degree (minimum 1)');
    return;
  }
  
  if (isNaN(startX) || isNaN(startY)) {
    alert('Please enter valid coordinates');
    return;
  }
  
  interactionManager.createBezierFromPanel(degree, startX, startY);
});

document.getElementById('btn-add-bezier-point')?.addEventListener('click', () => {
  interactionManager.addBezierPoint();
});

document.getElementById('btn-remove-selected-point')?.addEventListener('click', () => {
  interactionManager.removeSelectedBezierPoint();
});

// Polygon event handlers
document.getElementById('btn-add-polygon-vertex')?.addEventListener('click', () => {
  const xInput = document.getElementById('polygon-point-x') as HTMLInputElement;
  const yInput = document.getElementById('polygon-point-y') as HTMLInputElement;
  
  if (!xInput || !yInput) return;
  
  const x = parseFloat(xInput.value);
  const y = parseFloat(yInput.value);
  
  if (isNaN(x) || isNaN(y)) {
    alert('Please enter valid coordinates');
    return;
  }
  
  // Simulate a click at this position to add vertex
  interactionManager.addPolygonVertexFromPanel(x, y);
});

document.getElementById('btn-finish-polygon')?.addEventListener('click', () => {
  interactionManager.finishPolygonFromPanel();
});

document.getElementById('btn-remove-last-vertex')?.addEventListener('click', () => {
  interactionManager.removeLastPolygonVertex();
});

document.getElementById('btn-polygon-translate')?.addEventListener('click', () => {
  const dxInput = document.getElementById('polygon-translate-dx') as HTMLInputElement;
  const dyInput = document.getElementById('polygon-translate-dy') as HTMLInputElement;
  
  if (!dxInput || !dyInput) return;
  
  const dx = parseFloat(dxInput.value);
  const dy = parseFloat(dyInput.value);
  
  if (isNaN(dx) || isNaN(dy)) {
    alert('Please enter valid translation values');
    return;
  }
  
  interactionManager.translateSelectedPolygon(dx, dy);
});

document.getElementById('btn-apply-pivot')?.addEventListener('click', () => {
  const xInput = document.getElementById('polygon-pivot-x') as HTMLInputElement;
  const yInput = document.getElementById('polygon-pivot-y') as HTMLInputElement;
  
  if (!xInput || !yInput) return;
  
  const x = parseFloat(xInput.value);
  const y = parseFloat(yInput.value);
  
  if (isNaN(x) || isNaN(y)) {
    alert('Please enter valid pivot coordinates');
    return;
  }
  
  interactionManager.setPivotFromInput(x, y);
});

document.getElementById('btn-polygon-rotate')?.addEventListener('click', () => {
  const angleInput = document.getElementById('polygon-rotate-angle') as HTMLInputElement;
  
  if (!angleInput) return;
  
  const angle = parseFloat(angleInput.value);
  
  if (isNaN(angle)) {
    alert('Please enter a valid angle');
    return;
  }
  
  interactionManager.rotateSelectedPolygon(angle);
});

document.getElementById('btn-apply-scale-point')?.addEventListener('click', () => {
  const xInput = document.getElementById('polygon-scale-point-x') as HTMLInputElement;
  const yInput = document.getElementById('polygon-scale-point-y') as HTMLInputElement;
  
  if (!xInput || !yInput) return;
  
  const x = parseFloat(xInput.value);
  const y = parseFloat(yInput.value);
  
  if (isNaN(x) || isNaN(y)) {
    alert('Please enter valid scale point coordinates');
    return;
  }
  
  interactionManager.setScalePointFromInput(x, y);
});

document.getElementById('btn-polygon-scale')?.addEventListener('click', () => {
  const sxInput = document.getElementById('polygon-scale-sx') as HTMLInputElement;
  const syInput = document.getElementById('polygon-scale-sy') as HTMLInputElement;
  
  if (!sxInput || !syInput) return;
  
  const sx = parseFloat(sxInput.value);
  const sy = parseFloat(syInput.value);
  
  if (isNaN(sx) || isNaN(sy)) {
    alert('Please enter valid scale factors');
    return;
  }
  
  if (sx === 0 || sy === 0) {
    alert('Scale factors cannot be zero');
    return;
  }
  
  interactionManager.scaleSelectedPolygon(sx, sy);
});

document.getElementById('polygon-edit-filled')?.addEventListener('change', (e) => {
  const checkbox = e.target as HTMLInputElement;
  const selectedShape = drawingManager.getSelectedShape();
  
  if (selectedShape && selectedShape.getType() === 'polygon') {
    const polygon = selectedShape as any; // Polygon type
    polygon.setFilled(checkbox.checked);
    drawingManager.redraw();
  }
});

document.getElementById('close-polygon-btn')?.addEventListener('click', () => {
  document.getElementById('polygon-panel')?.classList.add('hidden');
  interactionManager.cancelPolygon();
});

window.addEventListener('show-rotate-cube-panel', (e) => {
  const customEvent = e as CustomEvent;
  const cube = customEvent.detail as RGBCube;
  showRotateCubePanel(cube);
});