// Morphological Filters - custom implementation without external libraries
export class MorphologicalFilters {
  
  // Default 3x3 square structuring element
  static createDefaultStructuringElement(): number[][] {
    return [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];
  }

  // Cross-shaped structuring element
  static createCrossStructuringElement(size: number): number[][] {
    const s = size % 2 === 0 ? size + 1 : size;
    const center = Math.floor(s / 2);
    const element: number[][] = [];
    
    for (let i = 0; i < s; i++) {
      element[i] = [];
      for (let j = 0; j < s; j++) {
        element[i][j] = (i === center || j === center) ? 1 : 0;
      }
    }
    
    return element;
  }

  // Square structuring element
  static createSquareStructuringElement(size: number): number[][] {
    const s = size % 2 === 0 ? size + 1 : size;
    const element: number[][] = [];
    
    for (let i = 0; i < s; i++) {
      element[i] = [];
      for (let j = 0; j < s; j++) {
        element[i][j] = 1;
      }
    }
    
    return element;
  }

  // Diamond-shaped structuring element (Manhattan distance)
  static createDiamondStructuringElement(size: number): number[][] {
    const s = size % 2 === 0 ? size + 1 : size;
    const center = Math.floor(s / 2);
    const element: number[][] = [];
    
    for (let i = 0; i < s; i++) {
      element[i] = [];
      for (let j = 0; j < s; j++) {
        const distance = Math.abs(i - center) + Math.abs(j - center);
        element[i][j] = distance <= center ? 1 : 0;
      }
    }
    
    return element;
  }

  // Parse string to SE matrix (format: "1,1,1;1,1,1;1,1,1")
  static parseStructuringElement(input: string): number[][] | null {
    try {
      const rows = input.trim().split(';');
      const element: number[][] = [];
      let expectedCols = -1;
      
      for (const row of rows) {
        const cols = row.trim().split(',').map(v => {
          const num = parseInt(v.trim(), 10);
          return isNaN(num) ? 0 : (num > 0 ? 1 : 0);
        });
        
        if (expectedCols === -1) {
          expectedCols = cols.length;
        } else if (cols.length !== expectedCols) {
          return null;
        }
        
        element.push(cols);
      }
      
      // Size must be odd
      if (element.length % 2 === 0 || expectedCols % 2 === 0) {
        return null;
      }
      
      return element.length > 0 ? element : null;
    } catch {
      return null;
    }
  }

  // Convert SE matrix to string
  static structuringElementToString(element: number[][]): string {
    return element.map(row => row.join(',')).join(';');
  }

  // Convert to grayscale using luminance
  private static toGrayscale(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      resultData[i] = gray;
      resultData[i + 1] = gray;
      resultData[i + 2] = gray;
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  // Binarize image using threshold
  static binarize(imageData: ImageData, threshold: number = 128): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale first
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      // Apply threshold - white (255) if above, black (0) if below
      const binary = gray >= threshold ? 255 : 0;
      resultData[i] = binary;
      resultData[i + 1] = binary;
      resultData[i + 2] = binary;
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  // Dilation - expands bright areas (takes max value under SE)
  static dilate(
    imageData: ImageData, 
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    const sourceData = applyToGrayscale ? this.toGrayscale(imageData) : imageData;
    
    const width = sourceData.width;
    const height = sourceData.height;
    const data = sourceData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;
    
    const seHeight = structuringElement.length;
    const seWidth = structuringElement[0].length;
    const seCenterY = Math.floor(seHeight / 2);
    const seCenterX = Math.floor(seWidth / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxR = 0;
        let maxG = 0;
        let maxB = 0;
        
        for (let seY = 0; seY < seHeight; seY++) {
          for (let seX = 0; seX < seWidth; seX++) {
            if (structuringElement[seY][seX] === 0) continue;
            
            const srcX = x + (seX - seCenterX);
            const srcY = y + (seY - seCenterY);
            
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              maxR = Math.max(maxR, data[srcIdx]);
              maxG = Math.max(maxG, data[srcIdx + 1]);
              maxB = Math.max(maxB, data[srcIdx + 2]);
            }
          }
        }
        
        const dstIdx = (y * width + x) * 4;
        resultData[dstIdx] = maxR;
        resultData[dstIdx + 1] = maxG;
        resultData[dstIdx + 2] = maxB;
        resultData[dstIdx + 3] = data[dstIdx + 3];
      }
    }
    
