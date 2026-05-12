import {
  createDefaultUcDocPageSettings,
  type UcDocPageSettings
} from '../ucdoc'

export function createPageSettings(
  settings: Partial<UcDocPageSettings> = {}
): UcDocPageSettings {
  const defaultSettings = createDefaultUcDocPageSettings()
  return {
    ...defaultSettings,
    ...settings,
    margins: {
      ...defaultSettings.margins,
      ...settings.margins
    }
  }
}

export function toLandscapePageSettings(
  settings: UcDocPageSettings
): UcDocPageSettings {
  return {
    ...settings,
    width: settings.height,
    height: settings.width,
    orientation: 'landscape'
  }
}

export function toPortraitPageSettings(
  settings: UcDocPageSettings
): UcDocPageSettings {
  return {
    ...settings,
    width: Math.min(settings.width, settings.height),
    height: Math.max(settings.width, settings.height),
    orientation: 'portrait'
  }
}
