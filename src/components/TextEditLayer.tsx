import React, { useState, useRef, useEffect } from 'react';
import { TextBlock } from '../utils/textBlockEngine';
import { TextEdit, Tool } from '../types';
import { reflowParagraphText } from '../utils/textReflow';
import { sampleBackgroundColor } from '../utils/colorSampler';
import { RotateCcw, Check, Edit3, Palette, X } from 'lucide-react';

interface TextEditLayerProps {
  pageNum: number;
  width: number;
  height: number;
  scale: number;
  tool: Tool;
  canvas: HTMLCanvasElement | null;
  blocks: TextBlock[];
  textEdits: TextEdit[];
  onSaveTextEdit: (edit: TextEdit) => void;
  onRevertTextEdit: (blockId: string) => void;
  onSwitchTool: (tool: Tool) => void;
}

export const TextEditLayer: React.FC<TextEditLayerProps> = ({
  pageNum,
  width,
  height,
  scale,
  tool,
  canvas,
  blocks,
  textEdits,
  onSaveTextEdit,
  onRevertTextEdit,
  onSwitchTool,
}) => {
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editFontSize, setEditFontSize] = useState<number>(14);
  const [editBgColor, setEditBgColor] = useState<string>('#ffffff');
  const [activeBlock, setActiveBlock] = useState<TextBlock | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Floating selection pill state
  const [selectionTooltip, setSelectionTooltip] = useState<{
    text: string;
    block: TextBlock;
    x: number;
    y: number;
  } | null>(null);

  // Start editing a specific paragraph block
  const startEditingBlock = (block: TextBlock) => {
    setActiveBlock(block);
    setActiveEditingId(block.id);

    const existingEdit = textEdits.find((e) => e.blockId === block.id);
    const initialText = existingEdit ? existingEdit.currentText : block.originalText;
    const initialSize = existingEdit ? existingEdit.fontSize : block.fontSize;

    // Sample background color from canvas perimeter if not already set
    let sampledBg = existingEdit ? existingEdit.bgColor : '#ffffff';
    if (!existingEdit && canvas) {
      sampledBg = sampleBackgroundColor(canvas, block.bounds);
    }

    setEditText(initialText);
    setEditFontSize(initialSize);
    setEditBgColor(sampledBg);
    setSelectionTooltip(null);
  };

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (activeEditingId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeEditingId]);

  // Commit changes when exiting editing mode
  const commitEdit = () => {
    if (!activeBlock) {
      setActiveEditingId(null);
      return;
    }

    const trimmed = editText.trim();
    const isEdited = trimmed !== activeBlock.originalText.trim();

    if (!isEdited) {
      // If reverted to original text, clear edit
      onRevertTextEdit(activeBlock.id);
    } else {
      const blockWidthPx = activeBlock.bounds.widthRatio * width;
      const reflowResult = reflowParagraphText(
        editText,
        blockWidthPx,
        editFontSize * scale,
        activeBlock.fontFamily,
        activeBlock.isBold
      );

      const updatedEdit: TextEdit = {
        blockId: activeBlock.id,
        pageNum,
        originalText: activeBlock.originalText,
        currentText: editText,
        reflowedLines: reflowResult.lines,
        bounds: activeBlock.bounds,
        fontSize: editFontSize,
        isBold: activeBlock.isBold,
        isItalic: activeBlock.isItalic,
        fontFamily: activeBlock.fontFamily,
        color: activeBlock.color || '#000000',
        bgColor: editBgColor,
        isEdited: true,
      };

      onSaveTextEdit(updatedEdit);
    }

    setActiveEditingId(null);
    setActiveBlock(null);
  };

  const handleRevert = (blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRevertTextEdit(blockId);
    if (activeEditingId === blockId) {
      setActiveEditingId(null);
      setActiveBlock(null);
    }
  };

  // Detect mouse text selections (Option 3: Both Click & Cursor Selection)
  useEffect(() => {
    const handleMouseUp = () => {
      if (activeEditingId) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelectionTooltip(null);
        return;
      }

      const selectedStr = sel.toString().trim();
      if (selectedStr.length < 2) {
        setSelectionTooltip(null);
        return;
      }

      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Find which block contains or matches the selection
        const matchingBlock = blocks.find((b) =>
          b.originalText.includes(selectedStr)
        );

        if (matchingBlock) {
          setSelectionTooltip({
            text: selectedStr,
            block: matchingBlock,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      } catch {
        setSelectionTooltip(null);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [blocks, activeEditingId]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Floating Selection Tooltip */}
      {selectionTooltip && !activeEditingId && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full pointer-events-auto bg-slate-900 text-white rounded-lg shadow-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in zoom-in-95 cursor-pointer hover:bg-slate-800"
          style={{ left: `${selectionTooltip.x}px`, top: `${selectionTooltip.y}px` }}
          onClick={() => {
            startEditingBlock(selectionTooltip.block);
            setSelectionTooltip(null);
          }}
        >
          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
          <span>Edit Selected Text</span>
        </div>
      )}

      {/* Render all modified text blocks (always active on screen to mask original text) */}
      {textEdits
        .filter((e) => e.pageNum === pageNum && e.isEdited && e.blockId !== activeEditingId)
        .map((edit) => {
          const bx = edit.bounds.xRatio * width;
          const by = edit.bounds.yRatio * height;
          const bw = edit.bounds.widthRatio * width;
          const scaledSize = Math.max(9, edit.fontSize * scale);
          const scaledLineHeight = Math.round(scaledSize * 1.3);

          return (
            <div
              key={edit.blockId}
              onClick={(e) => {
                e.stopPropagation();
                const matched = blocks.find((b) => b.id === edit.blockId);
                if (matched) startEditingBlock(matched);
              }}
              className="absolute group pointer-events-auto cursor-pointer rounded-xs transition-shadow hover:ring-2 hover:ring-blue-400"
              style={{
                left: `${bx}px`,
                top: `${by}px`,
                width: `${bw}px`,
                backgroundColor: edit.bgColor || '#ffffff',
                zIndex: 31,
                padding: '1px 2px',
              }}
              title="Click to re-edit paragraph"
            >
              {/* Reflowed text lines */}
              <div
                style={{
                  fontFamily:
                    edit.fontFamily === 'serif'
                      ? 'Times New Roman, Times, serif'
                      : edit.fontFamily === 'mono'
                      ? 'Courier New, Courier, monospace'
                      : 'Arial, Helvetica, sans-serif',
                  fontSize: `${scaledSize}px`,
                  lineHeight: `${scaledLineHeight}px`,
                  fontWeight: edit.isBold ? 'bold' : 'normal',
                  fontStyle: edit.isItalic ? 'italic' : 'normal',
                  color: edit.color || '#000000',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {edit.reflowedLines.join('\n')}
              </div>

              {/* Hover Revert Button */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-7 right-0 flex items-center gap-1 bg-slate-900 text-white rounded-md px-2 py-0.5 text-[10px] font-semibold shadow-md z-50">
                <button
                  type="button"
                  onMouseDown={(e) => handleRevert(edit.blockId, e)}
                  className="hover:text-amber-300 flex items-center gap-1"
                  title="Revert to original text"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Revert
                </button>
              </div>
            </div>
          );
        })}

      {/* Hover Outlines when Edit Text tool is active */}
      {tool === 'editText' &&
        !activeEditingId &&
        blocks.map((block) => {
          const isCurrentlyEdited = textEdits.some(
            (e) => e.blockId === block.id && e.isEdited
          );
          if (isCurrentlyEdited) return null;

          const bx = block.bounds.xRatio * width;
          const by = block.bounds.yRatio * height;
          const bw = block.bounds.widthRatio * width;
          const bh = block.bounds.heightRatio * height;

          return (
            <div
              key={block.id}
              onClick={(e) => {
                e.stopPropagation();
                startEditingBlock(block);
              }}
              className="absolute group pointer-events-auto hover:bg-blue-500/10 hover:ring-2 hover:ring-blue-500 rounded cursor-pointer transition-all flex items-start"
              style={{
                left: `${bx}px`,
                top: `${by}px`,
                width: `${bw}px`,
                height: `${bh}px`,
                zIndex: 25,
              }}
              title="Click to edit paragraph"
            >
              <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-0 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-50 flex items-center gap-1">
                <Edit3 className="w-2.5 h-2.5" />
                Click to edit paragraph
              </div>
            </div>
          );
        })}

      {/* Active In-Place Paragraph Editor */}
      {activeEditingId && activeBlock && (
        <div
          className="absolute pointer-events-auto z-50"
          style={{
            left: `${activeBlock.bounds.xRatio * width}px`,
            top: `${activeBlock.bounds.yRatio * height}px`,
            width: `${activeBlock.bounds.widthRatio * width}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Control Bar */}
          <div className="absolute -top-10 left-0 flex items-center gap-1.5 bg-slate-900 text-white rounded-lg px-2.5 py-1 shadow-2xl z-50 text-xs font-semibold whitespace-nowrap animate-in fade-in zoom-in-95">
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mr-1">
              Editing Paragraph
            </span>

            {/* Font Size Adjuster */}
            <select
              value={editFontSize}
              onChange={(e) => setEditFontSize(Number(e.target.value))}
              className="bg-slate-800 text-white rounded px-1.5 py-0.5 text-xs focus:outline-none"
              title="Font Size"
            >
              <option value={9}>9pt</option>
              <option value={10}>10pt</option>
              <option value={11}>11pt</option>
              <option value={12}>12pt</option>
              <option value={14}>14pt</option>
              <option value={16}>16pt</option>
              <option value={18}>18pt</option>
              <option value={22}>22pt</option>
            </select>

            {/* Background Color Picker (Cycle or custom) */}
            <input
              type="color"
              value={editBgColor}
              onChange={(e) => setEditBgColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
              title="Background Color (Auto-sampled)"
            />

            <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

            {/* Revert to Original */}
            <button
              type="button"
              onMouseDown={() => {
                setEditText(activeBlock.originalText);
                onRevertTextEdit(activeBlock.id);
                setActiveEditingId(null);
                setActiveBlock(null);
              }}
              className="flex items-center gap-1 hover:text-amber-300 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
              title="Revert back to original paragraph"
            >
              <RotateCcw className="w-3 h-3" />
              Revert
            </button>

            {/* Done Button */}
            <button
              type="button"
              onMouseDown={commitEdit}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded transition-colors font-bold ml-1"
              title="Apply changes (Ctrl+Enter)"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          </div>

          {/* In-Place Textarea Overwriting Original Text */}
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                commitEdit();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                commitEdit();
              }
            }}
            rows={Math.max(2, (editText.match(/\n/g) || []).length + 1)}
            className="w-full focus:outline-none resize-none ring-2 ring-blue-500 rounded p-1 shadow-2xl block"
            style={{
              backgroundColor: editBgColor,
              fontFamily:
                activeBlock.fontFamily === 'serif'
                  ? 'Times New Roman, Times, serif'
                  : activeBlock.fontFamily === 'mono'
                  ? 'Courier New, Courier, monospace'
                  : 'Arial, Helvetica, sans-serif',
              fontSize: `${Math.max(9, editFontSize * scale)}px`,
              lineHeight: `${Math.round(Math.max(9, editFontSize * scale) * 1.3)}px`,
              fontWeight: activeBlock.isBold ? 'bold' : 'normal',
              fontStyle: activeBlock.isItalic ? 'italic' : 'normal',
              color: activeBlock.color || '#000000',
              minHeight: `${activeBlock.bounds.heightRatio * height}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};
