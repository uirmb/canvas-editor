import type { UcDocAsset, UcDocFile } from '../../ucdoc'
import type { DocxImageRelation, DocxImageRelationMap, DocxPackageFile } from './types'

const DEFAULT_IMAGE_WIDTH = 240
const DEFAULT_IMAGE_HEIGHT = 180

function getImageExtension(asset: UcDocAsset): string {
  switch (asset.mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/gif':
      return 'gif'
    case 'image/webp':
      return 'webp'
    case 'image/svg+xml':
      return 'svg'
    case 'image/png':
    default:
      return 'png'
  }
}

function normalizeBase64(base64: string): string {
  const commaIndex = base64.indexOf(',')
  return commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = normalizeBase64(base64)
  if (typeof atob === 'function') {
    const binary = atob(normalized)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  const globalBuffer = (globalThis as {
    Buffer?: {
      from(value: string, encoding: 'base64'): Uint8Array
    }
  }).Buffer

  if (globalBuffer) {
    return new Uint8Array(globalBuffer.from(normalized, 'base64'))
  }

  throw new Error('Base64 decoding is not available in this environment')
}

export function createImageRelations(doc: UcDocFile): DocxImageRelation[] {
  return Object.values(doc.assets.images)
    .filter(asset => Boolean(asset.base64))
    .map((asset, index) => {
      const extension = getImageExtension(asset)
      const fileName = `image${index + 1}.${extension}`
      return {
        assetId: asset.id,
        relId: `rIdImage${index + 1}`,
        target: `media/${fileName}`,
        path: `word/media/${fileName}`,
        fileName,
        extension,
        mimeType: asset.mimeType,
        width: asset.width || DEFAULT_IMAGE_WIDTH,
        height: asset.height || DEFAULT_IMAGE_HEIGHT,
        data: base64ToUint8Array(asset.base64 || '')
      }
    })
}

export function createImageRelationMap(
  relations: DocxImageRelation[]
): DocxImageRelationMap {
  return relations.reduce<DocxImageRelationMap>((map, relation) => {
    map[relation.assetId] = relation
    return map
  }, {})
}

export function createImagePackageFiles(
  relations: DocxImageRelation[]
): DocxPackageFile[] {
  return relations.map(relation => ({
    path: relation.path,
    content: relation.data
  }))
}
