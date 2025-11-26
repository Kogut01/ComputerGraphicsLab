/**
 * Morphological Filters - Filtry morfologiczne
 * Implementacja własna bez użycia bibliotek zewnętrznych
 */
export class MorphologicalFilters {
  
  /**
   * Tworzy domyślny element strukturyzujący (kwadrat 3x3)
   * @returns Macierz elementu strukturyzującego
   */
  static createDefaultStructuringElement(): number[][] {
    return [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];
  }

  /**
   * Tworzy element strukturyzujący w kształcie krzyża
   * @param size Rozmiar elementu (musi być nieparzysty)
   * @returns Macierz elementu strukturyzującego
   */
  static createCrossStructuringElement(size: number): number[][] {
    const s = size % 2 === 0 ? size + 1 : size; // Wymusza nieparzysty rozmiar
    const center = Math.floor(s / 2);
    const element: number[][] = [];
    
    for (let i = 0; i < s; i++) {
      element[i] = [];
      for (let j = 0; j < s; j++) {
        // Ustaw 1 tylko w środkowym wierszu i kolumnie
        element[i][j] = (i === center || j === center) ? 1 : 0;
      }
    }
    
    return element;
  }

  /**
   * Tworzy element strukturyzujący w kształcie kwadratu
   * @param size Rozmiar elementu (musi być nieparzysty)
   * @returns Macierz elementu strukturyzującego
   */
  static createSquareStructuringElement(size: number): number[][] {
    const s = size % 2 === 0 ? size + 1 : size; // Wymusza nieparzysty rozmiar
    const element: number[][] = [];
    
    for (let i = 0; i < s; i++) {
      element[i] = [];
      for (let j = 0; j < s; j++) {
        element[i][j] = 1;
      }
    }
    
    return element;
  }

  /**
   * Tworzy element strukturyzujący w kształcie koła/diamentu
   * @param size Rozmiar elementu (musi być nieparzysty)
   * @returns Macierz elementu strukturyzującego
   */
  static createDiamondStructuringElement(size: number): number[][] {
    const s = size % 2 === 0 ? size + 1 : size;
    const center = Math.floor(s / 2);
    const element: number[][] = [];
    
    for (let i = 0; i < s; i++) {
      element[i] = [];
      for (let j = 0; j < s; j++) {
        // Manhattan distance od środka
        const distance = Math.abs(i - center) + Math.abs(j - center);
        element[i][j] = distance <= center ? 1 : 0;
      }
    }
    
    return element;
  }

  /**
   * Parsuje string do macierzy elementu strukturyzującego
   * Format: "1,1,1;1,1,1;1,1,1" gdzie ; oddziela wiersze, , oddziela kolumny
   * @param input String z definicją elementu
   * @returns Macierz elementu strukturyzującego lub null jeśli błąd
   */
  static parseStructuringElement(input: string): number[][] | null {
    try {
      const rows = input.trim().split(';');
      const element: number[][] = [];
      let expectedCols = -1;
      
      for (const row of rows) {
        const cols = row.trim().split(',').map(v => {
          const num = parseInt(v.trim(), 10);
          return isNaN(num) ? 0 : (num > 0 ? 1 : 0); // Normalizuj do 0 lub 1
        });
        
        if (expectedCols === -1) {
          expectedCols = cols.length;
        } else if (cols.length !== expectedCols) {
          return null; // Nierówna liczba kolumn
        }
        
        element.push(cols);
      }
      
      // Sprawdź czy rozmiar jest nieparzysty
      if (element.length % 2 === 0 || expectedCols % 2 === 0) {
        return null; // Wymaga nieparzystych rozmiarów
      }
      
      return element.length > 0 ? element : null;
    } catch {
      return null;
    }
  }

  /**
   * Konwertuje macierz elementu strukturyzującego do stringa
   * @param element Macierz elementu
   * @returns String reprezentujący element
   */
  static structuringElementToString(element: number[][]): string {
    return element.map(row => row.join(',')).join(';');
  }

