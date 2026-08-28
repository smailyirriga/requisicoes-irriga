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

// Ícone "any": logo preenchendo o quadrado, fundo branco (iOS não gosta de transparência)
async function iconeAny(size) {
  const base = sharp(origem).resize(size, size, {
    fit: "cover",
    position: "center",
  });
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: await base.png().toBuffer() }])
    .png()
    .toFile(path.join(dir, `icon-${size}.png`));
  console.log("gerado icon-" + size + ".png");
}

// Ícone "maskable": logo menor, centralizado, com margem de segurança
async function iconeMaskable(size) {
  const inner = Math.round(size * 0.72);
  const logo = await sharp(origem)
    .resize(inner, inner, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
  const off = Math.round((size - inner) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: logo, top: off, left: off }])
    .png()
    .toFile(path.join(dir, `icon-maskable-${size}.png`));
  console.log("gerado icon-maskable-" + size + ".png");
}

// favicon
async function favicon() {
  await sharp(origem)
    .resize(48, 48, { fit: "cover" })
    .png()
    .toFile(path.join(RAIZ, "src", "app", "icon.png"));
  console.log("gerado src/app/icon.png (favicon)");
}

await iconeAny(192);
await iconeAny(512);
await iconeMaskable(512);
await favicon();
console.log("\nOK — rode 'git add -A && git commit' e 'git push' para publicar.");
