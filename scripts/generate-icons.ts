import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT_DIR = "public/icons";
mkdirSync(OUT_DIR, { recursive: true });

const PRIMARY = "#0e8983";

// Standard icon: pin fills most of the canvas.
const standardSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="${PRIMARY}"/>
  <path d="M256 96c-61 0-110 49-110 110 0 82 110 210 110 210s110-128 110-210c0-61-49-110-110-110z" fill="#ffffff"/>
  <circle cx="256" cy="206" r="56" fill="${PRIMARY}"/>
  <path d="M228 206l20 20 40-44" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
`;

// Maskable icon: same mark, but shrunk into the ~80% "safe zone" some OSes crop to.
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${PRIMARY}"/>
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">
    <path d="M256 96c-61 0-110 49-110 110 0 82 110 210 110 210s110-128 110-210c0-61-49-110-110-110z" fill="#ffffff"/>
    <circle cx="256" cy="206" r="56" fill="${PRIMARY}"/>
    <path d="M228 206l20 20 40-44" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;

async function render(svg: string, size: number, filename: string) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${OUT_DIR}/${filename}`);
  console.log(`wrote ${OUT_DIR}/${filename}`);
}

await render(standardSvg, 512, "icon-512.png");
await render(standardSvg, 192, "icon-192.png");
await render(standardSvg, 180, "apple-touch-icon.png");
await render(standardSvg, 32, "favicon-32.png");
await render(maskableSvg, 512, "icon-512-maskable.png");
await render(maskableSvg, 192, "icon-192-maskable.png");

console.log("Done.");
