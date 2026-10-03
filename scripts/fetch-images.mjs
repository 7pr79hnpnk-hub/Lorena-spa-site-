#!/usr/bin/env node
/**
 * Downloads the source photography listed in scripts/image-sources.json and
 * writes responsive AVIF + WebP renditions to public/images/{name}-{width}.{ext}.
 *
 *   npm run images              → skip images whose renditions already exist
 *   npm run images -- --force   → regenerate everything
 *   npm run images -- --strict  → exit non-zero if any source fails (used in CI)
 */
import { readFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const strict = args.has('--strict');

const config = JSON.parse(await readFile(path.join(root, 'scripts/image-sources.json'), 'utf8'));
const outDir = path.join(root, config.outDir);
await mkdir(outDir, { recursive: true });

const exists = (file) => access(file).then(() => true, () => false);

async function download(url, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw lastError;
}

function targetsFor(image) {
  return image.widths.flatMap((width) =>
    Object.keys(config.formats).map((format) => ({
      width,
      format,
      file: path.join(outDir, `${image.name}-${width}.${format}`),
    })),
  );
}

let failures = 0;

for (const image of config.images) {
  const targets = targetsFor(image);
  if (!force && (await Promise.all(targets.map((t) => exists(t.file)))).every(Boolean)) {
    console.log(`✓ ${image.name} (cached)`);
    continue;
  }

  let input;
  try {
    input = image.file
      ? await readFile(path.join(root, image.file))
      : await download(image.url);
  } catch (error) {
    failures++;
    console.warn(`✗ ${image.name}: could not load source (${error.message})`);
    continue;
  }

  let base = sharp(input, { failOn: 'none' }).rotate();
  if (image.crop) base = base.extract(image.crop);
  const prepared = await base.toBuffer();

  await Promise.all(
    targets.map(({ width, format, file }) =>
      sharp(prepared)
        .resize({ width, withoutEnlargement: true })
        [format](config.formats[format])
        .toFile(file),
    ),
  );
  console.log(`✓ ${image.name} → ${targets.length} renditions`);
}

if (failures) {
  const message = `${failures} image source(s) failed.`;
  if (strict) {
    console.error(message);
    process.exit(1);
  }
  console.warn(`${message} The site falls back to its gradient placeholders for those images.`);
}
