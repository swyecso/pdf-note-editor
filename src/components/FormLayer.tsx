import React from 'react';
import { FormFieldInfo } from '../types';

interface FormLayerProps {
  pageNum: number;
  width: number;
  height: number;
  scale: number;
  formFields: FormFieldInfo[];
  onUpdateFormField: (name: string, value: string | boolean) => void;
}

export const FormLayer: React.FC<FormLayerProps> = ({
  pageNum,
  width,
  height,
  scale,
  formFields,
  onUpdateFormField,
}) => {
  const pageFields = formFields.filter((f) => f.pageNum === pageNum);
  if (pageFields.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-auto z-20"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {pageFields.map((field) => {
        const x = field.xRatio * width;
        const y = field.yRatio * height;
        const w = Math.max(20, field.widthRatio * width);
        const h = Math.max(18, field.heightRatio * height);

        if (field.type === 'checkbox') {
          return (
            <div
              key={field.name}
              className="absolute flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${w}px`,
                height: `${h}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateFormField(field.name, !field.value);
              }}
              title={`Checkbox: ${field.name}`}
            >
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(e) => onUpdateFormField(field.name, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-blue-500 cursor-pointer shadow-sm"
              />
            </div>
          );
        }

        if (field.type === 'dropdown') {
          return (
            <div
              key={field.name}
              className="absolute"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${w}px`,
                height: `${h}px`,
              }}
            >
              <select
                value={String(field.value || '')}
                onChange={(e) => onUpdateFormField(field.name, e.target.value)}
                className="w-full h-full bg-blue-50/70 hover:bg-blue-50 focus:bg-white text-slate-800 border border-blue-300 focus:border-blue-600 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                title={`Dropdown: ${field.name}`}
              >
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // Standard Text Field
        const isMultiLine = h > 36;

        return (
          <div
            key={field.name}
            className="absolute group"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${w}px`,
              height: `${h}px`,
            }}
          >
            {isMultiLine ? (
              <textarea
                value={String(field.value || '')}
                onChange={(e) => onUpdateFormField(field.name, e.target.value)}
                placeholder="Fill form field..."
                className="w-full h-full bg-blue-50/70 hover:bg-blue-50 focus:bg-white text-slate-800 border border-blue-300 focus:border-blue-600 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-xs"
                title={`Form Field: ${field.name}`}
              />
            ) : (
              <input
                type="text"
                value={String(field.value || '')}
                onChange={(e) => onUpdateFormField(field.name, e.target.value)}
                placeholder="Fill field..."
                className="w-full h-full bg-blue-50/70 hover:bg-blue-50 focus:bg-white text-slate-800 border border-blue-300 focus:border-blue-600 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                title={`Form Field: ${field.name}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
