/**
 * Bir kez çalıştır: node scripts/generate-turkey-districts.mjs
 * Kaynak: https://api.turkiyeapi.dev/v1/provinces
 */
import fs from "fs";
import https from "https";

const url = "https://api.turkiyeapi.dev/v1/provinces";

function get(urlString) {
  return new Promise((resolve, reject) => {
    https
      .get(urlString, (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

const j = await get(url);
if (j.status !== "OK" || !Array.isArray(j.data)) {
  console.error("Beklenmeyen API yanıtı");
  process.exit(1);
}

/** @type {Record<string, string[]>} */
const out = {};
for (const p of j.data) {
  const name = p.name;
  const districts = (p.districts ?? [])
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "tr"));
  out[name] = districts;
}

const dir = new URL("../lib/data/", import.meta.url);
fs.mkdirSync(dir, { recursive: true });
const target = new URL("../lib/data/turkey-districts.json", import.meta.url);
fs.writeFileSync(target, JSON.stringify(out));
console.log("Yazıldı:", target.pathname, Object.keys(out).length, "il");
