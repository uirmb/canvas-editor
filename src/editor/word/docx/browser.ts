import { DOCX_MIME_TYPE, type DocxExportResult } from './types'

export function createDocxBlob(result: DocxExportResult): Blob {
  return new Blob([result.data], {
    type: result.mimeType || DOCX_MIME_TYPE
  })
}

export function createDocxObjectUrl(result: DocxExportResult): string {
  if (typeof URL === 'undefined') {
    throw new Error('createDocxObjectUrl requires URL support')
  }
  return URL.createObjectURL(createDocxBlob(result))
}

export function revokeDocxObjectUrl(url: string): void {
  if (typeof URL === 'undefined') {
    throw new Error('revokeDocxObjectUrl requires URL support')
  }
  URL.revokeObjectURL(url)
}
