export class ImageProcessor {
  
  static add(imageData: ImageData, r: number, g: number, b: number): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      resultData[i] = this.clamp(data[i] + r);     
      resultData[i + 1] = this.clamp(data[i + 1] + g); 
      resultData[i + 2] = this.clamp(data[i + 2] + b); 
      resultData[i + 3] = data[i + 3];              
    }
    
    return result;
  }

  static subtract(imageData: ImageData, r: number, g: number, b: number): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      resultData[i] = this.clamp(data[i] - r);     
      resultData[i + 1] = this.clamp(data[i + 1] - g); 
      resultData[i + 2] = this.clamp(data[i + 2] - b); 
      resultData[i + 3] = data[i + 3];              
    }
    
    return result;
  }

  static multiply(imageData: ImageData, r: number, g: number, b: number): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      resultData[i] = this.clamp(data[i] * r);     
      resultData[i + 1] = this.clamp(data[i + 1] * g); 
      resultData[i + 2] = this.clamp(data[i + 2] * b); 
      resultData[i + 3] = data[i + 3];              
    }
    
    return result;
  }

  static divide(imageData: ImageData, r: number, g: number, b: number): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    // Prevent division by zero
    const rDiv = r === 0 ? 1 : r;
    const gDiv = g === 0 ? 1 : g;
    const bDiv = b === 0 ? 1 : b;
    
    for (let i = 0; i < data.length; i += 4) {
      resultData[i] = this.clamp(data[i] / rDiv);     
      resultData[i + 1] = this.clamp(data[i + 1] / gDiv); 
      resultData[i + 2] = this.clamp(data[i + 2] / bDiv); 
      resultData[i + 3] = data[i + 3];                 
    }
    
    return result;
  }

  static brightness(imageData: ImageData, value: number): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      resultData[i] = this.clamp(data[i] + value);     
      resultData[i + 1] = this.clamp(data[i + 1] + value); 
      resultData[i + 2] = this.clamp(data[i + 2] + value); 
      resultData[i + 3] = data[i + 3];                  
    }
    
    return result;
  }

  // Gray = (R + G + B) / 3
  static grayscaleAverage(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
      
      resultData[i] = gray;
      resultData[i + 1] = gray;
      resultData[i + 2] = gray;
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  // Gray = 0.299*R + 0.587*G + 0.114*B
  static grayscaleLuminance(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(
        0.299 * data[i] +
        0.587 * data[i + 1] +
        0.114 * data[i + 2]
      );

      resultData[i] = gray;
      resultData[i + 1] = gray;
      resultData[i + 2] = gray;
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  // Gray = (max(R,G,B) + min(R,G,B)) / 2
  static grayscaleDesaturation(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const gray = Math.round((max + min) / 2);
      
      resultData[i] = gray;
      resultData[i + 1] = gray;
      resultData[i + 2] = gray;
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  // Averaging values from 3x3 window
  static smoothingFilter(imageData: ImageData): ImageData {
    const kernel = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ];
    return this.applyConvolution(imageData, kernel, 9);
  }

  // Pixel replacement with median from 3x3 window
  static medianFilter(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    const width = imageData.width;
    const height = imageData.height;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];
        
        // Collecting values from 3x3 window
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nx = Math.max(0, Math.min(width - 1, x + kx));
            const ny = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (ny * width + nx) * 4;
            
            rValues.push(data[idx]);
            gValues.push(data[idx + 1]);
            bValues.push(data[idx + 2]);
          }
        }

        // Sorting and selecting median
        rValues.sort((a, b) => a - b);
        gValues.sort((a, b) => a - b);
        bValues.sort((a, b) => a - b);
        
        const medianIdx = Math.floor(rValues.length / 2);
        const resultIdx = (y * width + x) * 4;
        
        resultData[resultIdx] = rValues[medianIdx];
        resultData[resultIdx + 1] = gValues[medianIdx];
        resultData[resultIdx + 2] = bValues[medianIdx];
        resultData[resultIdx + 3] = data[resultIdx + 3];
      }
    }
    
    return result;
  }

  // Detects horizontal and vertical edges
  static sobelFilter(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    const width = imageData.width;
    const height = imageData.height;

    // Sobel mask for horizontal gradient (Gx)
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];

    // Sobel mask for vertical gradient (Gy)
    const sobelY = [
      [-1, -2, -1],
      [ 0,  0,  0],
      [ 1,  2,  1]
    ];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let gxR = 0, gxG = 0, gxB = 0;
        let gyR = 0, gyG = 0, gyB = 0;

        // Convolution with both masks
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nx = Math.max(0, Math.min(width - 1, x + kx));
            const ny = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (ny * width + nx) * 4;
            
            const weightX = sobelX[ky + 1][kx + 1];
            const weightY = sobelY[ky + 1][kx + 1];
            
            gxR += data[idx] * weightX;
            gxG += data[idx + 1] * weightX;
            gxB += data[idx + 2] * weightX;
            
            gyR += data[idx] * weightY;
            gyG += data[idx + 1] * weightY;
            gyB += data[idx + 2] * weightY;
          }
        }

        // Gradient magnitude = sqrt(Gx^2 + Gy^2)
        const magnitudeR = Math.sqrt(gxR * gxR + gyR * gyR);
        const magnitudeG = Math.sqrt(gxG * gxG + gyG * gyG);
        const magnitudeB = Math.sqrt(gxB * gxB + gyB * gyB);
        
        const resultIdx = (y * width + x) * 4;
        resultData[resultIdx] = this.clamp(magnitudeR);
        resultData[resultIdx + 1] = this.clamp(magnitudeG);
        resultData[resultIdx + 2] = this.clamp(magnitudeB);
        resultData[resultIdx + 3] = data[resultIdx + 3];
      }
    }
    
    return result;
  }

  // Enhances edges and details
  static sharpenFilter(imageData: ImageData): ImageData {
    const kernel = [
      [ 0, -1,  0],
      [-1,  5, -1],
      [ 0, -1,  0]
    ];
    return this.applyConvolution(imageData, kernel, 1);
  }

  static gaussianBlurFilter(imageData: ImageData): ImageData {
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    return this.applyConvolution(imageData, kernel, 16);
  }

  // Universal convolution method with any kernel
  static applyConvolution(
    imageData: ImageData, 
    kernel: number[][], 
    divisor: number = 1,
    offset: number = 0
  ): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const kernelHeight = kernel.length;
    const kernelWidth = kernel[0].length;
    const kernelRadiusY = Math.floor(kernelHeight / 2);
    const kernelRadiusX = Math.floor(kernelWidth / 2);

    // Processing each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0;

        // Convolution with kernel
        for (let ky = 0; ky < kernelHeight; ky++) {
          for (let kx = 0; kx < kernelWidth; kx++) {
            // Pixel coordinates in the image
            const pixelY = y + ky - kernelRadiusY;
            const pixelX = x + kx - kernelRadiusX;

            // Boundary handling - replicating edge values
            const clampedX = Math.max(0, Math.min(width - 1, pixelX));
            const clampedY = Math.max(0, Math.min(height - 1, pixelY));
            const idx = (clampedY * width + clampedX) * 4;
            
            const weight = kernel[ky][kx];
            
            sumR += data[idx] * weight;
            sumG += data[idx + 1] * weight;
            sumB += data[idx + 2] * weight;
          }
        }

        // Saving the resulting values with normalization
        const resultIdx = (y * width + x) * 4;
        resultData[resultIdx] = this.clamp(sumR / divisor + offset);
        resultData[resultIdx + 1] = this.clamp(sumG / divisor + offset);
        resultData[resultIdx + 2] = this.clamp(sumB / divisor + offset);
        resultData[resultIdx + 3] = data[resultIdx + 3];
      }
    }
    
    return result;
  }

  // Returns histograms for R, G, B (arrays of 256 elements)
  static calculateHistogram(imageData: ImageData): { r: number[]; g: number[]; b: number[] } {
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);
    
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      histR[data[i]]++;
      histG[data[i + 1]]++;
      histB[data[i + 2]]++;
    }
    
    return { r: histR, g: histG, b: histB };
  }

  // Stretches the range to full 0-255: output = (input - min) * 255 / (max - min)
  static stretchHistogram(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;

    // Find min and max for each channel
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      minR = Math.min(minR, data[i]);
      maxR = Math.max(maxR, data[i]);
      minG = Math.min(minG, data[i + 1]);
      maxG = Math.max(maxG, data[i + 1]);
      minB = Math.min(minB, data[i + 2]);
      maxB = Math.max(maxB, data[i + 2]);
    }

    // Calculate ranges
    const rangeR = maxR - minR;
    const rangeG = maxG - minG;
    const rangeB = maxB - minB;

    // Apply stretching
    for (let i = 0; i < data.length; i += 4) {
      // If range is 0, all pixels have the same value
      if (rangeR === 0) {
        resultData[i] = data[i];
      } else {
        resultData[i] = this.clamp((data[i] - minR) * 255 / rangeR);
      }
      
      if (rangeG === 0) {
        resultData[i + 1] = data[i + 1];
      } else {
        resultData[i + 1] = this.clamp((data[i + 1] - minG) * 255 / rangeG);
      }
      
      if (rangeB === 0) {
        resultData[i + 2] = data[i + 2];
      } else {
        resultData[i + 2] = this.clamp((data[i + 2] - minB) * 255 / rangeB);
      }
      
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }


  static equalizeHistogram(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    const hist = this.calculateHistogram(imageData);

    // Calculate CDF (Cumulative Distribution Function) for each channel
    const cdfR = this.calculateCDF(hist.r);
    const cdfG = this.calculateCDF(hist.g);
    const cdfB = this.calculateCDF(hist.b);

    // Find the first non-zero CDF value for each channel
    const cdfMinR = cdfR.find(v => v > 0) || 0;
    const cdfMinG = cdfG.find(v => v > 0) || 0;
    const cdfMinB = cdfB.find(v => v > 0) || 0;

    // Total number of pixels
    const totalPixels = imageData.width * imageData.height;

    // Apply histogram equalization
    for (let i = 0; i < data.length; i += 4) {
      // Formula: h(v) = round(((cdf(v) - cdfMin) / (totalPixels - cdfMin)) * 255)
      resultData[i] = Math.round(
        ((cdfR[data[i]] - cdfMinR) / (totalPixels - cdfMinR)) * 255
      );
      resultData[i + 1] = Math.round(
        ((cdfG[data[i + 1]] - cdfMinG) / (totalPixels - cdfMinG)) * 255
      );
      resultData[i + 2] = Math.round(
        ((cdfB[data[i + 2]] - cdfMinB) / (totalPixels - cdfMinB)) * 255
      );
      resultData[i + 3] = data[i + 3];
    }
    
    return result;
  }

  private static calculateCDF(histogram: number[]): number[] {
    const cdf = new Array(256).fill(0);
    cdf[0] = histogram[0];
    
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }
    
    return cdf;
  }

  // Convert 1D array to 2D and apply convolution
  static customConvolution(
    imageData: ImageData,
    kernelSize: number,
    kernelValues: number[],
    divisor?: number
  ): ImageData {
    // Konwersja tablicy 1D na 2D
    const kernel: number[][] = [];
    for (let i = 0; i < kernelSize; i++) {
      kernel[i] = [];
      for (let j = 0; j < kernelSize; j++) {
        kernel[i][j] = kernelValues[i * kernelSize + j];
      }
    }
    
    if (divisor === undefined) {
      divisor = kernelValues.reduce((sum, val) => sum + val, 0);
      if (divisor === 0) divisor = 1;
    }
    
    return this.applyConvolution(imageData, kernel, divisor);
  }

  // Convert to grayscale, then binarize
  static binarizeManual(imageData: ImageData, threshold: number): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const binary = gray >= threshold ? 255 : 0;
      
      resultData[i] = binary;     // R
      resultData[i + 1] = binary; // G
      resultData[i + 2] = binary; // B
      resultData[i + 3] = data[i + 3]; // A
    }
    
    return result;
  }

  // Automatic thresholding based on % of black pixels
  static binarizePercentBlack(imageData: ImageData, percentBlack: number): ImageData {
    const data = imageData.data;
    const grayValues: number[] = [];

    // Convert to grayscale and collect values
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayValues.push(gray);
    }
    
    // Find the threshold corresponding to percentBlack% of darkest pixels
    const index = Math.floor((percentBlack / 100) * grayValues.length);
    const threshold = grayValues[Math.min(index, grayValues.length - 1)];

    // Apply binarization with the calculated threshold
    return this.binarizeManual(imageData, threshold);
  }

  // Iterative thresholding based on the means of both groups
  static binarizeMeanIterative(imageData: ImageData, maxIterations: number = 100, tolerance: number = 0.5): ImageData {
    const data = imageData.data;
    const grayValues: number[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayValues.push(gray);
    }
    
    let threshold = grayValues.reduce((sum, val) => sum + val, 0) / grayValues.length;
    let prevThreshold = threshold;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let sumBelow = 0, countBelow = 0;
      let sumAbove = 0, countAbove = 0;
      
      for (const gray of grayValues) {
        if (gray < threshold) {
          sumBelow += gray;
          countBelow++;
        } else {
          sumAbove += gray;
          countAbove++;
        }
      }
      
      const meanBelow = countBelow > 0 ? sumBelow / countBelow : 0;
      const meanAbove = countAbove > 0 ? sumAbove / countAbove : 255;
      
      threshold = (meanBelow + meanAbove) / 2;
      
      if (Math.abs(threshold - prevThreshold) < tolerance) {
        break;
      }
      
      prevThreshold = threshold;
    }
    
    return this.binarizeManual(imageData, threshold);
  }

  private static clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }
}
