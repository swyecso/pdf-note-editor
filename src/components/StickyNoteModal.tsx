import React, { useState, useEffect } from 'react';
import { StickyNoteAnnotation } from '../types';
import { X, Trash2, Check, MessageSquare } from 'lucide-react';

interface StickyNoteModalProps {
  note: StickyNoteAnnotation;
  onUpdate: (updated: StickyNoteAnnotation) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { name: 'Yellow', bg: '#fef08a', border: '#eab308' },
  { name: 'Blue', bg: '#bfdbfe', border: '#3b82f6' },
  { name: 'Green', bg: '#bbf7d0', border: '#22c55e' },
  { name: 'Pink', bg: '#fbcfe8', border: '#ec4899' },
  { name: 'Orange', bg: '#fed7aa', border: '#f97316' },
];

export const StickyNoteModal: React.FC<StickyNoteModalProps> = ({
  note,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [content, setContent] = useState(note.content || '');
  const [color, setColor] = useState(note.color || '#fef08a');
  const [author, setAuthor] = useState(note.author || 'Note');

  useEffect(() => {
    setContent(note.content || '');
    setColor(note.color || '#fef08a');
    setAuthor(note.author || 'Note');
  }, [note]);

  const handleSave = () => {
    onUpdate({
      ...note,
      content,
      color,
      author,
    });
    onClose();
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onUpdate({
      ...note,
      color: newColor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-300 transition-all transform animate-in fade-in zoom-in-95 duration-150"
        style={{ backgroundColor: color }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/10 bg-black/5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-700" />
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author / Tag"
              className="font-semibold text-sm text-slate-800 bg-transparent border-b border-dashed border-slate-400 focus:outline-none focus:border-slate-800 px-1 py-0.5"
            />
            <span className="text-xs text-slate-500 font-medium ml-1">
              • Page {note.pageNum}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(note.id)}
              title="Delete note"
              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-black/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              title="Close note"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-black/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <textarea
            autoFocus
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your note, comment, or action item here..."
            className="w-full bg-white/70 backdrop-blur-sm rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50 resize-y border border-black/10 placeholder-slate-400 leading-relaxed shadow-inner"
          />

          {/* Color Chooser */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Color:</span>
              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleColorChange(c.bg)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c.bg ? 'scale-110 shadow-md ring-2 ring-slate-700' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.bg, borderColor: c.border }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
