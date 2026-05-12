import type { Listener } from '../core/listener/Listener'
import type { EditorMode } from '../dataset/enum/Editor'
import type {
  IEditorData,
  IEditorHTML,
  IEditorOption,
  IEditorResult,
  IEditorText,
  ISetValueOption
} from '../interface/Editor'
import type { UcDocFile, UcDocMetadata } from '../ucdoc'

export interface UcDocEditorCommandLike {
  getValue(): IEditorResult
  getValueAsync?(): Promise<IEditorResult>
  executeSetValue(data: IEditorData, option?: ISetValueOption): void
  executeUpdateOptions?(options: IEditorOption): void
  executeMode?(mode: EditorMode): void
  executePrint?(): void
  getHTML?(): IEditorHTML
  getText?(): IEditorText
}

export interface UcDocEditorLike {
  version: string
  command: UcDocEditorCommandLike
  listener?: Listener
}

export interface UcDocEditorShellOptions {
  initialDoc?: UcDocFile
  autoBindContentChange?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onSave?: (doc: UcDocFile) => void | Promise<void>
}

export interface GetUcDocOptions {
  metadata?: UcDocMetadata
  touchUpdatedAt?: boolean
}

export interface OpenUcDocOptions {
  applyOptions?: boolean
  setValueOption?: ISetValueOption
}
