import { ElementType } from '../../dataset/enum/Element'
import type { IElement } from '../../interface/Element'
import type { ITd } from '../../interface/table/Td'
import type { UcDocFile } from '../../ucdoc'
import type { DocxHyperlinkRelation, DocxHyperlinkRelationMap } from './types'

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

function getHyperlinkUrl(element: IElement): string | null {
  if (element.type !== ElementType.HYPERLINK && !element.url) return null
  return element.url || null
}

export function createHyperlinkRelations(doc: UcDocFile): DocxHyperlinkRelation[] {
  const urlList: string[] = []
  const urlSet = new Set<string>()

  walkElementList(getElementList(doc), element => {
    const url = getHyperlinkUrl(element)
    if (!url || urlSet.has(url)) return
    urlSet.add(url)
    urlList.push(url)
  })

  return urlList.map((url, index) => ({
    url,
    relId: `rIdHyperlink${index + 1}`
  }))
}

export function createHyperlinkRelationMap(
  relations: DocxHyperlinkRelation[]
): DocxHyperlinkRelationMap {
  return relations.reduce<DocxHyperlinkRelationMap>((map, relation) => {
    map[relation.url] = relation
    return map
  }, {})
}
