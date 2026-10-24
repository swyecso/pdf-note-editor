import React, { useState, useRef } from 'react';
import {
  Annotation,
  Tool,
  TextAnnotation,
  StickyNoteAnnotation,
  HighlightAnnotation,
  DrawAnnotation,
  DrawPoint,
} from '../types';
import { TextNoteBox } from './TextNoteBox';
import { Pin } from 'lucide-react';

interface AnnotationLayerProps {
  pageNum: number;
  width: number;
  height: number;
  scale: number;
  tool: Tool;
  color: string;
  strokeWidth: number;
  fontSize: number;
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddAnnotation: (ann: Annotation) => void;
  onUpdateAnnotation: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onOpenStickyModal: (note: StickyNoteAnnotation) => void;
  onSwitchTool: (tool: Tool) => void;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageNum,
  width,
  height,
  scale,
  tool,
  color,
  strokeWidth,
  fontSize,
  annotations,
  selectedId,
  onSelect,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onOpenStickyModal,
  onSwitchTool,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawPoint[]>([]);

  // Highlighting drag state
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [hlStart, setHlStart] = useState<{ x: number; y: number } | null>(null);
  const [hlCurrent, setHlCurrent] = useState<{ x: number; y: number } | null>(null);

  const getCoordinates = (e: React.MouseEvent): { x: number; y: number; xRatio: number; yRatio: number } => {
    if (!containerRef.current) return { x: 0, y: 0, xRatio: 0, yRatio: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(height, e.clientY - rect.top));
    return {
      x,
      y,
      xRatio: x / width,
      yRatio: y / height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const { x, y, xRatio, yRatio } = getCoordinates(e);

    if (tool === 'draw') {
      setIsDrawing(true);
      setCurrentPoints([{ xRatio, yRatio }]);
    } else if (tool === 'highlight') {
      setIsHighlighting(true);
      setHlStart({ x, y });
      setHlCurrent({ x, y });
    } else if (tool === 'text') {
      const newText: TextAnnotation = {
        id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'text',
        pageNum,
        xRatio,
        yRatio,
        text: 'Click to type note',
        fontSize,
        color,
        bgColor: '#ffffff',
        hasBorder: true,
        createdAt: Date.now(),
      };
      onAddAnnotation(newText);
      onSelect(newText.id);
      onSwitchTool('select');
    } else if (tool === 'sticky') {
      const newSticky: StickyNoteAnnotation = {
        id: `sticky_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'sticky',
        pageNum,
        xRatio,
        yRatio,
        content: '',
        color: color.startsWith('#') ? color : '#fef08a',
        author: 'Note',
        createdAt: Date.now(),
      };
      onAddAnnotation(newSticky);
      onOpenStickyModal(newSticky);
      onSwitchTool('select');
    } else if (tool === 'select') {
      onSelect(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tool === 'draw' && isDrawing) {
      const { xRatio, yRatio } = getCoordinates(e);
      setCurrentPoints((prev) => [...prev, { xRatio, yRatio }]);
    } else if (tool === 'highlight' && isHighlighting) {
      const { x, y } = getCoordinates(e);
      setHlCurrent({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (tool === 'draw' && isDrawing) {
      setIsDrawing(false);
      if (currentPoints.length > 1) {
        const newDraw: DrawAnnotation = {
          id: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'draw',
          pageNum,
          points: currentPoints,
          color,
          strokeWidth,
          createdAt: Date.now(),
        };
        onAddAnnotation(newDraw);
      }
      setCurrentPoints([]);
    } else if (tool === 'highlight' && isHighlighting && hlStart && hlCurrent) {
      setIsHighlighting(false);
      const minX = Math.min(hlStart.x, hlCurrent.x);
      const minY = Math.min(hlStart.y, hlCurrent.y);
      const w = Math.abs(hlCurrent.x - hlStart.x);
      const h = Math.abs(hlCurrent.y - hlStart.y);

      if (w > 5 && h > 5) {
        const newHl: HighlightAnnotation = {
          id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'highlight',
          pageNum,
          xRatio: minX / width,
          yRatio: minY / height,
          widthRatio: w / width,
          heightRatio: h / height,
          color,
          opacity: 0.35,
          createdAt: Date.now(),
        };
        onAddAnnotation(newHl);
      }

      setHlStart(null);
      setHlCurrent(null);
    }
  };

  const pageAnnotations = annotations.filter((a) => a.pageNum === pageNum);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="absolute inset-0 select-none"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor:
          tool === 'draw' || tool === 'highlight'
            ? 'crosshair'
            : tool === 'text'
            ? 'text'
            : tool === 'sticky'
            ? 'cell'
            : tool === 'eraser'
            ? 'pointer'
            : 'default',
      }}
    >
      {/* SVG Layer for Drawings, Highlights and Drag Previews */}
      <svg
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Render Saved Highlights */}
        {pageAnnotations
          .filter((a): a is HighlightAnnotation => a.type === 'highlight')
          .map((hl) => {
            const x = hl.xRatio * width;
            const y = hl.yRatio * height;
            const w = hl.widthRatio * width;
            const h = hl.heightRatio * height;

            return (
              <rect
                key={hl.id}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={hl.color}
                opacity={hl.opacity || 0.35}
                style={{
                  mixBlendMode: 'multiply',
                  pointerEvents: tool === 'eraser' ? 'auto' : 'none',
                  cursor: tool === 'eraser' ? 'pointer' : 'default',
                }}
                onMouseDown={(e) => {
                  if (tool === 'eraser') {
                    e.stopPropagation();
                    onDeleteAnnotation(hl.id);
                  }
                }}
              />
            );
          })}

        {/* Live Drag Preview for Highlighting */}
        {isHighlighting && hlStart && hlCurrent && (
          <rect
            x={Math.min(hlStart.x, hlCurrent.x)}
            y={Math.min(hlStart.y, hlCurrent.y)}
            width={Math.abs(hlCurrent.x - hlStart.x)}
            height={Math.abs(hlCurrent.y - hlStart.y)}
            fill={color}
            opacity={0.35}
            style={{ mixBlendMode: 'multiply' }}
          />
        )}

        {/* Render Saved Drawings */}
        {pageAnnotations
          .filter((a): a is DrawAnnotation => a.type === 'draw')
          .map((dr) => {
            const pointsStr = dr.points
              .map((p) => `${p.xRatio * width},${p.yRatio * height}`)
              .join(' ');

            return (
              <polyline
                key={dr.id}
                points={pointsStr}
                fill="none"
                stroke={dr.color}
                strokeWidth={(dr.strokeWidth || 2) * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  pointerEvents: tool === 'eraser' ? 'auto' : 'none',
                  cursor: tool === 'eraser' ? 'pointer' : 'default',
                }}
                onMouseDown={(e) => {
                  if (tool === 'eraser') {
                    e.stopPropagation();
                    onDeleteAnnotation(dr.id);
                  }
                }}
              />
            );
          })}

        {/* Live Drawing Preview */}
        {isDrawing && currentPoints.length > 1 && (
          <polyline
            points={currentPoints.map((p) => `${p.xRatio * width},${p.yRatio * height}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Render Sticky Notes */}
      {pageAnnotations
        .filter((a): a is StickyNoteAnnotation => a.type === 'sticky')
        .map((st) => {
          const x = st.xRatio * width;
          const y = st.yRatio * height;

          return (
            <div
              key={st.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (tool === 'eraser') {
                  onDeleteAnnotation(st.id);
                } else {
                  onOpenStickyModal(st);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (tool !== 'eraser') {
                  onOpenStickyModal(st);
                }
              }}
              title={st.content ? `${st.author}: ${st.content}` : 'Click to open note'}
              className="absolute group transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-40 transition-transform hover:scale-125 select-none"
              style={{
                left: `${x}px`,
                top: `${y}px`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 border-slate-700/80 transition-shadow group-hover:shadow-xl"
                style={{ backgroundColor: st.color || '#fef08a' }}
              >
                <Pin className="w-4 h-4 text-slate-800 transform rotate-45" />
              </div>

              {st.content && (
                <div className="absolute left-9 top-0 hidden group-hover:block bg-slate-900 text-white text-xs rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-xl z-50 max-w-xs truncate pointer-events-none">
                  <span className="font-semibold text-yellow-300">{st.author}: </span>
                  {st.content}
                </div>
              )}
            </div>
          );
        })}

      {/* Render Text Notes */}
      {pageAnnotations
        .filter((a): a is TextAnnotation => a.type === 'text')
        .map((txt) => (
          <TextNoteBox
            key={txt.id}
            annotation={txt}
            pageWidth={width}
            pageHeight={height}
            scale={scale}
            isSelected={selectedId === txt.id}
            onSelect={() => onSelect(txt.id)}
            onUpdate={onUpdateAnnotation}
            onDelete={onDeleteAnnotation}
          />
        ))}
    </div>
  );
};
