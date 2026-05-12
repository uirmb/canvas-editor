import { ElementType } from '../../dataset/enum/Element'
import { RowFlex } from '../../dataset/enum/Row'
import type { IElement } from '../../interface/Element'
import type { UcDocFile } from '../../ucdoc'
import { colorToHex, escapeXml, pxToHalfPoint, pxToTwip } from './xml'

function getTextElementList(doc: UcDocFile): IElement[] {
  return doc.data.main || []
}

function splitParagraphs(elementList: IElement[]): IElement[][] {
  const paragraphs: IElement[][] = []
  let current: IElement[] = []

  elementList.forEach(element => {
    if (element.type === ElementType.BREAK || element.value === '\n') {
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
      if (part) {
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

function createParagraphProperties(paragraph: IElement[]): string {
  const first = paragraph[0]
  if (!first) return ''

  const properties: string[] = []
  const paragraphModel = first.paragraph
  const styleId = first.styleId || paragraphModel?.styleId
  const jc = paragraphModel?.align || rowFlexToJc(first.rowFlex)

  if (styleId) {
    properties.push(`<w:pStyle w:val="${escapeXml(styleId)}"/>`)
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

function createRun(element: IElement): string {
  return `<w:r>${createRunProperties(element)}<w:t xml:space="preserve">${escapeXml(element.value || '')}</w:t></w:r>`
}

function createParagraph(paragraph: IElement[]): string {
  if (!paragraph.length) {
    return '<w:p/>'
  }
  return `<w:p>${createParagraphProperties(paragraph)}${paragraph.map(createRun).join('')}</w:p>`
}

function createSectionProperties(doc: UcDocFile): string {
  const page = doc.page
  return `<w:sectPr><w:pgSz w:w="${pxToTwip(page.width)}" w:h="${pxToTwip(page.height)}" w:orient="${page.orientation}"/><w:pgMar w:top="${pxToTwip(page.margins.top)}" w:right="${pxToTwip(page.margins.right)}" w:bottom="${pxToTwip(page.margins.bottom)}" w:left="${pxToTwip(page.margins.left)}" w:header="${pxToTwip(page.headerDistance || 0)}" w:footer="${pxToTwip(page.footerDistance || 0)}" w:gutter="0"/></w:sectPr>`
}

export function createDocumentXml(doc: UcDocFile): string {
  const paragraphs = splitParagraphs(getTextElementList(doc)).map(createParagraph)

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.join('')}${createSectionProperties(doc)}</w:body></w:document>`
}
