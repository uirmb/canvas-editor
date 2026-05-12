import { describe, expect, it, vi } from 'vitest'
import { EditorMode } from '../../src/editor/dataset/enum/Editor'
import type { IEditorData, IEditorResult } from '../../src/editor/interface/Editor'
import { createUcDocFileByEditorResult } from '../../src/editor/ucdoc'
import { UcDocEditorShell } from '../../src/editor/word'
import type { UcDocEditorLike } from '../../src/editor/word'

function createMockEditor(initialResult: IEditorResult): UcDocEditorLike {
  let currentResult = initialResult

  return {
    version: initialResult.version,
    listener: {
      contentChange: null
    } as UcDocEditorLike['listener'],
    command: {
      getValue: vi.fn(() => currentResult),
      getValueAsync: vi.fn(async () => currentResult),
      executeSetValue: vi.fn((data: IEditorData) => {
        currentResult = {
          ...currentResult,
          data
        }
      }),
      executeUpdateOptions: vi.fn(options => {
        currentResult = {
          ...currentResult,
          options
        }
      }),
      executeMode: vi.fn(),
      executePrint: vi.fn(),
      getHTML: vi.fn(() => ({
        header: '',
        main: '<p>Hello</p>',
        footer: ''
      })),
      getText: vi.fn(() => ({
        header: '',
        main: 'Hello',
        footer: ''
      }))
    }
  }
}

const initialResult: IEditorResult = {
  version: '0.9.133',
  data: {
    header: [],
    main: [
      {
        value: 'Initial'
      }
    ],
    footer: []
  },
  options: {
    defaultFont: 'Arial'
  }
}

describe('UcDocEditorShell', () => {
  it('creates a current ucdoc from editor value', () => {
    const editor = createMockEditor(initialResult)
    const shell = new UcDocEditorShell(editor)

    expect(shell.getCurrentDoc().format).toBe('ucdoc')
    expect(shell.getCurrentDoc().data.main[0].value).toBe('Initial')
    expect(shell.isDirty()).toBe(false)
  })

  it('opens ucdoc into editor and clears dirty state', () => {
    const editor = createMockEditor(initialResult)
    const shell = new UcDocEditorShell(editor)
    shell.markDirty(true)

    const nextDoc = createUcDocFileByEditorResult({
      ...initialResult,
      data: {
        header: [],
        main: [
          {
            value: 'Opened'
          }
        ],
        footer: []
      }
    })

    shell.openUcDoc(nextDoc)

    expect(editor.command.executeSetValue).toHaveBeenCalledWith(
      nextDoc.data,
      undefined
    )
    expect(shell.getCurrentDoc().data.main[0].value).toBe('Opened')
    expect(shell.isDirty()).toBe(false)
  })

  it('tracks content changes as dirty', () => {
    const onDirtyChange = vi.fn()
    const editor = createMockEditor(initialResult)
    const shell = new UcDocEditorShell(editor, { onDirtyChange })

    editor.listener?.contentChange?.()

    expect(shell.isDirty()).toBe(true)
    expect(onDirtyChange).toHaveBeenCalledWith(true)
  })

  it('saves ucdoc and clears dirty state', async () => {
    const onSave = vi.fn()
    const editor = createMockEditor(initialResult)
    const shell = new UcDocEditorShell(editor, { onSave })
    shell.markDirty(true)

    const doc = await shell.saveUcDoc({
      metadata: {
        title: 'Saved Document'
      }
    })

    expect(doc.metadata.title).toBe('Saved Document')
    expect(onSave).toHaveBeenCalledWith(doc)
    expect(shell.isDirty()).toBe(false)
  })

  it('switches readonly and edit modes', () => {
    const editor = createMockEditor(initialResult)
    const shell = new UcDocEditorShell(editor)

    shell.setReadonly(true)
    shell.setReadonly(false)

    expect(editor.command.executeMode).toHaveBeenNthCalledWith(
      1,
      EditorMode.READONLY
    )
    expect(editor.command.executeMode).toHaveBeenNthCalledWith(2, EditorMode.EDIT)
  })

  it('proxies print, html and text helpers', () => {
    const editor = createMockEditor(initialResult)
    const shell = new UcDocEditorShell(editor)

    shell.print()

    expect(editor.command.executePrint).toHaveBeenCalled()
    expect(shell.getHTML()?.main).toBe('<p>Hello</p>')
    expect(shell.getText()?.main).toBe('Hello')
  })
})
