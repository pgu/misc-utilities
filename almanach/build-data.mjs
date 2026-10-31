// Récupère les jours fériés et vacances scolaires et écrit almanach/data.js.
// Usage : node almanach/build-data.mjs   (Node 20+, accès réseau)
//
// Sources (ouvertes, sans clé) :
//   FR fériés      calendrier.api.gouv.fr                      (Licence Ouverte)
//   FR scolaire    data.education.gouv.fr / fr-en-calendrier-scolaire (Licence Ouverte v2.0)
//   DE ES IT fériés  date.nager.at                              (MIT)
//   GB fériés      gov.uk/bank-holidays.json                    (Open Government Licence)
//   DE scolaire    openholidaysapi.org                          (ODbL)
//
// Si une source échoue, on réutilise les données précédentes de data.js pour ce pays/cette année
// et l'erreur est consignée dans `errors` (affichée dans l'app).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "data.js");
const NOW = new Date();
const Y = NOW.getUTCFullYear();
const YEARS = [Y - 1, Y, Y + 1, Y + 2];
const FIRST = `${YEARS[0]}-01-01`, LAST = `${YEARS.at(-1)}-12-31`;

const prev = (() => {
  try { return JSON.parse(readFileSync(OUT, "utf8").replace(/^[^{]*/, "").replace(/;\s*$/, "")); } catch { return null; }
})();
const errors = [];

async function getJson(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { last = e; await new Promise((r) => setTimeout(r, 1000 * (i + 1))); }
  }
  throw new Error(`${url} : ${last.message}`);
}

const byDate = (a, b) => (a.d || a.s).localeCompare(b.d || b.s);
const addDays = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const parisDate = (ts) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts));

// Région → nom français (affichage).
const REGIONS = {
  FR: { public: { AM: "Alsace-Moselle" }, school: { A: "Zone A", B: "Zone B", C: "Zone C" } },
  DE: { both: { BB: "Brandebourg", BE: "Berlin", BW: "Bade-Wurtemberg", BY: "Bavière", HB: "Brême", HE: "Hesse", HH: "Hambourg", MV: "Mecklembourg-Poméranie-Occidentale", NI: "Basse-Saxe", NW: "Rhénanie-du-Nord-Westphalie", RP: "Rhénanie-Palatinat", SH: "Schleswig-Holstein", SL: "Sarre", SN: "Saxe", ST: "Saxe-Anhalt", TH: "Thuringe" } },
  ES: { both: { AN: "Andalousie", AR: "Aragon", AS: "Asturies", CB: "Cantabrie", CL: "Castille-et-León", CM: "Castille-La Manche", CN: "Îles Canaries", CT: "Catalogne", EX: "Estrémadure", GA: "Galice", IB: "Îles Baléares", MC: "Murcie", MD: "Madrid", NC: "Navarre", PV: "Pays basque", RI: "La Rioja", VC: "Communauté valencienne" } },
  IT: { both: { 32: "Trentin-Haut-Adige" } },
  GB: { both: { EAW: "Angleterre et pays de Galles", SCT: "Écosse", NIR: "Irlande du Nord" } },
};
const COUNTRIES = {
  FR: { name: "France", flag: "🇫🇷" }, DE: { name: "Allemagne", flag: "🇩🇪" }, ES: { name: "Espagne", flag: "🇪🇸" },
  IT: { name: "Italie", flag: "🇮🇹" }, GB: { name: "Royaume-Uni", flag: "🇬🇧" },
};

function reuse(cc, kind, year) {
  const old = prev?.countries?.[cc]?.[kind] || [];
  return kind === "public" ? old.filter((h) => h.d.startsWith(String(year))) : old;
}
const tooFew = (list, min) => { if (list.length < min) throw new Error(`seulement ${list.length} entrées (attendu ≥ ${min})`); return list; };

