import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { VerticalAlign } from '../../../src/editor/dataset/enum/VerticalAlign'
import { createUcDocFile } from '../../../src/editor/ucdoc'
import { createDocumentXml, exportUcDocToDocx } from '../../../src/editor/word/docx'

describe('docx table export', () => {
  it('exports basic table xml', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            type: ElementType.TABLE,
            value: '',
            colgroup: [
              { width: 120 },
              { width: 160 }
            ],
            tableProperties: {
              styleId: 'gridTable',
              width: 280,
              widthType: 'fixed',
              layout: 'fixed'
            },
            trList: [
              {
                height: 32,
                pagingRepeat: true,
                tdList: [
                  {
                    colspan: 1,
                    rowspan: 1,
                    width: 120,
                    value: [
                      {
                        value: 'Name',
                        bold: true,
                        tableCellProperties: {
                          backgroundColor: '#eeeeee',
                          verticalAlign: VerticalAlign.MIDDLE
                        }
                      }
                    ]
                  },
                  {
                    colspan: 1,
                    rowspan: 1,
                    width: 160,
                    value: [
                      {
                        value: 'Value',
                        bold: true
                      }
                    ]
                  }
                ]
              },
              {
                height: 28,
                tdList: [
                  {
                    colspan: 2,
                    rowspan: 1,
                    width: 280,
                    value: [
                      {
                        value: 'Merged cell'
                      }
                    ]
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

    expect(xml).toContain('<w:tbl>')
    expect(xml).toContain('<w:tblStyle w:val="gridTable"/>')
    expect(xml).toContain('<w:tblW w:w="4200" w:type="dxa"/>')
    expect(xml).toContain('<w:tblLayout w:type="fixed"/>')
    expect(xml).toContain('<w:gridCol w:w="1800"/>')
    expect(xml).toContain('<w:gridCol w:w="2400"/>')
    expect(xml).toContain('<w:tblHeader/>')
    expect(xml).toContain('<w:tcW w:w="1800" w:type="dxa"/>')
    expect(xml).toContain('<w:shd w:fill="EEEEEE"/>')
    expect(xml).toContain('<w:vAlign w:val="center"/>')
    expect(xml).toContain('<w:gridSpan w:val="2"/>')
    expect(xml).toContain('Merged cell')
  })

  it('exports tables inside docx package document xml', () => {
    const doc = createUcDocFile({
      data: {
        header: [],
        main: [
          {
            value: 'Before table'
          },
          {
            type: ElementType.TABLE,
            value: '',
            trList: [
              {
                height: 24,
                tdList: [
                  {
                    colspan: 1,
                    rowspan: 1,
                    value: [
                      {
                        value: 'Cell text'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            value: 'After table'
          }
        ],
        footer: []
      }
    })

    const result = exportUcDocToDocx(doc)
    const documentXml = result.files.find(file => file.path === 'word/document.xml')

    expect(documentXml?.content).toContain('Before table')
    expect(documentXml?.content).toContain('<w:tbl>')
    expect(documentXml?.content).toContain('Cell text')
    expect(documentXml?.content).toContain('After table')
  })
})
