import { describe, expect, it } from 'vitest'
import { RowFlex } from '../../../src/editor/dataset/enum/Row'
import { createUcDocFile } from '../../../src/editor/ucdoc'
import {
  createDocumentXml,
  DOCX_MIME_TYPE,
  exportUcDocToDocx
} from '../../../src/editor/word/docx'

describe('basic docx export', () => {
  it('creates document xml from ucdoc text content', () => {
    const doc = createUcDocFile({
      metadata: {
        title: 'Docx Test'
      },
      data: {
        header: [],
        main: [
          {
            value: 'Hello ',
            bold: true,
            font: 'Arial',
            size: 16,
            color: '#ff0000'
          },
          {
            value: 'World',
            italic: true
          },
          {
            value: '\n'
          },
          {
            value: 'Second paragraph',
            rowFlex: RowFlex.CENTER,
            paragraph: {
              styleId: 'heading1',
              spacing: {
                before: 6,
                after: 8
              }
            }
          }
        ],
        footer: []
      }
    })

    const xml = createDocumentXml(doc)

    expect(xml).toContain('<w:document')
    expect(xml).toContain('<w:b/>')
    expect(xml).toContain('<w:i/>')
    expect(xml).toContain('<w:color w:val="FF0000"/>')
    expect(xml).toContain('<w:pStyle w:val="heading1"/>')
    expect(xml).toContain('<w:jc w:val="center"/>')
    expect(xml).toContain('<w:sectPr>')
  })

  it('exports a docx package with required files and zip signature', () => {
    const doc = createUcDocFile({
      metadata: {
        title: 'Project Plan',
        author: 'uirmb'
      },
      data: {
        header: [],
        main: [
          {
            value: 'Project Plan'
          }
        ],
        footer: []
      }
    })

    const result = exportUcDocToDocx(doc)

    expect(result.fileName).toBe('Project Plan.docx')
    expect(result.mimeType).toBe(DOCX_MIME_TYPE)
    expect(result.files.map(file => file.path)).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'docProps/core.xml',
      'docProps/app.xml',
      'word/_rels/document.xml.rels',
      'word/document.xml',
      'word/styles.xml'
    ])
    expect(result.data[0]).toBe(0x50)
    expect(result.data[1]).toBe(0x4b)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('normalizes docx file names', () => {
    const doc = createUcDocFile({
      metadata: {
        title: 'Report'
      }
    })

    expect(exportUcDocToDocx(doc, { fileName: 'custom' }).fileName).toBe(
      'custom.docx'
    )
    expect(exportUcDocToDocx(doc, { fileName: 'custom.docx' }).fileName).toBe(
      'custom.docx'
    )
  })
})
