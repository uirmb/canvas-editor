import { ListStyle, ListType } from '../../dataset/enum/List'
import type { IElement, INumberingFormat } from '../../interface/Element'
import type { ITd } from '../../interface/table/Td'
import type { UcDocFile } from '../../ucdoc'
import { escapeXml } from './xml'
import type {
  DocxNumberingDefinition,
  DocxNumberingLevel,
  DocxNumberingMap,
  DocxNumberingReference
} from './types'

function getElementList(doc: UcDocFile): IElement[] {
  return [...(doc.data.header || []), ...(doc.data.main || []), ...(doc.data.footer || [])]
}

function walkElementList(elementList: IElement[], visitor: (element: IElement) => void): void {
  elementList.forEach(element => {
    visitor(element)
    if (element.valueList?.length) {
      walkElementList(element.valueList, visitor)
    }
    if (element.trList?.length) {
      element.trList.forEach(row => {
        row.tdList.forEach((td: ITd) => {
          walkElementList(td.value || [], visitor)
        })
      })
    }
  })
}

function getListFormat(element: IElement): INumberingFormat {
  if (element.numbering?.format) return element.numbering.format
  if (element.listType === ListType.UL) return 'bullet'
  return 'decimal'
}

function getListText(format: INumberingFormat, level: number): string {
  if (format === 'bullet') return '•'
  return `%${level + 1}.`
}

function getNumberingSourceId(element: IElement): string | null {
  if (element.numbering?.numId) return element.numbering.numId
  if (element.listId) return element.listId
  if (element.listType) return `list-${element.listType}-${element.listStyle || 'default'}`
  return null
}

function getNumberingLevel(element: IElement): number {
  if (typeof element.numbering?.level === 'number') return element.numbering.level
  return 0
}

function createDefaultLevel(level: number, format: INumberingFormat): DocxNumberingLevel {
  return {
    level,
    format,
    text: getListText(format, level),
    start: 1
  }
}

function ensureDefinitionLevel(
  definition: DocxNumberingDefinition,
  element: IElement
): void {
  const level = getNumberingLevel(element)
  const format = getListFormat(element)
  const existing = definition.levels.find(item => item.level === level)
  if (existing) return

  definition.levels.push({
    ...createDefaultLevel(level, format),
    text: element.numbering?.text || getListText(format, level),
    start: element.numbering?.start || 1
  })
  definition.levels.sort((a, b) => a.level - b.level)
}

export function createNumberingDefinitions(doc: UcDocFile): DocxNumberingDefinition[] {
  const definitions = new Map<string, DocxNumberingDefinition>()

  walkElementList(getElementList(doc), element => {
    const sourceId = getNumberingSourceId(element)
    if (!sourceId) return

    let definition = definitions.get(sourceId)
    if (!definition) {
      const index = definitions.size + 1
      definition = {
        sourceId,
        docxNumId: index,
        abstractNumId: index,
        levels: []
      }
      definitions.set(sourceId, definition)
    }

    ensureDefinitionLevel(definition, element)
  })

  return Array.from(definitions.values())
}

export function createNumberingMap(
  definitions: DocxNumberingDefinition[]
): DocxNumberingMap {
  return definitions.reduce<DocxNumberingMap>((map, definition) => {
    map[definition.sourceId] = definition
    return map
  }, {})
}

export function getNumberingReference(
  element: IElement,
  numberingMap: DocxNumberingMap
): DocxNumberingReference | null {
  const sourceId = getNumberingSourceId(element)
  if (!sourceId) return null
  const definition = numberingMap[sourceId]
  if (!definition) return null

  return {
    numId: definition.docxNumId,
    level: getNumberingLevel(element)
  }
}

function createLevelXml(level: DocxNumberingLevel): string {
  const format = escapeXml(level.format)
  const text = escapeXml(level.text)
  const indentLeft = 720 * (level.level + 1)
  const hanging = 360
  return `<w:lvl w:ilvl="${level.level}"><w:start w:val="${level.start}"/><w:numFmt w:val="${format}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${indentLeft}" w:hanging="${hanging}"/></w:pPr></w:lvl>`
}

export function createNumberingXml(definitions: DocxNumberingDefinition[]): string {
  const abstractNums = definitions
    .map(
      definition =>
        `<w:abstractNum w:abstractNumId="${definition.abstractNumId}">${definition.levels.map(createLevelXml).join('')}</w:abstractNum>`
    )
    .join('')
  const nums = definitions
    .map(
      definition =>
        `<w:num w:numId="${definition.docxNumId}"><w:abstractNumId w:val="${definition.abstractNumId}"/></w:num>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${abstractNums}${nums}</w:numbering>`
}
