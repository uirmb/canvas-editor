import { ElementType } from '../../dataset/enum/Element'
import { RowFlex } from '../../dataset/enum/Row'
import { VerticalAlign } from '../../dataset/enum/VerticalAlign'
import type { IElement } from '../../interface/Element'
import type { ITd } from '../../interface/table/Td'
import type { ITr } from '../../interface/table/Tr'
import type { UcDocFile } from '../../ucdoc'
import { getNumberingReference } from './numbering'
import type {
  DocxHeaderFooterRelation,
  DocxHyperlinkRelationMap,
  DocxImageRelationMap,
  DocxNumberingMap
} from './types'
import { colorToHex, escapeXml, pxToEmu, pxToHalfPoint, pxToTwip } from './xml'

interface DocxRenderContext {
  imageRelations?: DocxImageRelationMap
  numberingMap?: DocxNumberingMap
  hyperlinkRelations?: DocxHyperlinkRelationMap
}

function getTextElementList(doc: UcDocFile): IElement[] {
  return doc.data.main || []
}

function splitParagraphs(elementList: IElement[]): IElement[][] {
  const paragraphs: IElement[][] = []
  let current: IElement[] = []

  elementList.forEach(element => {
    if (element.type === ElementType.TABLE) {
      if (current.length) {
        paragraphs.push(current)
        current = []
      }
      return
    }
    if (element.value === '\n') {
      paragraphs.push(current)
      current = []
      return
    }

    const parts = String(element.value ?? '').split('\n')
    parts.forEach((part, index) => {
      if (index > 0) {
        paragraphs.push(current)
        current = []
      }
      if (part || element.type === ElementType.PAGE_BREAK || element.type === ElementType.IMAGE) {
        current.push({
          ...element,
          value: part
        })
      }
    })
  })

  paragraphs.push(current)
  return paragraphs
}

function createRunProperties(element: IElement): string {
  const properties: string[] = []
  const color = colorToHex(element.color)
  const highlight = colorToHex(element.highlight)

  if (element.bold) properties.push('<w:b/>')
  if (element.italic) properties.push('<w:i/>')
  if (element.underline) properties.push('<w:u w:val="single"/>')
  if (element.strikeout) properties.push('<w:strike/>')
  if (color) properties.push(`<w:color w:val="${color}"/>`)
  if (highlight) properties.push(`<w:highlight w:val="${highlight}"/>`)
  if (element.size) properties.push(`<w:sz w:val="${pxToHalfPoint(element.size)}"/>`)
  if (element.font) {
    const font = escapeXml(element.font)
    properties.push(`<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}"/>`)
  }
  if (element.characterStyleId) {
    properties.push(`<w:rStyle w:val="${escapeXml(element.characterStyleId)}"/>`)
  }

  return properties.length ? `<w:rPr>${properties.join('')}</w:rPr>` : ''
}

function rowFlexToJc(rowFlex?: RowFlex): string | null {
  switch (rowFlex) {
    case RowFlex.CENTER:
      return 'center'
    case RowFlex.RIGHT:
      return 'right'
    case RowFlex.JUSTIFY:
    case RowFlex.ALIGNMENT:
      return 'both'
    case RowFlex.LEFT:
      return 'left'
    default:
      return null
  }
}

function verticalAlignToDocx(value?: VerticalAlign): string | null {
  switch (value) {
    case VerticalAlign.MIDDLE:
      return 'center'
    case VerticalAlign.BOTTOM:
      return 'bottom'
    case VerticalAlign.TOP:
      return 'top'
    default:
      return null
  }
}

function createParagraphProperties(
  paragraph: IElement[],
  context: DocxRenderContext = {}
): string {
  const first = paragraph[0]
  if (!first) return ''

  const properties: string[] = []
  const paragraphModel = first.paragraph
  const styleId = first.styleId || paragraphModel?.styleId
  const jc = paragraphModel?.align || rowFlexToJc(first.rowFlex)
  const numberingReference = getNumberingReference(first, context.numberingMap || {})

  if (styleId) {
    properties.push(`<w:pStyle w:val="${escapeXml(styleId)}"/>`)
  }
  if (numberingReference) {
    properties.push(`<w:numPr><w:ilvl w:val="${numberingReference.level}"/><w:numId w:val="${numberingReference.numId}"/></w:numPr>`)
  }
  if (jc) {
    properties.push(`<w:jc w:val="${escapeXml(jc)}"/>`)
  }
  if (paragraphModel?.indent) {
    const indent = paragraphModel.indent
    properties.push(
      `<w:ind${indent.left !== undefined ? ` w:left="${pxToTwip(indent.left)}"` : ''}${indent.right !== undefined ? ` w:right="${pxToTwip(indent.right)}"` : ''}${indent.firstLine !== undefined ? ` w:firstLine="${pxToTwip(indent.firstLine)}"` : ''}${indent.hanging !== undefined ? ` w:hanging="${pxToTwip(indent.hanging)}"` : ''}/>`
    )
  }
  if (paragraphModel?.spacing || first.rowMargin !== undefined) {
    const spacing = paragraphModel?.spacing || {}
    properties.push(
      `<w:spacing${spacing.before !== undefined ? ` w:before="${pxToTwip(spacing.before)}"` : ''}${spacing.after !== undefined ? ` w:after="${pxToTwip(spacing.after)}"` : ''}${spacing.line !== undefined ? ` w:line="${pxToTwip(spacing.line)}"` : first.rowMargin !== undefined ? ` w:line="${Math.round(first.rowMargin * 240)}"` : ''}${spacing.lineRule ? ` w:lineRule="${spacing.lineRule}"` : ''}/>`
    )
  }

  return properties.length ? `<w:pPr>${properties.join('')}</w:pPr>` : ''
}

