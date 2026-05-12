import { describe, expect, it } from 'vitest'
import { ListStyle, ListType } from '../../../src/editor/dataset/enum/List'
import { createUcDocFile } from '../../../src/editor/ucdoc'
import {
  createDocumentXml,
  createNumberingDefinitions,
  createNumberingMap,
  createNumberingXml,
  exportUcDocToDocx
} from '../../../src/editor/word/docx'

describe('docx numbering export', () => {
  it('creates numbering definitions from explicit numbering model', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            value: 'Item 1',
            numbering: {
              numId: 'outline-1',
              level: 0,
              format: 'decimal',
              text: '%1.',
              start: 1
            }
          },
          {
            value: 'Item 1.1',
            numbering: {
              numId: 'outline-1',
              level: 1,
              format: 'lowerLetter',
              text: '%2)',
              start: 1
            }
          }
        ],
        footer: []
      }
    })

    const definitions = createNumberingDefinitions(doc)
    const xml = createNumberingXml(definitions)

    expect(definitions).toHaveLength(1)
    expect(definitions[0].levels).toHaveLength(2)
    expect(xml).toContain('<w:numbering')
    expect(xml).toContain('<w:abstractNum w:abstractNumId="1">')
    expect(xml).toContain('<w:lvl w:ilvl="0">')
    expect(xml).toContain('<w:numFmt w:val="decimal"/>')
    expect(xml).toContain('<w:lvlText w:val="%1."/>')
    expect(xml).toContain('<w:lvl w:ilvl="1">')
    expect(xml).toContain('<w:numFmt w:val="lowerLetter"/>')
    expect(xml).toContain('<w:lvlText w:val="%2)"/>')
    expect(xml).toContain('<w:num w:numId="1">')
  })

  it('writes paragraph numbering references in document xml', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            value: 'Task 1',
            numbering: {
              numId: 'tasks',
              level: 0,
              format: 'decimal'
            }
          },
          {
            value: '\n'
          },
          {
            value: 'Task 2',
            numbering: {
              numId: 'tasks',
              level: 0,
              format: 'decimal'
            }
          }
        ],
        footer: []
      }
    })
    const definitions = createNumberingDefinitions(doc)
    const xml = createDocumentXml(doc, {}, createNumberingMap(definitions))

    expect(xml).toContain('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>')
    expect(xml).toContain('Task 1')
    expect(xml).toContain('Task 2')
  })

  it('creates numbering definitions from existing list fields', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            value: 'Bullet item',
            listId: 'list-a',
            listType: ListType.UL,
            listStyle: ListStyle.DISC
          },
          {
            value: 'Ordered item',
            listId: 'list-b',
            listType: ListType.OL,
            listStyle: ListStyle.DECIMAL
          }
        ],
        footer: []
      }
    })

    const xml = createNumberingXml(createNumberingDefinitions(doc))

    expect(xml).toContain('<w:numFmt w:val="bullet"/>')
    expect(xml).toContain('<w:lvlText w:val="•"/>')
    expect(xml).toContain('<w:numFmt w:val="decimal"/>')
  })

  it('exports numbering package files and relationships', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            value: 'Numbered item',
            numbering: {
              numId: 'num-1',
              level: 0,
              format: 'decimal'
            }
          }
        ],
        footer: []
      }
    })

    const result = exportUcDocToDocx(doc)
    const contentTypes = result.files.find(file => file.path === '[Content_Types].xml')
    const rels = result.files.find(file => file.path === 'word/_rels/document.xml.rels')
    const numbering = result.files.find(file => file.path === 'word/numbering.xml')
    const documentXml = result.files.find(file => file.path === 'word/document.xml')

    expect(contentTypes?.content).toContain('/word/numbering.xml')
    expect(rels?.content).toContain('relationships/numbering')
    expect(rels?.content).toContain('Target="numbering.xml"')
    expect(numbering?.content).toContain('<w:numbering')
    expect(documentXml?.content).toContain('<w:numPr>')
  })
})
