import type { DocxPackageFile } from './types'

const encoder = new TextEncoder()

function toBytes(content: string | Uint8Array): Uint8Array {
  return typeof content === 'string' ? encoder.encode(content) : content
}

function dateToDosTime(date: Date): { time: number; date: number } {
  const year = Math.max(date.getFullYear(), 1980)
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  }
}

function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
}

const CRC32_TABLE = makeCrc32Table()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

class ByteWriter {
  private chunks: Uint8Array[] = []
  private size = 0

  public get length(): number {
    return this.size
  }

  public writeUint8(value: number): void {
    this.writeBytes(Uint8Array.of(value & 0xff))
  }

  public writeUint16(value: number): void {
    this.writeBytes(Uint8Array.of(value & 0xff, (value >>> 8) & 0xff))
  }

  public writeUint32(value: number): void {
    this.writeBytes(
      Uint8Array.of(
        value & 0xff,
        (value >>> 8) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 24) & 0xff
      )
    )
  }

  public writeBytes(bytes: Uint8Array): void {
    this.chunks.push(bytes)
    this.size += bytes.length
  }

  public toUint8Array(): Uint8Array {
    const result = new Uint8Array(this.size)
    let offset = 0
    this.chunks.forEach(chunk => {
      result.set(chunk, offset)
      offset += chunk.length
    })
    return result
  }
}

interface CentralDirectoryEntry {
  pathBytes: Uint8Array
  crc: number
  size: number
  offset: number
  dosTime: number
  dosDate: number
}

export function createZip(files: DocxPackageFile[]): Uint8Array {
  const writer = new ByteWriter()
  const entries: CentralDirectoryEntry[] = []
  const now = dateToDosTime(new Date())

  files.forEach(file => {
    const pathBytes = encoder.encode(file.path)
    const contentBytes = toBytes(file.content)
    const crc = crc32(contentBytes)
    const offset = writer.length

    writer.writeUint32(0x04034b50)
    writer.writeUint16(20)
    writer.writeUint16(0)
    writer.writeUint16(0)
    writer.writeUint16(now.time)
    writer.writeUint16(now.date)
    writer.writeUint32(crc)
    writer.writeUint32(contentBytes.length)
    writer.writeUint32(contentBytes.length)
    writer.writeUint16(pathBytes.length)
    writer.writeUint16(0)
    writer.writeBytes(pathBytes)
    writer.writeBytes(contentBytes)

    entries.push({
      pathBytes,
      crc,
      size: contentBytes.length,
      offset,
      dosTime: now.time,
      dosDate: now.date
    })
  })

  const centralDirectoryOffset = writer.length

  entries.forEach(entry => {
    writer.writeUint32(0x02014b50)
    writer.writeUint16(20)
    writer.writeUint16(20)
    writer.writeUint16(0)
    writer.writeUint16(0)
    writer.writeUint16(entry.dosTime)
    writer.writeUint16(entry.dosDate)
    writer.writeUint32(entry.crc)
    writer.writeUint32(entry.size)
    writer.writeUint32(entry.size)
    writer.writeUint16(entry.pathBytes.length)
    writer.writeUint16(0)
    writer.writeUint16(0)
    writer.writeUint16(0)
    writer.writeUint16(0)
    writer.writeUint32(0)
    writer.writeUint32(entry.offset)
    writer.writeBytes(entry.pathBytes)
  })

  const centralDirectorySize = writer.length - centralDirectoryOffset

  writer.writeUint32(0x06054b50)
  writer.writeUint16(0)
  writer.writeUint16(0)
  writer.writeUint16(entries.length)
  writer.writeUint16(entries.length)
  writer.writeUint32(centralDirectorySize)
  writer.writeUint32(centralDirectoryOffset)
  writer.writeUint16(0)

  return writer.toUint8Array()
}
