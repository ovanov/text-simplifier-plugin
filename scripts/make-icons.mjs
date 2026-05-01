#!/usr/bin/env node
// One-shot generator for placeholder extension icons.
// Output is committed to the repo; re-run only when changing the design.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";

const BG = { r: 0x00, g: 0x55, b: 0xaa, a: 0xff };
const FG = { r: 0xff, g: 0xff, b: 0xff, a: 0xff };

// 5x7 pixel font for "E" and "L". 1 = pixel on.
const GLYPHS = {
  E: [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  L: [
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
};

function setPixel(png, x, y, c) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  png.data[i] = c.r;
  png.data[i + 1] = c.g;
  png.data[i + 2] = c.b;
  png.data[i + 3] = c.a;
}

function fill(png, c) {
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) setPixel(png, x, y, c);
  }
}

function drawGlyph(png, glyph, originX, originY, scale, c) {
  for (let gy = 0; gy < glyph.length; gy++) {
    for (let gx = 0; gx < glyph[gy].length; gx++) {
      if (!glyph[gy][gx]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          setPixel(png, originX + gx * scale + dx, originY + gy * scale + dy, c);
        }
      }
    }
  }
}

async function makeIcon(size, outPath) {
  const png = new PNG({ width: size, height: size });
  fill(png, BG);

  // Two 5x7 glyphs, single space between, scaled to fit ~70% of the icon.
  const glyphCols = 5 + 1 + 5; // 11 logical columns
  const glyphRows = 7;
  const scale = Math.max(1, Math.floor(Math.min(size * 0.7 / glyphCols, size * 0.7 / glyphRows)));
  const totalW = glyphCols * scale;
  const totalH = glyphRows * scale;
  const originX = Math.floor((size - totalW) / 2);
  const originY = Math.floor((size - totalH) / 2);

  drawGlyph(png, GLYPHS.E, originX, originY, scale, FG);
  drawGlyph(png, GLYPHS.L, originX + 6 * scale, originY, scale, FG);

  await writeFile(outPath, PNG.sync.write(png));
  console.log(`  wrote ${outPath} (${size}x${size})`);
}

await mkdir("icons", { recursive: true });
await makeIcon(16, join("icons", "icon-16.png"));
await makeIcon(48, join("icons", "icon-48.png"));
await makeIcon(128, join("icons", "icon-128.png"));
await makeIcon(128, join("icons", "store-128.png"));
console.log("done.");
