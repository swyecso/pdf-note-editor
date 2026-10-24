import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function createSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Initialize interactive AcroForm
  const form = pdfDoc.getForm();

  // ================= PAGE 1: Overview & Annotation Guide =================
  const page1 = pdfDoc.addPage([595, 842]); // A4 dimensions
  const { width: p1Width, height: p1Height } = page1.getSize();

  // Top banner
  page1.drawRectangle({
    x: 0,
    y: p1Height - 80,
    width: p1Width,
    height: 80,
    color: rgb(0.12, 0.23, 0.36),
  });

  page1.drawText('PDF Note Editor - Quick Start Guide', {
    x: 40,
    y: p1Height - 50,
    size: 22,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Page 1 of 2  •  Text Notes, Sticky Comments & Highlights', {
    x: 40,
    y: p1Height - 70,
    size: 11,
    font: helveticaFont,
    color: rgb(0.8, 0.85, 0.9),
  });

  let y = p1Height - 120;

  // Introduction
  page1.drawText('Welcome to your PDF Note & Annotation Tool!', {
    x: 40,
    y: y,
    size: 16,
    font: helveticaBold,
    color: rgb(0.15, 0.2, 0.25),
  });

  y -= 25;
  const introLines = [
    'This application allows you to easily review documents, add rich notes, and fill out interactive forms.',
    'All notes, comments, highlights, pen drawings, and filled form values are permanently',
    'embedded when you download or save the document.'
  ];
  for (const line of introLines) {
    page1.drawText(line, { x: 40, y, size: 11, font: timesRomanFont, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
  }

  y -= 15;
  // Features Box
  page1.drawRectangle({
    x: 40,
    y: y - 205,
    width: p1Width - 80,
    height: 205,
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1),
  });

  let boxY = y - 22;
  page1.drawText('Try These Core Tools on This Document:', {
    x: 55,
    y: boxY,
    size: 13,
    font: helveticaBold,
    color: rgb(0.15, 0.25, 0.45),
  });

  const tools = [
    ['1. Text Note Tool (T)', 'Click anywhere on this page to type notes or comments directly onto the document.'],
    ['2. Sticky Note Pin (S)', 'Drop a pin to attach a note card. Listed in the "All Notes" sidebar.'],
    ['3. Highlighter Marker (H)', 'Drag across important sentences to highlight them in yellow, green, or pink.'],
    ['4. Freehand Pen (P)', 'Draw freehand notes, circle paragraphs, or sign your name with custom colors.'],
    ['5. Edit Existing Text (X)', 'Click any paragraph or drag words to edit wording with live reflow.'],
    ['6. Interactive Form Filling', 'Switch to Page 2 to test fillable form fields (inputs, dropdowns, checkboxes).']
  ];

  boxY -= 22;
  for (const [title, desc] of tools) {
    page1.drawText(title, { x: 55, y: boxY, size: 10.5, font: helveticaBold, color: rgb(0.1, 0.2, 0.35) });
    page1.drawText(`- ${desc}`, { x: 195, y: boxY, size: 9.5, font: helveticaFont, color: rgb(0.3, 0.35, 0.4) });
    boxY -= 26;
  }

  y -= 230;

  // Sample Contract Review Section
  page1.drawText('Sample Contract Paragraph (Try In-Place Text Editing!):', {
    x: 40,
    y,
    size: 13,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 22;
  const sampleContractText = [
    'The Client agrees to review and annotate all submitted deliverables within ten (10)',
    'business days of receipt. Any requested revisions or notes should be clearly placed',
    'alongside the relevant section. Upon mutual written confirmation of the notes, the final',
    'version of the document shall be deemed approved and executed by both parties.'
  ];
  for (const line of sampleContractText) {
    page1.drawText(line, { x: 40, y, size: 11, font: timesRomanFont, color: rgb(0.25, 0.25, 0.25) });
    y -= 18;
  }

  y -= 25;
  // Note prompt box
  page1.drawRectangle({
    x: 40,
    y: y - 55,
    width: p1Width - 80,
    height: 55,
    borderColor: rgb(0.9, 0.7, 0.2),
    borderWidth: 1.5,
    color: rgb(1, 0.99, 0.92),
  });

  page1.drawText('👉 Exercise: Select the Edit Text (X) tool & click the paragraph above to edit it,', {
    x: 55,
    y: y - 22,
    size: 11,
    font: helveticaBold,
    color: rgb(0.65, 0.45, 0.05),
  });
  page1.drawText('or drop a Sticky Note pin / add text notes to record review comments!', {
    x: 55,
    y: y - 40,
    size: 11,
    font: helveticaFont,
    color: rgb(0.5, 0.4, 0.1),
  });

  // Footer
  page1.drawText('Page 1 of 2 • PDF Note Editor Local Edition', {
    x: 40,
    y: 30,
    size: 9,
    font: helveticaFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  // ================= PAGE 2: Fillable Interactive Form =================
  const page2 = pdfDoc.addPage([595, 842]);
  const { width: p2Width, height: p2Height } = page2.getSize();

  // Page 2 header
  page2.drawRectangle({
    x: 0,
    y: p2Height - 80,
    width: p2Width,
    height: 80,
    color: rgb(0.18, 0.25, 0.32),
  });

  page2.drawText('Interactive PDF Form & Sign-off', {
    x: 40,
    y: p2Height - 50,
    size: 22,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page2.drawText('Page 2 of 2  •  Fill Out Form Fields & Save to PDF', {
    x: 40,
    y: p2Height - 70,
    size: 11,
    font: helveticaFont,
    color: rgb(0.8, 0.85, 0.9),
  });

  let p2Y = p2Height - 120;

  page2.drawText('Reviewer Sign-Off & Verification Form:', {
    x: 40,
    y: p2Y,
    size: 14,
    font: helveticaBold,
    color: rgb(0.15, 0.25, 0.4),
  });

  page2.drawText('Fill in the fields below. Values are saved directly into the PDF.', {
    x: 40,
    y: p2Y - 18,
    size: 10,
    font: helveticaFont,
    color: rgb(0.4, 0.45, 0.5),
  });

  p2Y -= 50;

  // 1. Full Name field
  page2.drawText('Full Name:', { x: 40, y: p2Y, size: 11, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  const nameField = form.createTextField('client_name');
  nameField.addToPage(page2, { x: 180, y: p2Y - 6, width: 340, height: 24 });

  p2Y -= 45;

  // 2. Email Address field
  page2.drawText('Email Address:', { x: 40, y: p2Y, size: 11, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  const emailField = form.createTextField('client_email');
  emailField.addToPage(page2, { x: 180, y: p2Y - 6, width: 340, height: 24 });

  p2Y -= 45;

  // 3. Department Dropdown
  page2.drawText('Department / Role:', { x: 40, y: p2Y, size: 11, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  const deptDropdown = form.createDropdown('department');
  deptDropdown.setOptions(['Legal & Contracts', 'Finance & Billing', 'Product Design', 'Executive Sign-off']);
  deptDropdown.select('Legal & Contracts');
  deptDropdown.addToPage(page2, { x: 180, y: p2Y - 6, width: 340, height: 24 });

  p2Y -= 50;

  // 4. Checkbox 1: Terms agreed
  const agreeCheck = form.createCheckBox('reviewed_terms');
  agreeCheck.addToPage(page2, { x: 40, y: p2Y - 4, width: 20, height: 20 });
  page2.drawText('I confirm I have reviewed all annotations, notes, and revisions.', {
    x: 70,
    y: p2Y + 2,
    size: 11,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  p2Y -= 35;

  // 5. Checkbox 2: Expedited
  const urgentCheck = form.createCheckBox('urgent_status');
  urgentCheck.addToPage(page2, { x: 40, y: p2Y - 4, width: 20, height: 20 });
  page2.drawText('Expedite processing (High priority response needed)', {
    x: 70,
    y: p2Y + 2,
    size: 11,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  p2Y -= 55;

  // 6. Signer comments multi-line field
  page2.drawText('Additional Review Comments:', { x: 40, y: p2Y, size: 11, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  p2Y -= 15;
  const commentsField = form.createTextField('comments_notes');
  commentsField.enableMultiline();
  commentsField.addToPage(page2, { x: 40, y: p2Y - 110, width: 480, height: 110 });

  // Footer
  page2.drawText('Page 2 of 2 • PDF Note Editor Form Demo', {
    x: 40,
    y: 30,
    size: 9,
    font: helveticaFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await pdfDoc.save();
}
