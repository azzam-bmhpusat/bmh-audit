import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const scanDirs = ["app", "components"];
const excludeDirs = [path.join("components", "ui")];

// 1. Tag mentah HTML
const rawTagRegex = /<(button|input|select|textarea|table|thead|tbody|tr|td|th)[\s>/]/;

// 2. Palet warna Tailwind & hex
const colorPrefixes = "bg|text|border|ring|fill|stroke|divide|from|to|via";
const colorNames = "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
const paletteClassRegex = new RegExp(`\\b(?:${colorPrefixes})-(?:${colorNames})-\\d+\\b`);
const whiteBlackClassRegex = new RegExp(`\\b(?:bg|text|border)-(?:white|black)\\b`);
const hexColorRegex = /#(?:[0-9a-fA-F]{3,8})\b/;

// 3. dark: modifier
const darkModeRegex = /\bdark:/;

// 4. destructive (warning if outside Alert)
const destructiveRegex = /\bdestructive\b/;

function getFiles(dir) {
  const fullDir = path.join(rootDir, dir);
  if (!fs.existsSync(fullDir)) return [];

  const results = [];
  function walk(current) {
    const relative = path.relative(rootDir, current);
    if (excludeDirs.some((ex) => relative === ex || relative.startsWith(ex + path.sep))) {
      return;
    }
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(tsx|ts|jsx|js|mjs)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(fullDir);
  return results;
}

let hasErrors = false;
let warningCount = 0;

for (const dir of scanDirs) {
  const files = getFiles(dir);

  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // Check raw tags
      const rawMatch = line.match(rawTagRegex);
      if (rawMatch) {
        console.error(`[ERROR] ${relPath}:${lineNum} - Dilarang memakai tag HTML mentah: <${rawMatch[1]}>`);
        hasErrors = true;
      }

      // Check palette colors
      const paletteMatch = line.match(paletteClassRegex);
      if (paletteMatch) {
        console.error(`[ERROR] ${relPath}:${lineNum} - Dilarang memakai kelas palet Tailwind: ${paletteMatch[0]}`);
        hasErrors = true;
      }

      // Check white/black hardcode
      const wbMatch = line.match(whiteBlackClassRegex);
      if (wbMatch) {
        console.error(`[ERROR] ${relPath}:${lineNum} - Dilarang memakai kelas white/black: ${wbMatch[0]}`);
        hasErrors = true;
      }

      // Check hex colors
      const hexMatch = line.match(hexColorRegex);
      if (hexMatch) {
        console.error(`[ERROR] ${relPath}:${lineNum} - Dilarang memakai nilai hex warna: ${hexMatch[0]}`);
        hasErrors = true;
      }

      // Check dark:
      if (darkModeRegex.test(line)) {
        console.error(`[ERROR] ${relPath}:${lineNum} - Dilarang memakai modifier 'dark:'`);
        hasErrors = true;
      }

      // Pengecualian semantik: destructive diizinkan pada Alert, Button, DropdownMenuItem, dan token kelas semantik
      if (destructiveRegex.test(line)) {
        const isAllowedDestructive =
          line.includes("Alert") ||
          line.includes("Button") ||
          line.includes("DropdownMenuItem") ||
          line.includes("variant=\"destructive\"") ||
          line.includes("variant='destructive'") ||
          line.includes("text-destructive") ||
          line.includes("bg-destructive") ||
          line.includes("border-destructive");

        if (!isAllowedDestructive) {
          console.warn(`[WARNING] ${relPath}:${lineNum} - Kata 'destructive' ditemukan di luar komponen yang diizinkan: "${line.trim()}"`);
          warningCount++;
        }
      }
    });
  }
}

if (hasErrors) {
  console.error("\n❌ check:design GAGAL: Ditemukan pelanggaran aturan desain.");
  process.exit(1);
} else {
  console.log(`\n✅ check:design LULUS: Tidak ada pelanggaran desain. (${warningCount} peringatan destructive untuk ditinjau manual)`);
}

