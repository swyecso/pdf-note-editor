import React, { useState, useRef, useEffect } from 'react';
import { TextAnnotation } from '../types';
import { GripVertical, Trash2, Palette, X } from 'lucide-react';

interface TextNoteBoxProps {
  annotation: TextAnnotation;
  pageWidth: number;
  pageHeight: number;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updated: TextAnnotation) => void;
  onDelete: (id: string) => void;
}

export const TextNoteBox: React.FC<TextNoteBoxProps> = ({
  annotation,
  pageWidth,
  pageHeight,
  scale,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(annotation.text || '');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialXRatio: number; initialYRatio: number }>({
    mouseX: 0,
    mouseY: 0,
    initialXRatio: 0,
    initialYRatio: 0,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(annotation.text || '');
  }, [annotation.text]);

  // When selected, auto-focus and auto-select placeholder text
  useEffect(() => {
    if (isSelected && textareaRef.current) {
      textareaRef.current.focus();
      if (text === 'Click to type note' || text === 'Type replacement text...') {
        textareaRef.current.select();
      }
    }
  }, [isSelected]);

  const xPx = annotation.xRatio * pageWidth;
  const yPx = annotation.yRatio * pageHeight;
  const scaledFontSize = Math.max(10, (annotation.fontSize || 14) * scale);

  const handleStartDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    onSelect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialXRatio: annotation.xRatio,
      initialYRatio: annotation.yRatio,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.mouseX;
      const deltaY = moveEvent.clientY - dragStartRef.current.mouseY;

      const newXRatio = Math.max(0, Math.min(0.95, dragStartRef.current.initialXRatio + deltaX / pageWidth));
      const newYRatio = Math.max(0, Math.min(0.98, dragStartRef.current.initialYRatio + deltaY / pageHeight));

      onUpdate({
        ...annotation,
        xRatio: newXRatio,
        yRatio: newYRatio,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Only auto-delete on blur if the user cleared the text completely
  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = text.trim();
    if (!trimmed) {
      onDelete(annotation.id);
    } else {
      onUpdate({
        ...annotation,
        text: trimmed,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      if (!text.trim()) {
        onDelete(annotation.id);
      }
      e.stopPropagation();
    }
  };

  const handleDeleteDirectly = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(annotation.id);
  };

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
        setIsEditing(true);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute group select-none transition-shadow ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg z-40'
          : 'hover:ring-1 hover:ring-blue-300 shadow-xs z-30'
      }`}
      style={{
        left: `${xPx}px`,
        top: `${yPx}px`,
        backgroundColor: annotation.bgColor || '#ffffff',
        border: annotation.hasBorder ? '1px solid #cbd5e1' : '1px dashed rgba(59, 130, 246, 0.4)',
        borderRadius: '4px',
        padding: '3px 6px',
        cursor: isDragging ? 'grabbing' : 'default',
        minWidth: '60px',
        maxWidth: '550px',
      }}
    >
      {/* Corner Quick-Delete "X" Button */}
      <button
        type="button"
        onMouseDown={handleDeleteDirectly}
        onClick={handleDeleteDirectly}
        title="Delete text box"
        className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-pointer"
      >
        <X className="w-3 h-3 stroke-[3]" />
      </button>

      {/* Action Toolbar on selection */}
      {isSelected && (
        <div
          className="absolute -top-9 left-0 flex items-center gap-1 bg-slate-900 text-white rounded-lg px-2 py-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div
            onMouseDown={handleStartDrag}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-700 rounded text-slate-300"
            title="Drag to reposition text box"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

          {/* Font Size Selector */}
          <select
            value={annotation.fontSize || 14}
            onChange={(e) =>
              onUpdate({
                ...annotation,
                fontSize: Number(e.target.value),
              })
            }
            className="bg-slate-800 text-xs text-white rounded px-1.5 py-0.5 focus:outline-none"
            title="Font Size"
          >
            <option value={10}>10pt</option>
            <option value={12}>12pt</option>
            <option value={14}>14pt</option>
            <option value={16}>16pt</option>
            <option value={18}>18pt</option>
            <option value={22}>22pt</option>
            <option value={28}>28pt</option>
          </select>

          {/* Text Color Picker */}
          <input
            type="color"
            value={annotation.color || '#000000'}
            onChange={(e) =>
              onUpdate({
                ...annotation,
                color: e.target.value,
              })
            }
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
            title="Text Color"
          />

          {/* Background Style Toggle */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const bgOptions = ['#ffffff', '#fef08a', 'transparent'];
              const curIdx = bgOptions.indexOf(annotation.bgColor);
              const next = bgOptions[(curIdx + 1) % bgOptions.length];
              onUpdate({
                ...annotation,
                bgColor: next,
                hasBorder: next !== 'transparent',
              });
            }}
            className="p-1 text-xs hover:bg-slate-700 rounded text-slate-300"
            title="Cycle background (Whiteout / Sticky Yellow / Transparent)"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

          {/* Delete Button */}
          <button
            type="button"
            onMouseDown={handleDeleteDirectly}
            onClick={handleDeleteDirectly}
            className="p-1 hover:bg-red-700 rounded text-red-300 transition-colors"
            title="Delete this text box"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inline Text Area / Content */}
      {isEditing || isSelected ? (
        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Type note or replacement text..."
          rows={Math.max(1, (text.match(/\n/g) || []).length + 1)}
          className="w-full bg-transparent border-0 focus:outline-none resize-none leading-snug p-0 block"
          style={{
            fontSize: `${scaledFontSize}px`,
            color: annotation.color || '#000000',
            minHeight: `${scaledFontSize * 1.3}px`,
          }}
        />
      ) : (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="whitespace-pre-wrap leading-snug cursor-text"
          style={{
            fontSize: `${scaledFontSize}px`,
            color: annotation.color || '#000000',
          }}
          title="Click to edit text"
        >
          {text || 'Click to edit...'}
        </div>
      )}
    </div>
  );
};
