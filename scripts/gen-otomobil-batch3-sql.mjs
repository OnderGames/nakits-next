/**
 * lib/categories.ts OTOMOBIL_MARKA_MODELS ile uyumlu (Peugeot … VW batch).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BN = {
  peugeot: "Peugeot",
  renault: "Renault",
  skoda: "Skoda",
  togg: "TOGG",
  toyota: "Toyota",
  tofas: "Tofaş",
  volkswagen: "Volkswagen"
};

const MODELS = {
  peugeot: [
    ["106", "106"],
    ["107", "107"],
    ["205", "205"],
    ["206", "206"],
    ["206-plus", "206 +"],
    ["207", "207"],
    ["208", "208"],
    ["e-208", "e-208"],
    ["301", "301"],
    ["305", "305"],
    ["306", "306"],
    ["307", "307"],
    ["308", "308"],
    ["e-308", "e-308"],
    ["405", "405"],
    ["406", "406"],
    ["407", "407"],
    ["508", "508"],
    ["605", "605"],
    ["607", "607"],
    ["807", "807"],
    ["pars", "Pars"],
    ["rcz", "RCZ"],
    ["1007", "1007"]
  ],
  renault: [
    ["clio", "Clio"],
    ["espace", "Espace"],
    ["fluence", "Fluence"],
    ["fluence-ze", "Fluence Z.E."],
    ["grand-scenic", "Grand Scenic"],
    ["grand-modus", "Grand Modüs"],
    ["laguna", "Laguna"],
    ["latitude", "Latitude"],
    ["megane", "Megane"],
    ["megane-e-tech", "Megane E-Tech"],
    ["modus", "Modus"],
    ["safrane", "Safrane"],
    ["scenic", "Scenic"],
    ["symbol", "Symbol"],
    ["taliant", "Taliant"],
    ["talisman", "Talisman"],
    ["twingo", "Twingo"],
    ["twizy", "Twizy"],
    ["vel-satis", "Vel Satis"],
    ["zoe", "ZOE"],
    ["r5-e-tech", "R5 E-Tech"],
    ["r-5", "R 5"],
    ["r-9", "R 9"],
    ["r-11", "R 11"],
    ["r-12", "R 12"],
    ["r-19", "R 19"],
    ["r-21", "R 21"],
    ["r-25", "R 25"]
  ],
  skoda: [
    ["citigo", "Citigo"],
    ["fabia", "Fabia"],
    ["favorit", "Favorit"],
    ["felicia", "Felicia"],
    ["forman", "Forman"],
    ["octavia", "Octavia"],
    ["rapid", "Rapid"],
    ["roomster", "Roomster"],
    ["scala", "Scala"],
    ["superb", "Superb"]
  ],
  togg: [
    ["t10f", "T10F"],
    ["v1", "V1"],
    ["v2", "V2"]
  ],
  toyota: [
    ["auris", "Auris"],
    ["avensis", "Avensis"],
    ["avalon", "Avalon"],
    ["camry", "Camry"],
    ["carina", "Carina"],
    ["celica", "Celica"],
    ["corolla", "Corolla"],
    ["corona", "Corona"],
    ["cressida", "Cressida"],
    ["gt86", "GT86"],
    ["mr2", "MR2"],
    ["prius", "Prius"],
    ["starlet", "Starlet"],
    ["supra", "Supra"],
    ["tercel", "Tercel"],
    ["urban-cruiser", "Urban Cruiser"],
    ["verso", "Verso"],
    ["yaris", "Yaris"]
  ],
  tofas: [
    ["dogan", "Doğan"],
    ["kartal", "Kartal"],
    ["murat", "Murat"],
    ["sahin", "Şahin"],
    ["serce", "Serçe"]
  ],
  volkswagen: [
    ["arteon", "Arteon"],
    ["beetle", "Beetle"],
    ["bora", "Bora"],
    ["eos", "EOS"],
    ["fox", "FOX"],
    ["golf", "Golf"],
    ["id-3", "ID.3"],
    ["id-7", "ID.7"],
    ["jetta", "Jetta"],
    ["lupo", "Lupo"],
    ["passat", "Passat"],
    ["passat-alltrack", "Passat Alltrack"],
    ["passat-variant", "Passat Variant"],
    ["phaeton", "Phaeton"],
    ["polo", "Polo"],
    ["scirocco", "Scirocco"],
    ["sharan", "Sharan"],
    ["touran", "Touran"],
    ["up-club", "Up Club"],
    ["vw-cc", "VW CC"],
    ["vento", "Vento"]
  ]
};

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

const rows = [];
for (const [brand, pairs] of Object.entries(MODELS)) {
  const brandLabel = BN[brand];
  for (const [slug, name] of pairs) {
    const label = sqlEscape(`Otomobil › ${brandLabel} › ${name}`);
    rows.push(`  ('tasitlar_otomobil-${brand}-${slug}', '${label}')`);
  }
}

const migPath = path.join(__dirname, "..", "sql", "migration_otomobil_modeller_batch3.sql");
const migBody = [
  "-- Peugeot, Renault, Skoda, TOGG, Toyota, Tofaş, Volkswagen modelleri (lib/categories.ts).",
  "insert into categories (slug, name)",
  "values",
  rows.join(",\n"),
  "on conflict (slug) do nothing;",
  ""
].join("\n");
fs.writeFileSync(migPath, migBody, "utf8");

/** Şema/seed: marka satırı + modeller */
const schemaChunks = [];
for (const [brand, pairs] of Object.entries(MODELS)) {
  schemaChunks.push(`  ('tasitlar_otomobil-${brand}', 'Otomobil › ${BN[brand]}'),`);
  for (const [slug, name] of pairs) {
    const label = sqlEscape(`Otomobil › ${BN[brand]} › ${name}`);
    schemaChunks.push(`  ('tasitlar_otomobil-${brand}-${slug}', '${label}'),`);
  }
}

const schemaBlockPath = path.join(__dirname, "_schema_batch3_block.txt");
fs.writeFileSync(schemaBlockPath, schemaChunks.join("\n"), "utf8");

console.error("Wrote", migPath);
console.error("Wrote", schemaBlockPath);
