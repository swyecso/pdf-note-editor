/**
 * Samples perimeter pixels around a bounding box on the PDF canvas
 * to detect the dominant background color (e.g. White, Cream, Light Gray, Tinted Table Cells).
 */
export function sampleBackgroundColor(
  canvas: HTMLCanvasElement,
  bounds: { xRatio: number; yRatio: number; widthRatio: number; heightRatio: number }
): string {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';

    const cw = canvas.width;
    const ch = canvas.height;

    const x = Math.max(0, Math.min(cw - 1, Math.floor(bounds.xRatio * cw)));
    const y = Math.max(0, Math.min(ch - 1, Math.floor(bounds.yRatio * ch)));
    const w = Math.max(1, Math.min(cw - x, Math.floor(bounds.widthRatio * cw)));
    const h = Math.max(1, Math.min(ch - y, Math.floor(bounds.heightRatio * ch)));

    // Sample points just outside the 4 edges of the text envelope (where glyph ink is absent)
    const samplePoints: [number, number][] = [
      [x, Math.max(0, y - 2)], // Top-left margin
      [x + Math.floor(w / 2), Math.max(0, y - 2)], // Top-center margin
      [Math.max(0, x - 2), y + Math.floor(h / 2)], // Left margin
      [Math.min(cw - 1, x + w + 2), y + Math.floor(h / 2)], // Right margin
      [x + Math.floor(w / 2), Math.min(ch - 1, y + h + 2)], // Bottom margin
    ];

    const colorCounts: { [hex: string]: number } = {};

    for (const [sx, sy] of samplePoints) {
      try {
        const pixel = ctx.getImageData(sx, sy, 1, 1).data;
        // Ignore fully transparent pixels
        if (pixel[3] < 128) continue;

        const hex =
          '#' +
          [pixel[0], pixel[1], pixel[2]]
            .map((c) => c.toString(16).padStart(2, '0'))
            .join('');

        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      } catch {
        // Pixel outside canvas bounds
      }
    }

    // Find the most frequent sampled color
    let dominantColor = '#ffffff';
    let maxCount = 0;
    for (const [hex, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = hex;
      }
    }

    return dominantColor;
  } catch (err) {
    console.warn('Could not sample background color:', err);
    return '#ffffff';
  }
}
