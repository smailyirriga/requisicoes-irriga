// Gera ícones PNG simples (quadrado azul com "IE") para o PWA, sem dependências.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
// desenho 8x8 de "IE" (1 = pixel aceso)
const GLYPH = [
  "01111110",
  "00110000",
  "00110000",
  "00110111",
  "00110110",
  "00110000",
  "00110000",
  "01111111",
];
function png(size) {
  const bg = [3, 105, 161]; // sky-700
  const fg = [255, 255, 255];
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  const cell = size / 8;
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const gx = Math.floor(x / cell);
      const gy = Math.floor(y / cell);
      const pad = x < cell || x >= size - cell || y < cell || y >= size - cell;
      const on = !pad && GLYPH[gy] && GLYPH[gy][gx] === "1";
      const [r, g, b] = on ? fg : bg;
      const o = y * stride + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(dir, { recursive: true });
for (const s of [192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${s}.png`), png(s));
  console.log("gerado", `public/icons/icon-${s}.png`);
}
