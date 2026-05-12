import type {
  IElement,
  INumberingProperties,
  IParagraphProperties
} from '../interface/Element'

export interface ApplyParagraphPropertiesOption {
  merge?: boolean
}

function mergeParagraphProperties(
  current: IParagraphProperties | undefined,
  next: IParagraphProperties
): IParagraphProperties {
  return {
    ...current,
    ...next,
    indent: {
      ...current?.indent,
      ...next.indent
    },
    spacing: {
      ...current?.spacing,
      ...next.spacing
    },
    tabs: next.tabs ?? current?.tabs
  }
}

export function applyParagraphProperties(
  elementList: IElement[],
  paragraph: IParagraphProperties,
  options: ApplyParagraphPropertiesOption = {}
): IElement[] {
  const { merge = true } = options
  elementList.forEach(element => {
    element.paragraph = merge
      ? mergeParagraphProperties(element.paragraph, paragraph)
      : paragraph
  })
  return elementList
}

export function clearParagraphProperties(elementList: IElement[]): IElement[] {
  elementList.forEach(element => {
    delete element.paragraph
  })
  return elementList
}

export function applyParagraphStyle(
  elementList: IElement[],
  styleId: string | null
): IElement[] {
  elementList.forEach(element => {
    if (styleId) {
      element.styleId = styleId
      element.paragraph = {
        ...element.paragraph,
        styleId
      }
    } else {
      delete element.styleId
      if (element.paragraph) {
        delete element.paragraph.styleId
      }
    }
  })
  return elementList
}

export function applyCharacterStyle(
  elementList: IElement[],
  characterStyleId: string | null
): IElement[] {
  elementList.forEach(element => {
    if (characterStyleId) {
      element.characterStyleId = characterStyleId
    } else {
      delete element.characterStyleId
    }
  })
  return elementList
}

export function applyNumberingProperties(
  elementList: IElement[],
  numbering: INumberingProperties | null
): IElement[] {
  elementList.forEach(element => {
    if (numbering) {
      element.numbering = numbering
    } else {
      delete element.numbering
    }
  })
  return elementList
}
