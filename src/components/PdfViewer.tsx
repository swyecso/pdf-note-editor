import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Annotation, Tool, StickyNoteAnnotation, FormFieldInfo, TextEdit } from '../types';
import { renderPage, RenderResult } from '../utils/pdfRenderer';
import { analyzePageText, TextBlock } from '../utils/textBlockEngine';
import { AnnotationLayer } from './AnnotationLayer';
import { FormLayer } from './FormLayer';
import { TextEditLayer } from './TextEditLayer';
import { UploadCloud, Sparkles, Info, X, AlertCircle } from 'lucide-react';

interface PdfViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  tool: Tool;
  color: string;
  strokeWidth: number;
  fontSize: number;
  annotations: Annotation[];
  formFields: FormFieldInfo[];
  textEdits: TextEdit[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onAddAnnotation: (ann: Annotation) => void;
  onUpdateAnnotation: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onOpenStickyModal: (note: StickyNoteAnnotation) => void;
  onUpdateFormField: (name: string, value: string | boolean) => void;
  onSaveTextEdit: (edit: TextEdit) => void;
  onRevertTextEdit: (blockId: string) => void;
  onSwitchTool: (tool: Tool) => void;
  onOpenFile: (file: File) => void;
  onLoadSample: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfDoc,
  currentPage,
  scale,
  tool,
  color,
  strokeWidth,
  fontSize,
  annotations,
  formFields,
  textEdits,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onOpenStickyModal,
  onUpdateFormField,
  onSaveTextEdit,
  onRevertTextEdit,
  onSwitchTool,
  onOpenFile,
  onLoadSample,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<RenderResult | null>(null);
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [isScanned, setIsScanned] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!pdfDoc || !canvasRef.current) return;

    setIsRendering(true);
    renderPage(pdfDoc, currentPage, canvasRef.current, scale)
      .then((dim) => {
        if (!isCancelled) {
          setDimensions(dim);
          setIsRendering(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Page render error:', err);
          setIsRendering(false);
        }
      });

    // Extract coherent paragraph blocks and scan status
    analyzePageText(pdfDoc, currentPage).then((analysis) => {
      if (!isCancelled) {
        setBlocks(analysis.blocks);
        setIsScanned(analysis.isScanned);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onOpenFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const getToolBanner = () => {
    switch (tool) {
      case 'sticky':
        return '📌 Sticky Note: Click anywhere on page to drop a note • Press Esc to cancel';
      case 'text':
        return '🔤 Text Note: Click anywhere to insert a text box • Press Esc to cancel';
      case 'editText':
        return '✏️ Edit Text Mode: Click any paragraph to edit, or select words with your mouse • Press Esc to cancel';
      case 'highlight':
        return '🖍️ Highlighter: Drag a box across text to highlight • Press Esc to cancel';
      case 'draw':
        return '✏️ Pen Mode: Draw freehand notes and signatures • Press Esc to cancel';
      case 'eraser':
        return '🧹 Eraser Mode: Click any note, drawing, or highlight to delete it • Press Esc to finish';
      default:
        return null;
    }
  };

  const toolBanner = getToolBanner();
  const pageFormCount = formFields.filter((f) => f.pageNum === currentPage).length;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex-1 h-full overflow-auto bg-slate-200/80 p-8 flex flex-col items-center justify-start relative ${
        isDragOver ? 'ring-4 ring-blue-500 ring-inset bg-blue-50/50' : ''
      }`}
    >
      {/* Floating Mode Guidance Banner */}
      {toolBanner && (
        <div className="sticky top-2 z-50 mb-3 bg-slate-900/90 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>{toolBanner}</span>
          <button
            onClick={() => onSwitchTool('select')}
            className="ml-2 hover:bg-slate-800 p-0.5 rounded text-slate-400 hover:text-white"
            title="Exit tool (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scanned Document Warning */}
      {isScanned && (
        <div className="sticky top-2 z-50 mb-3 bg-amber-600/95 backdrop-blur-sm text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-200" />
          <span>Scanned Page: No selectable text stream found. Use Text Notes to add comments.</span>
        </div>
      )}

      {/* Form Fields Notification Badge */}
      {!toolBanner && !isScanned && pageFormCount > 0 && (
        <div className="sticky top-2 z-50 mb-3 bg-blue-600/95 backdrop-blur-sm text-white px-3.5 py-1 rounded-full text-[11px] font-semibold shadow-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{pageFormCount} fillable form fields on this page (click any field to fill)</span>
        </div>
      )}

      {/* Empty State / Welcome Screen */}
      {!pdfDoc && (
        <div className="max-w-md w-full my-auto bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            Open a PDF to Add Notes
          </h2>
          <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
            Drag and drop any PDF file here, or click to pick a document from your computer.
          </p>

          <div className="flex flex-col gap-3">
            <label className="cursor-pointer w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all">
              Choose PDF File
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onOpenFile(e.target.files[0]);
                  }
                }}
              />
            </label>

            <button
              onClick={onLoadSample}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Try with Sample Document (Includes Interactive Form)
            </button>
          </div>
        </div>
      )}

      {/* Rendered PDF Page + Form & Annotation Overlays */}
      {pdfDoc && (
        <div
          className="relative bg-white shadow-2xl rounded-sm transition-all duration-100 mb-8"
          style={{
            width: dimensions ? `${dimensions.width}px` : 'auto',
            height: dimensions ? `${dimensions.height}px` : 'auto',
          }}
        >
          <canvas ref={canvasRef} className="block shadow-sm" />

          {/* Interactive Form Fields Layer */}
          {dimensions && (
            <FormLayer
              pageNum={currentPage}
              width={dimensions.width}
              height={dimensions.height}
              scale={scale}
              formFields={formFields}
              onUpdateFormField={onUpdateFormField}
            />
          )}

          {/* Paragraph Text Editing Layer */}
          {dimensions && (
            <TextEditLayer
              pageNum={currentPage}
              width={dimensions.width}
              height={dimensions.height}
              scale={scale}
              tool={tool}
              canvas={canvasRef.current}
              blocks={blocks}
              textEdits={textEdits}
              onSaveTextEdit={onSaveTextEdit}
              onRevertTextEdit={onRevertTextEdit}
              onSwitchTool={onSwitchTool}
            />
          )}

          {/* Interactive Annotation Overlay (Text Notes, Pins, Drawings, Highlights) */}
          {dimensions && (
            <AnnotationLayer
              pageNum={currentPage}
              width={dimensions.width}
              height={dimensions.height}
              scale={scale}
              tool={tool}
              color={color}
              strokeWidth={strokeWidth}
              fontSize={fontSize}
              annotations={annotations}
              selectedId={selectedAnnotationId}
              onSelect={onSelectAnnotation}
              onAddAnnotation={onAddAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
              onOpenStickyModal={onOpenStickyModal}
              onSwitchTool={onSwitchTool}
            />
          )}

          {isRendering && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full shadow border border-slate-200 animate-pulse">
                Rendering Page...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
