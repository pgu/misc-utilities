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

  // ---------- sélection pour la comparaison (A / B) ----------
  // Deux emplacements : un nouveau choix remplit l'emplacement libre, sinon remplace le plus ancien.
  const cmp = Object.assign({ a: "crepes", b: "pancakes", last: "b" }, store.get("cmp", {}));
  if (!rec(cmp.a)) cmp.a = null;
  if (!rec(cmp.b)) cmp.b = null;
  const saveCmp = () => store.set("cmp", cmp);
  const pickBtn = (id) => `<button class="pick" data-pick="${id}" title="Comparer (A/B)">⚖️</button>`;
  function pick(id) {
    if (cmp.a === id) cmp.a = null;
    else if (cmp.b === id) cmp.b = null;
    else if (!cmp.a) { cmp.a = id; cmp.last = "a"; }
    else if (!cmp.b) { cmp.b = id; cmp.last = "b"; }
    else { const slot = cmp.last === "a" ? "b" : "a"; cmp[slot] = id; cmp.last = slot; }
    saveCmp();
    afterPick();
  }
  function afterPick() {
    markPair();
    renderComparer();
    if (!$("#tab-radar").hidden) renderRadar();
  }
  // Repère A / B sur toutes les vues sans les re-générer (garde le défilement de la matrice, etc.).
  function markPair() {
    $$("[data-rid]").forEach((el) => { el.classList.toggle("pa", el.dataset.rid === cmp.a); el.classList.toggle("pb", el.dataset.rid === cmp.b); });
    $$("button.pick").forEach((b) => {
      const id = b.dataset.pick, isA = id === cmp.a, isB = id === cmp.b;
      b.textContent = isA ? "A" : isB ? "B" : "⚖️";
      b.classList.toggle("pa", isA); b.classList.toggle("pb", isB);
    });
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("button.pick"); if (b) pick(b.dataset.pick); });

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
            return `<div class="rcard${m.length ? "" : " ready"}" data-rid="${r.id}">
              <h3><span>${nm(r)}</span><span class="pickbox"><span class="pct">${p} %</span>${pickBtn(r.id)}</span></h3>
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
    markPair();
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
              return `<g class="${cls}" data-i="${i}" data-rid="${n.r.id}"><circle r="${radius(n.r)}" style="fill:var(--c-${mainFlour(n.r)});fill-opacity:${op}"/><text y="${radius(n.r) + 12}">${nt(n.r)}</text></g>`;
            }).join("")}
          </svg>
          <div class="legend">${Object.keys(FLOUR_LABEL).map((k) => `<span><i style="background:var(--c-${k})"></i>${nm(FLOUR_LABEL[k])}</span>`).join("")}<span>Taille = nombre d'ingrédients</span></div>
          <p class="hint">Plus deux recettes se ressemblent, plus elles sont proches. Glissez une pastille pour la déplacer, touchez-la pour la sélectionner et la comparer (A/B).</p>
        </div>
        <div class="card">
          <h2>${nm(selected)} ${pickBtn(selected.id)}</h2>
          <p class="hint">${keys(selected).map((k) => `${nm(ing(k))} ${qty(k, selected.ing[k])}`).join(" · ")}</p>
          ${m.length ? `<p>Il vous manque : ${m.map((k) => `<span class="chip miss" style="cursor:default" title="${tip(ing(k))}">${nm(ing(k))}</span>`).join(" ")}</p>` : `<p><span class="chip have">✓ Faisable avec mon garde-manger</span></p>`}
          <h3>Recettes les plus proches</h3>
          ${sim.slice(0, 6).map(({ r, s }) => {
            const shared = keys(r).filter((k) => selected.ing[k] !== undefined && !["sel"].includes(k)).map((k) => nm(ing(k)));
            return `<div class="sim-row" data-r="${r.id}" data-rid="${r.id}"><span>${nm(r)}<br><small class="hint">en commun : ${shared.join(", ") || "—"}</small></span><span class="pickbox"><strong>${Math.round(s * 100)} %</strong>${pickBtn(r.id)}</span></div>`;
          }).join("")}
          <button class="btn" id="goCmp" style="margin-top:.8rem">⚖️ Comparer avec ${nm(sim[0].r)}</button>
        </div>
      </div>`;

    $("#th").addEventListener("input", (e) => { threshold = e.target.value / 100; store.set("seuil", threshold); renderReseau(); });
    $("#pp").addEventListener("change", (e) => { usePantry = e.target.checked; store.set("colorPlacard", usePantry); renderReseau(); });
    $$("#tab-reseau .sim-row").forEach((el) => el.addEventListener("click", (e) => { if (e.target.closest("button.pick")) return; selected = rec(el.dataset.r); renderReseau(); }));
    $("#goCmp").addEventListener("click", () => { cmp.a = selected.id; cmp.b = sim[0].r.id; cmp.last = "b"; saveCmp(); afterPick(); });
    updatePositions();
    bindDrag();
    markPair();
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
          if (moved < 4) { selected = n.r; pick(n.r.id); renderReseau(); } else settle(60);
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
      <p class="hint">Chaque ligne est une recette (les plus proches sont voisines), chaque colonne un ingrédient. Plus la case est foncée, plus la quantité est grande. Touchez un en-tête de colonne pour l'ajouter ou le retirer du garde-manger (en vert = je l'ai), un nom de recette pour la comparer (A/B).</p>
      <div class="mx-wrap"><table class="mx"><thead><tr><th class="rn">Recette</th>${ING.map((i) => `<th data-ing="${i.id}" class="${pantry.has(i.id) ? "on" : ""}" title="${tip(i) || i.unite}">${nm(i)}<br><small>${i.unite || "pièces"}</small></th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr data-rid="${r.id}"><td class="rn" title="Comparer (A/B)">${nm(r)}</td>${ING.map((i) => {
        const v = r.ing[i.id];
        if (v === undefined) return `<td class="v"></td>`;
        const a = (0.15 + 0.7 * (v / max[i.id])).toFixed(2);
        return `<td class="v" style="background:color-mix(in srgb, var(--accent) ${Math.round(a * 100)}%, transparent)">${v}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
    $$("#tab-matrice th[data-ing]").forEach((th) => th.addEventListener("click", () => togglePantry(th.dataset.ing)));
    $$("#tab-matrice tbody tr").forEach((tr) => tr.querySelector(".rn").addEventListener("click", () => pick(tr.dataset.rid)));
    markPair();
  }

  // ---------- comparer (panneau de droite) ----------
  const total = (r, ids) => ids.reduce((s, k) => s + (r.ing[k] || 0), 0);
  function ratios(r) {
    const f = total(r, FARINES);
    if (!f) return null;
    // pour 100 g de farine
    const per100 = (v) => Math.round((v / f) * 100);
    return { liquide: per100(total(r, ["lait", "eau"])), gras: per100(total(r, ["beurre", "huile"])), sucre: per100(total(r, ["sucre"])), oeufs: ((r.ing.oeufs || 0) / f * 100).toFixed(1) };
  }
  function renderComparer() {
    const A = cmp.a && rec(cmp.a), B = cmp.b && rec(cmp.b);
    const byName = [...REC].sort((x, y) => nt(x).localeCompare(nt(y), lang === "en" ? "en" : "fr")); // tri sur le nom affiché
    const opts = (cur) => `<option value=""${cur ? "" : " selected"}>— choisir —</option>` + byName.map((r) => `<option value="${r.id}"${r.id === cur ? " selected" : ""}>${nt(r)}</option>`).join("");
    const head = `
      <div class="split-head"><h2>⚖️ Comparaison</h2>
        <div><button class="btn" id="swap"${A && B ? "" : " disabled"}>⇄ Échanger</button> <button class="btn" id="clr"${A || B ? "" : " disabled"}>Vider</button></div></div>
      <div class="sel-row"><span class="slot a">A</span><select id="ca" aria-label="Recette A">${opts(cmp.a)}</select><span class="slot b">B</span><select id="cb" aria-label="Recette B">${opts(cmp.b)}</select></div>`;

    let body;
    if (!A || !B) {
      const one = A || B;
      body = `<div class="card"><p class="hint" style="margin:0">Choisissez <strong>deux recettes</strong> : touchez ⚖️ sur une carte, une pastille du réseau, une recette du radar ou une ligne de la matrice. Un troisième choix remplace le plus ancien.</p></div>
        ${one ? `<div class="card"><h3><span class="slot ${A ? "a" : "b"}">${A ? "A" : "B"}</span> ${nm(one)}</h3>${keys(one).map((k) => `<div class="hint" style="margin:0">${nm(ing(k))} : ${qty(k, one.ing[k])}</div>`).join("")}</div>` : ""}`;
    } else {
      const all = ING.filter((i) => A.ing[i.id] !== undefined || B.ing[i.id] !== undefined);
      const onlyA = all.filter((i) => B.ing[i.id] === undefined).map((i) => nm(i));
      const onlyB = all.filter((i) => A.ing[i.id] === undefined).map((i) => nm(i));
      const common = all.filter((i) => A.ing[i.id] !== undefined && B.ing[i.id] !== undefined);
      const diffq = common.filter((i) => A.ing[i.id] !== B.ing[i.id]).map((i) => nm(i));
      const s = Math.round(SIM[idx(A)][idx(B)] * 100);
      const rA = ratios(A), rB = ratios(B);
      const metaRow = (label, k, unit) => (A.meta[k] !== undefined || B.meta[k] !== undefined) ? `<tr><td>${label}</td><td>${A.meta[k] !== undefined ? A.meta[k] + unit : "—"}</td><td>${B.meta[k] !== undefined ? B.meta[k] + unit : "—"}</td><td class="d"></td></tr>` : "";
      const barMax = (id) => Math.max(A.ing[id] || 0, B.ing[id] || 0) || 1;
      body = `
        <p><span class="chip have" style="cursor:default">Similarité ${s} %</span></p>
        <div class="diffnote"><strong>${nm(B)}</strong> par rapport à <strong>${nm(A)}</strong> :
          ${onlyB.length ? `ajoute <strong>${onlyB.join(", ")}</strong>` : "n'ajoute aucun ingrédient"}${onlyA.length ? `, retire <strong>${onlyA.join(", ")}</strong>` : ""}${diffq.length ? `, et change les quantités de ${diffq.join(", ")}` : ""}.</div>
        <div class="card" style="overflow-x:auto"><table class="cmp">
          <thead><tr><th>Ingrédient</th><th style="color:var(--o1)">${nm(A)}</th><th style="color:var(--o2)">${nm(B)}</th><th>Écart</th></tr></thead>
          <tbody>${all.map((i) => {
            const a = A.ing[i.id], b = B.ing[i.id], m = barMax(i.id);
            const d = a !== undefined && b !== undefined ? (b - a === 0 ? "=" : (b - a > 0 ? "+" : "") + +(b - a).toFixed(1)) : a === undefined ? "nouveau" : "retiré";
            return `<tr><td><span title="${tip(i)}">${nm(i)}</span>${i.unite ? ` <small class="hint">(${i.unite})</small>` : ""}</td>
              <td>${a !== undefined ? `<div class="pair">${a}<span class="b" style="width:${Math.round((a / m) * 40)}px"></span></div>` : "—"}</td>
              <td>${b !== undefined ? `<div class="pair">${b}<span class="b b2" style="width:${Math.round((b / m) * 40)}px"></span></div>` : "—"}</td>
              <td class="d">${d}</td></tr>`;
          }).join("")}
          ${metaRow("Four", "four", " °C")}${metaRow("Cuisson", "cuisson", " min")}${metaRow("Température de l'eau/lait", "temp", "")}
          </tbody></table></div>
        <div class="card"><h3>Proportions (pour 100 g de farine)</h3>
          ${rA && rB ? `<table class="cmp"><thead><tr><th></th><th style="color:var(--o1)">${nm(A)}</th><th style="color:var(--o2)">${nm(B)}</th></tr></thead><tbody>
            <tr><td>Liquide (lait + eau, ml)</td><td>${rA.liquide}</td><td>${rB.liquide}</td></tr>
            <tr><td>Matière grasse (g/ml)</td><td>${rA.gras}</td><td>${rB.gras}</td></tr>
            <tr><td>Sucre (g)</td><td>${rA.sucre}</td><td>${rB.sucre}</td></tr>
            <tr><td>Œufs (pièces)</td><td>${rA.oeufs}</td><td>${rB.oeufs}</td></tr></tbody></table>
            <p class="hint">Un rapport liquide/farine élevé donne une pâte fluide (crêpes), un rapport faible une pâte épaisse ou à pétrir.</p>`
            : `<p class="hint">Proportions non disponibles : l'une des deux recettes n'a pas de farine.</p>`}
        </div>`;
    }

    $("#split").innerHTML = head + body;
    $("#ca").addEventListener("change", (e) => { cmp.a = e.target.value || null; cmp.last = "a"; saveCmp(); afterPick(); });
    $("#cb").addEventListener("change", (e) => { cmp.b = e.target.value || null; cmp.last = "b"; saveCmp(); afterPick(); });
    $("#swap").addEventListener("click", () => { [cmp.a, cmp.b] = [cmp.b, cmp.a]; saveCmp(); afterPick(); });
    $("#clr").addEventListener("click", () => { cmp.a = cmp.b = null; saveCmp(); afterPick(); });
  }

  // ---------- radar ----------
  // Chaque axe = part de la masse totale de la recette. Facteurs de conversion en grammes.
  const ALL_AXES = [
    { id: "farine", nom: "Farines", en: "Flours", parts: { farine: 1, sarrasin: 1, mais: 1, avoine: 1 } },
    { id: "liquide", nom: "Liquides", en: "Liquids", parts: { lait: 1.03, eau: 1, yaourt: 125, creme_fraiche: 1.0, creme_liquide: 1.0 } },
    { id: "oeufs", nom: "Œufs", en: "Eggs", parts: { oeufs: 55 } },
    { id: "gras", nom: "Matières grasses", en: "Fats", parts: { beurre: 1, huile: 0.92 } },
    { id: "sucre", nom: "Sucres", en: "Sugars", parts: { sucre: 1, sucre_vanille: 7.5, chocolat: 1 } },
    { id: "garniture", nom: "Garnitures", en: "Fillings", parts: { chorizo: 1, lardons: 1, jambon: 1, fromage_frais: 1, gruyere: 1, fruits: 1 } },
  ];
  const OTHER = { chapelure: 1, levure_chimique: 11, levure_de_boulanger: 7, sel: 1, moutarde: 15, vinaigre_ou_citron: 15, ail: 4, muscade: 0.3 }; // comptés dans la masse totale, sans axe
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

  // Le radar superpose la paire A/B (couleurs 1 et 2) et jusqu'à 3 recettes en plus (« ＋ »).
  let radarExtra = store.get("radarExtra", []).filter((id) => rec(id));

  function setRadarMode() {
    AXES = radarMode === "total" ? ALL_AXES : ALL_AXES.filter((ax) => ax.id !== "liquide");
    RMAX = radarMode === "total" ? 0.8 : 1;
    SHARES = REC.map(shares);
  }
  setRadarMode();

  function renderRadar() {
    const R = 150, rings = radarMode === "total" ? [0.1, 0.25, 0.5, 0.8] : [0.1, 0.25, 0.5, 1];
    const sel = [cmp.a, cmp.b].map((id, k) => (id ? { r: rec(id), k, slot: k ? "b" : "a" } : null)).filter(Boolean)
      .concat(radarExtra.filter((id) => id !== cmp.a && id !== cmp.b).map((id, j) => ({ r: rec(id), k: 2 + j, slot: id })));
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
      <p class="hint">Chaque recette est un polygone : plus un sommet est loin du centre, plus l'ingrédient pèse dans la masse (échelle racine carrée, pour voir aussi les petites parts). La paire A/B est toujours tracée ; « ＋ » superpose jusqu'à 3 recettes de plus.</p>
      <div class="radar-wrap">
        <div>
          <svg class="radar" viewBox="-270 -200 540 400" role="img" aria-label="Radar des proportions d'ingrédients">
            ${grid(R, rings)}${ringLabels}
            ${sel.map(({ r, k }) => `<polygon points="${poly(SHARES[idx(r)], R)}" style="stroke:var(--o${k + 1});fill:var(--o${k + 1})"/>`).join("")}
            ${labels}
          </svg>
          <div class="chips" style="margin-top:.6rem">${sel.map(({ r, k, slot }) => `<button class="chip o" data-clear="${slot}" style="border-color:var(--o${k + 1})"><span style="color:var(--o${k + 1})">●</span> ${slot === "a" ? "A · " : slot === "b" ? "B · " : ""}${nm(r)} ✕</button>`).join("") || `<span class="hint">Aucune recette sélectionnée.</span>`}</div>
          ${sel.length ? `<div class="card" style="overflow-x:auto"><table class="cmp"><thead><tr><th>Part de la masse</th>${sel.map(({ r, k }) => `<th style="color:var(--o${k + 1})">${nm(r)}</th>`).join("")}</tr></thead><tbody>
            ${AXES.map((ax, i) => `<tr><td>${nm(ax)}</td>${sel.map(({ r }) => { const v = SHARES[idx(r)][i]; return `<td>${v ? Math.round(v * 100) + " %" : "—"}</td>`; }).join("")}</tr>`).join("")}
          </tbody></table><p class="hint" style="margin-bottom:0">Levures, sel, moutarde, vinaigre, ail et muscade entrent dans la masse mais n'ont pas d'axe.</p></div>` : ""}
        </div>
        <div>
          <h3>Toutes les recettes</h3>
          <p class="hint">La forme résume le type de pâte. Touchez une recette pour la comparer (A/B), « ＋ » pour la superposer.</p>
          <div class="minis">${ordered.map((r) => `<div class="mini" data-rid="${r.id}">
            <button class="mini-btn" data-pick="${r.id}"><svg viewBox="-62 -62 124 124" aria-hidden="true">${grid(50, [0.25, RMAX])}<polygon points="${poly(SHARES[idx(r)], 50)}" style="stroke:var(--c-${mainFlour(r)});fill:var(--c-${mainFlour(r)})"/></svg>${nm(r)}</button>
            <button class="plus${radarExtra.includes(r.id) ? " on" : ""}" data-extra="${r.id}" title="Superposer sur le radar">＋</button></div>`).join("")}</div>
        </div>
      </div>`;
    $$("#tab-radar [data-mode]").forEach((b) => b.addEventListener("click", () => {
      radarMode = b.dataset.mode; store.set("radarMode", radarMode); setRadarMode(); renderRadar();
    }));
    $$("#tab-radar .mini-btn").forEach((b) => b.addEventListener("click", () => pick(b.dataset.pick)));
    $$("#tab-radar [data-extra]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.extra;
      radarExtra = radarExtra.includes(id) ? radarExtra.filter((x) => x !== id) : [...radarExtra, id].slice(-3);
      store.set("radarExtra", radarExtra);
      renderRadar();
    }));
    $$("#tab-radar [data-clear]").forEach((b) => b.addEventListener("click", () => {
      const s = b.dataset.clear;
      if (s === "a" || s === "b") { cmp[s] = null; saveCmp(); markPair(); renderComparer(); }
      else { radarExtra = radarExtra.filter((x) => x !== s); store.set("radarExtra", radarExtra); }
      renderRadar();
    }));
    markPair();
  }

  // ---------- arbre : quels ingrédients ajouter ensuite ? ----------
  // Un nœud = un ensemble d'ingrédients (racine + chemin). Le chemin ne mène qu'à des recettes qui contiennent TOUS ses ingrédients :
  // une suggestion doit apparaître dans au moins une de ces recettes « compatibles » (pas d'œufs sur la route des churros).
  // Classement : recettes compatibles rendues faisables, puis à 1 ingrédient manquant, puis à 2, puis fréquence.
  // Les farines forment une famille : un seul bloc « Farine » dont on choisit le type, chaque type ouvrant son propre sous-arbre.
  // À droite, la liste des recettes suit le nœud sélectionné : celles qui ne contiennent plus tout le chemin sont grisées.
  const STAPLES = ["sel", "eau"];
  const FLOURS = ["farine", "sarrasin", "mais", "avoine"];
  const FLOUR_SHORT = { farine: { nom: "blé", en: "wheat" }, sarrasin: { nom: "sarrasin", en: "buckwheat" }, mais: { nom: "maïs", en: "corn" }, avoine: { nom: "avoine", en: "oats" } };
  const FLOUR_FAMILY = { nom: "Farine", en: "Flour" };
  let treeRoot = store.get("treeRoot", ["farine"]);        // ["pantry"] = partir du garde-manger
  let treeOpen = new Set(store.get("treeOpen", []));
  let treeSel = store.get("treeSel", {});                  // type de farine choisi par nœud parent
  let treeStaples = store.get("treeStaples", true);
  let treeCur = store.get("treeCur", "");                  // clé du nœud sélectionné ("" = racine)
  const MAX_DEPTH = 8;

  const treeBase = (path) => {
    const s = new Set(treeRoot[0] === "pantry" ? [...pantry] : treeRoot);
    path.forEach((k) => s.add(k));
    if (treeStaples) STAPLES.forEach((k) => s.add(k));
    return s;
  };
  const treeReq = (path) => (treeRoot[0] === "pantry" ? [] : [...treeRoot]).concat(path);   // ingrédients que la recette doit contenir
  const treePool = (path) => { const req = treeReq(path); return REC.filter((r) => req.every((k) => r.ing[k] !== undefined)); };
  const doable = (have, pool = REC) => pool.filter((r) => keys(r).every((k) => have.has(k)));
  function gainOf(i, have, pool) {
    const unlocked = []; let n1 = 0, n2 = 0, cnt = 0;
    for (const r of pool) {
      if (r.ing[i.id] === undefined) continue;
      cnt++;
      const after = keys(r).filter((k) => !have.has(k)).length - 1;
      if (after === 0) unlocked.push(r); else if (after === 1) n1++; else if (after === 2) n2++;
    }
    return { i, unlocked, n1, n2, cnt, score: unlocked.length * 10000 + n1 * 100 + n2 + cnt / 1000 };
  }
  function treeSuggest(have, pool) {
    const cands = ING.filter((i) => !have.has(i.id)).map((i) => gainOf(i, have, pool)).filter((c) => c.cnt > 0);
    const flours = cands.filter((c) => FLOURS.includes(c.i.id)).sort((a, b) => b.score - a.score);
    const out = cands.filter((c) => !FLOURS.includes(c.i.id));
    if (flours.length) out.push({ ...flours[0], best: flours[0], members: [...flours].sort((a, b) => FLOURS.indexOf(a.i.id) - FLOURS.indexOf(b.i.id)), hasFlour: FLOURS.some((f) => have.has(f)) });
    return out.sort((a, b) => b.score - a.score).slice(0, 3);
  }
  const rtags = (list, max = 4) => list.slice(0, max).map((r) => `<button class="rtag" data-rid="${r.id}" data-rpick="${r.id}" title="Comparer (A/B)">${nm(r)}</button>`).join("") + (list.length > max ? `<span class="hint"> +${list.length - max}</span>` : "");

  function treeNode(path, s, parentKey) {
    const key = path.join(">"), open = treeOpen.has(key), have = treeBase(path), pool = treePool(path), done = doable(have, pool);
    const kids = open && path.length < MAX_DEPTH ? treeSuggest(have, pool) : [];
    const gain = `<div class="gain">${s.unlocked.length ? `<span class="ok">+${s.unlocked.length} faisable${s.unlocked.length > 1 ? "s" : ""}</span>` : ""}${s.n1 ? `<span title="Recettes auxquelles il ne manquerait plus qu'un ingrédient">${s.n1} presque</span>` : ""}${s.n2 ? `<span title="Recettes auxquelles il manquerait encore 2 ingrédients">${s.n2} à 2 près</span>` : ""}${!s.unlocked.length && !s.n1 && !s.n2 ? `<span>${s.cnt} recette${s.cnt > 1 ? "s" : ""}</span>` : ""}</div>`;
    const newly = s.unlocked.length ? `<div class="rtags">${rtags(s.unlocked, 3)}</div>` : "";
    const title = s.members ? nm({ nom: s.hasFlour ? "Autre farine" : "Farine", en: s.hasFlour ? "Other flour" : "Flour" }) : nm(s.i);
    const picker = s.members ? `<div class="ftypes" role="group" aria-label="Type de farine">${s.members.map((m) => `<button class="ft${m.i.id === s.i.id ? " on" : ""}" data-ftype="${m.i.id}" data-fparent="${parentKey}" title="${m.unlocked.length} faisable(s), ${m.n1} presque">${nm(FLOUR_SHORT[m.i.id])}</button>`).join("")}</div>` : "";
    return `<li><div class="tn${open ? " open" : ""}${key === treeCur ? " cur" : ""}" data-key="${key}" role="button" tabindex="0" aria-expanded="${open}" title="${open ? "Replier" : "Voir la suite"}">
        <strong>${title}</strong>${picker}${gain}${newly}
        <div class="total">${done.length} faisable${done.length > 1 ? "s" : ""} sur ${pool.length} possible${pool.length > 1 ? "s" : ""}</div></div>
      ${open ? (kids.length ? `<ul>${kids.map((k) => treeChild(path, k, key)).join("")}</ul>` : `<div class="hint end">${path.length >= MAX_DEPTH ? "Profondeur maximale." : "Chemin complet : rien à ajouter."}</div>`) : ""}</li>`;
  }
  // Pour une famille de farines, le type retenu (choix de l'utilisateur, sinon le meilleur) devient l'ingrédient du chemin.
  function treeChild(path, s, parentKey) {
    if (!s.members) return treeNode([...path, s.i.id], s, parentKey);
    const chosen = s.members.find((m) => m.i.id === treeSel[parentKey]) || s.best; // sinon le type le plus utile
    return treeNode([...path, chosen.i.id], { ...chosen, members: s.members, hasFlour: s.hasFlour }, parentKey);
  }

  // Liste des recettes pour le nœud sélectionné : compatibles d'abord (faisables en tête), les autres grisées.
  function treeList(path) {
    const have = treeBase(path), req = treeReq(path), reqNames = req.map((k) => nm(ing(k)));
    const rows = REC.map((r) => {
      const ok = req.every((k) => r.ing[k] !== undefined), miss = keys(r).filter((k) => !have.has(k));
      return { r, ok, miss, gone: req.filter((k) => r.ing[k] === undefined) };
    }).sort((a, b) => b.ok - a.ok || (a.ok ? a.miss.length - b.miss.length : a.gone.length - b.gone.length) || nt(a.r).localeCompare(nt(b.r), lang === "en" ? "en" : "fr"));
    const n = rows.filter((x) => x.ok).length;
    return `<aside class="tree-list"><h3>Recettes</h3>
      <p class="hint" style="margin:0 0 .5rem">${reqNames.length ? `Chemin : <strong>${reqNames.join(" + ")}</strong>. ` : ""}${n} compatible${n > 1 ? "s" : ""} sur ${REC.length}.</p>
      <ul>${rows.map(({ r, ok, miss, gone }) => `<li class="${ok ? (miss.length ? "near" : "done") : "off"}"><button class="rl" data-rid="${r.id}" data-rpick="${r.id}" title="Comparer (A/B)">${nm(r)}</button>
        <span class="st">${!ok ? `sans ${gone.map((k) => nm(ing(k))).join(", ")}` : miss.length ? `manque ${miss.map((k) => nm(ing(k))).join(", ")}` : "✓ faisable"}</span></li>`).join("")}</ul></aside>`;
  }

  function renderArbre() {
    const startPantry = treeRoot[0] === "pantry", flourRoot = FLOURS.includes(treeRoot[0]);
    if (treeCur && !treeOpen.has(treeCur)) treeCur = "";
    const have0 = treeBase([]), pool0 = treePool([]), done0 = doable(have0, pool0), kids0 = treeSuggest(have0, pool0);
    const curPath = treeCur ? treeCur.split(">") : [];
    // Le premier nœud est lui-même un sélecteur : on part de n'importe quel ingrédient (les farines forment une famille) ou du garde-manger.
    const opts = ING.filter((x) => !FLOURS.includes(x.id)).map((x) => ({ v: x.id, t: nt(x) }));
    opts.push({ v: flourRoot ? treeRoot[0] : "farine", t: nt(FLOUR_FAMILY) });
    opts.sort((x, y) => x.t.localeCompare(y.t, lang === "en" ? "en" : "fr"));
    $("#tab-arbre").innerHTML = `
      <div class="ctl" style="margin-bottom:.8rem">
        <button class="btn" id="treeReset">Replier tout</button>
        <label><input type="checkbox" id="treeStaples" ${treeStaples ? "checked" : ""}> Sel et eau toujours disponibles</label>
      </div>
      <p class="hint" style="margin:0 0 .8rem">Choisissez l'ingrédient de départ dans le premier bloc, puis touchez une suggestion pour développer l'étape suivante. Le chemin ne propose que des ingrédients présents dans une recette qui contient tout le chemin ; la liste à droite grise les recettes écartées. Dans un bloc « Farine », choisissez le type : chaque type ouvre un sous-arbre différent.</p>
      <div class="tree-layout">
      <div class="tree-wrap"><div class="tree"><ul><li>
        <div class="tn root${treeCur === "" ? " cur" : ""}" data-key="">
          <span class="hint">Je pars de</span>
          <select id="rootSel" class="rootsel" aria-label="Ingrédient de départ">
            <option value="pantry"${startPantry ? " selected" : ""}>🧺 Mon garde-manger (${pantry.size})</option>
            ${opts.map((o) => `<option value="${o.v}"${!startPantry && o.v === treeRoot[0] ? " selected" : ""}>${o.t}</option>`).join("")}
          </select>
          ${flourRoot ? `<div class="ftypes" role="group" aria-label="Type de farine">${FLOURS.map((f) => `<button class="ft${treeRoot[0] === f ? " on" : ""}" data-rtype="${f}">${nm(FLOUR_SHORT[f])}</button>`).join("")}</div>` : ""}
          <div class="total">${done0.length} faisable${done0.length > 1 ? "s" : ""} sur ${pool0.length} possible${pool0.length > 1 ? "s" : ""}</div>${done0.length ? `<div class="rtags">${rtags(done0, 4)}</div>` : ""}
        </div>
        ${kids0.length ? `<ul>${kids0.map((k) => treeChild([], k, "")).join("")}</ul>` : `<div class="hint end">Rien à ajouter.</div>`}
      </li></ul></div></div>
      ${treeList(curPath)}</div>`;
    const saveOpen = () => store.set("treeOpen", [...treeOpen]);
    const setCur = (k) => { treeCur = k; store.set("treeCur", k); };
    $("#rootSel").addEventListener("change", (e) => { treeRoot = [e.target.value]; treeOpen = new Set(); setCur(""); store.set("treeRoot", treeRoot); saveOpen(); renderArbre(); });
    // Changer de type de farine à la racine garde les branches ouvertes, mais le chemin sélectionné peut devenir caduc.
    $$("#tab-arbre [data-rtype]").forEach((b) => b.addEventListener("click", () => { treeRoot = [b.dataset.rtype]; store.set("treeRoot", treeRoot); renderArbre(); }));
    $("#treeReset").addEventListener("click", () => { treeOpen = new Set(); setCur(""); saveOpen(); renderArbre(); });
    $("#treeStaples").addEventListener("change", (e) => { treeStaples = e.target.checked; store.set("treeStaples", treeStaples); renderArbre(); });
    $$("#tab-arbre .tn[data-key]").forEach((el) => {
      // Un clic ouvre le nœud et le sélectionne ; un clic sur le nœud déjà sélectionné le referme (la sélection remonte d'un cran).
      const toggle = () => {
        const k = el.dataset.key;
        if (k === "") { setCur(""); renderArbre(); return; }
        if (treeOpen.has(k) && treeCur === k) { treeOpen.delete(k); setCur(k.split(">").slice(0, -1).join(">")); }
        else { treeOpen.add(k); setCur(k); }
        saveOpen(); renderArbre();
      };
      el.addEventListener("click", (e) => { if (!e.target.closest("[data-rpick],[data-ftype],select,[data-rtype]")) toggle(); });
      el.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !e.target.closest("[data-ftype],select,[data-rtype]")) { e.preventDefault(); toggle(); } });
    });
    $$("#tab-arbre [data-rpick]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); pick(b.dataset.rpick); }));
    $$("#tab-arbre [data-ftype]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const parent = b.dataset.fparent, node = b.closest(".tn"), oldKey = node.dataset.key;
      const newKey = [...oldKey.split(">").slice(0, -1), b.dataset.ftype].join(">");
      treeSel[parent] = b.dataset.ftype;
      store.set("treeSel", treeSel);
      // Si le nœud était ouvert, on ouvre aussi le même nœud avec le nouveau type.
      if (treeOpen.has(oldKey)) { treeOpen.delete(oldKey); treeOpen.add(newKey); saveOpen(); }
      if (treeCur === oldKey) setCur(newKey);
      renderArbre();
    }));
    // L'arbre peut être plus large que l'écran : on centre la racine.
    const wrap = $("#tab-arbre .tree-wrap"), root = $("#tab-arbre .tn.root");
    if (wrap && root && !wrap.hidden && wrap.clientWidth) wrap.scrollLeft = root.offsetLeft + root.offsetWidth / 2 - wrap.clientWidth / 2;
    markPair();
  }

  // ---------- langue ----------
  function renderAll() { renderPlacard(); renderReseau(); renderArbre(); renderMatrice(); renderComparer(); renderRadar(); }
  function syncLang() { $$("#lang [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang))); document.documentElement.dataset.lang = lang; }
  $$("#lang [data-lang]").forEach((b) => b.addEventListener("click", () => { lang = b.dataset.lang; store.set("lang", lang); syncLang(); renderAll(); }));

  // ---------- onglets ----------
  function showTab(name) {
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    $$(".panel").forEach((p) => (p.hidden = p.id !== "tab-" + name));
    store.set("tab", name);
    if (name === "reseau") renderReseau(); // l'onglet doit être visible pour mesurer le SVG
    if (name === "arbre") renderArbre(); // le garde-manger a pu changer entre-temps
    if (name === "radar") renderRadar(); // la paire A/B a pu changer entre-temps
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  syncLang();
  renderPlacard();
  renderArbre();
  renderMatrice();
  renderComparer();
  renderRadar();
  const tab = location.hash.slice(1) || store.get("tab", "placard");
  showTab($(`.tabs [data-tab="${tab}"]`) ? tab : "placard");
})();
