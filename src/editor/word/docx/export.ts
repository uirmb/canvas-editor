import type { UcDocFile } from '../../ucdoc'
import { createZip } from './zip'
import { createDocxPackageFiles } from './package'
import {
  DOCX_MIME_TYPE,
  type DocxExportOptions,
  type DocxExportResult
} from './types'

function normalizeFileName(fileName?: string): string {
  const name = fileName?.trim() || 'document.docx'
  return name.toLowerCase().endsWith('.docx') ? name : `${name}.docx`
}

export function exportUcDocToDocx(
  doc: UcDocFile,
  options: DocxExportOptions = {}
): DocxExportResult {
  const files = createDocxPackageFiles(doc)
  return {
    fileName: normalizeFileName(options.fileName || doc.metadata.title),
    mimeType: DOCX_MIME_TYPE,
    files,
    data: createZip(files)
  }
}
