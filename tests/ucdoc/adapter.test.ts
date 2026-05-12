import { describe, expect, it } from 'vitest'
import {
  createUcDocFile,
  createUcDocFileByEditorResult,
  getEditorResultFromUcDocFile,
  isUcDocFile,
  migrateUcDocFile,
  UCDOC_VERSION
} from '../../src/editor/ucdoc'
import type { IEditorResult } from '../../src/editor/interface/Editor'

const editorResult: IEditorResult = {
  version: '0.9.133',
  data: {
    header: [],
    main: [
      {
        value: 'Hello UcDoc'
      }
    ],
    footer: []
  },
  options: {
    defaultFont: 'Arial',
    defaultSize: 16
  }
}

describe('ucdoc adapter', () => {
  it('creates an empty ucdoc file with default values', () => {
    const doc = createUcDocFile()

    expect(doc.format).toBe('ucdoc')
    expect(doc.version).toBe(UCDOC_VERSION)
    expect(doc.metadata.title).toBe('Untitled Document')
    expect(doc.data.main).toEqual([])
    expect(doc.styles.paragraphStyles.normal.name).toBe('Normal')
    expect(doc.assets.images).toEqual({})
  })

  it('creates a ucdoc file from editor result', () => {
    const doc = createUcDocFileByEditorResult(editorResult, {
      metadata: {
        title: 'Project Plan'
      }
    })

    expect(doc.editorVersion).toBe(editorResult.version)
    expect(doc.metadata.title).toBe('Project Plan')
    expect(doc.data.main[0].value).toBe('Hello UcDoc')
    expect(doc.options.defaultFont).toBe('Arial')
  })

  it('restores editor result from ucdoc file', () => {
    const doc = createUcDocFileByEditorResult(editorResult)
    const restored = getEditorResultFromUcDocFile(doc)

    expect(restored.version).toBe(editorResult.version)
    expect(restored.data).toEqual(editorResult.data)
    expect(restored.options).toEqual(editorResult.options)
  })

  it('detects and migrates ucdoc files', () => {
    const doc = createUcDocFile()

    expect(isUcDocFile(doc)).toBe(true)
    expect(isUcDocFile({ format: 'docx' })).toBe(false)
    expect(migrateUcDocFile({ ...doc, version: '0.1.0' }).version).toBe(
      UCDOC_VERSION
    )
  })
})
