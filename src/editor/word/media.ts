import type {
  IElement,
  IWordImageProperties,
  IWordTableCellProperties,
  IWordTableProperties
} from '../interface/Element'

export function applyTableProperties(
  elementList: IElement[],
  properties: IWordTableProperties
): IElement[] {
  elementList.forEach(element => {
    element.tableProperties = {
      ...element.tableProperties,
      ...properties,
      cellMargin: {
        ...element.tableProperties?.cellMargin,
        ...properties.cellMargin
      }
    }
  })
  return elementList
}

export function clearTableProperties(elementList: IElement[]): IElement[] {
  elementList.forEach(element => {
    delete element.tableProperties
  })
  return elementList
}

export function applyTableCellProperties(
  elementList: IElement[],
  properties: IWordTableCellProperties
): IElement[] {
  elementList.forEach(element => {
    element.tableCellProperties = {
      ...element.tableCellProperties,
      ...properties,
      cellMargin: {
        ...element.tableCellProperties?.cellMargin,
        ...properties.cellMargin
      }
    }
  })
  return elementList
}

export function clearTableCellProperties(elementList: IElement[]): IElement[] {
  elementList.forEach(element => {
    delete element.tableCellProperties
  })
  return elementList
}

export function applyImageProperties(
  elementList: IElement[],
  properties: IWordImageProperties
): IElement[] {
  elementList.forEach(element => {
    element.imageProperties = {
      ...element.imageProperties,
      ...properties
    }
  })
  return elementList
}

export function clearImageProperties(elementList: IElement[]): IElement[] {
  elementList.forEach(element => {
    delete element.imageProperties
  })
  return elementList
}
