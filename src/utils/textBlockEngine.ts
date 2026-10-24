import * as pdfjsLib from 'pdfjs-dist';

export interface TextLineItem {
  text: string;
  x: number;
  y: number; // PDF coordinates (bottom-left)
  width: number;
  height: number;
  fontSize: number;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

export interface TextBlock {
  id: string;
  pageNum: number;
  originalText: string;
  lines: TextLineItem[];
  bounds: {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  };
  fontSize: number;
  lineHeight: number;
  isBold: boolean;
  isItalic: boolean;
  fontFamily: 'sans' | 'serif' | 'mono';
  color: string;
}

export interface PageTextAnalysis {
  blocks: TextBlock[];
  isScanned: boolean;
  totalCharacters: number;
}

export async function analyzePageText(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNum: number
): Promise<PageTextAnalysis> {
  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const content = await page.getTextContent();

    let totalChars = 0;
    const rawLines: {
      y: number;
      fontName: string;
      items: { str: string; x: number; w: number; h: number; fontName: string }[];
    }[] = [];

    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const cleanStr = item.str.replace(/[\x00-\x1F\x7F]/g, '').trim();
      if (!cleanStr) continue;

      totalChars += cleanStr.length;
      const x = item.transform[4];
      const y = item.transform[5];
      const h = Math.abs(item.transform[3]) || 12;
      const w = item.width || cleanStr.length * h * 0.55;
      const fontName = item.fontName || '';

      let existingLine = rawLines.find((l) => Math.abs(l.y - y) <= 3.5);
      if (!existingLine) {
        existingLine = { y, fontName, items: [] };
        rawLines.push(existingLine);
      }
      existingLine.items.push({ str: cleanStr, x, w, h, fontName });
    }

    // If total characters is negligible, page is likely a scanned bitmap
    const isScanned = totalChars < 20;

    // Sort lines from top to bottom of page (higher Y in PDF coordinates is higher on screen)
    rawLines.sort((a, b) => b.y - a.y);

    const consolidatedLines: (TextLineItem & { fontName: string })[] = rawLines.map(
      (line) => {
        line.items.sort((a, b) => a.x - b.x);
        const text = line.items.map((it) => it.str).join(' ').trim();
        const minX = Math.min(...line.items.map((it) => it.x));
        const maxX = Math.max(...line.items.map((it) => it.x + it.w));
        const maxH = Math.max(...line.items.map((it) => it.h));
        const lineWidth = Math.max(20, maxX - minX);

        return {
          text,
          x: minX,
          y: line.y,
          width: lineWidth,
          height: maxH,
          fontSize: Math.round(maxH),
          fontName: line.items[0]?.fontName || line.fontName,
          xRatio: Math.max(0, minX / viewport.width),
          yRatio: Math.max(0, (viewport.height - line.y - maxH) / viewport.height),
          widthRatio: Math.min(1, lineWidth / viewport.width),
          heightRatio: Math.min(1, (maxH * 1.25) / viewport.height),
        };
      }
    ).filter((l) => l.text.length > 0);

    // Group adjacent lines into Paragraph Blocks
    const blocks: TextBlock[] = [];
    let currentBlockLines: (TextLineItem & { fontName: string })[] = [];

    const commitCurrentBlock = () => {
      if (currentBlockLines.length === 0) return;

      const firstLine = currentBlockLines[0];
      const minX = Math.min(...currentBlockLines.map((l) => l.x));
      const maxX = Math.max(...currentBlockLines.map((l) => l.x + l.width));
      const topY = currentBlockLines[0].y;
      const bottomY = currentBlockLines[currentBlockLines.length - 1].y;
      const totalBlockHeight = Math.max(
        firstLine.height,
        topY - bottomY + firstLine.height
      );
      const avgFontSize = Math.round(
        currentBlockLines.reduce((acc, l) => acc + l.fontSize, 0) /
          currentBlockLines.length
      );

      const fontName = firstLine.fontName.toLowerCase();
      const isBold = /bold|black|heavy|w[789]/i.test(fontName);
      const isItalic = /italic|oblique/i.test(fontName);
      const isSerif = /times|georgia|serif|roman|minion/i.test(fontName);
      const isMono = /courier|mono|console/i.test(fontName);
      const fontFamily = isMono ? 'mono' : isSerif ? 'serif' : 'sans';

      const fullText = currentBlockLines.map((l) => l.text).join('\n');
      const blockId = `block_${pageNum}_${Math.round(minX)}_${Math.round(topY)}`;

      // Calculate approximate line height
      const calculatedLineHeight =
        currentBlockLines.length > 1
          ? Math.abs(topY - currentBlockLines[1].y)
          : avgFontSize * 1.3;

      blocks.push({
        id: blockId,
        pageNum,
        originalText: fullText,
        lines: currentBlockLines.map(({ fontName: _, ...l }) => l),
        bounds: {
          xRatio: Math.max(0, minX / viewport.width),
          yRatio: Math.max(0, (viewport.height - topY - firstLine.height) / viewport.height),
          widthRatio: Math.min(1, Math.max(0.1, (maxX - minX) / viewport.width)),
          heightRatio: Math.min(1, (totalBlockHeight * 1.15) / viewport.height),
        },
        fontSize: avgFontSize,
        lineHeight: calculatedLineHeight,
        isBold,
        isItalic,
        fontFamily,
        color: '#000000',
      });

      currentBlockLines = [];
    };

    for (let i = 0; i < consolidatedLines.length; i++) {
      const line = consolidatedLines[i];

      if (currentBlockLines.length === 0) {
        currentBlockLines.push(line);
      } else {
        const prevLine = currentBlockLines[currentBlockLines.length - 1];
        const lineSpacing = prevLine.y - line.y;
        const fontDiff = Math.abs(prevLine.fontSize - line.fontSize);
        const leftDiff = Math.abs(prevLine.x - line.x);

        // Lines belong to the same paragraph if:
        // 1. Vertical spacing is consistent with body text (between 0.8x and 2.2x font size)
        // 2. Font sizes are identical or very close
        // 3. Left margins are roughly aligned (within 24px)
        const isSameParagraph =
          lineSpacing > 0 &&
          lineSpacing < prevLine.fontSize * 2.2 &&
          fontDiff <= 2 &&
          leftDiff < 30;

        if (isSameParagraph) {
          currentBlockLines.push(line);
        } else {
          commitCurrentBlock();
          currentBlockLines.push(line);
        }
      }
    }
    commitCurrentBlock();

    return {
      blocks,
      isScanned,
      totalCharacters: totalChars,
    };
  } catch (err) {
    console.warn('Error analyzing page text blocks:', err);
    return {
      blocks: [],
      isScanned: false,
      totalCharacters: 0,
    };
  }
}
