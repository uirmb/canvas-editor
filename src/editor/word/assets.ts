import type { UcDocAsset, UcDocAssetMap } from '../ucdoc'

export interface CreateImageAssetOptions {
  id: string
  name?: string
  mimeType: string
  width?: number
  height?: number
  size?: number
  url?: string
  base64?: string
  extension?: Record<string, unknown>
}

export function createImageAsset(options: CreateImageAssetOptions): UcDocAsset {
  return {
    id: options.id,
    type: 'image',
    name: options.name,
    mimeType: options.mimeType,
    width: options.width,
    height: options.height,
    size: options.size,
    url: options.url,
    base64: options.base64,
    extension: options.extension
  }
}

export function addImageAsset(
  assets: UcDocAssetMap,
  image: UcDocAsset
): UcDocAssetMap {
  return {
    ...assets,
    images: {
      ...assets.images,
      [image.id]: image
    }
  }
}

export function removeImageAsset(
  assets: UcDocAssetMap,
  assetId: string
): UcDocAssetMap {
  const images = { ...assets.images }
  delete images[assetId]
  return {
    ...assets,
    images
  }
}
