import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mig = fs.readFileSync(
  path.join(__dirname, "..", "sql", "migration_otomobil_modeller_batch2.sql"),
  "utf8"
);
const lines = mig.split("\n");
const valueLines = lines.filter((l) => l.trim().startsWith("('tasitlar_otomobil"));
const chunks = {
  citroen: [],
  fiat: [],
  ford: [],
  hyundai: [],
  opel: []
};
for (const line of valueLines) {
  const m = line.match(/tasitlar_otomobil-(citroen|fiat|ford|hyundai|opel)-/);
  if (m) chunks[m[1]].push(line);
}
const out = [
  "  ('tasitlar_otomobil-citroen', 'Otomobil › Citroën'),",
  ...chunks.citroen,
  "  ('tasitlar_otomobil-fiat', 'Otomobil › Fiat'),",
  ...chunks.fiat,
  "  ('tasitlar_otomobil-ford', 'Otomobil › Ford'),",
  ...chunks.ford,
  "  ('tasitlar_otomobil-hyundai', 'Otomobil › Hyundai'),",
  ...chunks.hyundai,
  "  ('tasitlar_otomobil-opel', 'Otomobil › Opel'),",
  ...chunks.opel
].join("\n");
fs.writeFileSync(
  path.join(__dirname, "_schema_tasitlar_models_block.txt"),
  out,
  "utf8"
);
console.log(out);
