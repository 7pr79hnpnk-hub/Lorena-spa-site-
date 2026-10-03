#!/usr/bin/env node
/**
 * Converts the glyphs needed for the 3D wordmark into a tiny three.js
 * typeface JSON (the format FontLoader / TextGeometry expect).
 * Only the letters of "LORENSA" are exported, so the runtime payload stays ~6 KB.
 *
 *   npm run wordmark
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT = 'node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff';
const OUT = 'src/scene/wordmark.typeface.json';
const CHARS = [...new Set('LORENSA')];

const buffer = await readFile(path.join(root, FONT));
const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
const r = (v) => Math.round(v * scale);

const glyphs = {};
for (const char of CHARS) {
  const glyph = font.charToGlyph(char);
  const box = glyph.getBoundingBox();
  let o = '';
  for (const c of glyph.path.commands) {
    const type = c.type === 'C' ? 'b' : c.type.toLowerCase();
    o += `${type} `;
    if (c.x !== undefined) o += `${r(c.x)} ${r(c.y)} `;
    if (c.x1 !== undefined) o += `${r(c.x1)} ${r(c.y1)} `;
    if (c.x2 !== undefined) o += `${r(c.x2)} ${r(c.y2)} `;
  }
  glyphs[char] = { ha: r(glyph.advanceWidth), x_min: r(box.x1), x_max: r(box.x2), o: o.trim() };
}

const typeface = {
  glyphs,
  familyName: font.names.fontFamily?.en ?? 'Cormorant Garamond',
  ascender: r(font.ascender),
  descender: r(font.descender),
  underlinePosition: r(font.tables.post.underlinePosition),
  underlineThickness: r(font.tables.post.underlineThickness),
  boundingBox: {
    xMin: r(font.tables.head.xMin),
    yMin: r(font.tables.head.yMin),
    xMax: r(font.tables.head.xMax),
    yMax: r(font.tables.head.yMax),
  },
  resolution: 1000,
  original_font_information: { license: 'SIL Open Font License 1.1', source: FONT },
};

await writeFile(path.join(root, OUT), JSON.stringify(typeface));
console.log(`✓ ${OUT} (${CHARS.join('')})`);
