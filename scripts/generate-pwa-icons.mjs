import { deflateSync } from "node:zlib"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../public/icons")

function crc32(buf) {
  let c = ~0
  for (const byte of buf) {
    c ^= byte
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const tag = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])))
  return Buffer.concat([len, tag, data, crc])
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y)
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

function inCircle(x, y, cx, cy, r) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2
}

function inRoundRect(x, y, left, top, width, height, radius) {
  const right = left + width
  const bottom = top + height
  if (x < left || x > right || y < top || y > bottom) return false
  if (x >= left + radius && x <= right - radius) return true
  if (y >= top + radius && y <= bottom - radius) return true
  return (
    inCircle(x, y, left + radius, top + radius, radius) ||
    inCircle(x, y, right - radius, top + radius, radius) ||
    inCircle(x, y, left + radius, bottom - radius, radius) ||
    inCircle(x, y, right - radius, bottom - radius, radius)
  )
}

function draw(size) {
  const bg = [246, 240, 230, 255]
  const rose = [251, 113, 133, 255]
  const orange = [251, 146, 60, 255]
  const paper = [255, 251, 245, 255]
  const line = [253, 186, 140, 255]
  return png(size, (x, y) => {
    const s = size / 512
    if (!inRoundRect(x, y, 28 * s, 28 * s, 456 * s, 456 * s, 108 * s)) {
      return [0, 0, 0, 0]
    }
    if (inCircle(x, y, 256 * s, 256 * s, 196 * s)) {
      const t = (x + y) / (size * 2)
      return [
        Math.round(rose[0] * (1 - t) + orange[0] * t),
        Math.round(rose[1] * (1 - t) + orange[1] * t),
        Math.round(rose[2] * (1 - t) + orange[2] * t),
        255,
      ]
    }
    if (inRoundRect(x, y, 168 * s, 150 * s, 196 * s, 230 * s, 18 * s)) {
      if (
        y > 190 * s &&
        y < 350 * s &&
        x > 196 * s &&
        x < 340 * s &&
        Math.round((y - 190 * s) / (28 * s)) % 2 === 0 &&
        Math.abs((y - 190 * s) % (28 * s) - 2 * s) < 3 * s
      ) {
        return line
      }
      return paper
    }
    return bg
  })
}

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, "icon-192.png"), draw(192))
writeFileSync(join(outDir, "icon-512.png"), draw(512))
writeFileSync(join(outDir, "apple-touch-icon.png"), draw(180))
console.log("Wrote PWA icons to public/icons")
