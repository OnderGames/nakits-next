const OTOMOBIL_MARKA_MODELS = {
  citroen: [
    ["ami", "AMI"],
    ["c-elysee", "C-Elysée"],
    ["c1", "C1"],
    ["c2", "C2"],
    ["c3", "C3"],
    ["e-c3", "e-C3"],
    ["c3-picasso", "C3 Picasso"],
    ["c4", "C4"],
    ["c4-grand-picasso", "C4 Grand Picasso"],
    ["c4-picasso", "C4 Picasso"],
    ["c4-x", "C4 X"],
    ["e-c4", "e-C4"],
    ["e-c4-x", "e-C4 X"],
    ["c5", "C5"],
    ["c6", "C6"],
    ["c8", "C8"],
    ["saxo", "Saxo"],
    ["xsara", "Xsara"],
    ["bx", "BX"],
    ["xantia", "Xantia"],
    ["xm", "XM"],
    ["zx", "ZX"]
  ],
  fiat: [
    ["124-spider", "124 Spider"],
    ["albea", "Albea"],
    ["brava", "Brava"],
    ["bravo", "Bravo"],
    ["126-bis", "126 Bis"],
    ["coupe", "Coupe"],
    ["croma", "Croma"],
    ["500-ailesi", "500 Ailesi"],
    ["egea", "Egea"],
    ["idea", "Idea"],
    ["linea", "Linea"],
    ["marea", "Marea"],
    ["mirafiori", "Mirafiori"],
    ["palio", "Palio"],
    ["panda", "Panda"],
    ["punto", "Punto"],
    ["siena", "Siena"],
    ["stilo", "Stilo"],
    ["tempra", "Tempra"],
    ["tipo", "Tipo"],
    ["topolino", "Topolino"],
    ["ulysse", "Ulysse"],
    ["uno", "UNO"]
  ],
  ford: [
    ["b-max", "B-Max"],
    ["c-max", "C-Max"],
    ["escort", "Escort"],
    ["fiesta", "Fiesta"],
    ["focus", "Focus"],
    ["fusion", "Fusion"],
    ["galaxy", "Galaxy"],
    ["grand-c-max", "Grand C-Max"],
    ["ka", "Ka"],
    ["mondeo", "Mondeo"],
    ["mustang", "Mustang"],
    ["s-max", "S-Max"],
    ["taurus", "Taurus"],
    ["cougar", "Cougar"],
    ["festiva", "Festiva"],
    ["granada", "Granada"],
    ["orion", "Orion"],
    ["probe", "Probe"],
    ["scorpio", "Scorpio"],
    ["sierra", "Sierra"],
    ["taunus", "Taunus"],
    ["thunderbird", "Thunderbird"]
  ],
  hyundai: [
    ["accent", "Accent"],
    ["accent-blue", "Accent Blue"],
    ["accent-era", "Accent Era"],
    ["atos", "Atos"],
    ["centennial", "Centennial"],
    ["coupe", "Coupe"],
    ["elantra", "Elantra"],
    ["excel", "Excel"],
    ["genesis", "Genesis"],
    ["getz", "Getz"],
    ["grandeur", "Grandeur"],
    ["i10", "i10"],
    ["i20", "i20"],
    ["i20-active", "i20 Active"],
    ["i20-n", "i20 N"],
    ["i30", "i30"],
    ["i40", "i40"],
    ["ioniq", "Ioniq"],
    ["ioniq-6", "Ioniq 6"],
    ["ix20", "iX20"],
    ["matrix", "Matrix"],
    ["s-coupe", "S-Coupe"],
    ["sonata", "Sonata"],
    ["trajet", "Trajet"]
  ],
  opel: [
    ["adam", "Adam"],
    ["agila", "Agila"],
    ["ascona", "Ascona"],
    ["astra", "Astra"],
    ["astra-e", "Astra-e"],
    ["calibra", "Calibra"],
    ["cascada", "Cascada"],
    ["corsa", "Corsa"],
    ["corsa-e", "Corsa-e"],
    ["gt-roadster", "GT (Roadster)"],
    ["insignia", "Insignia"],
    ["kadett", "Kadett"],
    ["manta", "Manta"],
    ["meriva", "Meriva"],
    ["omega", "Omega"],
    ["rekord", "Rekord"],
    ["signum", "Signum"],
    ["tigra", "Tigra"],
    ["vectra", "Vectra"],
    ["zafira", "Zafira"]
  ]
};
const brandNames = {
  citroen: "Citroën",
  fiat: "Fiat",
  ford: "Ford",
  hyundai: "Hyundai",
  opel: "Opel"
};
const rows = [];
for (const [brand, models] of Object.entries(OTOMOBIL_MARKA_MODELS)) {
  const bn = brandNames[brand];
  for (const [slug, name] of models) {
    const label = `Otomobil › ${bn} › ${name}`.replace(/'/g, "''");
    rows.push(
      `  ('tasitlar_otomobil-${brand}-${slug}', '${label}')`
    );
  }
}
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "sql", "migration_otomobil_modeller_batch2.sql");
const body = [
  "-- Citroën, Fiat, Ford, Hyundai, Opel modelleri (lib/categories.ts OTOMOBIL_MARKA_MODELS).",
  "insert into categories (slug, name)",
  "values",
  rows.join(",\n"),
  "on conflict (slug) do nothing;",
  ""
].join("\n");
fs.writeFileSync(out, body, "utf8");
console.error("Wrote", out);
