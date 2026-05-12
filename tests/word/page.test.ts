import { describe, expect, it } from 'vitest'
import {
  createUcDocFile,
  migrateUcDocFile,
  type UcDocFile
} from '../../src/editor/ucdoc'
import {
  createPageSettings,
  toLandscapePageSettings,
  toPortraitPageSettings
} from '../../src/editor/word'

describe('word page settings helpers', () => {
  it('creates default page settings with overrides', () => {
    const page = createPageSettings({
      paperSize: 'Letter',
      margins: {
        left: 72
      }
    })

    expect(page.paperSize).toBe('Letter')
    expect(page.width).toBe(794)
    expect(page.margins.left).toBe(72)
    expect(page.margins.top).toBe(96)
  })

  it('switches page orientation', () => {
    const portrait = createPageSettings({
      width: 800,
      height: 1000
    })
    const landscape = toLandscapePageSettings(portrait)

    expect(landscape.orientation).toBe('landscape')
    expect(landscape.width).toBe(1000)
    expect(landscape.height).toBe(800)

    const nextPortrait = toPortraitPageSettings(landscape)
    expect(nextPortrait.orientation).toBe('portrait')
    expect(nextPortrait.width).toBe(800)
    expect(nextPortrait.height).toBe(1000)
  })

  it('adds default page settings to ucdoc files', () => {
    const doc = createUcDocFile()

    expect(doc.page.paperSize).toBe('A4')
    expect(doc.page.orientation).toBe('portrait')
    expect(doc.page.margins.left).toBe(96)
  })

  it('migrates missing page settings', () => {
    const doc = createUcDocFile()
    const legacyDoc = {
      ...doc,
      page: undefined
    } as unknown as UcDocFile

    const migrated = migrateUcDocFile(legacyDoc)

    expect(migrated.page.paperSize).toBe('A4')
    expect(migrated.page.margins.top).toBe(96)
  })
})
