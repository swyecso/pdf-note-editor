import React, { useRef } from 'react';
import { Tool } from '../types';
import {
  MousePointer,
  Type,
  Edit3,
  Pin,
  Highlighter,
  PenTool,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  FileText,
  Sparkles,
} from 'lucide-react';

interface ToolbarProps {
  fileName: string;
  currentPage: number;
  numPages: number;
  scale: number;
  tool: Tool;
  color: string;
  strokeWidth: number;
  fontSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (t: Tool) => void;
  onChangeColor: (c: string) => void;
  onChangeStrokeWidth: (w: number) => void;
  onChangeFontSize: (s: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenFile: (file: File) => void;
  onLoadSample: () => void;
  onDownload: () => void;
}

const PALETTE = [
  { name: 'Dark Slate', hex: '#1e293b' },
  { name: 'Bright Yellow', hex: '#facc15' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Violet', hex: '#8b5cf6' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  fileName,
  currentPage,
  numPages,
  scale,
  tool,
  color,
  strokeWidth,
  fontSize,
  canUndo,
  canRedo,
  onSelectTool,
  onChangeColor,
  onChangeStrokeWidth,
  onChangeFontSize,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onUndo,
  onRedo,
  onOpenFile,
  onLoadSample,
  onDownload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm z-40 select-none">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* Left: App Identity & File Loader */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-800 leading-tight">
              PDF Note Editor
            </h1>
            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
              {fileName || 'No file loaded'}
            </p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          title="Open a PDF from your computer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
          Open PDF
        </button>

        <button
          onClick={onLoadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
          title="Load demonstration PDF with sample notes & form"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Sample PDF
        </button>
      </div>

      {/* Center: Tools, Colors & History */}
      <div className="flex items-center gap-2">
        {/* Tool Selector Group */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
          <button
            onClick={() => onSelectTool('select')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs ${
              tool === 'select'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Select & Move (V)"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('text')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs ${
              tool === 'text'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Add Text Note (T)"
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('editText')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs ${
              tool === 'editText'
                ? 'bg-white text-indigo-600 shadow-sm font-semibold ring-1 ring-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Edit Existing Text (Click paragraph or select words) (X)"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('sticky')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs ${
              tool === 'sticky'
                ? 'bg-white text-yellow-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Drop Sticky Note Pin (S)"
          >
            <Pin className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('highlight')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs ${
              tool === 'highlight'
                ? 'bg-white text-amber-500 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Highlighter (H)"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('draw')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs ${
              tool === 'draw'
                ? 'bg-white text-rose-500 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Freehand Pen (P)"
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('eraser')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs ${
              tool === 'eraser'
                ? 'bg-white text-red-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Eraser (E) - Click annotation to delete"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette Chips */}
        {tool !== 'select' && tool !== 'eraser' && tool !== 'editText' && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl">
            {PALETTE.map((p) => (
              <button
                key={p.hex}
                onClick={() => onChangeColor(p.hex)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  color.toLowerCase() === p.hex.toLowerCase()
                    ? 'scale-125 ring-2 ring-slate-800 ring-offset-1'
                    : 'hover:scale-110 border-black/10'
                }`}
                style={{ backgroundColor: p.hex }}
                title={p.name}
              />
            ))}

            <input
              type="color"
              value={color}
              onChange={(e) => onChangeColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
              title="Custom Color"
            />

            {tool === 'draw' && (
              <select
                value={strokeWidth}
                onChange={(e) => onChangeStrokeWidth(Number(e.target.value))}
                className="ml-1 bg-white border border-slate-300 rounded text-xs px-1 py-0.5"
                title="Pen Stroke Width"
              >
                <option value={1}>1px</option>
                <option value={2}>2px</option>
                <option value={4}>4px</option>
                <option value={8}>8px</option>
              </select>
            )}

            {tool === 'text' && (
              <select
                value={fontSize}
                onChange={(e) => onChangeFontSize(Number(e.target.value))}
                className="ml-1 bg-white border border-slate-300 rounded text-xs px-1 py-0.5"
                title="Default Text Font Size"
              >
                <option value={12}>12pt</option>
                <option value={14}>14pt</option>
                <option value={18}>18pt</option>
                <option value={24}>24pt</option>
              </select>
            )}
          </div>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo
                ? 'text-slate-700 hover:bg-white hover:text-slate-900'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo
                ? 'text-slate-700 hover:bg-white hover:text-slate-900'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Zoom, Page Navigation, Download */}
      <div className="flex items-center gap-3">
        {/* Page Nav */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 text-slate-700 hover:bg-white rounded-lg disabled:text-slate-300 disabled:hover:bg-transparent"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2 text-slate-700">
            {numPages > 0 ? `${currentPage} / ${numPages}` : '- / -'}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= numPages}
            className="p-1.5 text-slate-700 hover:bg-white rounded-lg disabled:text-slate-300 disabled:hover:bg-transparent"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-700 hover:bg-white rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-1.5 text-slate-700 min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-700 hover:bg-white rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomFit}
            className="p-1.5 text-slate-700 hover:bg-white rounded-lg border-l border-slate-300 ml-0.5"
            title="Fit to Width / Reset (100%)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Download PDF button */}
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          title="Save and download edited PDF with all notes & filled forms"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </header>
  );
};
