// Entry for make.fun bounty news-image-20261118: one image summing up the world's news of Wednesday 18 November 2026.
// The picture is entry.png beside this file (drawn by render-entry.mjs from stories.json). This program checks it
// and writes the same bytes to $MAKEFUN_OUTPUT_DIR/entry.png (default /output/entry.png). Node standard library
// only, no network, deterministic: every run writes identical bytes.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function fail(message) {
  console.error(`entry.png check failed: ${message}`);
  process.exit(1);
}

// CRC-32 as PNG uses it (polynomial 0xEDB88320), so each chunk's checksum can be confirmed.
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function checkPng(buf) {
  if (buf.length > MAX_BYTES) fail(`${buf.length} bytes is over the 1 MiB limit`);
  if (buf.length < 8 || PNG_SIGNATURE.some((b, i) => buf[i] !== b)) fail('missing PNG signature');
  let pos = 8;
  let width = 0;
  let height = 0;
  let sawIdat = false;
  let sawIend = false;
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    if (pos + 12 + len > buf.length) fail(`chunk ${type} runs past the end of the file`);
    const stored = buf.readUInt32BE(pos + 8 + len);
    if (crc32(buf.subarray(pos + 4, pos + 8 + len)) !== stored) fail(`bad CRC in chunk ${type}`);
    if (pos === 8) {
      if (type !== 'IHDR') fail('first chunk is not IHDR');
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
    }
    if (type === 'IDAT') sawIdat = true;
    pos += 12 + len;
    if (type === 'IEND') { sawIend = true; break; }
  }
  if (!sawIdat) fail('no image data (IDAT)');
  if (!sawIend) fail('no IEND chunk: file is truncated');
  if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE) fail(`size ${width}x${height} is outside 1..${MAX_SIDE}`);
  return { width, height };
}

const png = readFileSync(new URL('./entry.png', import.meta.url));
const { width, height } = checkPng(png);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');
try {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, png);
} catch (err) {
  fail(`cannot write ${target}: ${err.message}`);
}

// Read it back so a short or failed write is caught here, not by the gate.
const written = readFileSync(target);
if (!written.equals(png)) fail(`${target} does not match the source bytes`);
console.log(`wrote ${target}: ${width}x${height}, ${png.length} bytes`);
