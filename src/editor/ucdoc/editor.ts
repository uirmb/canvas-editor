import { EditorMode } from '../dataset/enum/Editor'
import type {
  IEditorData,
  IEditorHTML,
  IEditorOption,
  IEditorResult,
  ISetValueOption
} from '../interface/Editor'
import type { IContentChange } from '../interface/Listener'
import {
  createUcDocFile,
  createUcDocFileByEditorResult,
  getEditorResultFromUcDocFile
} from './adapter'
import { migrateUcDocFile } from './migrate'
import type {
  CreateUcDocOptions,
  UcDocFile,
  UcDocMetadata
} from './types'

export interface UcDocEditorCommandHost {
  getValue: () => IEditorResult
  getValueAsync?: () => Promise<IEditorResult>
  getHTML?: () => IEditorHTML
  executeSetValue: (payload: Partial<IEditorData>, options?: ISetValueOption) => void
  executeUpdateOptions?: (payload: Partial<IEditorOption>) => void
  executeMode?: (payload: EditorMode) => void
  executePrint?: () => void
}

export interface UcDocEditorListenerHost {
  contentChange: IContentChange | null
}

export interface UcDocEditorHost {
  version?: string
  command: UcDocEditorCommandHost
  listener?: UcDocEditorListenerHost
  destroy?: () => void
}

export interface UcDocEditorOptions {
  document?: UcDocFile
  metadata?: UcDocMetadata
  autoSave?: boolean
  autoSaveDelay?: number
  onDirtyChange?: (dirty: boolean) => void
  onSave?: (doc: UcDocFile) => void | Promise<void>
  onAutoSave?: (doc: UcDocFile) => void | Promise<void>
}

export interface GetUcDocOption {
  updateTime?: boolean
}

export class UcDocEditor {
  private readonly host: UcDocEditorHost
  private readonly options: UcDocEditorOptions
  private readonly originalContentChange: IContentChange | null
  private currentDoc: UcDocFile
  private dirty = false
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null
  private autoSaving = false

  constructor(host: UcDocEditorHost, options: UcDocEditorOptions = {}) {
    this.host = host
    this.options = options
    this.currentDoc = options.document
      ? migrateUcDocFile(options.document)
      : createUcDocFile({
          metadata: options.metadata,
          editorVersion: host.version
        })
    this.originalContentChange = host.listener?.contentChange || null

    if (options.document) {
      this.openUcDoc(options.document)
    }
    this.bindContentChange()
  }

  public getDocument(): UcDocFile {
    return this.currentDoc
  }

  public isDirty(): boolean {
    return this.dirty
  }

  public createBlankUcDoc(options: CreateUcDocOptions = {}): UcDocFile {
    const doc = createUcDocFile({
      ...options,
      editorVersion: options.editorVersion || this.host.version
    })
    this.openUcDoc(doc)
    return doc
  }

  public openUcDoc(doc: UcDocFile): UcDocFile {
    const migratedDoc = migrateUcDocFile(doc)
    const editorResult = getEditorResultFromUcDocFile(migratedDoc)

    this.currentDoc = migratedDoc
    if (this.host.command.executeUpdateOptions) {
      this.host.command.executeUpdateOptions(editorResult.options)
    }
    this.host.command.executeSetValue(editorResult.data, {
      isSetCursor: false
    })
    this.setDirty(false)
    return migratedDoc
  }

  public getUcDoc(options: GetUcDocOption = {}): UcDocFile {
    return this.createDocumentByEditorResult(
      this.host.command.getValue(),
      options
    )
  }

  public async getUcDocAsync(options: GetUcDocOption = {}): Promise<UcDocFile> {
    const editorResult = this.host.command.getValueAsync
      ? await this.host.command.getValueAsync()
      : this.host.command.getValue()
    return this.createDocumentByEditorResult(editorResult, options)
  }

  public async saveUcDoc(): Promise<UcDocFile> {
    const doc = await this.getUcDocAsync({
      updateTime: true
    })
    if (this.options.onSave) {
      await this.options.onSave(doc)
    }
    this.currentDoc = doc
    this.setDirty(false)
    return doc
  }

  public markSaved(doc?: UcDocFile) {
    if (doc) {
      this.currentDoc = migrateUcDocFile(doc)
    }
    this.setDirty(false)
  }

  public setReadonly(readonly: boolean) {
    this.setMode(readonly ? EditorMode.READONLY : EditorMode.EDIT)
  }

  public setMode(mode: EditorMode) {
    if (this.host.command.executeMode) {
      this.host.command.executeMode(mode)
    }
  }

  public print() {
    if (this.host.command.executePrint) {
      this.host.command.executePrint()
    }
  }

  public getHTML(): IEditorHTML | null {
    return this.host.command.getHTML ? this.host.command.getHTML() : null
  }

  public dispose() {
    this.clearAutoSaveTimer()
    if (this.host.listener) {
      this.host.listener.contentChange = this.originalContentChange
    }
  }

  public destroy() {
    this.dispose()
    if (this.host.destroy) {
      this.host.destroy()
    }
  }

  private bindContentChange() {
    if (!this.host.listener) {
      return
    }
    this.host.listener.contentChange = () => {
      if (this.originalContentChange) {
        this.originalContentChange()
      }
      this.setDirty(true)
      this.scheduleAutoSave()
    }
  }

  private createDocumentByEditorResult(
    editorResult: IEditorResult,
    options: GetUcDocOption
  ): UcDocFile {
    const metadata = {
      ...this.currentDoc.metadata
    }
    if (options.updateTime !== false) {
      metadata.updatedAt = new Date().toISOString()
    }
    return createUcDocFileByEditorResult(editorResult, {
      metadata,
      styles: this.currentDoc.styles,
      assets: this.currentDoc.assets,
      extensions: this.currentDoc.extensions
    })
  }

  private setDirty(dirty: boolean) {
    if (this.dirty === dirty) {
      return
    }
    this.dirty = dirty
    if (this.options.onDirtyChange) {
      this.options.onDirtyChange(dirty)
    }
  }

  private scheduleAutoSave() {
    if (!this.options.autoSave) {
      return
    }
    const delay = this.options.autoSaveDelay ?? 1000
    this.clearAutoSaveTimer()
    this.autoSaveTimer = setTimeout(() => {
      void this.autoSave()
    }, delay)
  }

  private clearAutoSaveTimer() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  private async autoSave() {
    if (!this.dirty || this.autoSaving) {
      return
    }
    const saveHandler = this.options.onAutoSave || this.options.onSave
    if (!saveHandler) {
      return
    }
    this.autoSaving = true
    try {
      const doc = await this.getUcDocAsync({
        updateTime: true
      })
      await saveHandler(doc)
      this.currentDoc = doc
      this.setDirty(false)
    } finally {
      this.autoSaving = false
    }
  }
}

export function createUcDocEditor(
  host: UcDocEditorHost,
  options?: UcDocEditorOptions
): UcDocEditor {
  return new UcDocEditor(host, options)
}

export function createBlankUcDoc(options?: CreateUcDocOptions): UcDocFile {
  return createUcDocFile(options)
}