// ---------- jours fériés ----------
async function publicFR(year) {
  const [metro, am] = await Promise.all([
    getJson(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`),
    getJson(`https://calendrier.api.gouv.fr/jours-feries/alsace-moselle/${year}.json`),
  ]);
  const out = Object.entries(metro).map(([d, n]) => ({ d, n, en: n }));
  Object.entries(am).filter(([d]) => !(d in metro)).forEach(([d, n]) => out.push({ d, n, en: n, r: ["AM"] }));
  return tooFew(out, 9);
}
async function publicNager(cc, year) {
  const list = await getJson(`https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`);
  const out = list.filter((h) => (h.types || []).includes("Public")).map((h) => {
    const o = { d: h.date, n: h.localName, en: h.name };
    if (h.counties?.length) o.r = h.counties.map((c) => c.replace(/^[A-Z]{2}-/, ""));
    return o;
  });
  return tooFew(out, 5);
}
let govUk;
async function publicGB(year) {
  govUk ||= await getJson("https://www.gov.uk/bank-holidays.json");
  const nations = { "england-and-wales": "EAW", scotland: "SCT", "northern-ireland": "NIR" };
  const map = new Map();
  for (const [key, code] of Object.entries(nations)) {
    for (const e of govUk[key].events.filter((e) => e.date.startsWith(String(year)))) {
      const k = `${e.date}|${e.title}`;
      map.set(k, [...(map.get(k) || []), code]);
    }
  }
  const out = [...map].map(([k, codes]) => {
    const [d, n] = k.split("|");
    const o = { d, n, en: n };
    if (codes.length < 3) o.r = codes;
    return o;
  });
  return tooFew(out, 6);
}
const PUBLIC = { FR: publicFR, DE: (y) => publicNager("DE", y), ES: (y) => publicNager("ES", y), IT: (y) => publicNager("IT", y), GB: publicGB };

// ---------- vacances scolaires ----------
const typeFR = (d) => /toussaint/i.test(d) ? "toussaint" : /no[eë]l/i.test(d) ? "noel" : /hiver/i.test(d) ? "hiver" : /printemps/i.test(d) ? "printemps" : /[ée]t[ée]/i.test(d) ? "ete" : /pont/i.test(d) ? "pont" : null;
const typeDE = (n) => /summer/i.test(n) ? "ete" : /autumn/i.test(n) ? "automne" : /christmas/i.test(n) ? "noel" : /easter/i.test(n) ? "paques" : /pentecost/i.test(n) ? "pentecote" : /winter|mid-year|carnival/i.test(n) ? "hiver" : /spring/i.test(n) ? "printemps" : "autre";

function mergeRegions(items) {
  const m = new Map();
  for (const it of items) {
    const k = `${it.t}|${it.n || ""}|${it.s}|${it.e}`;
    const cur = m.get(k) || { ...it, r: [] };
    cur.r = [...new Set([...cur.r, ...(it.r || [])])].sort();
    m.set(k, cur);
  }
  return [...m.values()].map((it) => (it.r.length ? it : (delete it.r, it))).sort(byDate);
}

async function schoolFR() {
  const schoolYears = [...new Set(YEARS.flatMap((y) => [`${y - 1}-${y}`, `${y}-${y + 1}`]))];
  const where = `(zones="Zone A" or zones="Zone B" or zones="Zone C") and (${schoolYears.map((s) => `annee_scolaire="${s}"`).join(" or ")})`;
  const rows = [];
  for (let offset = 0; ; offset += 100) {
    const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?select=description,start_date,end_date,zones&where=${encodeURIComponent(where)}&limit=100&offset=${offset}`;
    const page = (await getJson(url)).results;
    rows.push(...page);
    if (page.length < 100) break;
  }
  // Une ligne par académie : on ne garde qu'une variante par (zone, type, début) — la fin la plus tardive (date de reprise des élèves).
  const best = new Map();
  for (const r of rows) {
    const t = typeFR(r.description);
    if (!t || !/^vacances|^pont/i.test(r.description)) continue;
    const zone = r.zones.replace("Zone ", "");
    const s = parisDate(r.start_date), reprise = parisDate(r.end_date);
    const e = reprise === s ? s : addDays(reprise, -1); // end_date = jour de reprise (exclu), sauf pour un pont d'un jour
    const k = `${zone}|${t}|${s}`;
    if (!best.has(k) || best.get(k).e < e) best.set(k, { t, s, e, r: [zone] });
  }
  const out = mergeRegions([...best.values()].filter((h) => h.e >= FIRST && h.s <= LAST));
  return tooFew(out, 20);
}
async function schoolDE() {
  const seen = new Map();
  for (const y of YEARS) {
    const list = await getJson(`https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DE&validFrom=${y}-01-01&validTo=${y}-12-31&languageIsoCode=EN`);
    list.forEach((h) => seen.set(h.id, h));
  }
  const out = mergeRegions([...seen.values()].map((h) => {
    const name = h.name[0].text;
    const t = typeDE(name);
    const it = { t, s: h.startDate, e: h.endDate };
    if (t === "autre") it.n = name;
    if (!h.nationwide) it.r = (h.subdivisions || []).map((s) => s.code.replace(/^DE-/, ""));
    return it;
  }).filter((h) => h.e >= FIRST && h.s <= LAST));
  return tooFew(out, 30);
}
const SCHOOL = { FR: schoolFR, DE: schoolDE };

// Académies par zone (pour le rappel « quelle zone ? »).
async function academiesFR() {
  const where = `(zones="Zone A" or zones="Zone B" or zones="Zone C") and annee_scolaire="${Y}-${Y + 1}"`;
  const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?select=zones,location&group_by=zones,location&where=${encodeURIComponent(where)}&order_by=location&limit=100`;
  const out = { A: [], B: [], C: [] };
  (await getJson(url)).results.forEach((r) => out[r.zones.replace("Zone ", "")]?.push(r.location));
  if (Object.values(out).some((l) => !l.length)) throw new Error("liste d'académies incomplète");
  return out;
}

// ---------- assemblage ----------
const countries = {};
for (const [cc, meta] of Object.entries(COUNTRIES)) {
  const pub = [];
  for (const y of YEARS) {
    try { pub.push(...await PUBLIC[cc](y)); }
    catch (e) { errors.push({ scope: `${cc} fériés ${y}`, message: e.message, reused: true }); pub.push(...reuse(cc, "public", y)); }
  }
  let school = [], schoolNote = "Vacances scolaires non disponibles pour ce pays (prévu plus tard).";
  if (SCHOOL[cc]) {
    schoolNote = "";
    try { school = await SCHOOL[cc](); }
    catch (e) { errors.push({ scope: `${cc} vacances scolaires`, message: e.message, reused: true }); school = reuse(cc, "school"); }
  }
  const regions = REGIONS[cc];
  let academies;
  if (cc === "FR") {
    try { academies = await academiesFR(); }
    catch (e) { errors.push({ scope: "FR académies", message: e.message, reused: true }); academies = prev?.countries?.FR?.academies; }
  }
  countries[cc] = {
    ...meta,
    regions: { public: { ...(regions.both || {}), ...(regions.public || {}) }, school: { ...(regions.both || {}), ...(regions.school || {}) } },
    schoolNote,
    ...(academies ? { academies } : {}),
    public: pub.sort(byDate),
    school,
  };
  console.log(`${cc}: ${pub.length} jours fériés, ${school.length} périodes scolaires`);
}

const data = { generated: NOW.toISOString(), years: YEARS, errors, countries };
// On évite de réécrire (et de redéclencher un déploiement) si seules les données ont inchangé.
const strip = (o) => JSON.stringify({ ...o, generated: undefined });
if (prev && strip(prev) === strip(data) && existsSync(OUT)) { console.log("Aucun changement."); process.exit(0); }
writeFileSync(OUT, "// Généré par build-data.mjs — ne pas éditer à la main.\nconst ALMANACH = " + JSON.stringify(data, null, 0) + ";\n");
console.log(`data.js écrit (${errors.length} erreur(s)).`);
if (errors.length) errors.forEach((e) => console.warn("⚠", e.scope, "—", e.message));
