import React, { useState } from 'react';
import { Annotation, StickyNoteAnnotation, TextAnnotation } from '../types';
import {
  Layers,
  MessageSquare,
  Pin,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  numPages: number;
  currentPage: number;
  thumbnails: { [pageNum: number]: string };
  annotations: Annotation[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectPage: (pageNum: number) => void;
  onSelectNote: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  numPages,
  currentPage,
  thumbnails,
  annotations,
  isOpen,
  onToggleOpen,
  onSelectPage,
  onSelectNote,
  onDeleteAnnotation,
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'notes'>('pages');

  // Filter notes (sticky notes + text notes)
  const notesList = annotations.filter(
    (a): a is StickyNoteAnnotation | TextAnnotation =>
      a.type === 'sticky' || a.type === 'text'
  );

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 flex flex-col transition-all duration-200 select-none z-30 ${
        isOpen ? 'w-64' : 'w-12'
      }`}
    >
      {/* Collapse Toggle Handle */}
      <button
        onClick={onToggleOpen}
        className="absolute -right-3 top-5 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm z-50 transition-transform hover:scale-110"
        title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* When collapsed */}
      {!isOpen ? (
        <div className="flex flex-col items-center py-4 gap-4">
          <button
            onClick={() => {
              onToggleOpen();
              setActiveTab('pages');
            }}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            title="Pages"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              onToggleOpen();
              setActiveTab('notes');
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            title="All Notes"
          >
            <MessageSquare className="w-5 h-5" />
            {notesList.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>
      ) : (
        /* When expanded */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 p-1">
            <button
              onClick={() => setActiveTab('pages')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'pages'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Pages ({numPages})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'notes'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Notes ({notesList.length})
            </button>
          </div>

          {/* Tab 1: Pages Thumbnail View */}
          {activeTab === 'pages' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Array.from({ length: numPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isSelected = pageNum === currentPage;
                const thumb = thumbnails[pageNum];
                const noteCount = annotations.filter((a) => a.pageNum === pageNum).length;

                return (
                  <div
                    key={pageNum}
                    onClick={() => onSelectPage(pageNum)}
                    className={`cursor-pointer group flex flex-col items-center p-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="relative w-full aspect-[1/1.4] bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-sm flex items-center justify-center">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Page ${pageNum}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-300" />
                      )}

                      {noteCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                          {noteCount}
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-xs font-medium ${
                        isSelected ? 'text-blue-600 font-bold' : 'text-slate-600'
                      }`}
                    >
                      Page {pageNum}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: All Notes List */}
          {activeTab === 'notes' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {notesList.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Pin className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No notes yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select the Text or Sticky Note tool above to add comments to this PDF.
                  </p>
                </div>
              ) : (
                notesList.map((note) => {
                  const isSticky = note.type === 'sticky';
                  const title = isSticky ? (note as StickyNoteAnnotation).author || 'Note' : 'Text Box';
                  const content = isSticky
                    ? (note as StickyNoteAnnotation).content || 'Empty note'
                    : (note as TextAnnotation).text || 'Empty text';
                  const color = isSticky ? (note as StickyNoteAnnotation).color : '#bfdbfe';

                  return (
                    <div
                      key={note.id}
                      onClick={() => onSelectNote(note)}
                      className="group cursor-pointer p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                            {title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            Pg {note.pageNum}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAnnotation(note.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-opacity"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
