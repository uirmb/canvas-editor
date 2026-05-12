import type { IEditorData } from '../interface/Editor'
import type {
  UcDocAssetMap,
  UcDocMetadata,
  UcDocPageSettings,
  UcDocStyleSheet
} from './types'

export const UCDOC_FORMAT = 'ucdoc'

export const UCDOC_VERSION = '1.0.0'

export function createDefaultUcDocMetadata(): UcDocMetadata {
  const now = new Date().toISOString()
  return {
    title: 'Untitled Document',
    createdAt: now,
    updatedAt: now
  }
}

export function createDefaultUcDocPageSettings(): UcDocPageSettings {
  return {
    paperSize: 'A4',
    width: 794,
    height: 1123,
    orientation: 'portrait',
    margins: {
      top: 96,
      right: 96,
      bottom: 96,
      left: 96
    },
    headerDistance: 48,
    footerDistance: 48
  }
}

export function createDefaultUcDocStyles(): UcDocStyleSheet {
  return {
    paragraphStyles: {
      normal: {
        name: 'Normal',
        properties: {}
      },
      title: {
        name: 'Title',
        basedOn: 'normal',
        properties: {}
      },
      heading1: {
        name: 'Heading 1',
        basedOn: 'normal',
        properties: {}
      },
      heading2: {
        name: 'Heading 2',
        basedOn: 'normal',
        properties: {}
      },
      heading3: {
        name: 'Heading 3',
        basedOn: 'normal',
        properties: {}
      }
    },
    characterStyles: {},
    tableStyles: {
      defaultTable: {
        name: 'Default Table',
        properties: {}
      }
    }
  }
}

export function createDefaultUcDocAssets(): UcDocAssetMap {
  return {
    images: {},
    attachments: {}
  }
}

export function createDefaultUcDocData(): IEditorData {
  return {
    header: [],
    main: [],
    footer: []
  }
}
