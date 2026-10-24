# PDF Note Editor 📝

A lightweight, high-performance web application designed for adding notes, comments, annotations, filling out PDF forms, and performing in-place text edits with automatic paragraph reflow.

---

## 🌐 3 Ways to Use & Share

1. **Live Web App (Zero Install - Any Browser, Phone or Tablet)**:
   - **[https://swyecso.github.io/pdf-note-editor/](https://swyecso.github.io/pdf-note-editor/)**
   - Automatically deployed directly from this repository via GitHub Pages.

2. **Offline Single-File Bundle**:
   - Double-click **`pdf-notes-editor.html`**.
   - Opens immediately in your web browser with 100% offline functionality. You can also email this ~2MB file directly to anyone!

3. **1-Click Windows Launcher**:
   - Double-click **`start.bat`**.

---

## ✨ Features

- **✏️ In-Place Text Editing & Paragraph Reflow:**
  - Click the **Edit Text (`X`)** tool and click into any paragraph (or drag-select words with your mouse).
  - Modify wording in-place; words naturally wrap and reflow within the original column width.
  - Automatically samples background color behind text for seamless, invisible redaction masking.
  - Hover over any modified paragraph to access the **Revert** button to restore original text anytime.
- **🔤 Direct Text Notes:** Click anywhere to insert custom text boxes with adjustable font sizes (10pt–28pt), colors, and background fills.
- **📌 Interactive Sticky Notes:** Drop comment pins anywhere on a page. Color-code notes (Yellow, Green, Blue, Pink, Orange) with author tags and timestamps.
- **📋 Fillable PDF Form Support:** Detects interactive AcroForm fields (text inputs, checkboxes, dropdowns). Fill out forms in the browser and permanently embed filled values into the exported PDF.
- **📑 "All Notes" Sidebar:** Consolidated list of all notes and sticky pins across all pages. Clicking any note instantly jumps to that page.
- **🖍️ Highlighter:** Highlight text in translucent fluorescent yellow, green, cyan, or pink.
- **✒️ Freehand Pen:** Smooth sketching, circling sections, margin notes, and signatures.
- **🧹 Eraser:** Delete annotations with a single click.
- **↩️ Undo / Redo:** Full `Ctrl+Z` and `Ctrl+Y` history stack.
- **🔍 Zoom & Navigation:** Zoom in/out, fit to width, crisp page thumbnails, and arrow navigation.
- **💾 Real PDF Export:** Click "Download PDF" to generate a standard PDF with notes, pins, highlights, drawings, filled forms, and reflowed text edits baked in.
- **⚡ Interactive Sample PDF Included:** Click "Sample PDF" in the top bar to test all features and form fields immediately.

---

## 🔄 How to Build & Sync Future Changes

To build and push updates to GitHub in a single step:

- **Option A (1-Click Batch File)**: Double-click **`sync.bat`**.
- **Option B (Command Line)**: Run `npm run sync`.

Both options automatically re-compile the production bundle, copy it to `pdf-notes-editor.html`, commit the changes, and push to GitHub (which also triggers the automatic GitHub Pages deployment).
