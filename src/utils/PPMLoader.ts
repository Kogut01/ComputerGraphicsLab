export type PPMImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

// Parses PPM image from ArrayBuffer
export function parsePPM(buffer: ArrayBuffer): PPMImage {
  const u8 = new Uint8Array(buffer);
  if (u8.length < 2) throw new Error('PPM: file too small');

  // Check for optional UTF-8
  let offset = 0;
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
    offset = 3;
  }
  const magic = String.fromCharCode(u8[offset], u8[offset + 1]);

  if (magic === 'P3') {
    return parseP3(buffer.slice(offset));
  } else if (magic === 'P6') {
    return parseP6(u8, offset);
  } else {
    throw new Error('PPM: unsupported magic (expected P3 or P6)');
  }
}

// Parse PPM P3 (ASCII) format
function parseP3(buffer: ArrayBuffer): PPMImage {
  const text = new TextDecoder('utf-8').decode(buffer);
  const noComments = text.replace(/#[^\n]*\n/g, '\n');
  const tokens = noComments.trim().split(/\s+/);

  if (tokens[0] !== 'P3') throw new Error('PPM P3: invalid magic');
  if (tokens.length < 4) throw new Error('PPM P3: incomplete header');

  const width = parseInt(tokens[1], 10);
  const height = parseInt(tokens[2], 10);
  const maxVal = parseInt(tokens[3], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('PPM P3: invalid dimensions');
  }
  if (!Number.isFinite(maxVal) || maxVal <= 0) throw new Error('PPM P3: invalid maxVal');

  const expectedSamples = width * height * 3;
  const sampleTokens = tokens.slice(4);
  if (sampleTokens.length < expectedSamples) {
    throw new Error(`PPM P3: not enough samples (${sampleTokens.length} < ${expectedSamples})`);
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  const scale = maxVal === 255 ? 1 : 255 / maxVal;

  for (let i = 0, j = 0; i < expectedSamples; i += 3, j += 4) {
    const r = Math.max(0, Math.min(maxVal, parseInt(sampleTokens[i], 10)));
    const g = Math.max(0, Math.min(maxVal, parseInt(sampleTokens[i + 1], 10)));
    const b = Math.max(0, Math.min(maxVal, parseInt(sampleTokens[i + 2], 10)));

    rgba[j] = Math.round(r * scale);
    rgba[j + 1] = Math.round(g * scale);
    rgba[j + 2] = Math.round(b * scale);
    rgba[j + 3] = 255;
  }

  return { width, height, data: rgba };
}

// Parse PPM P6 (binary) format
function parseP6(u8: Uint8Array, start: number): PPMImage {
  let i = start + 2;
  const len = u8.length;

  const tokens: string[] = ['P6'];
  while (tokens.length < 4) {
    skipWhitespace();
    if (i >= len) break;
    if (u8[i] === 35 /* # */) {
      while (i < len && u8[i] !== 10 /* \n */) i++;
      continue;
    }
    const t = readToken();
    if (t.length) tokens.push(t);
  }

  if (tokens.length < 4) throw new Error('PPM P6: incomplete header');

  const width = parseInt(tokens[1], 10);
  const height = parseInt(tokens[2], 10);
  const maxVal = parseInt(tokens[3], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('PPM P6: invalid dimensions');
  }
  if (!Number.isFinite(maxVal) || maxVal <= 0) throw new Error('PPM P6: invalid maxVal');

  if (i >= len) throw new Error('PPM P6: missing pixel data');
  if (!isWhitespace(u8[i])) throw new Error('PPM P6: missing whitespace before pixel data');

  while (i < len && isWhitespace(u8[i])) i++;

  const pixels = width * height;
  const bytesPerSample = maxVal <= 255 ? 1 : 2;
  const dataBytes = pixels * 3 * bytesPerSample;
  if (i + dataBytes > len) throw new Error('PPM P6: pixel data truncated');

  const rgba = new Uint8ClampedArray(pixels * 4);

  if (bytesPerSample === 1) {
    const src = u8.subarray(i, i + pixels * 3);
    if (maxVal === 255) {
      for (let p = 0, s = 0; p < pixels; p++, s += 3) {
        const j = p * 4;
        rgba[j]     = src[s];
        rgba[j + 1] = src[s + 1];
        rgba[j + 2] = src[s + 2];
        rgba[j + 3] = 255;
      }
    } else {
      const scale = 255 / maxVal;
      for (let p = 0, s = 0; p < pixels; p++, s += 3) {
        const j = p * 4;
        rgba[j]     = Math.round(src[s] * scale);
        rgba[j + 1] = Math.round(src[s + 1] * scale);
        rgba[j + 2] = Math.round(src[s + 2] * scale);
        rgba[j + 3] = 255;
      }
    }
  } else {
    const maxScale = 255 / maxVal;
    let s = i;
    for (let p = 0; p < pixels; p++) {
      const r = (u8[s] << 8) | u8[s + 1];
      const g = (u8[s + 2] << 8) | u8[s + 3];
      const b = (u8[s + 4] << 8) | u8[s + 5];
      s += 6;

      const j = p * 4;
      rgba[j] = Math.round(r * maxScale);
      rgba[j + 1] = Math.round(g * maxScale);
      rgba[j + 2] = Math.round(b * maxScale);
      rgba[j + 3] = 255;
    }
  }

  return { width, height, data: rgba };

  function isWhitespace(c: number): boolean {
    return c === 32 || c === 9 || c === 10 || c === 13;
  }
  function skipWhitespace(): void {
    while (i < len) {
      if (isWhitespace(u8[i])) {
        i++;
        continue;
      }
      if (u8[i] === 35 /* # */) {
        while (i < len && u8[i] !== 10 /* \n */) i++;
        continue;
      }
      break;
    }
  }
  function readToken(): string {
    const start = i;
    while (i < len && !isWhitespace(u8[i]) && u8[i] !== 35 /* # */) i++;

    let s = '';
    for (let k = start; k < i; k++) s += String.fromCharCode(u8[k]);
    return s;
  }
}