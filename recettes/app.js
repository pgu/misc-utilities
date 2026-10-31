(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const ING = DONNEES.ingredients;
  const REC = DONNEES.recettes;
  const ing = (id) => ING.find((i) => i.id === id);
  const rec = (id) => REC.find((r) => r.id === id);
  const keys = (r) => Object.keys(r.ing);
  const qty = (id, q) => { const i = ing(id); return `${q}${i.unite ? " " + i.unite : ""}`; };
  const FARINES = ["farine", "sarrasin", "mais", "avoine"];
  // Langue d'affichage des noms : fr | bi (français + anglais) | en
  let lang = store0("lang", "fr");
  function store0(k, d) { try { const v = localStorage.getItem("recettes:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  const nt = (x) => { const fr = x.nom; return lang === "en" ? x.en : lang === "bi" && x.en !== fr ? `${fr} · ${x.en}` : fr; };           // texte brut (SVG, <option>)
  const nm = (x) => { const fr = x.nom; return lang === "en" ? x.en : lang === "bi" && x.en !== fr ? `${fr} <small class="en">${x.en}</small>` : fr; }; // HTML
  const tip = (i) => (lang === "fr" ? [i.en, i.note].filter(Boolean).join(" — ") : i.note || "");
  const CAT_EN = { farine: "Flours", liquide: "Liquids", base: "Eggs", gras: "Fats", levant: "Leavening", assaisonnement: "Seasoning", sucre: "Sugar & chocolate", garniture: "Fillings", autre: "Other" };
  const catObj = (c) => ({ nom: CAT_LABEL[c] || c, en: CAT_EN[c] || c });
  const CAT_LABEL = { farine: "Farines", liquide: "Liquides", base: "Œufs", gras: "Matières grasses", levant: "Levure", assaisonnement: "Assaisonnement", sucre: "Sucre et chocolat", garniture: "Garnitures", autre: "Autres" };

  const store = {
    get(k, d) { try { const v = localStorage.getItem("recettes:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("recettes:" + k, JSON.stringify(v)); } catch (e) { /* indisponible */ } },
  };

  // ---------- similarité ----------
  // Poids d'un ingrédient = rareté : le sel (presque partout) compte peu, le chorizo beaucoup.
  const df = {};
  REC.forEach((r) => keys(r).forEach((k) => (df[k] = (df[k] || 0) + 1)));
  const weight = (k) => Math.log(REC.length / df[k]) + 0.15;
  function similarity(a, b) {
    const A = new Set(keys(a)), B = new Set(keys(b));
    let inter = 0, union = 0;
    new Set([...A, ...B]).forEach((k) => { union += weight(k); if (A.has(k) && B.has(k)) inter += weight(k); });
    return union ? inter / union : 0;
  }
  const SIM = REC.map((a) => REC.map((b) => (a === b ? 1 : similarity(a, b))));
  const idx = (r) => REC.indexOf(r);
  const mainFlour = (r) => (r.ing.sarrasin ? "sarrasin" : r.ing.mais ? "mais" : r.ing.farine ? "farine" : "aucune");
  const FLOUR_LABEL = { farine: { nom: "Farine de blé", en: "Wheat flour" }, sarrasin: { nom: "Sarrasin", en: "Buckwheat" }, mais: { nom: "Maïs", en: "Corn" }, aucune: { nom: "Sans farine", en: "No flour" } };
  const similarTo = (r) => REC.filter((o) => o !== r).map((o) => ({ r: o, s: SIM[idx(r)][idx(o)] })).sort((x, y) => y.s - x.s);

  // ---------- garde-manger ----------
  const BASE = ["farine", "oeufs", "lait", "eau", "beurre", "sel", "sucre", "levure_chimique", "huile"];
  let pantry = new Set(store.get("placard", BASE).filter((id) => ing(id))); // ignore les anciens ids disparus
  const savePantry = () => store.set("placard", [...pantry]);
  const missing = (r) => keys(r).filter((k) => !pantry.has(k));
  const completion = (r) => (keys(r).length - missing(r).length) / keys(r).length;

  function togglePantry(id) {
    pantry.has(id) ? pantry.delete(id) : pantry.add(id);
    savePantry();
    renderPlacard();
    renderReseau();
    renderMatrice();
  }

  function renderPlacard() {
    const cats = [...new Set(ING.map((i) => i.cat))];
    const sorted = [...REC].sort((a, b) => completion(b) - completion(a) || missing(a).length - missing(b).length || a.nom.localeCompare(b.nom, "fr"));
    const ready = REC.filter((r) => !missing(r).length).length;

    // Ingrédient « malin » : combien de recettes devient-il possible de faire en ajoutant UN seul ingrédient ?
    const gain = ING.filter((i) => !pantry.has(i.id)).map((i) => ({
      i,
      unlocks: REC.filter((r) => { const m = missing(r); return m.length === 1 && m[0] === i.id; }),
      near: REC.filter((r) => { const m = missing(r); return m.length === 2 && m.includes(i.id); }).length,
    })).filter((g) => g.unlocks.length || g.near).sort((a, b) => b.unlocks.length - a.unlocks.length || b.near - a.near).slice(0, 5);

    $("#tab-placard").innerHTML = `
      <div class="layout">
        <div>
          <div class="card">
            <h2>Mon garde-manger</h2>
            <p class="hint">Cochez ce que vous avez : les recettes se mettent à jour.</p>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <button class="btn" data-preset="base">Base</button><button class="btn" data-preset="none">Vider</button><button class="btn" data-preset="all">Tout</button>
            </div>
            ${cats.map((c) => `<h3 style="margin-top:.8rem">${nm(catObj(c))}</h3><div class="chips">${ING.filter((i) => i.cat === c).map((i) => `<button class="chip" data-ing="${i.id}" aria-pressed="${pantry.has(i.id)}" title="${tip(i)}">${nm(i)}</button>`).join("")}</div>`).join("")}
          </div>
          <div class="card unlock">
            <h3>🔓 Ce qui débloque le plus</h3>
            ${gain.length ? `<ul>${gain.map((g) => `<li><button class="chip miss" data-ing="${g.i.id}" title="Ajouter à mon garde-manger">+ ${nm(g.i)}</button>${g.unlocks.length ? ` débloque <strong>${g.unlocks.map((r) => nm(r)).join(", ")}</strong>` : ""}${g.near ? ` <small>(+${g.near} presque)</small>` : ""}</li>`).join("")}</ul>` : `<p class="hint">Rien à débloquer avec un seul ingrédient.</p>`}
          </div>
        </div>
        <div>
          <p class="hint"><strong>${ready}</strong> recette${ready > 1 ? "s" : ""} faisable${ready > 1 ? "s" : ""} sur ${REC.length}. Touchez un ingrédient manquant pour l'ajouter.</p>
          <div class="recipes">${sorted.map((r) => {
            const m = missing(r), p = Math.round(completion(r) * 100);
            return `<div class="rcard${m.length ? "" : " ready"}">
              <h3><span>${nm(r)}</span><span class="pct">${p} %</span></h3>
              <div class="bar"><i style="width:${p}%"></i></div>
              ${m.length ? `<div class="chips" style="margin:0">${m.map((k) => `<button class="chip miss" data-ing="${k}">+ ${nm(ing(k))}</button>`).join("")}</div>` : `<span class="chip have">✓ Tout est là</span>`}
              <details><summary class="hint">Quantités</summary>${keys(r).map((k) => `<div class="hint" style="margin:0">${nm(ing(k))} : ${qty(k, r.ing[k])}</div>`).join("")}</details>
            </div>`;
          }).join("")}</div>
        </div>
      </div>`;

    $$("#tab-placard [data-ing]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.ing;
      if (b.classList.contains("miss")) { pantry.add(id); savePantry(); renderPlacard(); renderReseau(); renderMatrice(); } else togglePantry(id);
    }));
    $$("#tab-placard [data-preset]").forEach((b) => b.addEventListener("click", () => {
      pantry = new Set(b.dataset.preset === "base" ? BASE : b.dataset.preset === "all" ? ING.map((i) => i.id) : []);
      savePantry(); renderPlacard(); renderReseau(); renderMatrice();
    }));
  }

  // ---------- réseau ----------
  const W = 900, H = 640;
  const nodes = REC.map((r, i) => {
    const a = (i / REC.length) * Math.PI * 2;
    return { r, x: W / 2 + Math.cos(a) * 200, y: H / 2 + Math.sin(a) * 200, vx: 0, vy: 0, fixed: false };
  });
  let threshold = store.get("seuil", 0.5);
  let usePantry = store.get("colorPlacard", false);
  let selected = REC[0];

  // Chaque paire est un ressort dont la longueur cible croît quand la similarité baisse : proches = voisines.
  function tick(alpha) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        dx /= d; dy /= d;
        const target = 45 + (1 - SIM[i][j]) * 340;
        const f = (d - target) * 0.04 * alpha;
        const rep = d < 70 ? (70 - d) * 0.35 * alpha : 0;
        const fx = (f - rep) * dx, fy = (f - rep) * dy;
        if (!a.fixed) { a.vx += fx; a.vy += fy; }
        if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
      }
    }
    nodes.forEach((n) => {
      if (n.fixed) { n.vx = n.vy = 0; return; }
      n.vx += (W / 2 - n.x) * 0.002 * alpha; n.vy += (H / 2 - n.y) * 0.002 * alpha;
      n.x = Math.min(W - 40, Math.max(40, n.x + n.vx)); n.y = Math.min(H - 25, Math.max(25, n.y + n.vy));
      n.vx *= 0.6; n.vy *= 0.6;
    });
  }
  for (let k = 0; k < 500; k++) tick(1 - k / 600);

  let raf = 0;
  function settle(frames = 80) {
    cancelAnimationFrame(raf);
    let f = 0;
    const step = () => { tick(0.5 * (1 - f / frames)); updatePositions(); if (++f < frames) raf = requestAnimationFrame(step); };
    step();
  }

  const radius = (r) => 6 + keys(r).length * 1.0;
  function updatePositions() {
    $$("#net .node").forEach((g, i) => g.setAttribute("transform", `translate(${nodes[i].x},${nodes[i].y})`));
    $$("#net line").forEach((l) => {
      const a = nodes[+l.dataset.a], b = nodes[+l.dataset.b];
      l.setAttribute("x1", a.x); l.setAttribute("y1", a.y); l.setAttribute("x2", b.x); l.setAttribute("y2", b.y);
    });
  }

  function renderReseau() {
    const si = idx(selected);
    const neigh = new Set(REC.map((_, j) => j).filter((j) => j !== si && SIM[si][j] >= threshold));
    const edges = [];
    for (let i = 0; i < REC.length; i++) for (let j = i + 1; j < REC.length; j++) if (SIM[i][j] >= threshold) edges.push([i, j]);
    const sim = similarTo(selected);
    const m = missing(selected);

    $("#tab-reseau").innerHTML = `
      <div class="ctl">
        <label>Lien si similarité ≥ <strong id="thv">${Math.round(threshold * 100)} %</strong> <input id="th" type="range" min="20" max="90" value="${Math.round(threshold * 100)}"></label>
        <label><input type="checkbox" id="pp" ${usePantry ? "checked" : ""}> Montrer mon garde-manger (bord vert = faisable, opacité = complétion)</label>
      </div>
      <div class="net-wrap">
        <div>
          <svg id="net" class="net" viewBox="0 0 ${W} ${H}" role="img" aria-label="Réseau de similarité entre recettes">
            ${edges.map(([a, b]) => `<line data-a="${a}" data-b="${b}" style="stroke-width:${(0.5 + SIM[a][b] * 5).toFixed(1)};opacity:${(0.25 + SIM[a][b] * 0.6).toFixed(2)}" class="${a === si || b === si ? "" : neigh.size ? "dim" : ""}"/>`).join("")}
            ${nodes.map((n, i) => {
              const ready = !missing(n.r).length;
              const op = usePantry ? 0.3 + 0.7 * completion(n.r) : 1;
              const cls = `node${n.r === selected ? " sel" : ""}${usePantry && ready ? " ready" : ""}${i !== si && !neigh.has(i) && neigh.size ? " dim" : ""}`;
              return `<g class="${cls}" data-i="${i}"><circle r="${radius(n.r)}" style="fill:var(--c-${mainFlour(n.r)});fill-opacity:${op}"/><text y="${radius(n.r) + 12}">${nt(n.r)}</text></g>`;
            }).join("")}
          </svg>
          <div class="legend">${Object.keys(FLOUR_LABEL).map((k) => `<span><i style="background:var(--c-${k})"></i>${nm(FLOUR_LABEL[k])}</span>`).join("")}<span>Taille = nombre d'ingrédients</span></div>
          <p class="hint">Plus deux recettes se ressemblent, plus elles sont proches. Glissez une pastille pour la déplacer, touchez-la pour la sélectionner.</p>
        </div>
        <div class="card">
          <h2>${nm(selected)}</h2>
          <p class="hint">${keys(selected).map((k) => `${nm(ing(k))} ${qty(k, selected.ing[k])}`).join(" · ")}</p>
          ${m.length ? `<p>Il vous manque : ${m.map((k) => `<span class="chip miss" style="cursor:default" title="${tip(ing(k))}">${nm(ing(k))}</span>`).join(" ")}</p>` : `<p><span class="chip have">✓ Faisable avec mon garde-manger</span></p>`}
          <h3>Recettes les plus proches</h3>
          ${sim.slice(0, 6).map(({ r, s }) => {
            const shared = keys(r).filter((k) => selected.ing[k] !== undefined && !["sel"].includes(k)).map((k) => nm(ing(k)));
            return `<div class="sim-row" data-r="${r.id}"><span>${nm(r)}<br><small class="hint">en commun : ${shared.join(", ") || "—"}</small></span><strong>${Math.round(s * 100)} %</strong></div>`;
          }).join("")}
          <button class="btn" id="goCmp" style="margin-top:.8rem">⚖️ Comparer avec ${nm(sim[0].r)}</button>
        </div>
      </div>`;

    $("#th").addEventListener("input", (e) => { threshold = e.target.value / 100; store.set("seuil", threshold); renderReseau(); });
    $("#pp").addEventListener("change", (e) => { usePantry = e.target.checked; store.set("colorPlacard", usePantry); renderReseau(); });
    $$("#tab-reseau .sim-row").forEach((el) => el.addEventListener("click", () => { selected = rec(el.dataset.r); renderReseau(); }));
    $("#goCmp").addEventListener("click", () => { cmpA = selected.id; cmpB = sim[0].r.id; renderComparer(); showTab("comparer"); });
    updatePositions();
    bindDrag();
  }

  function bindDrag() {
    const svg = $("#net");
    const toSvg = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    $$("#net .node").forEach((g) => {
      g.addEventListener("pointerdown", (e) => {
        const n = nodes[+g.dataset.i];
        let moved = 0;
        const start = toSvg(e);
        g.setPointerCapture(e.pointerId);
        n.fixed = true;
        g.style.cursor = "grabbing";
        const move = (ev) => {
          const p = toSvg(ev);
          moved = Math.max(moved, Math.hypot(p.x - start.x, p.y - start.y));
          n.x = Math.min(W - 20, Math.max(20, p.x)); n.y = Math.min(H - 15, Math.max(15, p.y));
          tick(0.3); updatePositions();
        };
        const up = () => {
          g.removeEventListener("pointermove", move); g.removeEventListener("pointerup", up);
          n.fixed = false;
          if (moved < 4) { selected = n.r; renderReseau(); } else settle(60);
        };
        g.addEventListener("pointermove", move); g.addEventListener("pointerup", up);
      });
    });
  }

  // ---------- matrice ----------
  function orderedRecipes() {
    // Chaîne gloutonne : chaque recette est suivie de sa plus proche voisine pas encore placée.
    const left = new Set(REC.map((_, i) => i));
    let cur = 0; const out = [];
    left.delete(0); out.push(0);
    while (left.size) {
      let best = -1;
      left.forEach((j) => { if (best < 0 || SIM[cur][j] > SIM[cur][best]) best = j; });
      left.delete(best); out.push(best); cur = best;
    }
    return out.map((i) => REC[i]);
  }
  function renderMatrice() {
    const rows = orderedRecipes();
    const max = {}; ING.forEach((i) => (max[i.id] = Math.max(...REC.map((r) => r.ing[i.id] || 0))));
    $("#tab-matrice").innerHTML = `
      <p class="hint">Chaque ligne est une recette (les plus proches sont voisines), chaque colonne un ingrédient. Plus la case est foncée, plus la quantité est grande. Touchez un en-tête pour l'ajouter ou le retirer du garde-manger (en vert = je l'ai).</p>
      <div class="mx-wrap"><table class="mx"><thead><tr><th class="rn">Recette</th>${ING.map((i) => `<th data-ing="${i.id}" class="${pantry.has(i.id) ? "on" : ""}" title="${tip(i) || i.unite}">${nm(i)}<br><small>${i.unite || "pièces"}</small></th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr><td class="rn">${nm(r)}</td>${ING.map((i) => {
        const v = r.ing[i.id];
        if (v === undefined) return `<td class="v"></td>`;
        const a = (0.15 + 0.7 * (v / max[i.id])).toFixed(2);
        return `<td class="v" style="background:color-mix(in srgb, var(--accent) ${Math.round(a * 100)}%, transparent)">${v}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
    $$("#tab-matrice th[data-ing]").forEach((th) => th.addEventListener("click", () => togglePantry(th.dataset.ing)));
  }

  // ---------- comparer ----------
  let cmpA = "crepes", cmpB = "pancakes";
  const total = (r, ids) => ids.reduce((s, k) => s + (r.ing[k] || 0), 0);
  function ratios(r) {
    const f = total(r, FARINES);
    if (!f) return null;
    return { liquide: (total(r, ["lait", "eau"]) / f).toFixed(2), gras: (total(r, ["beurre", "huile"]) / f).toFixed(2), sucre: (total(r, ["sucre"]) / f).toFixed(2), oeufs: ((r.ing.oeufs || 0) / f * 100).toFixed(1) };
  }
  function renderComparer() {
    const A = rec(cmpA), B = rec(cmpB);
    const all = ING.filter((i) => A.ing[i.id] !== undefined || B.ing[i.id] !== undefined);
    const onlyA = all.filter((i) => B.ing[i.id] === undefined).map((i) => nm(i));
    const onlyB = all.filter((i) => A.ing[i.id] === undefined).map((i) => nm(i));
    const common = all.filter((i) => A.ing[i.id] !== undefined && B.ing[i.id] !== undefined);
    const diffq = common.filter((i) => A.ing[i.id] !== B.ing[i.id]).map((i) => nm(i));
    const s = Math.round(SIM[idx(A)][idx(B)] * 100);
    const rA = ratios(A), rB = ratios(B);
    const opts = (cur) => REC.map((r) => `<option value="${r.id}"${r.id === cur ? " selected" : ""}>${nt(r)}</option>`).join("");
    const metaRow = (label, k, unit) => (A.meta[k] !== undefined || B.meta[k] !== undefined) ? `<tr><td>${label}</td><td>${A.meta[k] !== undefined ? A.meta[k] + unit : "—"}</td><td>${B.meta[k] !== undefined ? B.meta[k] + unit : "—"}</td><td class="d"></td></tr>` : "";
    const barMax = (id) => Math.max(A.ing[id] || 0, B.ing[id] || 0) || 1;

    $("#tab-comparer").innerHTML = `
      <div class="sel-row">
        <select id="ca" aria-label="Recette A">${opts(cmpA)}</select> <strong>⇄</strong> <select id="cb" aria-label="Recette B">${opts(cmpB)}</select>
        <button class="btn" id="swap">Échanger</button>
        <span class="chip have" style="cursor:default">Similarité ${s} %</span>
      </div>
      <div class="diffnote"><strong>${nm(B)}</strong> par rapport à <strong>${nm(A)}</strong> :
        ${onlyB.length ? `ajoute <strong>${onlyB.join(", ")}</strong>` : "n'ajoute aucun ingrédient"}${onlyA.length ? `, retire <strong>${onlyA.join(", ")}</strong>` : ""}${diffq.length ? `, et change les quantités de ${diffq.join(", ")}` : ""}.</div>
      <div class="card" style="overflow-x:auto"><table class="cmp">
        <thead><tr><th>Ingrédient</th><th>${nm(A)}</th><th>${nm(B)}</th><th>Écart</th></tr></thead>
        <tbody>${all.map((i) => {
          const a = A.ing[i.id], b = B.ing[i.id], m = barMax(i.id);
          const d = a !== undefined && b !== undefined ? (b - a === 0 ? "=" : (b - a > 0 ? "+" : "") + +(b - a).toFixed(1)) : a === undefined ? "nouveau" : "retiré";
          return `<tr><td><span title="${tip(i)}">${nm(i)}</span>${i.unite ? ` <small class="hint">(${i.unite})</small>` : ""}</td>
            <td>${a !== undefined ? `<div class="pair">${a}<span class="b" style="width:${Math.round((a / m) * 60)}px"></span></div>` : "—"}</td>
            <td>${b !== undefined ? `<div class="pair">${b}<span class="b b2" style="width:${Math.round((b / m) * 60)}px"></span></div>` : "—"}</td>
            <td class="d">${d}</td></tr>`;
        }).join("")}
        ${metaRow("Four", "four", " °C")}${metaRow("Cuisson", "cuisson", " min")}${metaRow("Température de l'eau/lait", "temp", "")}
        </tbody></table></div>
      <div class="card"><h3>Proportions (pour 1 g de farine)</h3>
        ${rA && rB ? `<table class="cmp"><thead><tr><th></th><th>${nm(A)}</th><th>${nm(B)}</th></tr></thead><tbody>
          <tr><td>Liquide (lait + eau, ml)</td><td>${rA.liquide}</td><td>${rB.liquide}</td></tr>
          <tr><td>Matière grasse (g/ml)</td><td>${rA.gras}</td><td>${rB.gras}</td></tr>
          <tr><td>Sucre (g)</td><td>${rA.sucre}</td><td>${rB.sucre}</td></tr>
          <tr><td>Œufs pour 100 g de farine</td><td>${rA.oeufs}</td><td>${rB.oeufs}</td></tr></tbody></table>
          <p class="hint">Un rapport liquide/farine élevé donne une pâte fluide (crêpes), un rapport faible une pâte épaisse ou à pétrir.</p>`
          : `<p class="hint">Proportions non disponibles : l'une des deux recettes n'a pas de farine.</p>`}
      </div>`;
    $("#ca").addEventListener("change", (e) => { cmpA = e.target.value; renderComparer(); });
    $("#cb").addEventListener("change", (e) => { cmpB = e.target.value; renderComparer(); });
    $("#swap").addEventListener("click", () => { [cmpA, cmpB] = [cmpB, cmpA]; renderComparer(); });
  }

  // ---------- radar ----------
  // Chaque axe = part de la masse totale de la recette. Facteurs de conversion en grammes.
  const ALL_AXES = [
    { id: "farine", nom: "Farines", en: "Flours", parts: { farine: 1, sarrasin: 1, mais: 1, avoine: 1 } },
    { id: "liquide", nom: "Liquides", en: "Liquids", parts: { lait: 1.03, eau: 1, yaourt: 125, creme_fraiche: 1.0 } },
    { id: "oeufs", nom: "Œufs", en: "Eggs", parts: { oeufs: 55 } },
    { id: "gras", nom: "Matières grasses", en: "Fats", parts: { beurre: 1, huile: 0.92 } },
    { id: "sucre", nom: "Sucres", en: "Sugars", parts: { sucre: 1, sucre_vanille: 7.5, chocolat: 1 } },
    { id: "garniture", nom: "Garnitures", en: "Fillings", parts: { chorizo: 1, lardons: 1, gruyere: 1, fruits: 1 } },
  ];
  const OTHER = { levure_chimique: 11, levure_de_boulanger: 7, sel: 1, moutarde: 15, vinaigre_ou_citron: 15, ail: 4, muscade: 0.3 }; // comptés dans la masse totale, sans axe
  // Deux modes : « total » (toute la masse) ou « sec » (sans les liquides, pour comparer les pâtes indépendamment de leur hydratation).
  let radarMode = store.get("radarMode", "total");
  let AXES = ALL_AXES;
  function shares(r) {
    const mass = AXES.map((ax) => Object.entries(ax.parts).reduce((s, [k, f]) => s + (r.ing[k] || 0) * f, 0));
    const tot = mass.reduce((s, v) => s + v, 0) + Object.entries(OTHER).reduce((s, [k, f]) => s + (r.ing[k] || 0) * f, 0);
    return mass.map((m) => (tot ? m / tot : 0));
  }
  let SHARES = REC.map(shares);
  let RMAX = 0.8; // échelle racine carrée : les petites parts restent lisibles
  const rad = (v, R) => Math.sqrt(Math.min(v, RMAX) / RMAX) * R;
  const pt = (i, v, R) => { const a = -Math.PI / 2 + (i / AXES.length) * Math.PI * 2; return [Math.cos(a) * rad(v, R), Math.sin(a) * rad(v, R)]; };
  const poly = (sh, R) => sh.map((v, i) => pt(i, v, R).map((x) => x.toFixed(1)).join(",")).join(" ");
  const grid = (R, rings) => rings.map((v) => `<polygon class="ring" points="${AXES.map((_, i) => pt(i, v, R).join(",")).join(" ")}" style="fill:none;stroke-width:1"/>`).join("")
    + AXES.map((_, i) => { const [x, y] = pt(i, RMAX, R); return `<line class="axis" x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");

  let radarSel = store.get("radar", ["crepes", "gaufres", "pate-brisee"]).filter((id) => rec(id));

  function setRadarMode() {
    AXES = radarMode === "total" ? ALL_AXES : ALL_AXES.filter((ax) => ax.id !== "liquide");
    RMAX = radarMode === "total" ? 0.8 : 1;
    SHARES = REC.map(shares);
  }
  setRadarMode();

  function renderRadar() {
    const R = 150, rings = radarMode === "total" ? [0.1, 0.25, 0.5, 0.8] : [0.1, 0.25, 0.5, 1];
    const sel = radarSel.map((id, k) => ({ r: rec(id), k }));
    const labels = AXES.map((ax, i) => {
      const a = -Math.PI / 2 + (i / AXES.length) * Math.PI * 2, x = Math.cos(a) * (R + 14), y = Math.sin(a) * (R + 14);
      const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
      return `<text class="ax" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${nt(ax)}</text>`;
    }).join("");
    const ringLabels = rings.map((v) => { const t = -Math.PI / 2 + Math.PI / AXES.length, d = rad(v, R); return `<text x="${(Math.cos(t) * d + 3).toFixed(1)}" y="${(Math.sin(t) * d - 2).toFixed(1)}">${Math.round(v * 100)} %</text>`; }).join("");
    const ordered = orderedRecipes();

    $("#tab-radar").innerHTML = `
      <div class="ctl" role="group" aria-label="Mode de calcul">
        <button class="chip" data-mode="total" aria-pressed="${radarMode === "total"}">Masse totale</button>
        <button class="chip" data-mode="sec" aria-pressed="${radarMode === "sec"}">Hors liquides</button>
        <span class="hint" style="margin:0">${radarMode === "total" ? "Part de chaque ingrédient dans toute la pâte." : "Les liquides (lait, eau, yaourt) sont retirés : on compare la composition de la pâte, quelle que soit sa fluidité."}</span>
      </div>
      <p class="hint">Chaque recette est un polygone : plus un sommet est loin du centre, plus l'ingrédient pèse dans la masse (échelle racine carrée, pour voir aussi les petites parts). Sélectionnez jusqu'à 5 recettes à superposer.</p>
      <div class="radar-wrap">
        <div>
          <svg class="radar" viewBox="-270 -200 540 400" role="img" aria-label="Radar des proportions d'ingrédients">
            ${grid(R, rings)}${ringLabels}
            ${sel.map(({ r, k }) => `<polygon points="${poly(SHARES[idx(r)], R)}" style="stroke:var(--o${k + 1});fill:var(--o${k + 1})"/>`).join("")}
            ${labels}
          </svg>
          <div class="chips" style="margin-top:.6rem">${sel.map(({ r, k }) => `<button class="chip o" data-r="${r.id}" style="border-color:var(--o${k + 1})"><span style="color:var(--o${k + 1})">●</span> ${nm(r)} ✕</button>`).join("") || `<span class="hint">Aucune recette sélectionnée.</span>`}</div>
          ${sel.length ? `<div class="card" style="overflow-x:auto"><table class="cmp"><thead><tr><th>Part de la masse</th>${sel.map(({ r, k }) => `<th style="color:var(--o${k + 1})">${nm(r)}</th>`).join("")}</tr></thead><tbody>
            ${AXES.map((ax, i) => `<tr><td>${nm(ax)}</td>${sel.map(({ r }) => { const v = SHARES[idx(r)][i]; return `<td>${v ? Math.round(v * 100) + " %" : "—"}</td>`; }).join("")}</tr>`).join("")}
          </tbody></table><p class="hint" style="margin-bottom:0">Levures, sel, moutarde, vinaigre, ail et muscade entrent dans la masse mais n'ont pas d'axe.</p></div>` : ""}
        </div>
        <div>
          <h3>Toutes les recettes</h3>
          <p class="hint">La forme résume le type de pâte. Touchez pour ajouter ou retirer du radar.</p>
          <div class="minis">${ordered.map((r) => `<button class="mini${radarSel.includes(r.id) ? " on" : ""}" data-r="${r.id}">
            <svg viewBox="-62 -62 124 124" aria-hidden="true">${grid(50, [0.25, RMAX])}<polygon points="${poly(SHARES[idx(r)], 50)}" style="stroke:var(--c-${mainFlour(r)});fill:var(--c-${mainFlour(r)})"/></svg>${nm(r)}</button>`).join("")}</div>
        </div>
      </div>`;
    $$("#tab-radar [data-mode]").forEach((b) => b.addEventListener("click", () => {
      radarMode = b.dataset.mode; store.set("radarMode", radarMode); setRadarMode(); renderRadar();
    }));
    $$("#tab-radar [data-r]").forEach((el) => el.addEventListener("click", () => {
      const id = el.dataset.r;
      if (radarSel.includes(id)) radarSel = radarSel.filter((x) => x !== id);
      else radarSel = [...radarSel, id].slice(-5);
      store.set("radar", radarSel);
      renderRadar();
    }));
  }

  // ---------- langue ----------
  function renderAll() { renderPlacard(); renderReseau(); renderMatrice(); renderComparer(); renderRadar(); }
  function syncLang() { $$("#lang [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang))); document.documentElement.dataset.lang = lang; }
  $$("#lang [data-lang]").forEach((b) => b.addEventListener("click", () => { lang = b.dataset.lang; store.set("lang", lang); syncLang(); renderAll(); }));

  // ---------- onglets ----------
  function showTab(name) {
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    $$(".panel").forEach((p) => (p.hidden = p.id !== "tab-" + name));
    store.set("tab", name);
    if (name === "reseau") renderReseau(); // l'onglet doit être visible pour mesurer le SVG
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  syncLang();
  renderPlacard();
  renderMatrice();
  renderComparer();
  renderRadar();
  const tab = location.hash.slice(1) || store.get("tab", "placard");
  showTab($(`.tabs [data-tab="${tab}"]`) ? tab : "placard");
})();
