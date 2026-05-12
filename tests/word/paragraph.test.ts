import { describe, expect, it } from 'vitest'
import type { IElement } from '../../src/editor/interface/Element'
import {
  applyCharacterStyle,
  applyNumberingProperties,
  applyParagraphProperties,
  applyParagraphStyle,
  clearParagraphProperties
} from '../../src/editor/word'

function createElementList(): IElement[] {
  return [
    {
      value: 'Hello'
    },
    {
      value: 'World'
    }
  ]
}

describe('word paragraph model helpers', () => {
  it('applies and merges paragraph properties', () => {
    const elementList = createElementList()

    applyParagraphProperties(elementList, {
      align: 'justify',
      indent: {
        firstLine: 24
      },
      spacing: {
        before: 6
      }
    })

    applyParagraphProperties(elementList, {
      indent: {
        left: 12
      },
      spacing: {
        after: 8
      }
    })

    expect(elementList[0].paragraph).toEqual({
      align: 'justify',
      indent: {
        firstLine: 24,
        left: 12
      },
      spacing: {
        before: 6,
        after: 8
      }
    })
    expect(elementList[1].paragraph).toEqual(elementList[0].paragraph)
  })

  it('replaces paragraph properties when merge is disabled', () => {
    const elementList = createElementList()

    applyParagraphProperties(elementList, {
      align: 'left',
      indent: {
        firstLine: 24
      }
    })

    applyParagraphProperties(
      elementList,
      {
        align: 'center'
      },
      {
        merge: false
      }
    )

    expect(elementList[0].paragraph).toEqual({
      align: 'center'
    })
  })

  it('clears paragraph properties', () => {
    const elementList = createElementList()

    applyParagraphProperties(elementList, {
      align: 'right'
    })
    clearParagraphProperties(elementList)

    expect(elementList[0].paragraph).toBeUndefined()
    expect(elementList[1].paragraph).toBeUndefined()
  })

  it('applies and clears paragraph style id', () => {
    const elementList = createElementList()

    applyParagraphStyle(elementList, 'heading1')

    expect(elementList[0].styleId).toBe('heading1')
    expect(elementList[0].paragraph?.styleId).toBe('heading1')

    applyParagraphStyle(elementList, null)

    expect(elementList[0].styleId).toBeUndefined()
    expect(elementList[0].paragraph?.styleId).toBeUndefined()
  })

  it('applies and clears character style id', () => {
    const elementList = createElementList()

    applyCharacterStyle(elementList, 'strong')
    expect(elementList[0].characterStyleId).toBe('strong')

    applyCharacterStyle(elementList, null)
    expect(elementList[0].characterStyleId).toBeUndefined()
  })

  it('applies and clears numbering properties', () => {
    const elementList = createElementList()

    applyNumberingProperties(elementList, {
      numId: 'num-1',
      abstractNumId: 'abstract-1',
      level: 2,
      format: 'decimal',
      text: '%1.%2.%3',
      start: 1
    })

    expect(elementList[0].numbering).toEqual({
      numId: 'num-1',
      abstractNumId: 'abstract-1',
      level: 2,
      format: 'decimal',
      text: '%1.%2.%3',
      start: 1
    })

    applyNumberingProperties(elementList, null)
    expect(elementList[0].numbering).toBeUndefined()
  })
})