function getImageAssetId(element: IElement): string | undefined {
  return element.imageProperties?.assetId || element.externalId || element.id
}

function createImageDrawing(element: IElement, imageRelations: DocxImageRelationMap): string {
  const assetId = getImageAssetId(element)
  const relation = assetId ? imageRelations[assetId] : undefined
  if (!relation) return ''

  const width = element.width || relation.width
  const height = element.height || relation.height
  const cx = pxToEmu(width)
  const cy = pxToEmu(height)
  const description = escapeXml(element.imageProperties?.altText || relation.fileName)
  const name = escapeXml(element.imageProperties?.caption || relation.fileName)

  return `<w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="${name}" descr="${description}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${escapeXml(relation.relId)}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`
}

function createRun(
  element: IElement,
  context: DocxRenderContext = {}
): string {
  if (element.type === ElementType.PAGE_BREAK) {
    return '<w:r><w:br w:type="page"/></w:r>'
  }
  if (element.type === ElementType.IMAGE) {
    return `<w:r>${createImageDrawing(element, context.imageRelations || {})}</w:r>`
  }
  return `<w:r>${createRunProperties(element)}<w:t xml:space="preserve">${escapeXml(element.value || '')}</w:t></w:r>`
}

function createHyperlink(element: IElement, context: DocxRenderContext): string | null {
  const url = element.url
  if (!url) return null
  const relation = context.hyperlinkRelations?.[url]
  if (!relation) return null
  const children = element.valueList?.length
    ? element.valueList.map(child => createRun(child, context)).join('')
    : createRun({ ...element, type: ElementType.TEXT }, context)
  return `<w:hyperlink r:id="${escapeXml(relation.relId)}" w:history="1">${children}</w:hyperlink>`
}

function createParagraph(
  paragraph: IElement[],
  context: DocxRenderContext = {}
): string {
  if (!paragraph.length) {
    return '<w:p/>'
  }
  return `<w:p>${createParagraphProperties(paragraph, context)}${paragraph
    .map(element => {
      if (element.type === ElementType.HYPERLINK || element.url) {
        return createHyperlink(element, context) || createRun(element, context)
      }
      return createRun(element, context)
    })
    .join('')}</w:p>`
}

function createParagraphs(
  elementList: IElement[],
  context: DocxRenderContext = {}
): string {
  return splitParagraphs(elementList)
    .map(paragraph => createParagraph(paragraph, context))
    .join('')
}

function createTableGrid(table: IElement): string {
  if (!table.colgroup?.length) return ''
  const columns = table.colgroup
    .map(col => `<w:gridCol w:w="${pxToTwip(col.width)}"/>`)
    .join('')
  return `<w:tblGrid>${columns}</w:tblGrid>`
}

function createTableProperties(table: IElement): string {
  const properties: string[] = []
  const tableProperties = table.tableProperties
  const width = tableProperties?.width
  const widthType = tableProperties?.widthType || 'auto'

  properties.push('<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders>')

  if (tableProperties?.styleId) {
    properties.unshift(`<w:tblStyle w:val="${escapeXml(tableProperties.styleId)}"/>`)
  }
  if (width !== undefined) {
    properties.push(
      `<w:tblW w:w="${widthType === 'percent' ? Math.round(width * 50) : pxToTwip(width)}" w:type="${widthType === 'percent' ? 'pct' : 'dxa'}"/>`
    )
  }
  if (tableProperties?.layout === 'fixed') {
    properties.push('<w:tblLayout w:type="fixed"/>')
  }

  return `<w:tblPr>${properties.join('')}</w:tblPr>`
}

