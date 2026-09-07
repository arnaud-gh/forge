/**
 * Generates the PWA icons: an amber "F" on graphite, in the app style.
 * The F is drawn as vector rects so no font is required. Run once with:
 *   npx tsx scripts/generate-icons.ts
 * Outputs to public/. Re-run only if the mark changes.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const BG = '#0B0D10'; // --bg-app
const AMBER = '#FFB000'; // --accent
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/**
 * Build the icon SVG at a 512 viewBox. `inset` scales the F down and centres it,
 * leaving padding for the maskable safe zone.
 */
function iconSvg(inset: number, rounded: boolean): string {
  // F geometry within a 512 box before insetting.
  const stemX = 176;
  const stemW = 76;
  const topY = 120;
  const armW = 172;
  const barH = 64;
  const midY = 224;
  const midW = 132;
  const bottom = 392;
  const stemH = bottom - topY;

  const scale = 1 - inset * 2;
  const tx = 256 - 256 * scale;
  const rx = rounded ? 96 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="0" y="0" width="512" height="512" rx="${rx}" fill="${BG}"/>
  <g transform="translate(${tx},${tx}) scale(${scale})">
    <rect x="${stemX}" y="${topY}" width="${stemW}" height="${stemH}" fill="${AMBER}"/>
    <rect x="${stemX}" y="${topY}" width="${armW}" height="${barH}" fill="${AMBER}"/>
    <rect x="${stemX}" y="${midY}" width="${midW}" height="${barH - 4}" fill="${AMBER}"/>
  </g>
</svg>`;
}

function render(svg: string, size: number): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

const full = iconSvg(0, false);
const maskable = iconSvg(0.12, false); // extra padding for the maskable safe zone
const apple = iconSvg(0.06, false); // iOS shows on a rounded tile; small inset

const outputs: Array<[string, Buffer | string]> = [
  ['icon-192.png', render(full, 192)],
  ['icon-512.png', render(full, 512)],
  ['icon-512-maskable.png', render(maskable, 512)],
  ['apple-touch-icon.png', render(apple, 180)],
  ['favicon.svg', iconSvg(0, true)],
];

for (const [name, data] of outputs) {
  writeFileSync(join(publicDir, name), data);
  console.log(`wrote public/${name}`);
}