    return result;
  }

  // Erosion - shrinks bright areas (takes min value under SE)
  static erode(
    imageData: ImageData, 
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    const sourceData = applyToGrayscale ? this.toGrayscale(imageData) : imageData;
    
    const width = sourceData.width;
    const height = sourceData.height;
    const data = sourceData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;
    
    const seHeight = structuringElement.length;
    const seWidth = structuringElement[0].length;
    const seCenterY = Math.floor(seHeight / 2);
    const seCenterX = Math.floor(seWidth / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minR = 255;
        let minG = 255;
        let minB = 255;
        
        for (let seY = 0; seY < seHeight; seY++) {
          for (let seX = 0; seX < seWidth; seX++) {
            if (structuringElement[seY][seX] === 0) continue;
            
            const srcX = x + (seX - seCenterX);
            const srcY = y + (seY - seCenterY);
            
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              minR = Math.min(minR, data[srcIdx]);
              minG = Math.min(minG, data[srcIdx + 1]);
              minB = Math.min(minB, data[srcIdx + 2]);
            }
          }
        }
        
        const dstIdx = (y * width + x) * 4;
        resultData[dstIdx] = minR;
        resultData[dstIdx + 1] = minG;
        resultData[dstIdx + 2] = minB;
        resultData[dstIdx + 3] = data[dstIdx + 3];
      }
    }
    
    return result;
  }

  // Opening - erosion followed by dilation (removes small bright objects)
  static open(
    imageData: ImageData,
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    const eroded = this.erode(imageData, structuringElement, applyToGrayscale);
    return this.dilate(eroded, structuringElement, false);
  }

  // Closing - dilation followed by erosion (fills small dark holes)
  static close(
    imageData: ImageData,
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    const dilated = this.dilate(imageData, structuringElement, applyToGrayscale);
    return this.erode(dilated, structuringElement, false);
  }

  // Convert to binary image based on threshold
  static toBinary(imageData: ImageData, threshold: number = 128): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      const binary = gray >= threshold ? 255 : 0;
      resultData[i] = binary;
      resultData[i + 1] = binary;
      resultData[i + 2] = binary;
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  // Hit-or-Miss transform - shape detection using two SEs (hit and miss)
  static hitOrMiss(
    imageData: ImageData,
    hitElement: number[][],
    missElement: number[][]
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;
    
    const seHeight = hitElement.length;
    const seWidth = hitElement[0].length;
    const seCenterY = Math.floor(seHeight / 2);
    const seCenterX = Math.floor(seWidth / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let hitMatch = true;
        let missMatch = true;
        
        for (let seY = 0; seY < seHeight && (hitMatch || missMatch); seY++) {
          for (let seX = 0; seX < seWidth && (hitMatch || missMatch); seX++) {
            const srcX = x + (seX - seCenterX);
            const srcY = y + (seY - seCenterY);
            
            // Boundary = background (black)
            let pixelValue = 0;
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              pixelValue = data[srcIdx] > 128 ? 1 : 0;
            }
            
            // Hit must match foreground (white)
            if (hitElement[seY][seX] === 1 && pixelValue !== 1) {
              hitMatch = false;
            }
            
            // Miss must match background (black)
            if (missElement[seY][seX] === 1 && pixelValue !== 0) {
              missMatch = false;
            }
          }
        }
        
        const dstIdx = (y * width + x) * 4;
        const outputValue = (hitMatch && missMatch) ? 255 : 0;
        resultData[dstIdx] = outputValue;
        resultData[dstIdx + 1] = outputValue;
        resultData[dstIdx + 2] = outputValue;
        resultData[dstIdx + 3] = 255;
      }
    }
    
    return result;
  }

  // Thinning SE patterns (8 rotations - Golay alphabet)
  static createThinningElements(): Array<[number[][], number[][]]> {
    return [
      [[[0, 0, 0], [0, 1, 0], [1, 1, 1]], [[1, 1, 1], [0, 0, 0], [0, 0, 0]]],
      [[[0, 0, 0], [1, 1, 0], [1, 1, 0]], [[0, 1, 1], [0, 0, 1], [0, 0, 0]]],
      [[[1, 0, 0], [1, 1, 0], [1, 0, 0]], [[0, 0, 1], [0, 0, 1], [0, 0, 1]]],
      [[[1, 1, 0], [1, 1, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 1], [0, 1, 1]]],
      [[[1, 1, 1], [0, 1, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [1, 1, 1]]],
      [[[0, 1, 1], [0, 1, 1], [0, 0, 0]], [[0, 0, 0], [1, 0, 0], [1, 1, 0]]],
      [[[0, 0, 1], [0, 1, 1], [0, 0, 1]], [[1, 0, 0], [1, 0, 0], [1, 0, 0]]],
      [[[0, 0, 0], [0, 1, 1], [0, 1, 1]], [[1, 1, 0], [1, 0, 0], [0, 0, 0]]]
    ];
  }

  // Thickening SE patterns (complement of thinning)
  static createThickeningElements(): Array<[number[][], number[][]]> {
    return [
      [[[1, 1, 1], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 1, 0], [1, 1, 1]]],
      [[[0, 1, 1], [0, 0, 1], [0, 0, 0]], [[0, 0, 0], [1, 1, 0], [1, 1, 0]]],
      [[[0, 0, 1], [0, 0, 1], [0, 0, 1]], [[1, 0, 0], [1, 1, 0], [1, 0, 0]]],
      [[[0, 0, 0], [0, 0, 1], [0, 1, 1]], [[1, 1, 0], [1, 1, 0], [0, 0, 0]]],
      [[[0, 0, 0], [0, 0, 0], [1, 1, 1]], [[1, 1, 1], [0, 1, 0], [0, 0, 0]]],
      [[[0, 0, 0], [1, 0, 0], [1, 1, 0]], [[0, 1, 1], [0, 1, 1], [0, 0, 0]]],
      [[[1, 0, 0], [1, 0, 0], [1, 0, 0]], [[0, 0, 1], [0, 1, 1], [0, 0, 1]]],
      [[[1, 1, 0], [1, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 1, 1], [0, 1, 1]]]
    ];
  }

  // Thinning - iteratively removes boundary pixels (skeletonization)
  static thin(imageData: ImageData, maxIterations: number = 0): ImageData {
    let current = this.toBinary(imageData, 128);
    const patterns = this.createThinningElements();
    
    let iteration = 0;
    let changed = true;
    
    while (changed && (maxIterations === 0 || iteration < maxIterations)) {
      changed = false;
      
      for (const [hitEl, missEl] of patterns) {
        const toRemove = this.hitOrMiss(current, hitEl, missEl);
        
        // Subtract hit-or-miss result from current image
        const newData = new ImageData(current.width, current.height);
        for (let i = 0; i < current.data.length; i += 4) {
          const currentPixel = current.data[i] > 128 ? 1 : 0;
          const removePixel = toRemove.data[i] > 128 ? 1 : 0;
          const newValue = (currentPixel === 1 && removePixel === 0) ? 255 : 0;
          
          if (current.data[i] !== newValue) changed = true;
          
          newData.data[i] = newValue;
          newData.data[i + 1] = newValue;
          newData.data[i + 2] = newValue;
          newData.data[i + 3] = 255;
        }
        
        current = newData;
      }
      
      iteration++;
    }
    
    return current;
  }

  // Thickening - iteratively adds boundary pixels
  static thicken(imageData: ImageData, maxIterations: number = 0): ImageData {
    let current = this.toBinary(imageData, 128);
    const patterns = this.createThickeningElements();
    
    let iteration = 0;
    let changed = true;
    
    while (changed && (maxIterations === 0 || iteration < maxIterations)) {
      changed = false;
      
      for (const [hitEl, missEl] of patterns) {
        const toAdd = this.hitOrMiss(current, hitEl, missEl);
        
        // Union hit-or-miss result with current image
        const newData = new ImageData(current.width, current.height);
        for (let i = 0; i < current.data.length; i += 4) {
          const currentPixel = current.data[i] > 128 ? 1 : 0;
          const addPixel = toAdd.data[i] > 128 ? 1 : 0;
          const newValue = (currentPixel === 1 || addPixel === 1) ? 255 : 0;
          
          if (current.data[i] !== newValue) changed = true;
          
          newData.data[i] = newValue;
          newData.data[i + 1] = newValue;
          newData.data[i + 2] = newValue;
          newData.data[i + 3] = 255;
        }
        
        current = newData;
      }
      
      iteration++;
    }
    
    return current;
  }
}
