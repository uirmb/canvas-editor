import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { createUcDocFile } from '../../../src/editor/ucdoc'
import {
  base64ToUint8Array,
  createDocumentXml,
  createImageRelationMap,
  createImageRelations,
  exportUcDocToDocx
} from '../../../src/editor/word/docx'

const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lHTB9QAAAABJRU5ErkJggg=='

describe('docx image export', () => {
  it('creates image relations from ucdoc assets', () => {
    const doc = createUcDocFile({
      assets: {
        images: {
          image1: {
            id: 'image1',
            type: 'image',
            name: 'cover.png',
            mimeType: 'image/png',
            width: 120,
            height: 80,
            base64: PNG_1X1_BASE64
          }
        }
      }
    })

    const relations = createImageRelations(doc)

    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      assetId: 'image1',
      relId: 'rIdImage1',
      target: 'media/image1.png',
      path: 'word/media/image1.png',
      extension: 'png',
      mimeType: 'image/png',
      width: 120,
      height: 80
    })
    expect(relations[0].data.length).toBeGreaterThan(0)
    expect(base64ToUint8Array(PNG_1X1_BASE64)[0]).toBe(0x89)
  })

  it('renders inline image drawing xml', () => {
    const doc = createUcDocFile({
      assets: {
        images: {
          image1: {
            id: 'image1',
            type: 'image',
            mimeType: 'image/png',
            width: 120,
            height: 80,
            base64: PNG_1X1_BASE64
          }
        }
      },
      data: {
        header: [],
        main: [
          {
            type: ElementType.IMAGE,
            value: '',
            imageProperties: {
              assetId: 'image1',
              altText: 'cover image',
              caption: 'Cover'
            }
          }
        ],
        footer: []
      }
    })
    const relations = createImageRelations(doc)
    const xml = createDocumentXml(doc, createImageRelationMap(relations))

    expect(xml).toContain('<w:drawing>')
    expect(xml).toContain('r:embed="rIdImage1"')
    expect(xml).toContain('descr="cover image"')
    expect(xml).toContain('name="Cover"')
    expect(xml).toContain('cx="1143000"')
    expect(xml).toContain('cy="762000"')
  })

  it('exports image media and relationships inside docx package', () => {
    const doc = createUcDocFile({
      assets: {
        images: {
          image1: {
            id: 'image1',
            type: 'image',
            mimeType: 'image/png',
            width: 120,
            height: 80,
            base64: PNG_1X1_BASE64
          }
        }
      },
      data: {
        header: [],
        main: [
          {
            type: ElementType.IMAGE,
            value: '',
            imageProperties: {
              assetId: 'image1'
            }
          }
        ],
        footer: []
      }
    })

    const result = exportUcDocToDocx(doc)
    const contentTypes = result.files.find(file => file.path === '[Content_Types].xml')
    const rels = result.files.find(file => file.path === 'word/_rels/document.xml.rels')
    const documentXml = result.files.find(file => file.path === 'word/document.xml')
    const media = result.files.find(file => file.path === 'word/media/image1.png')

    expect(contentTypes?.content).toContain('Extension="png"')
    expect(contentTypes?.content).toContain('ContentType="image/png"')
    expect(rels?.content).toContain('Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"')
    expect(rels?.content).toContain('Target="media/image1.png"')
    expect(documentXml?.content).toContain('r:embed="rIdImage1"')
    expect(media?.content).toBeInstanceOf(Uint8Array)
  })
})
