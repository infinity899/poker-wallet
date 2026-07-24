/**
 * Rasterises public/favicon.svg into the PNG/ICO fallbacks.
 *
 *   node scripts/generate-favicons.mjs
 *
 * Emits public/apple-touch-icon.png (180) and public/favicon.ico (16/32/48).
 *
 * The mark is pure geometry — a rounded tile, a disc, four notches and a ring —
 * so it is cheaper and far more reproducible to evaluate the shapes directly
 * than to shell out to a rasteriser (this machine has none) or round-trip a
 * canvas through the browser. Coverage is computed with signed-distance
 * functions at 4x4 supersampling, which gives clean edges at 16px where the
 * notches are barely over a pixel wide.
 *
 * KEEP IN SYNC with public/favicon.svg — the constants below mirror it.
 */
import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/* ---- Geometry, in the SVG's 32-unit coordinate space ---- */
const VIOLET = [0x73, 0x5F, 0xE9]; // accent-600, oklch(0.58 0.20 285)
const WHITE = [0xFF, 0xFF, 0xFF];

const TILE = { cx: 16, cy: 16, hw: 16, hh: 16, r: 7 };
const BODY_R = 11.4;
const RING_R = 7.5;
const RING_HALF = 1.4; // stroke-width 2.8
const NOTCHES = [
  { cx: 16, cy: 5.6, hw: 2.1, hh: 3, r: 2.1 }, // top
  { cx: 16, cy: 26.4, hw: 2.1, hh: 3, r: 2.1 }, // bottom
  { cx: 5.6, cy: 16, hw: 3, hh: 2.1, r: 2.1 }, // left
  { cx: 26.4, cy: 16, hw: 3, hh: 2.1, r: 2.1 }, // right
];

/** Signed distance to a rounded box; <= 0 is inside. */
function sdRoundedBox(px, py, box) {
  const qx = Math.abs(px - box.cx) - (box.hw - box.r);
  const qy = Math.abs(py - box.cy) - (box.hh - box.r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - box.r;
}

function dist(px, py, cx, cy) {
  return Math.hypot(px - cx, py - cy);
}

/** Colour of the mark at a point, or null where the tile is not present. */
function sample(px, py) {
  if (sdRoundedBox(px, py, TILE) > 0) {
    return null; // outside the tile => transparent
  }
  const d = dist(px, py, 16, 16);
  let color = VIOLET;
  if (d <= BODY_R) {
    color = WHITE;
  }
  // Notches and the inset ring are punched back to the tile colour.
  if (Math.abs(d - RING_R) <= RING_HALF) {
    color = VIOLET;
  }
  for (const n of NOTCHES) {
    if (sdRoundedBox(px, py, n) <= 0) {
      color = VIOLET;
      break;
    }
  }
  return color;
}

/** Render to an RGBA buffer at `size`, 4x4 supersampled. */
function render(size) {
  const SS = 4;
  const rgba = Buffer.alloc(size * size * 4);
  const unit = 32 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) * unit;
          const py = (y + (sy + 0.5) / SS) * unit;
          const c = sample(px, py);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            hits++;
          }
        }
      }
      const i = (y * size + x) * 4;
      const total = SS * SS;
      if (hits > 0) {
        // Un-premultiply: average colour over covered samples only.
        rgba[i] = Math.round(r / hits);
        rgba[i + 1] = Math.round(g / hits);
        rgba[i + 2] = Math.round(b / hits);
        rgba[i + 3] = Math.round((hits / total) * 255);
      }
    }
  }
  return rgba;
}

/* ---- Minimal PNG encoder (8-bit RGBA, no interlace) ---- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  // Each scanline gets filter byte 0 (None) — the images are tiny and flat.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO wrapping PNG payloads (supported since Vista; universal in practice). */
function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const { size, png } of entries) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size; // 0 means 256
    e[1] = size >= 256 ? 0 : size;
    e[2] = 0; // palette count
    e[3] = 0; // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    dir.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...dir, ...entries.map(e => e.png)]);
}

/* ---- Emit ---- */
const icoSizes = [16, 32, 48];
const ico = encodeIco(icoSizes.map(size => ({ size, png: encodePng(render(size), size) })));
writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), ico);

const apple = encodePng(render(180), 180);
writeFileSync(join(PUBLIC_DIR, 'apple-touch-icon.png'), apple);

console.log(`favicon.ico          ${ico.length} bytes (${icoSizes.join('/')})`);
console.log(`apple-touch-icon.png ${apple.length} bytes (180x180)`);
