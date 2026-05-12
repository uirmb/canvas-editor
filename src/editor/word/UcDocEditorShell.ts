import { EditorMode } from '../dataset/enum/Editor'
import type { IEditorHTML, IEditorText } from '../interface/Editor'
import {
  createUcDocFileByEditorResult,
  getEditorResultFromUcDocFile,
  migrateUcDocFile,
  type UcDocFile
} from '../ucdoc'
import type {
  GetUcDocOptions,
  OpenUcDocOptions,
  UcDocEditorLike,
  UcDocEditorShellOptions
} from './types'

export class UcDocEditorShell {
  private readonly editor: UcDocEditorLike
  private currentDoc: UcDocFile
  private dirty = false
  private readonly onDirtyChange?: (dirty: boolean) => void
  private readonly onSave?: (doc: UcDocFile) => void | Promise<void>
  private readonly originalContentChange?: () => void

  constructor(editor: UcDocEditorLike, options: UcDocEditorShellOptions = {}) {
    this.editor = editor
    this.onDirtyChange = options.onDirtyChange
    this.onSave = options.onSave
    this.currentDoc = options.initialDoc
      ? migrateUcDocFile(options.initialDoc)
      : createUcDocFileByEditorResult(editor.command.getValue(), {
          editorVersion: editor.version
        })

    this.originalContentChange = editor.listener?.contentChange || undefined

    if (options.autoBindContentChange !== false && editor.listener) {
      editor.listener.contentChange = () => {
        this.markDirty(true)
        this.originalContentChange?.()
      }
    }
  }

  public getEditor(): UcDocEditorLike {
    return this.editor
  }

  public getCurrentDoc(): UcDocFile {
    return this.currentDoc
  }

  public isDirty(): boolean {
    return this.dirty
  }

  public markDirty(dirty = true): void {
    if (this.dirty === dirty) return
    this.dirty = dirty
    this.onDirtyChange?.(dirty)
  }

  public openUcDoc(doc: UcDocFile, options: OpenUcDocOptions = {}): UcDocFile {
    const migratedDoc = migrateUcDocFile(doc)
    const editorResult = getEditorResultFromUcDocFile(migratedDoc)

    if (options.applyOptions && this.editor.command.executeUpdateOptions) {
      this.editor.command.executeUpdateOptions(editorResult.options)
    }

    this.editor.command.executeSetValue(editorResult.data, options.setValueOption)
    this.currentDoc = migratedDoc
    this.markDirty(false)
    return this.currentDoc
  }

  public getUcDoc(options: GetUcDocOptions = {}): UcDocFile {
    const editorResult = this.editor.command.getValue()
    const metadata = {
      ...this.currentDoc.metadata,
      ...options.metadata
    }

    if (options.touchUpdatedAt !== false) {
      metadata.updatedAt = new Date().toISOString()
    }

    this.currentDoc = createUcDocFileByEditorResult(editorResult, {
      metadata,
      styles: this.currentDoc.styles,
      assets: this.currentDoc.assets,
      extensions: this.currentDoc.extensions,
      editorVersion: this.editor.version
    })

    return this.currentDoc
  }

  public async getUcDocAsync(options: GetUcDocOptions = {}): Promise<UcDocFile> {
    const editorResult = this.editor.command.getValueAsync
      ? await this.editor.command.getValueAsync()
      : this.editor.command.getValue()
    const metadata = {
      ...this.currentDoc.metadata,
      ...options.metadata
    }

    if (options.touchUpdatedAt !== false) {
      metadata.updatedAt = new Date().toISOString()
    }

    this.currentDoc = createUcDocFileByEditorResult(editorResult, {
      metadata,
      styles: this.currentDoc.styles,
      assets: this.currentDoc.assets,
      extensions: this.currentDoc.extensions,
      editorVersion: this.editor.version
    })

    return this.currentDoc
  }

  public async saveUcDoc(options: GetUcDocOptions = {}): Promise<UcDocFile> {
    const doc = await this.getUcDocAsync(options)
    await this.onSave?.(doc)
    this.markDirty(false)
    return doc
  }

  public setReadonly(readonly: boolean): void {
    this.editor.command.executeMode?.(
      readonly ? EditorMode.READONLY : EditorMode.EDIT
    )
  }

  public print(): void {
    this.editor.command.executePrint?.()
  }

  public getHTML(): IEditorHTML | null {
    return this.editor.command.getHTML?.() || null
  }

  public getText(): IEditorText | null {
    return this.editor.command.getText?.() || null
  }

  public destroy(): void {
    if (this.editor.listener) {
      this.editor.listener.contentChange = this.originalContentChange || null
    }
  }
}