  /**
   * Konwertuje obraz kolorowy na obraz w odcieniach szarości
   * @param imageData Dane obrazu
   * @returns Nowe ImageData w odcieniach szarości
   */
  private static toGrayscale(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Używamy luminancji dla lepszej jakości
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      resultData[i] = gray;
      resultData[i + 1] = gray;
      resultData[i + 2] = gray;
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  /**
   * Dylatacja - rozszerzenie jasnych obszarów obrazu
   * 
   * Dylatacja dla każdego piksela oblicza maksymalną wartość
   * spośród wszystkich pikseli pod elementem strukturyzującym.
   * Efekt: jasne obszary się rozszerzają, ciemne kurczą.
   * 
   * @param imageData Dane obrazu wejściowego
   * @param structuringElement Element strukturyzujący (macierz 0/1)
   * @param applyToGrayscale Czy najpierw przekonwertować na odcienie szarości
   * @returns Nowe ImageData po dylatacji
   */
  static dilate(
    imageData: ImageData, 
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    // Opcjonalna konwersja na szarość
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
    
    // Iteracja po wszystkich pikselach obrazu
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxR = 0;
        let maxG = 0;
        let maxB = 0;
        
        // Iteracja po elemencie strukturyzującym
        for (let seY = 0; seY < seHeight; seY++) {
          for (let seX = 0; seX < seWidth; seX++) {
            // Pomijamy piksele gdzie element strukturyzujący ma wartość 0
            if (structuringElement[seY][seX] === 0) continue;
            
            // Obliczamy pozycję piksela źródłowego
            const srcX = x + (seX - seCenterX);
            const srcY = y + (seY - seCenterY);
            
            // Sprawdzamy czy piksel jest w granicach obrazu
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              
              // Szukamy maksimum dla każdego kanału
              maxR = Math.max(maxR, data[srcIdx]);
              maxG = Math.max(maxG, data[srcIdx + 1]);
              maxB = Math.max(maxB, data[srcIdx + 2]);
            }
          }
        }
        
        // Zapisujemy wynik
        const dstIdx = (y * width + x) * 4;
        resultData[dstIdx] = maxR;
        resultData[dstIdx + 1] = maxG;
        resultData[dstIdx + 2] = maxB;
        resultData[dstIdx + 3] = data[dstIdx + 3]; // Zachowujemy alfa
      }
    }
    
    return result;
  }

  /**
   * Erozja - zmniejszenie jasnych obszarów obrazu
   * 
   * Erozja dla każdego piksela oblicza minimalną wartość
   * spośród wszystkich pikseli pod elementem strukturyzującym.
   * Efekt: jasne obszary się kurczą, ciemne rozszerzają.
   * 
   * @param imageData Dane obrazu wejściowego
   * @param structuringElement Element strukturyzujący (macierz 0/1)
   * @param applyToGrayscale Czy najpierw przekonwertować na odcienie szarości
   * @returns Nowe ImageData po erozji
   */
  static erode(
    imageData: ImageData, 
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    // Opcjonalna konwersja na szarość
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
    
    // Iteracja po wszystkich pikselach obrazu
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minR = 255;
        let minG = 255;
        let minB = 255;
        
        // Iteracja po elemencie strukturyzującym
        for (let seY = 0; seY < seHeight; seY++) {
          for (let seX = 0; seX < seWidth; seX++) {
            // Pomijamy piksele gdzie element strukturyzujący ma wartość 0
            if (structuringElement[seY][seX] === 0) continue;
            
            // Obliczamy pozycję piksela źródłowego
            const srcX = x + (seX - seCenterX);
            const srcY = y + (seY - seCenterY);
            
            // Sprawdzamy czy piksel jest w granicach obrazu
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              
              // Szukamy minimum dla każdego kanału
              minR = Math.min(minR, data[srcIdx]);
              minG = Math.min(minG, data[srcIdx + 1]);
              minB = Math.min(minB, data[srcIdx + 2]);
            }
          }
        }
        
        // Zapisujemy wynik
        const dstIdx = (y * width + x) * 4;
        resultData[dstIdx] = minR;
        resultData[dstIdx + 1] = minG;
        resultData[dstIdx + 2] = minB;
        resultData[dstIdx + 3] = data[dstIdx + 3]; // Zachowujemy alfa
      }
    }
    
    return result;
  }

  /**
   * Opening (erosion + dilation)
   * Removes small bright objects and smooths contours
   */
  static open(
    imageData: ImageData,
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    const eroded = this.erode(imageData, structuringElement, applyToGrayscale);
    return this.dilate(eroded, structuringElement, false);
  }

  /**
   * Closing (dilation + erosion)
   * Removes small dark objects and fills small holes
   */
  static close(
    imageData: ImageData,
    structuringElement: number[][] = this.createDefaultStructuringElement(),
    applyToGrayscale: boolean = false
  ): ImageData {
    const dilated = this.dilate(imageData, structuringElement, applyToGrayscale);
    return this.erode(dilated, structuringElement, false);
  }

  /**
   * Converts image to binary (black and white) based on threshold
   * @param imageData Input image data
   * @param threshold Threshold value (0-255), default 128
   * @returns Binary ImageData
   */
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

  /**
   * Hit-or-Miss Transform
   * 
   * The Hit-or-Miss transform is used for shape detection.
   * It uses two structuring elements:
   * - B1 (hit): pixels that must be foreground (1/white)
   * - B2 (miss): pixels that must be background (0/black)
   * 
   * A pixel is set to white only if:
   * - All B1 positions match foreground pixels
   * - All B2 positions match background pixels
   * 
   * For a combined SE: 1 = must be foreground, 0 = must be background, -1 = don't care
   * 
   * @param imageData Input binary image
   * @param hitElement Structuring element for hit (foreground matching)
   * @param missElement Structuring element for miss (background matching)
   * @returns Transformed ImageData
   */
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
    
    // Process each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let hitMatch = true;
        let missMatch = true;
        
        // Check structuring element
        for (let seY = 0; seY < seHeight && (hitMatch || missMatch); seY++) {
          for (let seX = 0; seX < seWidth && (hitMatch || missMatch); seX++) {
            const srcX = x + (seX - seCenterX);
            const srcY = y + (seY - seCenterY);
            
            // Handle boundary - treat as background (black)
            let pixelValue = 0;
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              pixelValue = data[srcIdx] > 128 ? 1 : 0; // Binary: 1 = white, 0 = black
            }
            
            // Check hit element (must match foreground/white)
            if (hitElement[seY][seX] === 1 && pixelValue !== 1) {
              hitMatch = false;
            }
            
            // Check miss element (must match background/black)
            if (missElement[seY][seX] === 1 && pixelValue !== 0) {
              missMatch = false;
            }
          }
        }
        
        // Set result pixel
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

  /**
   * Creates standard thinning structuring elements (Golay alphabet)
   * Returns array of [hitElement, missElement] pairs for 8 rotations
   */
  static createThinningElements(): Array<[number[][], number[][]]> {
    // Standard thinning SE patterns (B1 = hit, B2 = miss)
    // Pattern 1 and its rotations
    const patterns: Array<[number[][], number[][]]> = [
      // North
      [
        [[0, 0, 0], [0, 1, 0], [1, 1, 1]],  // hit
        [[1, 1, 1], [0, 0, 0], [0, 0, 0]]   // miss
      ],
      // Northeast
      [
        [[0, 0, 0], [1, 1, 0], [1, 1, 0]],
        [[0, 1, 1], [0, 0, 1], [0, 0, 0]]
      ],
      // East
      [
        [[1, 0, 0], [1, 1, 0], [1, 0, 0]],
        [[0, 0, 1], [0, 0, 1], [0, 0, 1]]
      ],
      // Southeast
      [
        [[1, 1, 0], [1, 1, 0], [0, 0, 0]],
        [[0, 0, 0], [0, 0, 1], [0, 1, 1]]
      ],
      // South
      [
        [[1, 1, 1], [0, 1, 0], [0, 0, 0]],
        [[0, 0, 0], [0, 0, 0], [1, 1, 1]]
      ],
      // Southwest
      [
        [[0, 1, 1], [0, 1, 1], [0, 0, 0]],
        [[0, 0, 0], [1, 0, 0], [1, 1, 0]]
      ],
      // West
      [
        [[0, 0, 1], [0, 1, 1], [0, 0, 1]],
        [[1, 0, 0], [1, 0, 0], [1, 0, 0]]
      ],
      // Northwest
      [
        [[0, 0, 0], [0, 1, 1], [0, 1, 1]],
        [[1, 1, 0], [1, 0, 0], [0, 0, 0]]
      ]
    ];
    
    return patterns;
  }

  /**
   * Creates standard thickening structuring elements
   * Returns array of [hitElement, missElement] pairs for 8 rotations
   */
  static createThickeningElements(): Array<[number[][], number[][]]> {
    // Thickening uses complement patterns of thinning
    const patterns: Array<[number[][], number[][]]> = [
      // North
      [
        [[1, 1, 1], [0, 0, 0], [0, 0, 0]],  // hit (was miss in thinning)
        [[0, 0, 0], [0, 1, 0], [1, 1, 1]]   // miss (was hit in thinning)
      ],
      // Northeast
      [
        [[0, 1, 1], [0, 0, 1], [0, 0, 0]],
        [[0, 0, 0], [1, 1, 0], [1, 1, 0]]
      ],
      // East
      [
        [[0, 0, 1], [0, 0, 1], [0, 0, 1]],
        [[1, 0, 0], [1, 1, 0], [1, 0, 0]]
      ],
      // Southeast
      [
        [[0, 0, 0], [0, 0, 1], [0, 1, 1]],
        [[1, 1, 0], [1, 1, 0], [0, 0, 0]]
      ],
      // South
      [
        [[0, 0, 0], [0, 0, 0], [1, 1, 1]],
        [[1, 1, 1], [0, 1, 0], [0, 0, 0]]
      ],
      // Southwest
      [
        [[0, 0, 0], [1, 0, 0], [1, 1, 0]],
        [[0, 1, 1], [0, 1, 1], [0, 0, 0]]
      ],
      // West
      [
        [[1, 0, 0], [1, 0, 0], [1, 0, 0]],
        [[0, 0, 1], [0, 1, 1], [0, 0, 1]]
      ],
      // Northwest
      [
        [[1, 1, 0], [1, 0, 0], [0, 0, 0]],
        [[0, 0, 0], [0, 1, 1], [0, 1, 1]]
      ]
    ];
    
    return patterns;
  }

  /**
   * Thinning operation (skeletonization)
   * 
   * Iteratively removes pixels from the boundary of objects
   * while preserving connectivity, resulting in a skeleton.
   * Uses Hit-or-Miss transform with 8 rotational patterns.
   * 
   * @param imageData Input binary image
   * @param maxIterations Maximum iterations (0 = until convergence)
   * @returns Thinned ImageData
   */
  static thin(
    imageData: ImageData,
    maxIterations: number = 0
  ): ImageData {
    let current = this.toBinary(imageData, 128);
    const patterns = this.createThinningElements();
    
    let iteration = 0;
    let changed = true;
    
    while (changed && (maxIterations === 0 || iteration < maxIterations)) {
      changed = false;
      
      // Apply each pattern
      for (const [hitEl, missEl] of patterns) {
        // Find pixels to remove using hit-or-miss
        const toRemove = this.hitOrMiss(current, hitEl, missEl);
        
        // Subtract hit-or-miss result from current image
        const newData = new ImageData(current.width, current.height);
        for (let i = 0; i < current.data.length; i += 4) {
          const currentPixel = current.data[i] > 128 ? 1 : 0;
          const removePixel = toRemove.data[i] > 128 ? 1 : 0;
          const newValue = (currentPixel === 1 && removePixel === 0) ? 255 : 0;
          
          if (current.data[i] !== newValue) {
            changed = true;
          }
          
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

  /**
   * Thickening operation
   * 
   * Iteratively adds pixels to the boundary of objects.
   * Opposite of thinning - expands objects while preserving shape.
   * Uses Hit-or-Miss transform with 8 rotational patterns.
   * 
   * @param imageData Input binary image
   * @param maxIterations Maximum iterations (0 = until convergence)
   * @returns Thickened ImageData
   */
  static thicken(
    imageData: ImageData,
    maxIterations: number = 0
  ): ImageData {
    let current = this.toBinary(imageData, 128);
    const patterns = this.createThickeningElements();
    
    let iteration = 0;
    let changed = true;
    
    while (changed && (maxIterations === 0 || iteration < maxIterations)) {
      changed = false;
      
      // Apply each pattern
      for (const [hitEl, missEl] of patterns) {
        // Find pixels to add using hit-or-miss
        const toAdd = this.hitOrMiss(current, hitEl, missEl);
        
        // Union hit-or-miss result with current image
        const newData = new ImageData(current.width, current.height);
        for (let i = 0; i < current.data.length; i += 4) {
          const currentPixel = current.data[i] > 128 ? 1 : 0;
          const addPixel = toAdd.data[i] > 128 ? 1 : 0;
          const newValue = (currentPixel === 1 || addPixel === 1) ? 255 : 0;
          
          if (current.data[i] !== newValue) {
            changed = true;
          }
          
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
