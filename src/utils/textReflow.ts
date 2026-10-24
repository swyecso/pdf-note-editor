/**
 * Greedy paragraph text reflow engine.
 * Computes natural word-wrapping for modified text within the original column width,
 * calculating line breaks and vertical line coordinates.
 */

let measurementCanvas: HTMLCanvasElement | null = null;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
  }
  return measurementCanvas.getContext('2d');
}

export interface ReflowResult {
  lines: string[];
  totalHeight: number;
  lineHeight: number;
}

export function reflowParagraphText(
  text: string,
  maxWidthPx: number,
  fontSize: number,
  fontFamily: 'sans' | 'serif' | 'mono' = 'sans',
  isBold: boolean = false
): ReflowResult {
  const ctx = getMeasurementContext();
  const fontCss = `${isBold ? 'bold ' : ''}${Math.round(fontSize)}px ${
    fontFamily === 'serif'
      ? 'Times New Roman, Times, serif'
      : fontFamily === 'mono'
      ? 'Courier New, Courier, monospace'
      : 'Arial, Helvetica, sans-serif'
  }`;

  if (ctx) {
    ctx.font = fontCss;
  }

  const measureWord = (word: string): number => {
    if (!ctx) return word.length * fontSize * 0.55;
    return ctx.measureText(word).width;
  };

  const spaceWidth = measureWord(' ');
  const lineHeight = Math.round(fontSize * 1.3);

  const rawParagraphs = (text || '').split('\n');
  const finalLines: string[] = [];

  for (const paragraph of rawParagraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      finalLines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';
    let currentLineWidth = 0;

    for (const word of words) {
      const wordW = measureWord(word);

      if (!currentLine) {
        currentLine = word;
        currentLineWidth = wordW;
      } else {
        const potentialWidth = currentLineWidth + spaceWidth + wordW;
        // If adding this word fits within column width, keep on same line
        if (potentialWidth <= maxWidthPx) {
          currentLine += ' ' + word;
          currentLineWidth = potentialWidth;
        } else {
          // Word wraps to next line
          finalLines.push(currentLine);
          currentLine = word;
          currentLineWidth = wordW;
        }
      }
    }

    if (currentLine) {
      finalLines.push(currentLine);
    }
  }

  // Ensure at least one line exists
  if (finalLines.length === 0) {
    finalLines.push('');
  }

  const totalHeight = finalLines.length * lineHeight;

  return {
    lines: finalLines,
    totalHeight,
    lineHeight,
  };
}
