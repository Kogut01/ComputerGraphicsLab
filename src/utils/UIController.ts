import { DrawingManager } from './DrawingManager';
import { Line, Rectangle, Circle } from './shapes/Import';
import { parsePPM } from './PPMLoader';
import { ImageProcessor } from './ImageProcessor';

export class UIController {
  private panels: {
    drawParams: HTMLElement;
    file: HTMLElement;
    editShape: HTMLElement;
    zoom: HTMLElement;
    colorPicker: HTMLElement;
    rotateCube: HTMLElement;
    imageProcessing: HTMLElement;
    histogram: HTMLElement;
  };
  private drawingManager: DrawingManager;
  private statusText: HTMLElement;
  
  // Initialize UI controller with all panels and event handlers
  constructor(
    panels: { drawParams: HTMLElement; file: HTMLElement; editShape: HTMLElement; zoom: HTMLElement, colorPicker: HTMLElement, rotateCube: HTMLElement, imageProcessing: HTMLElement, histogram: HTMLElement },
    drawingManager: DrawingManager,
    statusText: HTMLElement
  ) {
    this.panels = panels;
    this.drawingManager = drawingManager;
    this.statusText = statusText;
    this.initializePanelButtons();
    this.handleFileTypeChange();
    this.handleColorPickerChange();
    this.updateZoomDisplay();
    this.updateColorPickerDisplays();
    this.initializeImageProcessing();
  }

