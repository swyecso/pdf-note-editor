import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFHexString,
  LineCapStyle,
  PDFFont,
} from 'pdf-lib';
import { Annotation, FormFieldInfo, TextEdit } from '../types';
import { applyFormFieldsToPdf } from './pdfFormHandler';

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  if (!hex || hex === 'transparent') {
    return { r: 1, g: 1, b: 1 };
  }
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16) || 0;
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function sanitizeForStandardFont(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2022]/g, '*')
    // Strip characters that WinAnsi cannot encode
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, '');
}

export async function exportAnnotatedPdf(
  originalData: Uint8Array,
  annotations: Annotation[],
  formFields: FormFieldInfo[] = [],
  textEdits: TextEdit[] = [],
  fileName: string = 'annotated_document.pdf'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalData, { ignoreEncryption: true });

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const totalPages = pdfDoc.getPageCount();

  // 1. Apply filled form field values
  if (formFields && formFields.length > 0) {
    applyFormFieldsToPdf(pdfDoc, formFields);
  }

  // 2. Apply Text Edits (Precision Redaction & Paragraph Reflow Re-placement)
  for (const edit of textEdits) {
    try {
      if (!edit.isEdited || edit.pageNum < 1 || edit.pageNum > totalPages) continue;

      const page = pdfDoc.getPage(edit.pageNum - 1);
      const { width, height } = page.getSize();

      const fontSize = Math.max(8, edit.fontSize);
      const lineHeight = fontSize * 1.3;
      const totalTextHeight = (edit.reflowedLines.length || 1) * lineHeight;

      const bx = edit.bounds.xRatio * width;
      const bw = edit.bounds.widthRatio * width;
      const bh = edit.bounds.heightRatio * height;
      const redactHeight = Math.max(bh, totalTextHeight);
      const topY = height - (edit.bounds.yRatio * height);
      const redactY = topY - redactHeight;

      // Draw background redaction rectangle with auto-sampled color to mask original text & downward reflow area
      const bgC = parseHexColor(edit.bgColor || '#ffffff');
      page.drawRectangle({
        x: Math.max(0, bx - 3),
        y: Math.max(0, redactY - 2),
        width: Math.min(width - bx + 3, bw + 6),
        height: redactHeight + 4,
        color: rgb(bgC.r, bgC.g, bgC.b),
      });

      // Select matching font
      let targetFont: PDFFont = fontHelvetica;
      if (edit.fontFamily === 'serif') {
        targetFont = edit.isBold ? fontTimesBold : fontTimes;
      } else if (edit.fontFamily === 'mono') {
        targetFont = edit.isBold ? fontCourierBold : fontCourier;
      } else {
        targetFont = edit.isBold ? fontHelveticaBold : fontHelvetica;
      }

      const textC = parseHexColor(edit.color || '#000000');
      let currentY = topY - fontSize;

      for (const line of edit.reflowedLines) {
        if (line && line.trim()) {
          const safeLine = sanitizeForStandardFont(line);
          try {
            page.drawText(safeLine, {
              x: bx,
              y: currentY,
              size: fontSize,
              font: targetFont,
              color: rgb(textC.r, textC.g, textC.b),
            });
          } catch (err) {
            const cleanFallback = safeLine.replace(/[^\x20-\x7E]/g, '');
            if (cleanFallback.trim()) {
              page.drawText(cleanFallback, {
                x: bx,
                y: currentY,
                size: fontSize,
                font: targetFont,
                color: rgb(textC.r, textC.g, textC.b),
              });
            }
          }
        }
        currentY -= lineHeight;
      }
    } catch (editErr) {
      console.warn('Skipping text edit due to error:', edit, editErr);
    }
  }

  // 3. Apply standard annotations (text notes, sticky pins, highlights, drawings)
  for (const ann of annotations) {
    try {
      if (ann.pageNum < 1 || ann.pageNum > totalPages) continue;

      const page = pdfDoc.getPage(ann.pageNum - 1);
      const { width, height } = page.getSize();

      if (ann.type === 'text') {
        const rawText = ann.text || '';
        if (!rawText.trim()) continue;

        const fontSize = Math.max(8, ann.fontSize || 14);
        const safeText = sanitizeForStandardFont(rawText);
        const lines = safeText.split('\n');
        const lineHeight = fontSize * 1.25;
        const textX = ann.xRatio * width;
        const topY = height - (ann.yRatio * height);

        let maxLineWidth = 0;
        for (const line of lines) {
          try {
            const lw = fontHelvetica.widthOfTextAtSize(line || ' ', fontSize);
            if (lw > maxLineWidth) maxLineWidth = lw;
          } catch {
            maxLineWidth = Math.max(maxLineWidth, (line.length || 1) * fontSize * 0.6);
          }
        }
        const boxWidth = Math.max(40, maxLineWidth + 12);
        const boxHeight = lines.length * lineHeight + 8;
        const boxBottomY = topY - boxHeight;

        if (ann.bgColor && ann.bgColor !== 'transparent') {
          const bgC = parseHexColor(ann.bgColor);
          page.drawRectangle({
            x: textX - 3,
            y: boxBottomY,
            width: boxWidth,
            height: boxHeight,
            color: rgb(bgC.r, bgC.g, bgC.b),
            borderColor: ann.hasBorder ? rgb(0.7, 0.75, 0.8) : undefined,
            borderWidth: ann.hasBorder ? 1 : 0,
          });
        }

        const textC = parseHexColor(ann.color || '#000000');
        let currentLineY = topY - fontSize - 3;

        for (const line of lines) {
          if (line && line.trim().length > 0) {
            try {
              page.drawText(line, {
                x: textX + 3,
                y: currentLineY,
                size: fontSize,
                font: fontHelvetica,
                color: rgb(textC.r, textC.g, textC.b),
              });
            } catch (drawErr) {
              const fallbackLine = line.replace(/[^\x20-\x7E]/g, '');
              if (fallbackLine.trim()) {
                page.drawText(fallbackLine, {
                  x: textX + 3,
                  y: currentLineY,
                  size: fontSize,
                  font: fontHelvetica,
                  color: rgb(textC.r, textC.g, textC.b),
                });
              }
            }
          }
          currentLineY -= lineHeight;
        }
      } else if (ann.type === 'sticky') {
        const pinX = ann.xRatio * width;
        const pinY = height - (ann.yRatio * height);
        const pinSize = 22;

        const bgC = parseHexColor(ann.color || '#fef08a');
        page.drawRectangle({
          x: pinX,
          y: pinY - pinSize,
          width: pinSize,
          height: pinSize,
          color: rgb(bgC.r, bgC.g, bgC.b),
          borderColor: rgb(0.2, 0.25, 0.3),
          borderWidth: 1.5,
        });

        page.drawLine({
          start: { x: pinX + pinSize - 6, y: pinY },
          end: { x: pinX + pinSize, y: pinY - 6 },
          color: rgb(0.4, 0.45, 0.5),
          thickness: 1,
        });

        page.drawText('N', {
          x: pinX + 6,
          y: pinY - 16,
          size: 11,
          font: fontHelveticaBold,
          color: rgb(0.15, 0.2, 0.25),
        });

        try {
          const context = pdfDoc.context;
          const noteText = ann.content || 'Note';
          const authorText = ann.author || 'User Note';

          const annotDict = context.obj({
            Type: 'Annot',
            Subtype: 'Text',
            Rect: [pinX, pinY - pinSize, pinX + pinSize, pinY],
            Contents: PDFHexString.fromText(noteText),
            T: PDFHexString.fromText(authorText),
            C: [bgC.r, bgC.g, bgC.b],
            Name: 'Comment',
            Open: false,
          });
          const annotRef = context.register(annotDict);
          page.node.addAnnot(annotRef);
        } catch (annotErr) {
          console.warn('Could not register native PDF annotation:', annotErr);
        }
      } else if (ann.type === 'highlight') {
        const hlX = ann.xRatio * width;
        const hlW = ann.widthRatio * width;
        const hlH = ann.heightRatio * height;
        const hlY = height - (ann.yRatio * height) - hlH;

        const hlC = parseHexColor(ann.color || '#fef08a');
        page.drawRectangle({
          x: hlX,
          y: hlY,
          width: hlW,
          height: hlH,
          color: rgb(hlC.r, hlC.g, hlC.b),
          opacity: ann.opacity || 0.35,
        });
      } else if (ann.type === 'draw') {
        if (ann.points && ann.points.length > 1) {
          const strokeC = parseHexColor(ann.color || '#ef4444');
          const strokeWidth = ann.strokeWidth || 2;

          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];

            page.drawLine({
              start: {
                x: p1.xRatio * width,
                y: height - (p1.yRatio * height),
              },
              end: {
                x: p2.xRatio * width,
                y: height - (p2.yRatio * height),
              },
              thickness: strokeWidth,
              color: rgb(strokeC.r, strokeC.g, strokeC.b),
              lineCap: LineCapStyle.Round,
            });
          }
        }
      }
    } catch (annError) {
      console.warn('Skipping annotation due to processing error:', ann, annError);
    }
  }

  const modifiedBytes = await pdfDoc.save();
  return modifiedBytes;
}

export function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
