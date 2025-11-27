// Color area detection using HSV color space analysis
export class GreenAreaAnalyzer {

  // Color presets with HSV ranges
  static readonly COLOR_PRESETS: Record<string, ColorPreset> = {
    'green': {
      name: 'Green',
      hueMin: 60,
      hueMax: 180,
      satMin: 25,
      valMin: 25,
      maskColor: { r: 0, g: 255, b: 0 }
    },
    'blue': {
      name: 'Blue',
      hueMin: 180,
      hueMax: 260,
      satMin: 30,
      valMin: 30,
      maskColor: { r: 0, g: 100, b: 255 }
    },
    'red': {
      name: 'Red',
      hueMin: 0,
      hueMax: 30,
      satMin: 40,
      valMin: 40,
      maskColor: { r: 255, g: 0, b: 0 }
    },
    'yellow': {
      name: 'Yellow',
      hueMin: 30,
      hueMax: 60,
      satMin: 30,
      valMin: 50,
      maskColor: { r: 255, g: 255, b: 0 }
    },
    'brown': {
      name: 'Brown',
      hueMin: 10,
      hueMax: 40,
      satMin: 30,
      valMin: 20,
      maskColor: { r: 139, g: 90, b: 43 }
    },
    'white': {
      name: 'White',
      hueMin: 0,
      hueMax: 360,
      satMin: 0,
      valMin: 200,
      satMax: 30,
      maskColor: { r: 255, g: 255, b: 255 }
    },
    'black': {
      name: 'Black',
      hueMin: 0,
      hueMax: 360,
      satMin: 0,
      valMin: 0,
      valMax: 50,
      maskColor: { r: 50, g: 50, b: 50 }
    }
  };

  // Analyze with custom thresholds and mask color
  static analyzeWithCustomThresholds(
    imageData: ImageData,
    hueMin: number,
    hueMax: number,
    satMin: number,
    valMin: number,
    satMax: number = 255,
    valMax: number = 255,
    maskColor: { r: number; g: number; b: number } = { r: 255, g: 0, b: 255 }
  ): ColorAnalysisResult {
    const data = imageData.data;
    const totalPixels = imageData.width * imageData.height;
    let matchedPixels = 0;

    const maskData = new Uint8ClampedArray(data.length);

    // Handle hue wrap-around (e.g., red spans 350-10)
    const hueWraps = hueMin > hueMax;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const hsv = this.rgbToHsv(r, g, b);

      // Check hue range (handle wrap-around)
      let hueMatch: boolean;
      if (hueWraps) {
        hueMatch = hsv.h >= hueMin || hsv.h <= hueMax;
      } else {
        hueMatch = hsv.h >= hueMin && hsv.h <= hueMax;
      }

      const satMatch = hsv.s >= satMin && hsv.s <= satMax;
      const valMatch = hsv.v >= valMin && hsv.v <= valMax;

      if (hueMatch && satMatch && valMatch) {
        matchedPixels++;
        maskData[i] = maskColor.r;
        maskData[i + 1] = maskColor.g;
        maskData[i + 2] = maskColor.b;
        maskData[i + 3] = 255;
      } else {
        // Grayscale for non-matched pixels
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        maskData[i] = gray;
        maskData[i + 1] = gray;
        maskData[i + 2] = gray;
        maskData[i + 3] = 255;
      }
    }

    const percentage = (matchedPixels / totalPixels) * 100;

    return {
      totalPixels,
      matchedPixels,
      percentage,
      maskImageData: new ImageData(maskData, imageData.width, imageData.height)
    };
  }

  // RGB to HSV conversion
  static rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    // Calculate hue (0-360)
    let h = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        h = 60 * (((gNorm - bNorm) / delta) % 6);
      } else if (max === gNorm) {
        h = 60 * (((bNorm - rNorm) / delta) + 2);
      } else {
        h = 60 * (((rNorm - gNorm) / delta) + 4);
      }
    }
    if (h < 0) h += 360;

    // Calculate saturation (0-255)
    const s = max === 0 ? 0 : (delta / max) * 255;

    // Value is max (0-255)
    const v = max * 255;

    return { h, s, v };
  }

  // Get hue histogram for analysis
  static getHueHistogram(imageData: ImageData): number[] {
    const histogram = new Array(360).fill(0);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const hsv = this.rgbToHsv(r, g, b);
      if (hsv.s >= 20 && hsv.v >= 20) {
        histogram[Math.floor(hsv.h)]++;
      }
    }

    return histogram;
  }

  // Get preset by name
  static getPreset(name: string): ColorPreset {
    return this.COLOR_PRESETS[name] || this.COLOR_PRESETS['custom'];
  }

  // Get all preset names
  static getPresetNames(): string[] {
    return Object.keys(this.COLOR_PRESETS);
  }
}

// Color preset interface
export interface ColorPreset {
  name: string;
  hueMin: number;
  hueMax: number;
  satMin: number;
  valMin: number;
  satMax?: number;
  valMax?: number;
  maskColor: { r: number; g: number; b: number };
}

// Result interface
export interface ColorAnalysisResult {
  totalPixels: number;
  matchedPixels: number;
  percentage: number;
  maskImageData: ImageData;
}

// Legacy alias for backward compatibility
export type GreenAnalysisResult = ColorAnalysisResult;
