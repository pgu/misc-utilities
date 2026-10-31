(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const legume = (id) => LEGUMES.find((l) => l.id === id);
  const groupe = (id) => GROUPES.find((g) => g.id === id);
  const nowMonth = new Date().getMonth() + 1;

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("potager:" + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("potager:" + key, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
    },
  };

  const cropButton = (l) => `<button class="crop-btn" data-crop="${l.id}">${l.emoji} ${l.nom}</button>`;

  // ---------- onglets ----------
  function showTab(name) {
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    $$(".panel").forEach((p) => (p.hidden = p.id !== "tab-" + name));
    store.set("tab", name);
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  // ---------- fiche légume ----------
  const dialog = $("#fiche");
  function openFiche(id) {
    const l = legume(id);
    if (!l) return;
    const g = groupe(l.groupe);
    const cells = MOIS_COURT.map((m, i) => {
      const n = i + 1;
      return `<div title="${MOIS[i]}">${m[0]}${["s", "p", "r"].map((k) => (l[k].includes(n) ? `<b class="${k}"></b>` : "")).join("")}</div>`;
    }).join("");
    dialog.innerHTML = `
      <button class="close" aria-label="Fermer">×</button>
      <h2>${l.emoji} ${l.nom}</h2>
      <p class="hint">${g ? g.emoji + " " + g.nom : "Hors rotation (vivace / complément)"} · ${l.famille}</p>
      <div class="mini-cal">${cells}</div>
      <p class="legend"><span><i style="background:var(--semis)"></i>Semis</span><span><i style="background:var(--plant)"></i>Plantation</span><span><i style="background:var(--recolte)"></i>Récolte</span></p>
      <dl>
        <dt>Exposition</dt><dd>${l.soleil}</dd>
        <dt>Espacement</dt><dd>${l.espace}</dd>
        <dt>Durée</dt><dd>${l.duree}</dd>
        <dt>Amis</dt><dd>${l.amis}</dd>
        <dt>À éviter</dt><dd>${l.ennemis}</dd>
      </dl>
      <p>${l.conseil}</p>`;
    $(".close", dialog).addEventListener("click", () => dialog.close());
    dialog.showModal();
  }
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-crop]");
    if (b) openFiche(b.dataset.crop);
  });

  // ---------- Ce mois-ci ----------
  function renderMois(month) {
    const t = TACHES[month - 1];
    const list = (key, label) => {
      const items = LEGUMES.filter((l) => l[key].includes(month));
      return `<div class="card"><span class="badge ${key}">${label}</span>
        ${items.length ? `<ul class="crop-list">${items.map((l) => `<li>${cropButton(l)}</li>`).join("")}</ul>` : `<p class="hint">Rien ce mois-ci.</p>`}</div>`;
    };
    $("#tab-mois").innerHTML = `
      <div class="chips" role="group" aria-label="Choisir le mois">
        ${MOIS.map((m, i) => `<button class="chip${i + 1 === nowMonth ? " now" : ""}" data-month="${i + 1}" aria-pressed="${i + 1 === month}">${m}</button>`).join("")}
      </div>
      <div class="card">
        <span class="season-tag">${t.saison}${month === nowMonth ? " · maintenant" : ""}</span>
        <h2>${MOIS[month - 1]} : ${t.titre}</h2>
        <ul class="tasks">${t.taches.map((x) => `<li>${x}</li>`).join("")}</ul>
      </div>
      <div class="why"><strong>💡 Pourquoi ?</strong>${t.pourquoi}</div>
      <h3 style="margin-top:1.2rem">Au potager en ${MOIS[month - 1].toLowerCase()}</h3>
      <div class="grid">${list("s", "À semer")}${list("p", "À planter / repiquer")}${list("r", "À récolter")}</div>`;
    $$("#tab-mois [data-month]").forEach((b) => b.addEventListener("click", () => renderMois(+b.dataset.month)));
  }

  // ---------- Plan & rotation ----------
  // Unités du SVG = 10 cm. Quatre carrés de 4,5 m séparés par une croix de sentiers de 1 m ;
  // chaque carré contient 3 planches de 1,2 m (sentiers de 45 cm entre elles).
  const QUADS = [[0, 0], [55, 0], [0, 55], [55, 55]];
  const QUAD = 45, BED_W = 12, BED_GAP = 16.5;

  function renderPlan(year, selected) {
    const groupOf = (q, y) => GROUPES[(q + y - 1) % 4];
    const quads = QUADS.map(([x, y], q) => {
      const g = groupOf(q, year);
      const beds = g.planches.map((id, i) => {
        const l = legume(id);
        const bx = x + i * BED_GAP;
        return `<rect class="bed" x="${bx}" y="${y}" width="${BED_W}" height="${QUAD}" rx="1" fill="${g.couleur}"/>
          <text class="emo" x="${bx + BED_W / 2}" y="${y + 18}">${l.emoji}</text>
          <text class="lbl" x="${bx + BED_W / 2}" y="${y + 24}">${l.nom.split(" ")[0].replace(/[,…]/g, "")}</text>`;
      }).join("");
      return `<g class="quad${q === selected ? " on" : ""}" data-q="${q}" tabindex="0" role="button" aria-label="Carré ${q + 1} : ${g.nom}">
        ${beds}<rect class="sel" x="${x - .5}" y="${y - .5}" width="${QUAD + 1}" height="${QUAD + 1}" rx="2"/></g>`;
    }).join("");

    const sel = groupOf(selected, year);
    const next = groupOf(selected, year + 1);
    const prev = groupOf(selected, year - 1 + 4);
    $("#tab-plan").innerHTML = `
      <p class="hint">Un potager de 100 m² divisé en 4 carrés de rotation. Chaque année, les cultures « avancent » d'un carré. Touchez un carré pour le détail.</p>
      <div class="year-ctl">
        <label for="year"><strong>Année <span id="yv">${year}</span></strong></label>
        <input id="year" type="range" min="1" max="4" value="${year}" aria-label="Année de rotation">
      </div>
      <div class="plan-wrap">
        <svg class="plan" viewBox="-4 -4 108 108" role="img" aria-label="Plan du potager de 10 par 10 mètres">
          ${quads}
          <rect x="46" y="46" width="8" height="8" rx="1" fill="#8a5a2b" stroke="rgba(0,0,0,.3)" stroke-width=".3"/>
          <text class="emo" x="50" y="51.5">♻️</text>
          <text class="dim" x="50" y="-1.2">10 m</text>
          <text class="dim" x="-2" y="50" transform="rotate(-90 -2 50)">10 m</text>
        </svg>
        <div>
          <div class="card">
            <span class="season-tag">Carré ${selected + 1}, année ${year}</span>
            <h2>${sel.emoji} ${sel.nom}</h2>
            <p>${sel.role}</p>
            <ul class="crop-list">${sel.planches.map((id) => `<li>${cropButton(legume(id))}</li>`).join("")}</ul>
            <p class="hint" style="margin-top:.8rem">Avant : ${prev.emoji} ${prev.nom} → Après : ${next.emoji} ${next.nom}.<br>${sel.suite}</p>
          </div>
          <div class="why"><strong>💡 Pourquoi tourner ?</strong>Une même famille au même endroit accumule maladies et parasites, et épuise les mêmes réserves du sol. En alternant légumineuses, feuilles, fruits et racines, on équilibre les besoins et on casse les cycles des ravageurs.</div>
          <div class="legend">${GROUPES.map((g) => `<span><i style="background:${g.couleur}"></i>${g.nom}</span>`).join("")}<span><i style="background:#8a5a2b"></i>Composteur</span></div>
          <p class="hint" style="margin-top:.8rem">Planches de 1,20 m × 4,50 m, sentiers de 45 cm (12 planches, ≈ 65 m² cultivés). Les aromatiques et fraisiers se placent en bordure, les fleurs (œillet d'Inde, capucine, soucis) entre les planches.</p>
        </div>
      </div>`;
    $("#year").addEventListener("input", (e) => { store.set("annee", +e.target.value); renderPlan(+e.target.value, selected); });
    $$("#tab-plan .quad").forEach((el) => {
      const pick = () => renderPlan(year, +el.dataset.q);
      el.addEventListener("click", pick);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
  }

  // ---------- Calendrier ----------
  function renderCalendrier(filter) {
    const rows = LEGUMES.filter((l) => filter === "tous" || l.groupe === filter);
    const head = MOIS_COURT.map((m, i) => `<th class="${i + 1 === nowMonth ? "now" : ""}">${m}</th>`).join("");
    const body = rows.map((l) => `<tr><td class="name" data-crop="${l.id}">${l.emoji} ${l.nom}</td>${
      MOIS_COURT.map((_, i) => {
        const n = i + 1;
        return `<td class="m${n === nowMonth ? " now" : ""}">${["s", "p", "r"].map((k) => (l[k].includes(n) ? `<span class="${k}"></span>` : "")).join("")}</td>`;
      }).join("")
    }</tr>`).join("");
    const filters = [["tous", "Tous"], ...GROUPES.map((g) => [g.id, g.emoji + " " + g.nom]), ["autre", "Autres"]];
    $("#tab-calendrier").innerHTML = `
      <div class="chips">${filters.map(([id, n]) => `<button class="chip" data-f="${id}" aria-pressed="${id === filter}">${n}</button>`).join("")}</div>
      <p class="legend"><span><i style="background:var(--semis)"></i>Semis</span><span><i style="background:var(--plant)"></i>Plantation</span><span><i style="background:var(--recolte)"></i>Récolte</span></p>
      <div class="cal-wrap"><table class="cal"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="hint">La colonne surlignée est le mois en cours. Touchez un légume pour sa fiche.</p>`;
    $$("#tab-calendrier [data-f]").forEach((b) => b.addEventListener("click", () => renderCalendrier(b.dataset.f)));
  }

  // ---------- Légumes ----------
  function renderLegumes(query) {
    const q = (query || "").trim().toLowerCase();
    const items = LEGUMES.filter((l) => !q || l.nom.toLowerCase().includes(q) || l.famille.toLowerCase().includes(q));
    $("#tab-legumes").innerHTML = `
      <input class="search" type="search" placeholder="Rechercher un légume ou une famille…" value="${q}" aria-label="Rechercher">
      <div class="grid" style="margin-top:1rem">${items.map((l) => `
        <button class="card veg-card" data-crop="${l.id}">
          <span class="emoji">${l.emoji}</span><strong>${l.nom}</strong><br>
          <small>${l.famille} · ${l.duree}</small>
        </button>`).join("") || `<p class="hint">Aucun résultat.</p>`}</div>`;
    const input = $("#tab-legumes .search");
    input.addEventListener("input", () => {
      const pos = input.selectionStart;
      renderLegumes(input.value);
      const n = $("#tab-legumes .search");
      n.focus(); n.setSelectionRange(pos, pos);
    });
  }

  // ---------- Démarrer ----------
  function renderDemarrer() {
    const done = new Set(store.get("checks", []));
    const cats = [...new Set(DEMARRAGE.map((d) => d.cat))];
    const pct = Math.round((done.size / DEMARRAGE.length) * 100);
    $("#tab-demarrer").innerHTML = `
      <div class="card">
        <h2>Créer son potager en automne</h2>
        <p>L'automne est un bon moment pour démarrer : le sol est encore tiède, il pleut, et on peut préparer le terrain tout l'hiver sans stress. Méthode proposée : <strong>culture sur sol vivant</strong> (sans bêcher), qui économise votre dos et protège la vie du sol.</p>
        <div class="progress" aria-label="Progression"><div style="width:${pct}%"></div></div>
        <p class="hint">${done.size} / ${DEMARRAGE.length} étapes — votre progression est sauvegardée dans ce navigateur.</p>
      </div>
      ${cats.map((c) => `<div class="card"><h3>${c}</h3>${DEMARRAGE.filter((d) => d.cat === c).map((d) => `
        <label class="check${done.has(d.id) ? " done" : ""}"><input type="checkbox" data-id="${d.id}"${done.has(d.id) ? " checked" : ""}><span>${d.txt}</span></label>`).join("")}</div>`).join("")}
      <div class="why"><strong>💡 Pourquoi ne pas bêcher ?</strong>Chaque coup de bêche remonte des graines d'adventices, détruit les galeries de vers de terre et le réseau de champignons du sol. En couvrant avec du carton puis du compost, l'herbe en dessous meurt de privation de lumière et se décompose : la terre s'ameublit seule, sans effort.</div>`;
    $$("#tab-demarrer input").forEach((cb) => cb.addEventListener("change", () => {
      cb.checked ? done.add(cb.dataset.id) : done.delete(cb.dataset.id);
      store.set("checks", [...done]);
      renderDemarrer();
    }));
  }

  // ---------- Quiz ----------
  function renderQuiz(i, score) {
    const el = $("#tab-quiz");
    if (i >= QUIZ.length) {
      el.innerHTML = `<div class="card"><h2>Résultat : ${score} / ${QUIZ.length}</h2>
        <p>${score === QUIZ.length ? "Sans faute ! Vous pouvez vous lancer." : score >= QUIZ.length / 2 ? "Bien joué. Relisez les onglets « Ce mois-ci » et « Plan & rotation »." : "Pas de souci : parcourez les onglets puis réessayez."}</p>
        <button class="btn" id="again">Recommencer</button></div>`;
      $("#again").addEventListener("click", () => renderQuiz(0, 0));
      return;
    }
    const q = QUIZ[i];
    el.innerHTML = `<div class="card">
      <span class="season-tag">Question ${i + 1} / ${QUIZ.length}</span>
      <h2>${q.q}</h2>
      ${q.options.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join("")}
      <div id="fb"></div></div>`;
    $$("#tab-quiz .opt").forEach((b) => b.addEventListener("click", () => {
      const k = +b.dataset.k, ok = k === q.bonne;
      $$("#tab-quiz .opt").forEach((o) => { o.disabled = true; if (+o.dataset.k === q.bonne) o.classList.add("ok"); });
      if (!ok) b.classList.add("ko");
      $("#fb").innerHTML = `<div class="why" style="margin-top:.8rem"><strong>${ok ? "✅ Exact !" : "❌ Pas tout à fait."}</strong>${q.expl}</div>
        <button class="btn" id="next">${i + 1 < QUIZ.length ? "Suivante" : "Voir le résultat"}</button>`;
      $("#next").addEventListener("click", () => renderQuiz(i + 1, score + (ok ? 1 : 0)));
    }));
  }

  // ---------- init ----------
  renderMois(nowMonth);
  renderPlan(store.get("annee", 1), 0);
  renderCalendrier("tous");
  renderLegumes("");
  renderDemarrer();
  renderQuiz(0, 0);
  const tab = location.hash.slice(1) || store.get("tab", "mois");
  showTab($(`.tabs [data-tab="${tab}"]`) ? tab : "mois");
})();
