export type Tool = 'select' | 'text' | 'editText' | 'sticky' | 'highlight' | 'draw' | 'eraser';

export interface BaseAnnotation {
  id: string;
  pageNum: number; // 1-based index
  createdAt: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  xRatio: number; // 0 to 1 relative to page width
  yRatio: number; // 0 to 1 relative to page height
  text: string;
  fontSize: number; // e.g. 14, 18, 24
  color: string;
  bgColor: string;
  hasBorder: boolean;
}

export interface StickyNoteAnnotation extends BaseAnnotation {
  type: 'sticky';
  xRatio: number;
  yRatio: number;
  content: string;
  color: string; // Background color for sticky note
  author: string;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  color: string;
  opacity: number;
}

export interface DrawPoint {
  xRatio: number;
  yRatio: number;
}

export interface DrawAnnotation extends BaseAnnotation {
  type: 'draw';
  points: DrawPoint[];
  color: string;
  strokeWidth: number;
}

export type Annotation =
  | TextAnnotation
  | StickyNoteAnnotation
  | HighlightAnnotation
  | DrawAnnotation;

export interface TextEdit {
  blockId: string;
  pageNum: number;
  originalText: string;
  currentText: string;
  reflowedLines: string[];
  bounds: {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  };
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  fontFamily: 'sans' | 'serif' | 'mono';
  color: string;
  bgColor: string;
  isEdited: boolean;
}

export interface FormFieldInfo {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown';
  pageNum: number;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  value: string | boolean;
  options?: string[];
}

export interface PageDimension {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface PdfDocumentInfo {
  fileName: string;
  fileSize: number;
  numPages: number;
  data: Uint8Array;
}
