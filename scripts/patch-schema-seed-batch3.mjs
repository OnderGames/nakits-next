import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const oldBlock = `  ('tasitlar_otomobil-peugeot', 'Otomobil › Peugeot'),
  ('tasitlar_otomobil-renault', 'Otomobil › Renault'),
  ('tasitlar_otomobil-skoda', 'Otomobil › Skoda'),
  ('tasitlar_otomobil-togg', 'Otomobil › TOGG'),
  ('tasitlar_otomobil-toyota', 'Otomobil › Toyota'),
  ('tasitlar_otomobil-tofas', 'Otomobil › Tofaş'),
  ('tasitlar_otomobil-volkswagen', 'Otomobil › Volkswagen'),`;

const neu = fs.readFileSync(
  path.join(__dirname, "_schema_batch3_block.txt"),
  "utf8"
);

function replaceBlock(fileRel, oldLF, replacementLF) {
  const p = path.join(root, fileRel);
  let s = fs.readFileSync(p, "utf8");
  const oldCRLF = oldLF.replace(/\n/g, "\r\n");
  const replacementCRLF = replacementLF.replace(/\n/g, "\r\n");
  if (s.includes(oldLF)) {
    s = s.replace(oldLF, replacementLF);
  } else if (s.includes(oldCRLF)) {
    s = s.replace(oldCRLF, replacementCRLF);
  } else {
    console.error("Missing block in", fileRel);
    process.exit(1);
  }
  fs.writeFileSync(p, s, "utf8");
  console.error("Patched", fileRel);
}

replaceBlock("schema.sql", oldBlock, neu);
replaceBlock("sql/seed_categories.sql", oldBlock, neu);
