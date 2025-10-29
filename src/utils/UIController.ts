import { DrawingManager } from './DrawingManager';
import { Line, Rectangle, Circle } from './shapes/Import';
import { parsePPM } from './PPMLoader';

export class UIController {
  private panels: {
    drawParams: HTMLElement;
    file: HTMLElement;
    editShape: HTMLElement;
    zoom: HTMLElement;
  };
  private drawingManager: DrawingManager;
  private statusText: HTMLElement;
  
  constructor(
    panels: { drawParams: HTMLElement; file: HTMLElement; editShape: HTMLElement; zoom: HTMLElement },
    drawingManager: DrawingManager,
    statusText: HTMLElement
  ) {
    this.panels = panels;
    this.drawingManager = drawingManager;
    this.statusText = statusText;
    this.initializePanelButtons();
    this.handleFileTypeChange();
  }
  
  // Panel buttons acctions
   private initializePanelButtons(): void {
    document.getElementById('draw-params-btn')?.addEventListener('click', () => {
      this.panels.drawParams.classList.toggle('hidden');
      this.panels.file.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.zoom.classList.add('hidden');
    });
    
    document.getElementById('close-params-btn')?.addEventListener('click', () => {
      this.panels.drawParams.classList.add('hidden');
    });
    
    document.getElementById('file-btn')?.addEventListener('click', () => {
      this.panels.file.classList.toggle('hidden');
      this.panels.drawParams.classList.add('hidden');
      this.panels.editShape.classList.add('hidden');
      this.panels.zoom.classList.add('hidden');
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

    this.updateZoomDisplay();
  }

  // Update zoom display
  private updateZoomDisplay(): void {
    const zoomValue = document.getElementById('zoom-value');
    if (zoomValue) {
      const zoom = Math.round(this.drawingManager.getZoom() * 100);
      zoomValue.textContent = `${zoom}%`;
    }
  }

  // Update pixel values display
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

  public hideAllPanels(): void {
    Object.values(this.panels).forEach(panel => panel.classList.add('hidden'));
  }
  
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

    // Set file input accept attribute
    const fileInput = document.getElementById('file-input') as HTMLInputElement;

    if (fileType === 'json') {
      fileInput.accept = '.json';
    } else if (fileType === 'ppm-p3' || fileType === 'ppm-p6') {
      fileInput.accept = '.ppm';
    } else {
      fileInput.accept = '.jpg,.jpeg';
    }
  }

  private handleSaveFile(): void {
    const fileType = (document.getElementById('param-file-type') as HTMLSelectElement).value;

    if (fileType === 'json') {
      // Save drawing as JSON
      const blob = new Blob([this.drawingManager.exportToJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drawing-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.statusText.textContent = 'Drawing saved!';

    } else if (fileType === 'ppm-p3' || fileType === 'ppm-p6') {
      // PPM file is not necessarily to be implemented
      this.statusText.textContent = 'PPM file saving not implemented yet';

    } else {
      // Save drawing as JPEG
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
  
  private handleLoadFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    const fileType = (document.getElementById('param-file-type') as HTMLSelectElement).value;

    if (!file) {
      this.statusText.textContent = 'Error: No file selected';
      return;
    }

    if (fileType === 'json') {
      // Load JSON file, parse and import shapes
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
      // Load PPM-3, PPM-6 file as ArrayBuffer, parse to RGBA, draw as background
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
      // Load JPEG file as DataURL, draw as background
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

          this.drawingManager.setBackgroundImage(img, x, y, img.width * scale, img.height * scale);
          this.drawingManager.redraw();
          this.statusText.textContent = `JPEG loaded: ${img.width}x${img.height}`;
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
}