import {
  createDefaultUcDocPageSettings,
  UCDOC_FORMAT,
  UCDOC_VERSION
} from './defaults'
import type { UcDocFile } from './types'

export function isUcDocFile(value: unknown): value is UcDocFile {
  if (!value || typeof value !== 'object') {
    return false
  }
  const doc = value as Partial<UcDocFile>
  return doc.format === UCDOC_FORMAT && typeof doc.version === 'string'
}

export function migrateUcDocFile(doc: UcDocFile): UcDocFile {
  const defaultPage = createDefaultUcDocPageSettings()
  return {
    ...doc,
    version: UCDOC_VERSION,
    page: {
      ...defaultPage,
      ...doc.page,
      margins: {
        ...defaultPage.margins,
        ...doc.page?.margins
      }
    }
  }
}
