import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd(), "public");
const source = resolve(root, "favicon.svg");
const svg = readFileSync(source);
const sizes = [16, 48, 128];

for (const size of sizes) {
  const out = resolve(root, `icon-${size}.png`);
  await sharp(svg, { density: Math.max(72, size * 6) })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}
