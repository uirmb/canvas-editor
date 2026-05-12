import type { UcDocFile } from '../../ucdoc'

export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export interface DocxPackageFile {
  path: string
  content: string | Uint8Array
}

export interface DocxExportOptions {
  fileName?: string
}

export interface DocxExportResult {
  fileName: string
  mimeType: typeof DOCX_MIME_TYPE
  files: DocxPackageFile[]
  data: Uint8Array
}

export interface DocxExportContext {
  doc: UcDocFile
  options: Required<DocxExportOptions>
}

export interface DocxImageRelation {
  assetId: string
  relId: string
  target: string
  path: string
  fileName: string
  extension: string
  mimeType: string
  width: number
  height: number
  data: Uint8Array
}

export type DocxImageRelationMap = Record<string, DocxImageRelation>

export interface DocxNumberingLevel {
  level: number
  format: string
  text: string
  start: number
}

export interface DocxNumberingDefinition {
  sourceId: string
  docxNumId: number
  abstractNumId: number
  levels: DocxNumberingLevel[]
}

export type DocxNumberingMap = Record<string, DocxNumberingDefinition>

export interface DocxNumberingReference {
  numId: number
  level: number
}
