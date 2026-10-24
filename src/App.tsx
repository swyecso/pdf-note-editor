import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Annotation,
  Tool,
  StickyNoteAnnotation,
  PdfDocumentInfo,
  FormFieldInfo,
  TextEdit,
} from './types';
import { loadPdf, renderThumbnail } from './utils/pdfRenderer';
import { exportAnnotatedPdf, downloadBlob } from './utils/pdfExporter';
import { extractPdfFormFields } from './utils/pdfFormHandler';
import { createSamplePdf } from './utils/samplePdf';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PdfViewer } from './components/PdfViewer';
import { StickyNoteModal } from './components/StickyNoteModal';

export const App: React.FC = () => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfDocumentInfo | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState<string>('#1e293b');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [fontSize, setFontSize] = useState<number>(14);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [formFields, setFormFields] = useState<FormFieldInfo[]>([]);
  const [textEdits, setTextEdits] = useState<TextEdit[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  const [thumbnails, setThumbnails] = useState<{ [pageNum: number]: string }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeStickyModal, setActiveStickyModal] = useState<StickyNoteAnnotation | null>(null);

  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  const pushHistory = useCallback((current: Annotation[]) => {
    setUndoStack((prev) => [...prev, current]);
    setRedoStack([]);
  }, []);

  const handleAddAnnotation = useCallback(
    (newAnn: Annotation) => {
      pushHistory(annotationsRef.current);
      setAnnotations((prev) => [...prev, newAnn]);
    },
    [pushHistory]
  );

  const handleUpdateAnnotation = useCallback(
    (updatedAnn: Annotation) => {
      pushHistory(annotationsRef.current);
      setAnnotations((prev) =>
        prev.map((a) => (a.id === updatedAnn.id ? updatedAnn : a))
      );
    },
    [pushHistory]
  );

  const handleDeleteAnnotation = useCallback(
    (id: string) => {
      pushHistory(annotationsRef.current);
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnnotationId === id) {
        setSelectedAnnotationId(null);
      }
      if (activeStickyModal?.id === id) {
        setActiveStickyModal(null);
      }
    },
    [pushHistory, selectedAnnotationId, activeStickyModal]
  );

  const handleUpdateFormField = useCallback((name: string, value: string | boolean) => {
    setFormFields((prev) =>
      prev.map((f) => (f.name === name ? { ...f, value } : f))
    );
  }, []);

  const handleSaveTextEdit = useCallback((edit: TextEdit) => {
    setTextEdits((prev) => {
      const filtered = prev.filter((e) => e.blockId !== edit.blockId);
      return [...filtered, edit];
    });
  }, []);

  const handleRevertTextEdit = useCallback((blockId: string) => {
    setTextEdits((prev) => prev.filter((e) => e.blockId !== blockId));
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, annotationsRef.current]);
    setAnnotations(previous);
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, annotationsRef.current]);
    setAnnotations(next);
  }, [redoStack]);

  // Clone bytes to prevent PDF.js Web Worker from detaching the buffer
  const loadPdfBytes = useCallback(async (data: Uint8Array, fileName: string) => {
    try {
      const bytesForSaving = new Uint8Array(data.slice());
      const bytesForPdfJs = new Uint8Array(data.slice());

      const doc = await loadPdf(bytesForPdfJs);
      setPdfDoc(doc);
      setPdfInfo({
        fileName,
        fileSize: bytesForSaving.byteLength,
        numPages: doc.numPages,
        data: bytesForSaving,
      });
      setCurrentPage(1);
      setAnnotations([]);
      setTextEdits([]);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedAnnotationId(null);
      setActiveStickyModal(null);

      // Extract fillable form fields if present
      extractPdfFormFields(bytesForSaving).then((fields) => {
        setFormFields(fields);
      });

      // Render crisp thumbnails
      for (let i = 1; i <= doc.numPages; i++) {
        try {
          const t = await renderThumbnail(doc, i, 380);
          setThumbnails((prev) => ({ ...prev, [i]: t }));
        } catch (err) {
          console.warn(`Thumbnail failed for page ${i}`, err);
        }
      }
    } catch (err: any) {
      console.error('Failed to load PDF document:', err);
      alert(`Could not open the selected PDF file: ${err?.message || 'Invalid format'}`);
    }
  }, []);

  const handleOpenFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(reader.result.slice(0));
        await loadPdfBytes(bytes, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadSample = useCallback(async () => {
    const sampleBytes = await createSamplePdf();
    await loadPdfBytes(sampleBytes, 'Welcome_Sample_Document.pdf');
  }, [loadPdfBytes]);

  useEffect(() => {
    handleLoadSample();
  }, [handleLoadSample]);

  const handleSelectTool = (newTool: Tool) => {
    setTool(newTool);
    if (newTool === 'sticky' && !color.startsWith('#fe')) {
      setColor('#fef08a');
    } else if (newTool === 'highlight' && color === '#1e293b') {
      setColor('#facc15');
    } else if (newTool === 'draw' && color === '#fef08a') {
      setColor('#f43f5e');
    } else if (newTool === 'text' && (color === '#fef08a' || color === '#facc15')) {
      setColor('#1e293b');
    }
  };

  const handleDownload = async () => {
    if (!pdfInfo) {
      alert('No PDF document loaded.');
      return;
    }
    if (!pdfInfo.data || pdfInfo.data.byteLength === 0) {
      alert('PDF data buffer is empty. Please reload the document.');
      return;
    }

    try {
      const outputName = pdfInfo.fileName.replace(/\.pdf$/i, '') + '_annotated.pdf';
      const modifiedBytes = await exportAnnotatedPdf(
        pdfInfo.data,
        annotations,
        formFields,
        textEdits,
        outputName
      );
      downloadBlob(modifiedBytes, outputName);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      alert(`Failed to save PDF: ${err?.message || 'Unknown error'}. Please check console for details.`);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputActive =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        setTool('select');
        setSelectedAnnotationId(null);
        return;
      }

      if (isInputActive) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) {
          handleDeleteAnnotation(selectedAnnotationId);
          e.preventDefault();
        }
      } else if (e.key.toLowerCase() === 'v') {
        handleSelectTool('select');
      } else if (e.key.toLowerCase() === 't') {
        handleSelectTool('text');
      } else if (e.key.toLowerCase() === 's') {
        handleSelectTool('sticky');
      } else if (e.key.toLowerCase() === 'h') {
        handleSelectTool('highlight');
      } else if (e.key.toLowerCase() === 'p') {
        handleSelectTool('draw');
      } else if (e.key.toLowerCase() === 'x') {
        handleSelectTool('editText');
      } else if (e.key.toLowerCase() === 'e') {
        handleSelectTool('eraser');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (pdfDoc) {
          setCurrentPage((p) => Math.min(pdfDoc.numPages, p + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    selectedAnnotationId,
    handleDeleteAnnotation,
    pdfDoc,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100">
      {/* Top Bar */}
      <Toolbar
        fileName={pdfInfo?.fileName || ''}
        currentPage={currentPage}
        numPages={pdfDoc?.numPages || 0}
        scale={scale}
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        fontSize={fontSize}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onSelectTool={handleSelectTool}
        onChangeColor={setColor}
        onChangeStrokeWidth={setStrokeWidth}
        onChangeFontSize={setFontSize}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setCurrentPage((p) => Math.min(pdfDoc?.numPages || 1, p + 1))}
        onZoomIn={() => setScale((s) => Math.min(3.0, s + 0.15))}
        onZoomOut={() => setScale((s) => Math.max(0.5, s - 0.15))}
        onZoomFit={() => setScale(1.0)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenFile={handleOpenFile}
        onLoadSample={handleLoadSample}
        onDownload={handleDownload}
      />

      {/* Main Workspace: Sidebar + PDF Viewport */}
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        <Sidebar
          numPages={pdfDoc?.numPages || 0}
          currentPage={currentPage}
          thumbnails={thumbnails}
          annotations={annotations}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
          onSelectPage={(pageNum) => setCurrentPage(pageNum)}
          onSelectNote={(note) => {
            setCurrentPage(note.pageNum);
            if (note.type === 'sticky') {
              setActiveStickyModal(note as StickyNoteAnnotation);
            } else if (note.type === 'text') {
              setSelectedAnnotationId(note.id);
            }
          }}
          onDeleteAnnotation={handleDeleteAnnotation}
        />

        <PdfViewer
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          scale={scale}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          fontSize={fontSize}
          annotations={annotations}
          formFields={formFields}
          textEdits={textEdits}
          selectedAnnotationId={selectedAnnotationId}
          onSelectAnnotation={setSelectedAnnotationId}
          onAddAnnotation={handleAddAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onOpenStickyModal={(note) => setActiveStickyModal(note)}
          onUpdateFormField={handleUpdateFormField}
          onSaveTextEdit={handleSaveTextEdit}
          onRevertTextEdit={handleRevertTextEdit}
          onSwitchTool={(t) => setTool(t)}
          onOpenFile={handleOpenFile}
          onLoadSample={handleLoadSample}
        />
      </div>

      {/* Sticky Note Popover Card */}
      {activeStickyModal && (
        <StickyNoteModal
          note={activeStickyModal}
          onUpdate={(updated) => {
            handleUpdateAnnotation(updated);
            setActiveStickyModal(null);
          }}
          onDelete={(id) => {
            handleDeleteAnnotation(id);
            setActiveStickyModal(null);
          }}
          onClose={() => setActiveStickyModal(null)}
        />
      )}
    </div>
  );
};
