import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { createUcDocFile } from '../../../src/editor/ucdoc'
import {
  createDocxBlob,
  createDocumentXml,
  createHyperlinkRelationMap,
  createHyperlinkRelations,
  createStylesXml,
  exportUcDocToDocx
} from '../../../src/editor/word/docx'

describe('docx quality export', () => {
  it('exports header and footer package files and section references', () => {
    const doc = createUcDocFile({
      data: {
        header: [
          {
            value: 'Document Header'
          }
        ],
        main: [
          {
            value: 'Main Content'
          }
        ],
        footer: [
          {
            value: 'Document Footer'
          }
        ]
      }
    })

    const result = exportUcDocToDocx(doc)
    const contentTypes = result.files.find(file => file.path === '[Content_Types].xml')
    const rels = result.files.find(file => file.path === 'word/_rels/document.xml.rels')
    const documentXml = result.files.find(file => file.path === 'word/document.xml')
    const headerXml = result.files.find(file => file.path === 'word/header1.xml')
    const footerXml = result.files.find(file => file.path === 'word/footer1.xml')

    expect(contentTypes?.content).toContain('/word/header1.xml')
    expect(contentTypes?.content).toContain('/word/footer1.xml')
    expect(rels?.content).toContain('relationships/header')
    expect(rels?.content).toContain('relationships/footer')
    expect(documentXml?.content).toContain('<w:headerReference w:type="default" r:id="rIdHeader1"/>')
    expect(documentXml?.content).toContain('<w:footerReference w:type="default" r:id="rIdFooter1"/>')
    expect(headerXml?.content).toContain('<w:hdr')
    expect(headerXml?.content).toContain('Document Header')
    expect(footerXml?.content).toContain('<w:ftr')
    expect(footerXml?.content).toContain('Document Footer')
  })

  it('exports hyperlink relationships and document hyperlink xml', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            type: ElementType.HYPERLINK,
            value: 'Open Website',
            url: 'https://example.com'
          }
        ],
        footer: []
      }
    })

    const relations = createHyperlinkRelations(doc)
    const documentXml = createDocumentXml(
      doc,
      {},
      {},
      createHyperlinkRelationMap(relations)
    )
    const result = exportUcDocToDocx(doc)
    const rels = result.files.find(file => file.path === 'word/_rels/document.xml.rels')

    expect(relations).toEqual([
      {
        url: 'https://example.com',
        relId: 'rIdHyperlink1'
      }
    ])
    expect(documentXml).toContain('<w:hyperlink r:id="rIdHyperlink1" w:history="1">')
    expect(documentXml).toContain('Open Website')
    expect(rels?.content).toContain('relationships/hyperlink')
    expect(rels?.content).toContain('Target="https://example.com"')
    expect(rels?.content).toContain('TargetMode="External"')
  })

  it('exports table vertical merge continuation', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            type: ElementType.TABLE,
            value: '',
            trList: [
              {
                height: 24,
                tdList: [
                  {
                    rowspan: 2,
                    colspan: 1,
                    value: [
                      {
                        value: 'Merged Start'
                      }
                    ]
                  }
                ]
              },
              {
                height: 24,
                tdList: [
                  {
                    rowspan: 0,
                    colspan: 1,
                    value: []
                  }
                ]
              }
            ]
          }
        ],
        footer: []
      }
    })

    const xml = createDocumentXml(doc)

    expect(xml).toContain('<w:vMerge w:val="restart"/>')
    expect(xml).toContain('<w:vMerge/>')
  })

  it('creates styles xml from ucdoc styles', () => {
    const doc = createUcDocFile({
      styles: {
        paragraphStyles: {
          quote: {
            name: 'Quote',
            basedOn: 'normal',
            properties: {}
          }
        }
      }
    })

    const xml = createStylesXml(doc)

    expect(xml).toContain('w:styleId="quote"')
    expect(xml).toContain('<w:name w:val="Quote"/>')
    expect(xml).toContain('<w:basedOn w:val="normal"/>')
  })

  it('creates docx blob from export result', () => {
    const doc = createUcDocFile()
    const result = exportUcDocToDocx(doc)
    const blob = createDocxBlob(result)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe(result.mimeType)
    expect(blob.size).toBe(result.data.length)
  })
})
