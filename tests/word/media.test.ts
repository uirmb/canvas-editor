import { describe, expect, it } from 'vitest'
import { VerticalAlign } from '../../src/editor/dataset/enum/VerticalAlign'
import type { IElement } from '../../src/editor/interface/Element'
import { createDefaultUcDocAssets } from '../../src/editor/ucdoc'
import {
  addImageAsset,
  applyImageProperties,
  applyTableCellProperties,
  applyTableProperties,
  clearImageProperties,
  clearTableCellProperties,
  clearTableProperties,
  createImageAsset,
  removeImageAsset
} from '../../src/editor/word'

function createElementList(): IElement[] {
  return [
    {
      value: 'A'
    },
    {
      value: 'B'
    }
  ]
}

describe('word table image and asset helpers', () => {
  it('adds and removes image assets', () => {
    const assets = createDefaultUcDocAssets()
    const image = createImageAsset({
      id: 'image-1',
      name: 'cover.png',
      mimeType: 'image/png',
      width: 320,
      height: 180,
      url: '/assets/cover.png'
    })

    const withImage = addImageAsset(assets, image)

    expect(withImage.images['image-1']).toEqual(image)

    const removed = removeImageAsset(withImage, 'image-1')
    expect(removed.images['image-1']).toBeUndefined()
  })

  it('applies and clears table properties', () => {
    const elementList = createElementList()

    applyTableProperties(elementList, {
      styleId: 'gridTable',
      width: 500,
      widthType: 'fixed',
      repeatHeaderRow: true,
      cellMargin: {
        top: 4,
        left: 6
      }
    })

    applyTableProperties(elementList, {
      cellMargin: {
        right: 8
      }
    })

    expect(elementList[0].tableProperties).toEqual({
      styleId: 'gridTable',
      width: 500,
      widthType: 'fixed',
      repeatHeaderRow: true,
      cellMargin: {
        top: 4,
        left: 6,
        right: 8
      }
    })

    clearTableProperties(elementList)
    expect(elementList[0].tableProperties).toBeUndefined()
  })

  it('applies and clears table cell properties', () => {
    const elementList = createElementList()

    applyTableCellProperties(elementList, {
      verticalAlign: VerticalAlign.MIDDLE,
      backgroundColor: '#eeeeee',
      cellMargin: {
        bottom: 4
      }
    })

    expect(elementList[0].tableCellProperties).toEqual({
      verticalAlign: VerticalAlign.MIDDLE,
      backgroundColor: '#eeeeee',
      cellMargin: {
        bottom: 4
      }
    })

    clearTableCellProperties(elementList)
    expect(elementList[0].tableCellProperties).toBeUndefined()
  })

  it('applies and clears image properties', () => {
    const elementList = createElementList()

    applyImageProperties(elementList, {
      assetId: 'image-1',
      wrapType: 'inline',
      altText: 'cover image',
      caption: 'Figure 1',
      lockAspectRatio: true
    })

    expect(elementList[0].imageProperties).toEqual({
      assetId: 'image-1',
      wrapType: 'inline',
      altText: 'cover image',
      caption: 'Figure 1',
      lockAspectRatio: true
    })

    clearImageProperties(elementList)
    expect(elementList[0].imageProperties).toBeUndefined()
  })
})
