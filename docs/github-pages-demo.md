# GitHub Pages demo deployment

This repository includes a GitHub Actions workflow for publishing the UcDoc DOCX export demo to GitHub Pages.

## Workflow

```txt
.github/workflows/pages.yml
```

The workflow runs on:

- push to `main`
- manual `workflow_dispatch`

It performs the following steps:

1. Install dependencies with pnpm.
2. Build the library with `pnpm run lib`.
3. Copy `examples/` and `dist/` into the Pages artifact.
4. Publish the artifact to GitHub Pages.

## Required repository setting

In GitHub repository settings, enable GitHub Pages with GitHub Actions as the source:

```txt
Settings
-> Pages
-> Build and deployment
-> Source: GitHub Actions
```

## Demo URLs

Repository Pages root:

```txt
https://uirmb.github.io/ucdoc-editor/
```

UcDoc DOCX export demo:

```txt
https://uirmb.github.io/ucdoc-editor/examples/ucdoc-docx-export.html
```

## Notes

The demo imports the built ESM file from:

```txt
../dist/canvas-editor.js
```

Therefore the workflow must build the library and publish `dist/` together with `examples/`.
