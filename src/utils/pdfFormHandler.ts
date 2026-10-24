import {
  PDFDocument,
  PDFCheckBox,
  PDFDropdown,
  PDFTextField,
  PDFRef,
} from 'pdf-lib';
import { FormFieldInfo } from '../types';

export async function extractPdfFormFields(pdfBytes: Uint8Array): Promise<FormFieldInfo[]> {
  try {
    const loadedDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = loadedDoc.getForm();
    const fields = form.getFields();
    if (!fields || fields.length === 0) return [];

    const pages = loadedDoc.getPages();
    const extracted: FormFieldInfo[] = [];

    for (const field of fields) {
      try {
        const name = field.getName();
        let type: 'text' | 'checkbox' | 'dropdown' = 'text';
        let value: string | boolean = '';
        let options: string[] | undefined = undefined;

        if (field instanceof PDFCheckBox) {
          type = 'checkbox';
          value = field.isChecked();
        } else if (field instanceof PDFDropdown) {
          type = 'dropdown';
          options = field.getOptions();
          const selected = field.getSelected();
          value = selected.length > 0 ? selected[0] : (options[0] || '');
        } else if (field instanceof PDFTextField) {
          type = 'text';
          value = field.getText() || '';
        }

        const widgets = field.acroField.getWidgets();
        for (const widget of widgets) {
          try {
            const rect = widget.getRectangle();
            const pageRef = widget.P();

            let pageIndex = pages.findIndex((p) => p.ref === pageRef);
            if (pageIndex === -1) pageIndex = 0;

            const page = pages[pageIndex];
            const { width: pW, height: pH } = page.getSize();

            const xRatio = Math.max(0, Math.min(1, rect.x / pW));
            const yRatio = Math.max(0, Math.min(1, (pH - rect.y - rect.height) / pH));
            const widthRatio = Math.max(0.01, Math.min(1, rect.width / pW));
            const heightRatio = Math.max(0.01, Math.min(1, rect.height / pH));

            extracted.push({
              name,
              type,
              value,
              options,
              pageNum: pageIndex + 1,
              xRatio,
              yRatio,
              widthRatio,
              heightRatio,
            });
          } catch (widgetErr) {
            console.warn(`Could not process widget for field ${name}:`, widgetErr);
          }
        }
      } catch (fieldErr) {
        console.warn('Could not parse form field:', fieldErr);
      }
    }

    return extracted;
  } catch (err) {
    console.warn('Error reading PDF form fields:', err);
    return [];
  }
}

export function applyFormFieldsToPdf(pdfDoc: PDFDocument, formFields: FormFieldInfo[]) {
  try {
    const form = pdfDoc.getForm();
    for (const ff of formFields) {
      try {
        if (ff.type === 'text') {
          const field = form.getTextField(ff.name);
          field.setText(String(ff.value || ''));
        } else if (ff.type === 'checkbox') {
          const field = form.getCheckBox(ff.name);
          if (ff.value) {
            field.check();
          } else {
            field.uncheck();
          }
        } else if (ff.type === 'dropdown' && ff.options) {
          const field = form.getDropdown(ff.name);
          field.select(String(ff.value));
        }
      } catch (err) {
        console.warn(`Could not apply value to form field ${ff.name}:`, err);
      }
    }
  } catch (err) {
    console.warn('Could not access form in pdfDoc during export:', err);
  }
}