function createTableCellProperties(td: ITd): string {
  const properties: string[] = []
  const cellProperties = td.value?.[0]?.tableCellProperties
  const verticalAlign = verticalAlignToDocx(
    cellProperties?.verticalAlign || td.verticalAlign
  )
  const backgroundColor = colorToHex(
    cellProperties?.backgroundColor || td.backgroundColor
  )

  if (td.width) {
    properties.push(`<w:tcW w:w="${pxToTwip(td.width)}" w:type="dxa"/>`)
  }
  if (td.colspan > 1) {
    properties.push(`<w:gridSpan w:val="${td.colspan}"/>`)
  }
  if (td.rowspan > 1) {
    properties.push('<w:vMerge w:val="restart"/>')
  } else if (td.rowspan === 0) {
    properties.push('<w:vMerge/>')
  }
  if (verticalAlign) {
    properties.push(`<w:vAlign w:val="${verticalAlign}"/>`)
  }
  if (backgroundColor) {
    properties.push(`<w:shd w:fill="${backgroundColor}"/>`)
  }

  return properties.length ? `<w:tcPr>${properties.join('')}</w:tcPr>` : ''
}

function createTableCell(
  td: ITd,
  context: DocxRenderContext = {}
): string {
  const content = createParagraphs(td.value || [], context) || '<w:p/>'
  return `<w:tc>${createTableCellProperties(td)}${content}</w:tc>`
}

function createTableRow(
  row: ITr,
  context: DocxRenderContext = {}
): string {
  const rowProperties: string[] = []
  if (row.height) {
    rowProperties.push(`<w:trHeight w:val="${pxToTwip(row.height)}"/>`)
  }
  if (row.pagingRepeat) {
    rowProperties.push('<w:tblHeader/>')
  }
  return `<w:tr>${rowProperties.length ? `<w:trPr>${rowProperties.join('')}</w:trPr>` : ''}${row.tdList.map(td => createTableCell(td, context)).join('')}</w:tr>`
}

function createTable(
  table: IElement,
  context: DocxRenderContext = {}
): string {
  if (!table.trList?.length) return '<w:p/>'
  return `<w:tbl>${createTableProperties(table)}${createTableGrid(table)}${table.trList.map(row => createTableRow(row, context)).join('')}</w:tbl>`
}

function createDocumentBlocks(
  elementList: IElement[],
  context: DocxRenderContext = {}
): string {
  const blocks: string[] = []
  let paragraphBuffer: IElement[] = []

  const flushParagraphBuffer = () => {
    if (!paragraphBuffer.length) return
    blocks.push(createParagraphs(paragraphBuffer, context))
    paragraphBuffer = []
  }

  elementList.forEach(element => {
    if (element.type === ElementType.TABLE) {
      flushParagraphBuffer()
      blocks.push(createTable(element, context))
      return
    }
    paragraphBuffer.push(element)
  })

  flushParagraphBuffer()
  return blocks.join('')
}

function createSectionProperties(
  doc: UcDocFile,
  headerFooterRelations: DocxHeaderFooterRelation[] = []
): string {
  const page = doc.page
  const headerFooterRefs = headerFooterRelations
    .map(relation =>
      relation.type === 'header'
        ? `<w:headerReference w:type="default" r:id="${escapeXml(relation.relId)}"/>`
        : `<w:footerReference w:type="default" r:id="${escapeXml(relation.relId)}"/>`
    )
    .join('')
  return `<w:sectPr>${headerFooterRefs}<w:pgSz w:w="${pxToTwip(page.width)}" w:h="${pxToTwip(page.height)}" w:orient="${page.orientation}"/><w:pgMar w:top="${pxToTwip(page.margins.top)}" w:right="${pxToTwip(page.margins.right)}" w:bottom="${pxToTwip(page.margins.bottom)}" w:left="${pxToTwip(page.margins.left)}" w:header="${pxToTwip(page.headerDistance || 0)}" w:footer="${pxToTwip(page.footerDistance || 0)}" w:gutter="0"/></w:sectPr>`
}

export function createDocumentXml(
  doc: UcDocFile,
  imageRelations: DocxImageRelationMap = {},
  numberingMap: DocxNumberingMap = {},
  hyperlinkRelations: DocxHyperlinkRelationMap = {},
  headerFooterRelations: DocxHeaderFooterRelation[] = []
): string {
  const blocks = createDocumentBlocks(getTextElementList(doc), {
    imageRelations,
    numberingMap,
    hyperlinkRelations
  })

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${blocks}${createSectionProperties(doc, headerFooterRelations)}</w:body></w:document>`
}

export function createHeaderXml(
  elementList: IElement[],
  context: DocxRenderContext = {}
): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${createDocumentBlocks(elementList, context) || '<w:p/>'}</w:hdr>`
}

export function createFooterXml(
  elementList: IElement[],
  context: DocxRenderContext = {}
): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${createDocumentBlocks(elementList, context) || '<w:p/>'}</w:ftr>`
}
