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
  const FLOUR_LABEL = { farine: "Farine de blé", sarrasin: "Sarrasin", mais: "Maïs", aucune: "Sans farine" };
  const similarTo = (r) => REC.filter((o) => o !== r).map((o) => ({ r: o, s: SIM[idx(r)][idx(o)] })).sort((x, y) => y.s - x.s);

  // ---------- garde-manger ----------
  const BASE = ["farine", "oeufs", "lait", "beurre", "sel", "sucre", "levure", "huile"];
  let pantry = new Set(store.get("placard", BASE));
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
            ${cats.map((c) => `<h3 style="margin-top:.8rem">${CAT_LABEL[c] || c}</h3><div class="chips">${ING.filter((i) => i.cat === c).map((i) => `<button class="chip" data-ing="${i.id}" aria-pressed="${pantry.has(i.id)}">${i.nom}</button>`).join("")}</div>`).join("")}
          </div>
          <div class="card unlock">
            <h3>🔓 Ce qui débloque le plus</h3>
            ${gain.length ? `<ul>${gain.map((g) => `<li><button class="chip miss" data-ing="${g.i.id}" title="Ajouter à mon garde-manger">+ ${g.i.nom}</button>${g.unlocks.length ? ` débloque <strong>${g.unlocks.map((r) => r.nom).join(", ")}</strong>` : ""}${g.near ? ` <small>(+${g.near} presque)</small>` : ""}</li>`).join("")}</ul>` : `<p class="hint">Rien à débloquer avec un seul ingrédient.</p>`}
          </div>
        </div>
        <div>
          <p class="hint"><strong>${ready}</strong> recette${ready > 1 ? "s" : ""} faisable${ready > 1 ? "s" : ""} sur ${REC.length}. Touchez un ingrédient manquant pour l'ajouter.</p>
          <div class="recipes">${sorted.map((r) => {
            const m = missing(r), p = Math.round(completion(r) * 100);
            return `<div class="rcard${m.length ? "" : " ready"}">
              <h3><span>${r.nom}</span><span class="pct">${p} %</span></h3>
              <div class="bar"><i style="width:${p}%"></i></div>
              ${m.length ? `<div class="chips" style="margin:0">${m.map((k) => `<button class="chip miss" data-ing="${k}">+ ${ing(k).nom}</button>`).join("")}</div>` : `<span class="chip have">✓ Tout est là</span>`}
              <details><summary class="hint">Quantités</summary>${keys(r).map((k) => `<div class="hint" style="margin:0">${ing(k).nom} : ${qty(k, r.ing[k])}</div>`).join("")}</details>
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
  const W = 800, H = 560;
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

  const radius = (r) => 9 + keys(r).length * 1.1;
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
              return `<g class="${cls}" data-i="${i}"><circle r="${radius(n.r)}" style="fill:var(--c-${mainFlour(n.r)});fill-opacity:${op}"/><text y="${radius(n.r) + 12}">${n.r.nom}</text></g>`;
            }).join("")}
          </svg>
          <div class="legend">${Object.keys(FLOUR_LABEL).map((k) => `<span><i style="background:var(--c-${k})"></i>${FLOUR_LABEL[k]}</span>`).join("")}<span>Taille = nombre d'ingrédients</span></div>
          <p class="hint">Plus deux recettes se ressemblent, plus elles sont proches. Glissez une pastille pour la déplacer, touchez-la pour la sélectionner.</p>
        </div>
        <div class="card">
          <h2>${selected.nom}</h2>
          <p class="hint">${keys(selected).map((k) => `${ing(k).nom} ${qty(k, selected.ing[k])}`).join(" · ")}</p>
          ${m.length ? `<p>Il vous manque : ${m.map((k) => `<span class="chip miss" style="cursor:default">${ing(k).nom}</span>`).join(" ")}</p>` : `<p><span class="chip have">✓ Faisable avec mon garde-manger</span></p>`}
          <h3>Recettes les plus proches</h3>
          ${sim.slice(0, 6).map(({ r, s }) => {
            const shared = keys(r).filter((k) => selected.ing[k] !== undefined && !["sel"].includes(k)).map((k) => ing(k).nom);
            return `<div class="sim-row" data-r="${r.id}"><span>${r.nom}<br><small class="hint">en commun : ${shared.join(", ") || "—"}</small></span><strong>${Math.round(s * 100)} %</strong></div>`;
          }).join("")}
          <button class="btn" id="goCmp" style="margin-top:.8rem">⚖️ Comparer avec ${sim[0].r.nom}</button>
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
      <div class="mx-wrap"><table class="mx"><thead><tr><th class="rn">Recette</th>${ING.map((i) => `<th data-ing="${i.id}" class="${pantry.has(i.id) ? "on" : ""}" title="${i.unite}">${i.nom}<br><small>${i.unite || "pièces"}</small></th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr><td class="rn">${r.nom}</td>${ING.map((i) => {
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
    const onlyA = all.filter((i) => B.ing[i.id] === undefined).map((i) => i.nom);
    const onlyB = all.filter((i) => A.ing[i.id] === undefined).map((i) => i.nom);
    const common = all.filter((i) => A.ing[i.id] !== undefined && B.ing[i.id] !== undefined);
    const diffq = common.filter((i) => A.ing[i.id] !== B.ing[i.id]).map((i) => i.nom);
    const s = Math.round(SIM[idx(A)][idx(B)] * 100);
    const rA = ratios(A), rB = ratios(B);
    const opts = (cur) => REC.map((r) => `<option value="${r.id}"${r.id === cur ? " selected" : ""}>${r.nom}</option>`).join("");
    const metaRow = (label, k, unit) => (A.meta[k] !== undefined || B.meta[k] !== undefined) ? `<tr><td>${label}</td><td>${A.meta[k] !== undefined ? A.meta[k] + unit : "—"}</td><td>${B.meta[k] !== undefined ? B.meta[k] + unit : "—"}</td><td class="d"></td></tr>` : "";
    const barMax = (id) => Math.max(A.ing[id] || 0, B.ing[id] || 0) || 1;

    $("#tab-comparer").innerHTML = `
      <div class="sel-row">
        <select id="ca" aria-label="Recette A">${opts(cmpA)}</select> <strong>⇄</strong> <select id="cb" aria-label="Recette B">${opts(cmpB)}</select>
        <button class="btn" id="swap">Échanger</button>
        <span class="chip have" style="cursor:default">Similarité ${s} %</span>
      </div>
      <div class="diffnote"><strong>${B.nom}</strong> par rapport à <strong>${A.nom}</strong> :
        ${onlyB.length ? `ajoute <strong>${onlyB.join(", ")}</strong>` : "n'ajoute aucun ingrédient"}${onlyA.length ? `, retire <strong>${onlyA.join(", ")}</strong>` : ""}${diffq.length ? `, et change les quantités de ${diffq.join(", ")}` : ""}.</div>
      <div class="card" style="overflow-x:auto"><table class="cmp">
        <thead><tr><th>Ingrédient</th><th>${A.nom}</th><th>${B.nom}</th><th>Écart</th></tr></thead>
        <tbody>${all.map((i) => {
          const a = A.ing[i.id], b = B.ing[i.id], m = barMax(i.id);
          const d = a !== undefined && b !== undefined ? (b - a === 0 ? "=" : (b - a > 0 ? "+" : "") + +(b - a).toFixed(1)) : a === undefined ? "nouveau" : "retiré";
          return `<tr><td>${i.nom}${i.unite ? ` <small class="hint">(${i.unite})</small>` : ""}</td>
            <td>${a !== undefined ? `<div class="pair">${a}<span class="b" style="width:${Math.round((a / m) * 60)}px"></span></div>` : "—"}</td>
            <td>${b !== undefined ? `<div class="pair">${b}<span class="b b2" style="width:${Math.round((b / m) * 60)}px"></span></div>` : "—"}</td>
            <td class="d">${d}</td></tr>`;
        }).join("")}
        ${metaRow("Four", "four", " °C")}${metaRow("Cuisson", "cuisson", " min")}${metaRow("Température de l'eau/lait", "temp", "")}
        </tbody></table></div>
      <div class="card"><h3>Proportions (pour 1 g de farine)</h3>
        ${rA && rB ? `<table class="cmp"><thead><tr><th></th><th>${A.nom}</th><th>${B.nom}</th></tr></thead><tbody>
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

  // ---------- onglets ----------
  function showTab(name) {
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    $$(".panel").forEach((p) => (p.hidden = p.id !== "tab-" + name));
    store.set("tab", name);
    if (name === "reseau") renderReseau(); // l'onglet doit être visible pour mesurer le SVG
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  renderPlacard();
  renderMatrice();
  renderComparer();
  const tab = location.hash.slice(1) || store.get("tab", "placard");
  showTab($(`.tabs [data-tab="${tab}"]`) ? tab : "placard");
})();
