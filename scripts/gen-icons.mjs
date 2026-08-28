// Gera os ícones do PWA a partir de logo.png (na raiz do projeto).
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const origem = path.join(RAIZ, "logo.png");
if (!fs.existsSync(origem)) {
  console.error("logo.png não encontrado na raiz do projeto.");
  process.exit(1);
}

const dir = path.join(RAIZ, "public", "icons");
fs.mkdirSync(dir, { recursive: true });

// Remove qualquer borda/transparência ao redor do desenho.
async function logoRecortada() {
  return sharp(origem).trim({ threshold: 10 }).png().toBuffer();
}

// Ícone "any": desenho preenchendo TODO o quadrado (full-bleed).
async function iconeAny(size) {
  const recortada = await logoRecortada();
  await sharp(recortada)
    .resize(size, size, { fit: "cover", position: "center" })
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(path.join(dir, `icon-${size}.png`));
  console.log("gerado icon-" + size + ".png");
}

// Ícone "maskable": mesma arte, leve margem para a zona de segurança do Android.
async function iconeMaskable(size) {
  const recortada = await logoRecortada();
  const inner = Math.round(size * 0.86);
  const arte = await sharp(recortada)
    .resize(inner, inner, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
  const off = Math.round((size - inner) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: arte, top: off, left: off }])
    .png()
    .toFile(path.join(dir, `icon-maskable-${size}.png`));
  console.log("gerado icon-maskable-" + size + ".png");
}

async function favicon() {
  const recortada = await logoRecortada();
  await sharp(recortada)
    .resize(64, 64, { fit: "cover" })
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(path.join(RAIZ, "src", "app", "icon.png"));
  console.log("gerado src/app/icon.png (favicon)");
}

await iconeAny(192);
await iconeAny(512);
await iconeMaskable(512);
await favicon();
console.log("\nOK — rode 'git add -A && git commit' e 'git push' para publicar.");
