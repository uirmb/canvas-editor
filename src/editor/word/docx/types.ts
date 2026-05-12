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
