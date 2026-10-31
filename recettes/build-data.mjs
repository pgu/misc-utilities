// Convertit resources/*.csv en recettes/data.js.  Usage : node recettes/build-data.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvName = readdirSync(join(root, "resources")).find((f) => f.endsWith(".csv"));
const text = readFileSync(join(root, "resources", csvName), "utf8");

// Parseur CSV minimal (guillemets, retours à la ligne dans les cellules).
function parse(t) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const clean = (s) => s.replace(/\s+/g, " ").trim();
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const rows = parse(text).filter((r) => r.some((c) => c.trim() !== ""));
const [header, ...body] = rows;
const recettes = header.slice(1).map((h) => ({ id: slug(clean(h)), nom: clean(h), ing: {}, meta: {} }));

const META = { "Température": "temp", "Four": "four", "Cuisson": "cuisson" };
// Catégorie et unité par défaut quand le CSV ne les précise pas.
const CAT = { farine: "farine", sarrasin: "farine", mais: "farine", avoine: "farine", yaourt: "liquide", oeufs: "base", eau: "liquide", lait: "liquide", creme_fraiche: "liquide", beurre: "gras", huile: "gras", levure_chimique: "levant", levure_de_boulanger: "levant", sel: "assaisonnement", moutarde: "assaisonnement", vinaigre_ou_citron: "assaisonnement", ail: "assaisonnement", muscade: "assaisonnement", sucre: "sucre", sucre_vanille: "sucre", chocolat: "sucre", chorizo: "garniture", gruyere: "garniture", fruits: "garniture" };
const UNITE = { oeufs: "" };
const ingredients = [];
// Noms anglais, affichés via le sélecteur de langue de l'app.
const EN_ING = { farine: "wheat flour", sarrasin: "buckwheat flour", mais: "corn flour (masa harina)", avoine: "oats", yaourt: "yogurt", oeufs: "eggs", eau: "water", lait: "milk", creme_fraiche: "crème fraîche (sour cream)", beurre: "butter", huile: "oil", levure_chimique: "baking powder", levure_de_boulanger: "yeast", sel: "salt", sucre: "sugar", sucre_vanille: "vanilla sugar", chocolat: "chocolate", chorizo: "chorizo", gruyere: "Gruyère cheese", fruits: "fruit", moutarde: "mustard", vinaigre_ou_citron: "vinegar or lemon", ail: "garlic", muscade: "nutmeg" };
const EN_REC = { crepes: "Crêpes", pancakes: "Pancakes", "pancakes-avoine": "Oat pancakes", gaufres: "Waffles", donut: "Doughnut", churros: "Churros", bottereaux: "Bottereaux (Nantes fritters)", "gateau-yaourt": "Yogurt cake", "fondant-au-chocolat": "Chocolate fondant cake", "cake-sale-chorizo": "Savory loaf cake (chorizo)", "galettes-de-ble-noir": "Buckwheat galettes", "tortillas-de-mais": "Corn tortillas", empanadillas: "Empanadillas (empanada dough)", "sauce-bechamel": "Béchamel sauce", mayonnaise: "Mayonnaise", "pate-brisee": "Shortcrust pastry", "pate-feuilletee": "Puff pastry", "pate-a-pizza": "Pizza dough", "pate-a-choux": "Choux pastry", gougeres: "Gougères (cheese puffs)", "quatre-quarts": "Pound cake", madeleines: "Madeleines", "far-breton": "Far breton (Breton flan)", clafoutis: "Clafoutis", "yorkshire-pudding": "Yorkshire pudding", blinis: "Blinis", brioche: "Brioche", "gache-vendeenne": "Gâche vendéenne (Vendée brioche)", naan: "Naan", "tortillas-de-ble": "Flour tortillas", "pate-sablee": "Sweet shortcrust (pâte sablée)", "sauce-mornay": "Mornay (cheese) sauce", aioli: "Aïoli", hollandaise: "Hollandaise sauce" };


for (const r of body) {
  const lines = r[0].split("\n").map((l) => l.trim()).filter(Boolean);
  const m = lines[0].match(/^(.*?)\s*\((.*)\)\s*$/);
  const nom = clean(m ? m[1] : lines[0]);
  const unite = m ? m[2] : "";
  const metaKey = META[nom];
  if (metaKey) {
    recettes.forEach((rec, i) => { const v = (r[i + 1] || "").trim(); if (v) rec.meta[metaKey] = isNaN(+v) ? v : +v; });
    continue;
  }
  const id = slug(nom).replace(/-/g, "_");
  const key = id.startsWith("farine_ble") ? "farine" : id.startsWith("farine_") ? id.slice(7) : id;
  ingredients.push({ id: key, nom: nom.replace(/^Oeufs$/, "Œufs").replace(/^Gruyere$/, "Gruyère").replace(/^Farine (.*)$/, "Farine de $1").replace(/ Blé$/, " blé").replace(/ Sarrasin$/, " sarrasin").replace(/ Maïs$/, " maïs").replace(/de Blé/, "de blé").replace(/de Sarrasin/, "de sarrasin").replace(/de Maïs/, "de maïs"), unite: unite || UNITE[key] || "", note: lines.slice(1).join(" · "), cat: CAT[key] || "autre" });
  recettes.forEach((rec, i) => { const v = parseFloat((r[i + 1] || "").replace(",", ".")); if (!isNaN(v)) rec.ing[key] = v; });
}

ingredients.forEach((i) => { i.en = EN_ING[i.id] || (console.warn("EN manquant :", i.id), i.nom); });
recettes.forEach((r) => { r.en = EN_REC[r.id] || (console.warn("EN manquant :", r.id), r.nom); });

writeFileSync(join(root, "recettes", "data.js"),
  "// Généré par build-data.mjs à partir de resources/*.csv — ne pas éditer à la main.\n" +
  "const DONNEES = " + JSON.stringify({ ingredients, recettes }, null, 1) + ";\n");
console.log(`${recettes.length} recettes, ${ingredients.length} ingrédients`);
