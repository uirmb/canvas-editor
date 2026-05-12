export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function pxToTwip(value: number): number {
  return Math.round(value * 15)
}

export function pxToHalfPoint(value: number): number {
  return Math.round(value * 1.5)
}

export function colorToHex(value?: string | null): string | null {
  if (!value) return null
  const normalized = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.slice(1).toUpperCase()
  }
  if (/^[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.toUpperCase()
  }
  return null
}
