import type { IEditorData, IEditorResult } from '../interface/Editor'
import type { IElement } from '../interface/Element'
import {
  createDefaultUcDocAssets,
  createDefaultUcDocData,
  createDefaultUcDocMetadata,
  createDefaultUcDocStyles,
  UCDOC_FORMAT,
  UCDOC_VERSION
} from './defaults'
import type { CreateUcDocOptions, UcDocFile } from './types'

function normalizeEditorData(
  data?: Partial<IEditorData> | IElement[]
): IEditorData {
  if (!data) {
    return createDefaultUcDocData()
  }
  if (Array.isArray(data)) {
    return {
      header: [],
      main: data,
      footer: []
    }
  }
  return {
    header: data.header || [],
    main: data.main || [],
    footer: data.footer || [],
    graffiti: data.graffiti || []
  }
}

export function createUcDocFile(options: CreateUcDocOptions = {}): UcDocFile {
  const defaultMetadata = createDefaultUcDocMetadata()
  const defaultStyles = createDefaultUcDocStyles()
  const defaultAssets = createDefaultUcDocAssets()

  return {
    format: UCDOC_FORMAT,
    version: UCDOC_VERSION,
    editorVersion: options.editorVersion,
    metadata: {
      ...defaultMetadata,
      ...options.metadata
    },
    styles: {
      paragraphStyles: {
        ...defaultStyles.paragraphStyles,
        ...options.styles?.paragraphStyles
      },
      characterStyles: {
        ...defaultStyles.characterStyles,
        ...options.styles?.characterStyles
      },
      tableStyles: {
        ...defaultStyles.tableStyles,
        ...options.styles?.tableStyles
      }
    },
    data: normalizeEditorData(options.data),
    options: options.options || {},
    assets: {
      images: {
        ...defaultAssets.images,
        ...options.assets?.images
      },
      attachments: {
        ...defaultAssets.attachments,
        ...options.assets?.attachments
      }
    },
    extensions: options.extensions || {}
  }
}

export function createUcDocFileByEditorResult(
  editorResult: IEditorResult,
  options: Omit<CreateUcDocOptions, 'data' | 'options' | 'editorVersion'> = {}
): UcDocFile {
  return createUcDocFile({
    ...options,
    editorVersion: editorResult.version,
    data: editorResult.data,
    options: editorResult.options
  })
}

export function getEditorResultFromUcDocFile(doc: UcDocFile): IEditorResult {
  return {
    version: doc.editorVersion || '',
    data: doc.data,
    options: doc.options
  }
}
