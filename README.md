# UcDoc Editor

> A UcDoc JSON-based Word-like document editor with DOCX export, based on [canvas-editor](https://github.com/Hufe921/canvas-editor).

UcDoc Editor is a fork-based document editor project built on top of the excellent open-source [canvas-editor](https://github.com/Hufe921/canvas-editor). It keeps the canvas/SVG rendering foundation of canvas-editor and adds a UcDoc-first document workflow for online document systems.

The main goal of this project is:

- Use UcDoc JSON as the native online document format.
- Open and save editable documents as JSON.
- Export UcDoc documents to DOCX.
- Provide a Word-like editor foundation for business systems, file managers, and online office scenarios.

## Relationship with canvas-editor

This project is based on [Hufe921/canvas-editor](https://github.com/Hufe921/canvas-editor).

Original project:

```txt
https://github.com/Hufe921/canvas-editor
```

Current fork/project:

```txt
https://github.com/uirmb/canvas-editor
```

The original canvas-editor project is licensed under the MIT License. This project keeps the MIT License and includes additional UcDoc and DOCX export capabilities.

## License

This project is released under the [MIT License](./LICENSE).

It is based on [canvas-editor](https://github.com/Hufe921/canvas-editor), which is also released under the MIT License.

## Installation

```bash
# npm
npm install @uirmb/ucdoc-editor

# pnpm
pnpm add @uirmb/ucdoc-editor

# yarn
yarn add @uirmb/ucdoc-editor
```

## Quick Start

```html
<div class="ucdoc-editor"></div>
```

```ts
import Editor from '@uirmb/ucdoc-editor'

const container = document.querySelector<HTMLDivElement>('.ucdoc-editor')!

const editor = new Editor(
  container,
  {
    header: [],
    main: [
      {
        value: 'Hello, UcDoc Editor!'
      }
    ],
    footer: []
  },
  {}
)
```

## UcDoc save / open / DOCX export

```ts
import Editor, {
  UcDocEditorShell,
  exportUcDocToDocx,
  createDocxBlob
} from '@uirmb/ucdoc-editor'

const container = document.querySelector<HTMLDivElement>('.ucdoc-editor')!

const editor = new Editor(
  container,
  {
    header: [],
    main: [
      {
        value: 'Hello UcDoc'
      }
    ],
    footer: []
  },
  {}
)

const shell = new UcDocEditorShell(editor, {
  async onSave(doc) {
    localStorage.setItem('demo.ucdoc', JSON.stringify(doc))
  }
})

// Save as UcDoc JSON
const doc = await shell.saveUcDoc({
  metadata: {
    title: 'Demo Document'
  }
})

// Open UcDoc JSON
shell.openUcDoc(doc, {
  applyOptions: true
})

// Export DOCX
const result = exportUcDocToDocx(doc, {
  fileName: 'Demo Document.docx'
})

const blob = createDocxBlob(result)
```

## Main capabilities

- Canvas/SVG-based editor foundation inherited from canvas-editor.
- UcDoc JSON native document format.
- UcDoc editor shell for open/save/dirty/readonly workflows.
- Headless Word toolbar controller.
- Paragraph, style, numbering, page, table, and image models.
- DOCX export for common document scenarios.

Current DOCX export supports:

- Text paragraphs.
- Basic character styles.
- Paragraph style, alignment, indentation, spacing, and line spacing.
- Page size, orientation, and margins.
- Page breaks.
- Tables, table grid, borders, header rows, cell width, background, vertical alignment, colspan, and rowspan/vMerge.
- Images from UcDoc assets.
- Numbering and lists.
- Headers and footers.
- External hyperlinks.
- Dynamic paragraph styles.

## Example

See:

```txt
examples/ucdoc-docx-export.html
```

This example demonstrates:

- Creating an editor.
- Saving current content as UcDoc JSON.
- Opening UcDoc JSON back into the editor.
- Exporting UcDoc to DOCX in the browser.

## Documentation

Stage summary and integration notes:

```txt
docs/ucdoc-docx-export.md
```

## Development

### Prerequisites

```txt
Node.js >= 24.13.1
pnpm recommended
```

### Install dependencies

```bash
pnpm install
```

### Start development server

```bash
pnpm run dev
```

### Build library

```bash
pnpm run lib
```

### Type check

```bash
pnpm run type:check
```

### Unit tests

```bash
pnpm run test:unit
```

## Notes

UcDoc Editor does not aim to be a full Microsoft Word compatibility layer at this stage. The recommended workflow is:

```txt
UcDoc JSON as source format -> online editing -> export DOCX when needed
```

DOCX import, advanced Word compatibility, floating image layout, footnotes, comments, revision tracking, and complex section handling can be implemented later as plugins or optional modules.

## Credits

This project is based on [canvas-editor](https://github.com/Hufe921/canvas-editor) by Hufe921 and contributors.

Thanks to the original canvas-editor project for providing the rendering engine and editor foundation.

## License

MIT License.

See [LICENSE](./LICENSE).
