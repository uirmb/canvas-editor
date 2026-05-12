import type {
  IEditorData,
  IEditorOption,
  IEditorResult
} from '../interface/Editor'
import type { IElement } from '../interface/Element'

export type UcDocFormat = 'ucdoc'

export type UcDocAssetType = 'image' | 'attachment'

export type UcDocStyleValue = string | number | boolean | null

export type UcDocPageOrientation = 'portrait' | 'landscape'

export interface UcDocMetadata {
  id?: string
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  createdAt?: string
  updatedAt?: string
  description?: string
}

export interface UcDocAsset {
  id: string
  type: UcDocAssetType
  name?: string
  mimeType: string
  width?: number
  height?: number
  size?: number
  url?: string
  base64?: string
  extension?: Record<string, unknown>
}

export interface UcDocAssetMap {
  images: Record<string, UcDocAsset>
  attachments: Record<string, UcDocAsset>
}

export interface UcDocPageMargin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface UcDocPageSettings {
  paperSize?: string
  width: number
  height: number
  orientation: UcDocPageOrientation
  margins: UcDocPageMargin
  headerDistance?: number
  footerDistance?: number
}

export type UcDocPageSettingsInput = Omit<
  Partial<UcDocPageSettings>,
  'margins'
> & {
  margins?: Partial<UcDocPageMargin>
}

export interface UcDocParagraphStyle {
  name: string
  basedOn?: string
  next?: string
  properties: Record<string, UcDocStyleValue>
}

export interface UcDocCharacterStyle {
  name: string
  basedOn?: string
  properties: Record<string, UcDocStyleValue>
}

export interface UcDocTableStyle {
  name: string
  basedOn?: string
  properties: Record<string, UcDocStyleValue>
}

export interface UcDocStyleSheet {
  paragraphStyles: Record<string, UcDocParagraphStyle>
  characterStyles: Record<string, UcDocCharacterStyle>
  tableStyles: Record<string, UcDocTableStyle>
}

export interface UcDocFile {
  format: UcDocFormat
  version: string
  editorVersion?: string
  metadata: UcDocMetadata
  page: UcDocPageSettings
  styles: UcDocStyleSheet
  data: IEditorData
  options: IEditorOption
  assets: UcDocAssetMap
  extensions?: Record<string, unknown>
}

export interface CreateUcDocOptions {
  metadata?: UcDocMetadata
  page?: UcDocPageSettingsInput
  data?: Partial<IEditorData> | IElement[]
  options?: IEditorOption
  styles?: Partial<UcDocStyleSheet>
  assets?: Partial<UcDocAssetMap>
  extensions?: Record<string, unknown>
  editorVersion?: string
}

export interface UcDocExportContext {
  doc: UcDocFile
  editorResult: IEditorResult
}
