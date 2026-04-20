// One-shot generator for placeholder amber PNGs used by the extension manifest.
// Writes public/icon-{16,48,128}.png as solid oklch(0.78 0.14 75) ≈ #E6A937 squares.
// Delete / replace these when real branding lands.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { resolve } from "node:path";

const RGB = [0xe6, 0xa9, 0x37]; // amber

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const i = y * rowSize + 1 + x * 3;
      raw[i] = RGB[0];
      raw[i + 1] = RGB[1];
      raw[i + 2] = RGB[2];
    }
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const root = resolve(process.cwd(), "public");
mkdirSync(root, { recursive: true });
for (const size of [16, 48, 128]) {
  const path = resolve(root, `icon-${size}.png`);
  writeFileSync(path, makePng(size));
  console.log("wrote", path);
}