  // Setup all panel toggle buttons and their event handlers
  private initializePanelButtons(): void {
    document.getElementById('draw-params-btn')?.addEventListener('click', () => {
      this.panels.drawParams.classList.toggle('hidden');
      this.panels.file.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.zoom.classList.add('hidden');
      this.panels.colorPicker.classList.add('hidden');
      this.panels.rotateCube.classList.add('hidden');
      this.panels.imageProcessing.classList.add('hidden');
      this.panels.histogram.classList.add('hidden');

      this.statusText.textContent = `Draw Parameters Panel opened`;
    });
    
    document.getElementById('close-params-btn')?.addEventListener('click', () => {
      this.panels.drawParams.classList.add('hidden');
    });
    
    document.getElementById('file-btn')?.addEventListener('click', () => {
      this.panels.file.classList.toggle('hidden');
      this.panels.drawParams.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.zoom.classList.add('hidden');
      this.panels.colorPicker.classList.add('hidden');
      this.panels.rotateCube.classList.add('hidden');
      this.panels.imageProcessing.classList.add('hidden');
      this.panels.histogram.classList.add('hidden');

      this.statusText.textContent = `File Panel opened`;
    });
    
    document.getElementById('close-file-btn')?.addEventListener('click', () => {
      this.panels.file.classList.add('hidden');
    });
    
    document.getElementById('close-edit-btn')?.addEventListener('click', () => {
      this.panels.editShape.classList.add('hidden');
      this.drawingManager.clearSelection();
      this.drawingManager.redraw();
    });

    document.getElementById('zoom-btn')?.addEventListener('click', () => {
      this.panels.zoom.classList.toggle('hidden');
      this.panels.drawParams.classList.add('hidden');
      this.panels.file.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.colorPicker.classList.add('hidden');
      this.panels.rotateCube.classList.add('hidden');
      this.panels.imageProcessing.classList.add('hidden');
      this.panels.histogram.classList.add('hidden');

      this.statusText.textContent = `Zoom: Hold Shift and drag to pan`;
      this.updateZoomDisplay();
    });
    
    document.getElementById('close-zoom-btn')?.addEventListener('click', () => {
      this.panels.zoom.classList.add('hidden');
    });

    document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
      const newZoom = this.drawingManager.getZoom() * 1.2;
      this.drawingManager.setZoom(newZoom);
      this.updateZoomDisplay();
    });

    document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
      const newZoom = this.drawingManager.getZoom() / 1.2;
      this.drawingManager.setZoom(newZoom);
      this.updateZoomDisplay();
    });

    document.getElementById('zoom-reset-btn')?.addEventListener('click', () => {
      this.drawingManager.setZoom(1.0);
      this.drawingManager.resetPan();
      this.updateZoomDisplay();

      const cursor = document.getElementById('cursor-position');
      if (cursor) cursor.textContent = '0, 0';

      const canvas = (this.drawingManager as any)['ctx'].canvas as HTMLCanvasElement;
      if (canvas) canvas.style.cursor = 'default';
    }); 

    document.getElementById('color-picker-btn')?.addEventListener('click', () => {
      this.panels.colorPicker.classList.toggle('hidden');
      this.panels.drawParams.classList.add('hidden');
      this.panels.file.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.zoom.classList.add('hidden');
      this.panels.rotateCube.classList.add('hidden');
      this.panels.imageProcessing.classList.add('hidden');
      this.panels.histogram.classList.add('hidden');

      this.statusText.textContent = `Color Picker opened`;
    });

    document.getElementById('close-color-picker-btn')?.addEventListener('click', () => {
      this.panels.colorPicker.classList.add('hidden');
    });

    document.getElementById('image-processing-btn')?.addEventListener('click', () => {
      if (!this.drawingManager.hasImageData()) {
        this.statusText.textContent = 'Please load an image first (File > Load Drawing > JPEG)';
        return;
      }
      this.panels.imageProcessing.classList.toggle('hidden');
      this.panels.drawParams.classList.add('hidden');
      this.panels.file.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.zoom.classList.add('hidden');
      this.panels.colorPicker.classList.add('hidden');
      this.panels.rotateCube.classList.add('hidden');
      this.panels.histogram.classList.add('hidden');

      this.statusText.textContent = `Image Processing panel opened`;
    });

    document.getElementById('close-image-processing-btn')?.addEventListener('click', () => {
      this.panels.imageProcessing.classList.add('hidden');
    });

    document.getElementById('histogram-btn')?.addEventListener('click', () => {
      if (!this.drawingManager.hasImageData()) {
        this.statusText.textContent = 'Please load an image first (File > Load Drawing > JPEG)';
        return;
      }
      this.panels.histogram.classList.toggle('hidden');
      this.panels.drawParams.classList.add('hidden');
      this.panels.file.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.zoom.classList.add('hidden');
      this.panels.colorPicker.classList.add('hidden');
      this.panels.rotateCube.classList.add('hidden');
      this.panels.imageProcessing.classList.add('hidden');

      // Auto-display histogram when panel opens
      if (!this.panels.histogram.classList.contains('hidden')) {
        this.showHistogram();
      }

      this.statusText.textContent = `Histogram panel opened`;
    });

    document.getElementById('close-histogram-btn')?.addEventListener('click', () => {
      this.panels.histogram.classList.add('hidden');
    });

    document.getElementById('draw-shape-btn')?.addEventListener('click', () => this.handleDrawShapeFromParams());
    document.getElementById('update-shape-btn')?.addEventListener('click', () => this.handleUpdateShapeFromParams());
    
    document.getElementById('save-file-btn')?.addEventListener('click', () => this.handleSaveFile());
    document.getElementById('load-file-btn')?.addEventListener('click', () => document.getElementById('file-input')?.click());
      
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.addEventListener('change', (e) => this.handleLoadFile(e));

    const fileSelect = document.getElementById('param-file-type') as HTMLSelectElement | null;
    fileSelect?.addEventListener('change', () => this.handleFileTypeChange());

    const compressionSlider = document.getElementById('compression-slider') as HTMLInputElement | null;
    const compressionValue = document.getElementById('compression-value') as HTMLSpanElement | null;

    if (compressionSlider && compressionValue) {
      const updateCompressionDisplay = () => {
        compressionValue.textContent = `${compressionSlider.value}%`;
      };
      updateCompressionDisplay();
      compressionSlider.addEventListener('input', updateCompressionDisplay);
    }

    const colorPickerCheckbox = document.getElementById('color-picker-checkbox') as HTMLInputElement | null;
    colorPickerCheckbox?.addEventListener('change', () => this.handleColorPickerChange());

    const colorPickerSelect = document.getElementById('color-style-select') as HTMLSelectElement | null;
    colorPickerSelect?.addEventListener('change', () => this.handleColorPickerChange());
  }

  // Update zoom percentage display
  private updateZoomDisplay(): void {
    const zoomValue = document.getElementById('zoom-value');
    if (zoomValue) {
      const zoom = Math.round(this.drawingManager.getZoom() * 100);
      zoomValue.textContent = `${zoom}%`;
    }
  }

  // Bidirectional RGB <-> CMYK conversion with live sync
  private updateColorPickerDisplays(): void {
    const rSlider = document.getElementById('color-r-slider') as HTMLInputElement | null;
    const gSlider = document.getElementById('color-g-slider') as HTMLInputElement | null;
    const bSlider = document.getElementById('color-b-slider') as HTMLInputElement | null;
    const cSlider = document.getElementById('color-c-slider') as HTMLInputElement | null;
    const mSlider = document.getElementById('color-m-slider') as HTMLInputElement | null;
    const ySlider = document.getElementById('color-y-slider') as HTMLInputElement | null;
    const kSlider = document.getElementById('color-k-slider') as HTMLInputElement | null;

    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

    const rgbToCmyk = (r: number, g: number, b: number) => {
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      
      const k = 1 - Math.max(rNorm, gNorm, bNorm);
      
      if (k >= 1) {
        return { c: 0, m: 0, y: 0, k: 255 };
      }
      
      const c = (1 - rNorm - k) / (1 - k);
      const m = (1 - gNorm - k) / (1 - k);
      const y = (1 - bNorm - k) / (1 - k);
      
      return {
        c: Math.round(c * 255),
        m: Math.round(m * 255),
        y: Math.round(y * 255),
        k: Math.round(k * 255)
      };
    };

    const cmykToRgb = (c: number, m: number, y: number, k: number) => {
      const cNorm = c / 255;
      const mNorm = m / 255;
      const yNorm = y / 255;
      const kNorm = k / 255;
      
      const r = 255 * (1 - cNorm) * (1 - kNorm);
      const g = 255 * (1 - mNorm) * (1 - kNorm);
      const b = 255 * (1 - yNorm) * (1 - kNorm);
      
      return {
        r: Math.round(r),
        g: Math.round(g),
        b: Math.round(b)
      };
    };

    const setPreview = (r: number, g: number, b: number) => {
      const preview = document.getElementById('color-preview') as HTMLElement | null;
      
      if (preview) {
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        preview.style.backgroundColor = hex;
      }
    };

    const updateFromRGB = () => {
      const r = clamp(parseInt(rSlider?.value ?? '0', 10));
      const g = clamp(parseInt(gSlider?.value ?? '0', 10));
      const b = clamp(parseInt(bSlider?.value ?? '0', 10));
      
      const { c, m, y, k } = rgbToCmyk(r, g, b);

      if (cSlider) cSlider.value = String(c);
      if (mSlider) mSlider.value = String(m);
      if (ySlider) ySlider.value = String(y);
      if (kSlider) kSlider.value = String(k);

      const cDisplay = document.getElementById('color-c-slider-value');
      const mDisplay = document.getElementById('color-m-slider-value');
      const yDisplay = document.getElementById('color-y-slider-value');
      const kDisplay = document.getElementById('color-k-slider-value');
      if (cDisplay) cDisplay.textContent = String(c);
      if (mDisplay) mDisplay.textContent = String(m);
      if (yDisplay) yDisplay.textContent = String(y);
      if (kDisplay) kDisplay.textContent = String(k);

      const cInput = document.getElementById('color-c-input') as HTMLInputElement | null;
      const mInput = document.getElementById('color-m-input') as HTMLInputElement | null;
      const yInput = document.getElementById('color-y-input') as HTMLInputElement | null;
      const kInput = document.getElementById('color-k-input') as HTMLInputElement | null;
      if (cInput) cInput.value = String(c);
      if (mInput) mInput.value = String(m);
      if (yInput) yInput.value = String(y);
      if (kInput) kInput.value = String(k);

      setPreview(r, g, b);
    };

    const updateFromCMYK = () => {
      const c = clamp(parseInt(cSlider?.value ?? '0', 10));
      const m = clamp(parseInt(mSlider?.value ?? '0', 10));
      const y = clamp(parseInt(ySlider?.value ?? '0', 10));
      const k = clamp(parseInt(kSlider?.value ?? '0', 10));
      
      const { r, g, b } = cmykToRgb(c, m, y, k);

      if (rSlider) rSlider.value = String(r);
      if (gSlider) gSlider.value = String(g);
      if (bSlider) bSlider.value = String(b);

      const rDisplay = document.getElementById('color-r-slider-value');
      const gDisplay = document.getElementById('color-g-slider-value');
      const bDisplay = document.getElementById('color-b-slider-value');
      if (rDisplay) rDisplay.textContent = String(r);
      if (gDisplay) gDisplay.textContent = String(g);
      if (bDisplay) bDisplay.textContent = String(b);

      const rInput = document.getElementById('color-r-input') as HTMLInputElement | null;
      const gInput = document.getElementById('color-g-input') as HTMLInputElement | null;
      const bInput = document.getElementById('color-b-input') as HTMLInputElement | null;
      if (rInput) rInput.value = String(r);
      if (gInput) gInput.value = String(g);
      if (bInput) bInput.value = String(b);

      setPreview(r, g, b);
    };

    const bind = (
      slider: HTMLInputElement | null,
      displayId: string | null,
      inputId?: string,
      onChangeCallback?: () => void
    ) => {
      if (!slider || !displayId) return;
      const display = document.getElementById(displayId) as HTMLElement | null;
      const numberInput = inputId ? document.getElementById(inputId) as HTMLInputElement | null : null;

      if (display) display.textContent = slider.value;
      if (numberInput) numberInput.value = slider.value;

      slider.addEventListener('input', () => {
        const val = clamp(parseInt(slider.value, 10) || 0);
        slider.value = String(val);
        if (display) display.textContent = String(val);
        if (numberInput) numberInput.value = String(val);
        if (onChangeCallback) onChangeCallback();
      });

      if (numberInput) {
        numberInput.addEventListener('input', () => {
          let val = clamp(parseInt(numberInput.value, 10) || 0);
          numberInput.value = String(val);
          slider.value = String(val);
          if (display) display.textContent = String(val);
          if (onChangeCallback) onChangeCallback();
        });
      }
    };

    bind(rSlider, 'color-r-slider-value', 'color-r-input', updateFromRGB);
    bind(gSlider, 'color-g-slider-value', 'color-g-input', updateFromRGB);
    bind(bSlider, 'color-b-slider-value', 'color-b-input', updateFromRGB);

    bind(cSlider, 'color-c-slider-value', 'color-c-input', updateFromCMYK);
    bind(mSlider, 'color-m-slider-value', 'color-m-input', updateFromCMYK);
    bind(ySlider, 'color-y-slider-value', 'color-y-input', updateFromCMYK);
    bind(kSlider, 'color-k-slider-value', 'color-k-input', updateFromCMYK);

    if (rSlider && gSlider && bSlider) {
      updateFromRGB();
    }
  }

  // Update pixel RGB values display in zoom panel
  public updatePixelValues(r: number, g: number, b: number): void {
    const rValue = document.getElementById('zoom-r-value');
    const gValue = document.getElementById('zoom-g-value');
    const bValue = document.getElementById('zoom-b-value');

    if (rValue && gValue && bValue) {
      rValue.textContent = r.toString();
      gValue.textContent = g.toString();
      bValue.textContent = b.toString();
    }
  }

  // Hide all panels at once
  public hideAllPanels(): void {
    Object.values(this.panels).forEach(panel => panel.classList.add('hidden'));
  }

  // Get current selected color from color picker as hex string
  public getCurrentColor(): string {
    const rSlider = document.getElementById('color-r-slider') as HTMLInputElement | null;
    const gSlider = document.getElementById('color-g-slider') as HTMLInputElement | null;
    const bSlider = document.getElementById('color-b-slider') as HTMLInputElement | null;

    if (rSlider && gSlider && bSlider) {
      const r = parseInt(rSlider.value, 10) || 0;
      const g = parseInt(gSlider.value, 10) || 0;
      const b = parseInt(bSlider.value, 10) || 0;
      
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      return hex;
    }

    return '#000000';
  }
  
  // Update edit panel with selected shape coordinates
  public updateEditPanel(): void {
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

  // Draw new shape from parameters panel
  private handleDrawShapeFromParams(): void {
    const shapeType = (document.getElementById('param-shape') as HTMLSelectElement).value as any;
    const x1 = parseFloat((document.getElementById('param-x1') as HTMLInputElement).value) || 0;
    const y1 = parseFloat((document.getElementById('param-y1') as HTMLInputElement).value) || 0;
    const x2 = parseFloat((document.getElementById('param-x2') as HTMLInputElement).value) || 100;
    const y2 = parseFloat((document.getElementById('param-y2') as HTMLInputElement).value) || 100;

    const currentColor = this.getCurrentColor();
    this.drawingManager.addShape(this.drawingManager.createShape(shapeType, x1, y1, x2, y2, currentColor));
    this.drawingManager.redraw();
    this.statusText.textContent = `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} drawn`;
  }
  
  // Update selected shape with new coordinates from edit panel
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

  // Update UI based on selected file type (JSON, PPM, JPEG)
  private handleFileTypeChange(): void {
    const fileType = (document.getElementById('param-file-type') as HTMLSelectElement).value;

    if (fileType === 'json') {
      document.getElementById('compression-panel')?.classList.add('hidden');
      document.getElementById('save-file-btn')?.classList.remove('hidden');
      document.getElementById('load-file-btn')?.classList.remove('hidden');
    } else if (fileType === 'ppm-p3' || fileType === 'ppm-p6') {
      document.getElementById('compression-panel')?.classList.add('hidden');
      document.getElementById('save-file-btn')?.classList.add('hidden');
      document.getElementById('load-file-btn')?.classList.remove('hidden');
    } else {
      document.getElementById('compression-panel')?.classList.remove('hidden');
      document.getElementById('save-file-btn')?.classList.remove('hidden');
      document.getElementById('load-file-btn')?.classList.remove('hidden');
    }

    const fileInput = document.getElementById('file-input') as HTMLInputElement;

    if (fileType === 'json') {
      fileInput.accept = '.json';
    } else if (fileType === 'ppm-p3' || fileType === 'ppm-p6') {
      fileInput.accept = '.ppm';
    } else {
      fileInput.accept = '.jpg,.jpeg';
    }
  }

  // Toggle between RGB/CMYK and slider/text modes in color picker
  private handleColorPickerChange(): void {
    const checkboxEl = document.getElementById('color-picker-checkbox') as HTMLInputElement | null;
    const isTextMode = !!checkboxEl?.checked;
    const selectEl = document.getElementById('color-style-select') as HTMLSelectElement | null;
    const mode = selectEl?.value ?? 'color-style-rgb';

    const hideAll = () => {
      document.getElementById('color-rgb-slider-label')?.classList.add('hidden');
      document.getElementById('color-rgb-text-label')?.classList.add('hidden');
      document.getElementById('color-cmyk-slider-label')?.classList.add('hidden');
      document.getElementById('color-cmyk-text-label')?.classList.add('hidden');
    };

    hideAll();

    if (mode === 'color-style-rgb') {
      if (isTextMode) {
        document.getElementById('color-rgb-text-label')?.classList.remove('hidden');
      } else {
        document.getElementById('color-rgb-slider-label')?.classList.remove('hidden');
      }
    } else if (mode === 'color-style-cmyk') {
      if (isTextMode) {
        document.getElementById('color-cmyk-text-label')?.classList.remove('hidden');
      } else {
        document.getElementById('color-cmyk-slider-label')?.classList.remove('hidden');
      }
    }
  }

  // Save drawing as JSON or JPEG with compression
  private handleSaveFile(): void {
    const fileType = (document.getElementById('param-file-type') as HTMLSelectElement).value;

    if (fileType === 'json') {
      const blob = new Blob([this.drawingManager.exportToJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drawing-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.statusText.textContent = 'Drawing saved!';

    } else if (fileType === 'ppm-p3' || fileType === 'ppm-p6') {
      this.statusText.textContent = 'PPM file saving not implemented yet';

    } else {
      const canvas = (this.drawingManager as any)['ctx'].canvas;
      const compressionSlider = document.getElementById('compression-slider') as HTMLInputElement;
      const quality = compressionSlider ? parseFloat(compressionSlider.value) / 100 : 0.92;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        this.statusText.textContent = 'Error: Could not create temporary canvas';
        return;
      }

      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      
      tempCanvas.toBlob((blob) => {
        if (!blob) {
          this.statusText.textContent = 'Error creating JPEG';
          return;
        }
        const filename = `drawing-${Date.now()}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.jpeg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.statusText.textContent = `Saved as ${filename}.jpg (compression: ${Math.round(quality * 100)}%)`;
      }, 'image/jpeg', quality);
    }
  }
  
  // Load file (JSON shapes, PPM, or JPEG image)
  private handleLoadFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    const fileType = (document.getElementById('param-file-type') as HTMLSelectElement).value;

    if (!file) {
      this.statusText.textContent = 'Error: No file selected';
      return;
    }

    if (fileType === 'json') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if ((this.drawingManager as any).importFromJSON && this.drawingManager.importFromJSON(text)) {
          this.statusText.textContent = `Loaded ${this.drawingManager.getShapes().length} shapes`;
          this.drawingManager.redraw && this.drawingManager.redraw();
        } else {
          this.statusText.textContent = 'Error loading JSON or importFromJSON not implemented';
        }
      };
      reader.onerror = () => {
        this.statusText.textContent = 'Error reading file';
      };
      reader.readAsText(file);

    } else if (fileType === 'ppm-p3' || fileType === 'ppm-p6') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          const ppm = parsePPM(buffer);

          const off = document.createElement('canvas');
          off.width = ppm.width;
          off.height = ppm.height;
          const offCtx = off.getContext('2d');
          if (!offCtx) throw new Error('Cannot get 2D context');

          const imageData = offCtx.createImageData(ppm.width, ppm.height);
          imageData.data.set(ppm.data);
          offCtx.putImageData(imageData, 0, 0);

          const canvas = (this.drawingManager as any)['ctx'].canvas as HTMLCanvasElement;
          const scale = Math.min(canvas.width / off.width, canvas.height / off.height);
          const x = (canvas.width - off.width * scale) / 2;
          const y = (canvas.height - off.height * scale) / 2;

          this.drawingManager.clear();
          this.drawingManager.setBackgroundImage(off, x, y, off.width * scale, off.height * scale);
          this.drawingManager.redraw();

          this.statusText.textContent = `PPM loaded (${ppm.width}x${ppm.height})`;
        } catch (err: any) {
          console.error(err);
          this.statusText.textContent = `Error loading PPM: ${err?.message || err}`;
        }
      };
      reader.onerror = () => {
        this.statusText.textContent = 'Error reading PPM file';
      };
      reader.readAsArrayBuffer(file);

    } else if (fileType === 'jpeg' || fileType === 'jpg') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = (this.drawingManager as any)['ctx'].canvas;
          const ctx = canvas.getContext('2d');
          this.drawingManager.clear();
          ctx?.clearRect(0, 0, canvas.width, canvas.height);

          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;

          // Extract ImageData for processing operations
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0);
            const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
            this.drawingManager.setImageData(imageData, x, y);
          }

          this.drawingManager.setBackgroundImage(img, x, y, img.width * scale, img.height * scale);
          this.drawingManager.redraw();
          this.statusText.textContent = `JPEG loaded: ${img.width}x${img.height} - Use Image Processing to edit`;
        };
        img.onerror = () => {
          this.statusText.textContent = 'Error loading JPEG image';
        };
        img.src = ev.target?.result as string;
      };
      reader.onerror = () => {
        this.statusText.textContent = 'Error reading JPEG file';
      };
      reader.readAsDataURL(file);
    } else {
      this.statusText.textContent = 'Unsupported file type';
    }
  }

  // Show RGB cube rotation panel
  showRotateCubePanel(cube: any) {
    this.panels.rotateCube.classList.remove('hidden');
    const xSlider = document.getElementById('rotate-x-slider') as HTMLInputElement | null;
    const ySlider = document.getElementById('rotate-y-slider') as HTMLInputElement | null;
    const xValue = document.getElementById('rotate-x-value') as HTMLElement | null;
    const yValue = document.getElementById('rotate-y-value') as HTMLElement | null;
    if (xSlider && ySlider && xValue && yValue && cube && cube.getRotation) {
      xSlider.value = Math.round(cube.getRotation().x).toString();
      ySlider.value = Math.round(cube.getRotation().y).toString();
      xValue.textContent = `${Math.round(cube.getRotation().x)}°`;
      yValue.textContent = `${Math.round(cube.getRotation().y)}°`;
    }
  }

  hideRotateCubePanel() {
    this.panels.rotateCube.classList.add('hidden');
  }

  // Setup all image processing and histogram operation handlers
  private initializeImageProcessing(): void {
    const brightnessSlider = document.getElementById('brightness-slider') as HTMLInputElement | null;
    const brightnessValue = document.getElementById('brightness-value') as HTMLElement | null;
    
    if (brightnessSlider && brightnessValue) {
      brightnessSlider.addEventListener('input', () => {
        brightnessValue.textContent = brightnessSlider.value;
      });
    }

    // Point transformations
    document.getElementById('btn-add')?.addEventListener('click', () => {
      this.applyImageOperation('add');
    });

    document.getElementById('btn-subtract')?.addEventListener('click', () => {
      this.applyImageOperation('subtract');
    });

    document.getElementById('btn-multiply')?.addEventListener('click', () => {
      this.applyImageOperation('multiply');
    });

    document.getElementById('btn-divide')?.addEventListener('click', () => {
      this.applyImageOperation('divide');
    });

    document.getElementById('btn-brightness')?.addEventListener('click', () => {
      this.applyImageOperation('brightness');
    });

    // Grayscale conversions
    document.getElementById('btn-grayscale-avg')?.addEventListener('click', () => {
      this.applyImageOperation('grayscale-avg');
    });

    document.getElementById('btn-grayscale-lum')?.addEventListener('click', () => {
      this.applyImageOperation('grayscale-lum');
    });

    document.getElementById('btn-grayscale-des')?.addEventListener('click', () => {
      this.applyImageOperation('grayscale-des');
    });

    // Convolution filters
    document.getElementById('btn-smoothing-filter')?.addEventListener('click', () => {
      this.applyImageOperation('smoothing-filter');
    });

    document.getElementById('btn-median-filter')?.addEventListener('click', () => {
      this.applyImageOperation('median-filter');
    });

    document.getElementById('btn-sobel-filter')?.addEventListener('click', () => {
      this.applyImageOperation('sobel-filter');
    });

    document.getElementById('btn-sharpen-filter')?.addEventListener('click', () => {
      this.applyImageOperation('sharpen-filter');
    });

    document.getElementById('btn-gaussian-filter')?.addEventListener('click', () => {
      this.applyImageOperation('gaussian-filter');
    });

    document.getElementById('btn-custom-convolution')?.addEventListener('click', () => {
      this.applyImageOperation('custom-convolution');
    });

    // Toggle between 3x3 and 5x5 kernel grids
    document.getElementById('custom-kernel-size')?.addEventListener('change', (e) => {
      const size = (e.target as HTMLSelectElement).value;
      const kernel3x3 = document.getElementById('kernel-3x3');
      const kernel5x5 = document.getElementById('kernel-5x5');
      
      if (size === '3') {
        kernel3x3?.classList.remove('hidden');
        kernel5x5?.classList.add('hidden');
      } else {
        kernel3x3?.classList.add('hidden');
        kernel5x5?.classList.remove('hidden');
      }
    });

    // Histogram operations
    document.getElementById('btn-show-histogram')?.addEventListener('click', () => {
      this.showHistogram();
    });

    document.getElementById('btn-stretch-histogram')?.addEventListener('click', () => {
      this.applyImageOperation('stretch-histogram');
    });

    document.getElementById('btn-equalize-histogram')?.addEventListener('click', () => {
      this.applyImageOperation('equalize-histogram');
    });

    document.getElementById('btn-reset-image')?.addEventListener('click', () => {
      this.drawingManager.resetToOriginalImage();
      this.statusText.textContent = 'Image reset to original';
      this.showHistogram();
    });

    document.getElementById('btn-reset-histogram')?.addEventListener('click', () => {
      this.drawingManager.resetToOriginalImage();
      this.statusText.textContent = 'Image reset to original';
      this.showHistogram();
    });

    // Binarization operations
    const thresholdSlider = document.getElementById('binarize-threshold-slider') as HTMLInputElement;
    const thresholdValue = document.getElementById('binarize-threshold-value');
    thresholdSlider?.addEventListener('input', () => {
      if (thresholdValue) {
        thresholdValue.textContent = thresholdSlider.value;
      }
    });

    document.getElementById('btn-binarize-manual')?.addEventListener('click', () => {
      this.applyImageOperation('binarize-manual');
    });

    document.getElementById('btn-binarize-percent')?.addEventListener('click', () => {
      this.applyImageOperation('binarize-percent');
    });

    document.getElementById('btn-binarize-mean')?.addEventListener('click', () => {
      this.applyImageOperation('binarize-mean');
    });
  }

  // Apply selected image processing operation
  private applyImageOperation(operation: string): void {
    const currentImageData = this.drawingManager.getCurrentImageData();
    
    if (!currentImageData) {
      this.statusText.textContent = 'No image loaded';
      return;
    }

    let resultImageData: ImageData | null = null;

    try {
      switch (operation) {
        case 'add': {
          const r = parseFloat((document.getElementById('add-r') as HTMLInputElement)?.value || '0');
          const g = parseFloat((document.getElementById('add-g') as HTMLInputElement)?.value || '0');
          const b = parseFloat((document.getElementById('add-b') as HTMLInputElement)?.value || '0');
          resultImageData = ImageProcessor.add(currentImageData, r, g, b);
          this.statusText.textContent = `Added R:${r}, G:${g}, B:${b}`;
          break;
        }
        case 'subtract': {
          const r = parseFloat((document.getElementById('add-r') as HTMLInputElement)?.value || '0');
          const g = parseFloat((document.getElementById('add-g') as HTMLInputElement)?.value || '0');
          const b = parseFloat((document.getElementById('add-b') as HTMLInputElement)?.value || '0');
          resultImageData = ImageProcessor.subtract(currentImageData, r, g, b);
          this.statusText.textContent = `Subtracted R:${r}, G:${g}, B:${b}`;
          break;
        }
        case 'multiply': {
          const r = parseFloat((document.getElementById('mult-r') as HTMLInputElement)?.value || '1');
          const g = parseFloat((document.getElementById('mult-g') as HTMLInputElement)?.value || '1');
          const b = parseFloat((document.getElementById('mult-b') as HTMLInputElement)?.value || '1');
          resultImageData = ImageProcessor.multiply(currentImageData, r, g, b);
          this.statusText.textContent = `Multiplied by R:${r}, G:${g}, B:${b}`;
          break;
        }
        case 'divide': {
          const r = parseFloat((document.getElementById('mult-r') as HTMLInputElement)?.value || '1');
          const g = parseFloat((document.getElementById('mult-g') as HTMLInputElement)?.value || '1');
          const b = parseFloat((document.getElementById('mult-b') as HTMLInputElement)?.value || '1');
          resultImageData = ImageProcessor.divide(currentImageData, r, g, b);
          this.statusText.textContent = `Divided by R:${r}, G:${g}, B:${b}`;
          break;
        }
        case 'brightness': {
          const value = parseFloat((document.getElementById('brightness-slider') as HTMLInputElement)?.value || '0');
          resultImageData = ImageProcessor.brightness(currentImageData, value);
          this.statusText.textContent = `Brightness adjusted by ${value}`;
          break;
        }
        case 'grayscale-avg': {
          resultImageData = ImageProcessor.grayscaleAverage(currentImageData);
          this.statusText.textContent = 'Converted to grayscale (Average method)';
          break;
        }
        case 'grayscale-lum': {
          resultImageData = ImageProcessor.grayscaleLuminance(currentImageData);
          this.statusText.textContent = 'Converted to grayscale (Luminance method)';
          break;
        }
        case 'grayscale-des': {
          resultImageData = ImageProcessor.grayscaleDesaturation(currentImageData);
          this.statusText.textContent = 'Converted to grayscale (Desaturation method)';
          break;
        }
        case 'smoothing-filter': {
          resultImageData = ImageProcessor.smoothingFilter(currentImageData);
          this.statusText.textContent = 'Smoothing filter applied (3x3 averaging)';
          break;
        }
        case 'median-filter': {
          resultImageData = ImageProcessor.medianFilter(currentImageData);
          this.statusText.textContent = 'Median filter applied (noise reduction)';
          break;
        }
        case 'sobel-filter': {
          resultImageData = ImageProcessor.sobelFilter(currentImageData);
          this.statusText.textContent = 'Sobel edge detection applied';
          break;
        }
        case 'sharpen-filter': {
          resultImageData = ImageProcessor.sharpenFilter(currentImageData);
          this.statusText.textContent = 'Sharpen filter applied (high-pass)';
          break;
        }
        case 'gaussian-filter': {
          resultImageData = ImageProcessor.gaussianBlurFilter(currentImageData);
          this.statusText.textContent = 'Gaussian blur filter applied';
          break;
        }
        case 'custom-convolution': {
          const kernelSizeSelect = document.getElementById('custom-kernel-size') as HTMLSelectElement;
          const kernelSize = parseInt(kernelSizeSelect.value);
          const kernelValues: number[] = [];
          
          // Collect kernel values from grid inputs
          if (kernelSize === 3) {
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                const input = document.getElementById(`k-${i}-${j}`) as HTMLInputElement;
                kernelValues.push(parseFloat(input.value) || 0);
              }
            }
          } else if (kernelSize === 5) {
            for (let i = 0; i < 5; i++) {
              for (let j = 0; j < 5; j++) {
                const input = document.getElementById(`k5-${i}-${j}`) as HTMLInputElement;
                kernelValues.push(parseFloat(input.value) || 0);
              }
            }
          }
          
          // Optional divisor for kernel normalization
          const divisorInput = document.getElementById('custom-divisor') as HTMLInputElement;
          const divisor = divisorInput.value ? parseFloat(divisorInput.value) : undefined;
          
          resultImageData = ImageProcessor.customConvolution(
            currentImageData,
            kernelSize,
            kernelValues,
            divisor
          );
          this.statusText.textContent = `Custom convolution applied (${kernelSize}x${kernelSize})`;
          break;
        }
        case 'stretch-histogram': {
          resultImageData = ImageProcessor.stretchHistogram(currentImageData);
          this.statusText.textContent = 'Histogram stretched (contrast enhancement)';
          break;
        }
        case 'equalize-histogram': {
          resultImageData = ImageProcessor.equalizeHistogram(currentImageData);
          this.statusText.textContent = 'Histogram equalized (improved distribution)';
          break;
        }
        case 'binarize-manual': {
          const threshold = parseFloat((document.getElementById('binarize-threshold-slider') as HTMLInputElement)?.value || '128');
          resultImageData = ImageProcessor.binarizeManual(currentImageData, threshold);
          this.statusText.textContent = `Manual binarization applied (threshold: ${threshold})`;
          break;
        }
        case 'binarize-percent': {
          const percentBlack = parseFloat((document.getElementById('percent-black-input') as HTMLInputElement)?.value || '50');
          resultImageData = ImageProcessor.binarizePercentBlack(currentImageData, percentBlack);
          this.statusText.textContent = `Percent Black binarization applied (${percentBlack}% black pixels)`;
          break;
        }
        case 'binarize-mean': {
          resultImageData = ImageProcessor.binarizeMeanIterative(currentImageData);
          this.statusText.textContent = 'Mean Iterative binarization applied';
          break;
        }
      }

      if (resultImageData) {
        this.drawingManager.updateImageData(resultImageData);
        this.showHistogram();
      }
    } catch (error) {
      console.error('Error applying image operation:', error);
      this.statusText.textContent = `Error: ${error}`;
    }
  }

  // Display histogram for current image (R, G, B channels)
  private showHistogram(): void {
    const currentImageData = this.drawingManager.getCurrentImageData();
    
    if (!currentImageData) {
      this.statusText.textContent = 'No image loaded to show histogram';
      return;
    }

    const histogram = ImageProcessor.calculateHistogram(currentImageData);
    
    const histogramDisplay = document.getElementById('histogram-display');
    if (histogramDisplay) {
      histogramDisplay.classList.remove('hidden');
    }

    // Draw histogram for each color channel
    this.drawHistogramChannel('histogram-r', histogram.r, '#ff0000');
    this.drawHistogramChannel('histogram-g', histogram.g, '#00ff00');
    this.drawHistogramChannel('histogram-b', histogram.b, '#0000ff');

    this.statusText.textContent = 'Histogram displayed';
  }

  // Draw histogram for single color channel
  private drawHistogramChannel(canvasId: string, histogram: number[], color: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const maxValue = Math.max(...histogram);
    if (maxValue === 0) return;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;

    for (let i = 0; i < 256; i++) {
      const barHeight = (histogram[i] / maxValue) * height;
      const x = i;
      const y = height - barHeight;
      
      ctx.fillRect(x, y, 1, barHeight);
    }

    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 0.5;
    
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
}