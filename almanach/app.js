(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const C = ALMANACH.countries;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("almanach:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("almanach:" + k, JSON.stringify(v)); } catch (e) { /* indisponible */ } },
  };

  // ---------- dates ----------
  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const TODAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const day = (iso) => Date.parse(iso + "T00:00:00Z") / 864e5; // n° de jour absolu
  const diff = (a, b) => Math.round(day(b) - day(a));
  const addDays = (iso, n) => new Date((day(iso) + n) * 864e5).toISOString().slice(0, 10);
  const fmt = (iso, opts = { weekday: "short", day: "numeric", month: "short" }) => new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });
  const fmtLong = (iso) => fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const MOIS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const MOIS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const inDays = (n) => (n === 0 ? "aujourd'hui" : n === 1 ? "demain" : `dans ${n} jours`);

  const TYPE = {
    toussaint: "Toussaint", automne: "Automne", noel: "Noël", hiver: "Hiver", printemps: "Printemps", paques: "Pâques",
    pentecote: "Pentecôte", ete: "Été", pont: "Pont", autre: "Congé",
  };

  // Week-end long / pont possible, selon le jour de la semaine.
  function bridge(iso) {
    const wd = new Date(iso + "T00:00:00Z").getUTCDay();
    return { 1: "week-end de 3 jours", 5: "week-end de 3 jours", 2: "pont possible (lundi)", 4: "pont possible (vendredi)", 0: "tombe un dimanche", 6: "tombe un samedi" }[wd] || "";
  }

  // ---------- lignes (pays + région) ----------
  const DEFAULT_ROWS = [{ c: "FR", r: "A" }, { c: "FR", r: "B" }, { c: "FR", r: "C" }, { c: "DE", r: "NW" }, { c: "ES", r: "" }, { c: "IT", r: "" }, { c: "GB", r: "EAW" }];
  let rows = store.get("rows", DEFAULT_ROWS).filter((x) => C[x.c]);
  let year = store.get("year", ALMANACH.years.includes(now.getFullYear()) ? now.getFullYear() : ALMANACH.years[1]);
  let show = store.get("show", { pub: true, school: true });
  const regionNames = (cc) => ({ ...C[cc].regions.public, ...C[cc].regions.school });
  const rowLabel = (x) => {
    const c = C[x.c], name = x.r ? regionNames(x.c)[x.r] || x.r : "";
    return { flag: c.flag, country: c.name, region: name, text: `${c.flag} ${c.name}${name ? " · " + name : ""}` };
  };
  const forRow = (x, list) => list.filter((h) => (x.r ? !h.r || h.r.includes(x.r) : !h.r));
  const publicOf = (x) => forRow(x, C[x.c].public);
  const schoolOf = (x) => forRow(x, C[x.c].school);

  function renderRows() {
    const opts = Object.entries(C).map(([k, c]) => `<option value="${k}">${c.flag} ${c.name}</option>`).join("");
    $("#rows").innerHTML = `
      <h3>Lignes affichées</h3>
      <div class="rowchips">${rows.map((x, i) => `<span class="rchip">${rowLabel(x).text}<button data-del="${i}" aria-label="Retirer">✕</button></span>`).join("") || `<span class="hint">Aucune ligne : ajoutez un pays.</span>`}</div>
      <div class="addrow">
        <select id="ac" aria-label="Pays">${opts}</select>
        <select id="ar" aria-label="Région"></select>
        <button class="btn primary" id="add">+ Ajouter</button>
        <button class="btn" id="reset">Réinitialiser</button>
      </div>`;
    const fillRegions = () => {
      const cc = $("#ac").value, regs = regionNames(cc);
      $("#ar").innerHTML = `<option value="">${Object.keys(regs).length ? "National (sans région)" : "National"}</option>` + Object.entries(regs).map(([k, n]) => {
        const kind = C[cc].regions.public[k] && C[cc].regions.school[k] ? "" : C[cc].regions.school[k] ? " (vacances)" : " (fériés)";
        return `<option value="${k}">${n}${kind}</option>`;
      }).join("");
    };
    $("#ac").addEventListener("change", fillRegions); fillRegions();
    $("#add").addEventListener("click", () => {
      const x = { c: $("#ac").value, r: $("#ar").value };
      if (!rows.some((y) => y.c === x.c && y.r === x.r)) rows.push(x);
      saveRows();
    });
    $("#reset").addEventListener("click", () => { rows = DEFAULT_ROWS.map((x) => ({ ...x })); saveRows(); });
    $$("#rows [data-del]").forEach((b) => b.addEventListener("click", () => { rows.splice(+b.dataset.del, 1); saveRows(); }));
  }
  function saveRows() { store.set("rows", rows); renderAll(); }

  // ---------- bientôt ----------
  function nextOf(list, key) { return list.filter((h) => (h.e || h[key]) >= TODAY).sort((a, b) => (a.d || a.s).localeCompare(b.d || b.s))[0]; }
  function renderBientot() {
    $("#tab-bientot").innerHTML = rows.length ? `<div class="cards">${rows.map((x) => {
      const L = rowLabel(x);
      const pub = nextOf(publicOf(x), "d");
      const sch = nextOf(schoolOf(x), "s");
      let pubHtml = `<p class="hint">Aucun jour férié à venir dans les données.</p>`;
      if (pub) pubHtml = `<div class="big"><span class="dot" style="background:var(--pub)"></span>${pub.n}</div>
        <div class="when">${fmtLong(pub.d)} · ${inDays(diff(TODAY, pub.d))}${pub.n !== pub.en ? ` · <span title="${pub.en}">${pub.en}</span>` : ""}</div>
        <div class="lw">${bridge(pub.d)}</div>`;
      let schHtml = `<p class="hint">${C[x.c].schoolNote || (x.r ? "Aucune période à venir dans les données." : "Choisissez une région pour voir les vacances scolaires.")}</p>`;
      if (sch) {
        const cur = sch.s <= TODAY;
        schHtml = `<div class="big"><span class="dot t-${sch.t}"></span>${sch.n || TYPE[sch.t]} ${cur ? `<span class="badge now">en cours</span>` : ""}</div>
          <div class="when">${cur ? `jusqu'au ${fmt(sch.e)} (reprise ${fmt(addDays(sch.e, 1))})` : `du ${fmt(sch.s)} au ${fmt(sch.e)} · ${inDays(diff(TODAY, sch.s))}`}</div>`;
      }
      return `<div class="card"><h3><span>${L.flag} ${L.country}</span><span class="hint">${L.region}</span></h3>
        ${show.pub ? `<div><span class="hint">Prochain jour férié</span>${pubHtml}</div>` : ""}
        ${show.school ? `<div class="sect"><span class="hint">Vacances scolaires</span>${schHtml}</div>` : ""}</div>`;
    }).join("")}</div>` : `<p class="hint">Ajoutez une ligne ci-dessus.</p>`;
  }

  // ---------- année ----------
  let selected = null;
  function renderAnnee() {
    const y = year, y0 = day(`${y}-01-01`), n = day(`${y + 1}-01-01`) - y0;
    const pct = (iso) => ((day(iso) - y0) / n) * 100;
    const months = Array.from({ length: 12 }, (_, m) => ({ m, left: pct(`${y}-${pad(m + 1)}-01`), days: day(m === 11 ? `${y + 1}-01-01` : `${y}-${pad(m + 2)}-01`) - day(`${y}-${pad(m + 1)}-01`) }));
    const ml = months.slice(1).map((m) => `<i class="ml" style="left:${m.left}%"></i>`).join("");
    const todayLine = TODAY.startsWith(String(y)) ? `<i class="todayline" style="left:${pct(TODAY) + 100 / n / 2}%" title="Aujourd'hui"></i>` : "";
    const types = new Set();

    const body = rows.map((x, ri) => {
      const L = rowLabel(x);
      const bands = show.school ? schoolOf(x).filter((h) => h.e >= `${y}-01-01` && h.s <= `${y}-12-31`).map((h, i) => {
        types.add(h.t);
        const s = h.s < `${y}-01-01` ? `${y}-01-01` : h.s, e = h.e > `${y}-12-31` ? `${y}-12-31` : h.e;
        return `<button class="band t-${h.t}${selected === `${ri}s${i}` ? " sel" : ""}" data-sel="${ri}s${i}" style="left:${pct(s)}%;width:${((diff(s, e) + 1) / n) * 100}%" title="${h.n || TYPE[h.t]} : ${fmt(h.s)} → ${fmt(h.e)}"></button>`;
      }).join("") : "";
      const ticks = show.pub ? publicOf(x).filter((h) => h.d.startsWith(String(y))).map((h, i) =>
        `<button class="tick${selected === `${ri}p${i}` ? " sel" : ""}" data-sel="${ri}p${i}" style="left:${pct(h.d) + 100 / n / 2}%" title="${h.n} — ${fmt(h.d)}"></button>`).join("") : "";
      return `<div class="tl-row"><div class="tl-label"><span>${L.flag} ${L.country}</span><small>${L.region || "national"}</small></div><div class="tl-track">${ml}${bands}${ticks}${todayLine}</div></div>`;
    }).join("");

    $("#tab-annee").innerHTML = `
      <div class="ycontrols">
        <button class="btn" id="yprev" ${ALMANACH.years.includes(y - 1) ? "" : "disabled"}>◀</button>
        <strong style="font-size:1.2rem">${y}</strong>
        <button class="btn" id="ynext" ${ALMANACH.years.includes(y + 1) ? "" : "disabled"}>▶</button>
        <label><input type="checkbox" id="spub" ${show.pub ? "checked" : ""}> <span class="dot" style="background:var(--pub);margin:0"></span>Jours fériés</label>
        <label><input type="checkbox" id="ssch" ${show.school ? "checked" : ""}> Vacances scolaires</label>
      </div>
      <div class="tl-wrap"><div class="tl">
        <div class="tl-row tl-head"><div class="tl-label"></div><div class="tl-track">${months.map((m) => `<div class="m" style="width:${(m.days / n) * 100}%">${MOIS[m.m]}</div>`).join("")}</div></div>
        ${body}
      </div></div>
      <div class="legend">${show.pub ? `<span><i style="background:var(--pub);width:.6rem;height:.6rem;border-radius:50%"></i>Jour férié</span>` : ""}${show.school ? [...types].map((t) => `<span><i class="t-${t}"></i>${TYPE[t]}</span>`).join("") : ""}</div>
      <div class="detail card" id="detail"></div>`;
    $("#yprev").addEventListener("click", () => setYear(y - 1));
    $("#ynext").addEventListener("click", () => setYear(y + 1));
    $("#spub").addEventListener("change", (e) => { show.pub = e.target.checked; store.set("show", show); renderAll(); });
    $("#ssch").addEventListener("change", (e) => { show.school = e.target.checked; store.set("show", show); renderAll(); });
    $$("#tab-annee [data-sel]").forEach((b) => b.addEventListener("click", () => { selected = b.dataset.sel; showDetail(); $$("#tab-annee [data-sel]").forEach((o) => o.classList.toggle("sel", o === b)); }));
    showDetail();
  }
  function showDetail() {
    const el = $("#detail");
    if (!el) return;
    const m = selected && selected.match(/^(\d+)([ps])(\d+)$/);
    if (!m || !rows[+m[1]]) { el.innerHTML = `<span class="hint">Touchez un jour férié ou une période de vacances pour le détail.</span>`; return; }
    const x = rows[+m[1]], L = rowLabel(x);
    if (m[2] === "p") {
      const h = publicOf(x).filter((h) => h.d.startsWith(String(year)))[+m[3]];
      if (!h) return;
      el.innerHTML = `<h3><span class="dot" style="background:var(--pub)"></span>${h.n}</h3><p style="margin:0">${fmtLong(h.d)} · ${L.text}</p>
        ${h.n !== h.en ? `<p class="hint" style="margin:.2rem 0">${h.en}</p>` : ""}<p class="lw" style="margin:.2rem 0">${bridge(h.d)}</p>
        ${h.r ? `<p class="hint" style="margin:.2rem 0">Uniquement : ${h.r.map((c) => regionNames(x.c)[c] || c).join(", ")}</p>` : `<p class="hint" style="margin:.2rem 0">Jour férié national.</p>`}`;
    } else {
      const h = schoolOf(x).filter((h) => h.e >= `${year}-01-01` && h.s <= `${year}-12-31`)[+m[3]];
      if (!h) return;
      el.innerHTML = `<h3><span class="dot t-${h.t}"></span>${h.n || "Vacances"} (${TYPE[h.t].toLowerCase()})</h3>
        <p style="margin:0">Du ${fmtLong(h.s)} au ${fmtLong(h.e)} · ${diff(h.s, h.e) + 1} jours</p>
        <p class="hint" style="margin:.2rem 0">${L.text} · reprise le ${fmtLong(addDays(h.e, 1))}</p>
        ${h.r && h.r.length > 1 ? `<p class="hint" style="margin:.2rem 0">Mêmes dates pour : ${h.r.map((c) => regionNames(x.c)[c] || c).join(", ")}</p>` : ""}`;
    }
  }
  function setYear(y) { year = y; store.set("year", y); selected = null; renderAnnee(); renderListe(); }

  // ---------- liste ----------
  let listMonth = "", listKind = "all";
  function renderListe() {
    const items = [];
    rows.forEach((x) => {
      const L = rowLabel(x);
      if (listKind !== "school") publicOf(x).filter((h) => h.d.startsWith(String(year))).forEach((h) => items.push({ date: h.d, kind: "p", name: h.n, en: h.en, row: L.text, extra: bridge(h.d) }));
      if (listKind !== "pub") schoolOf(x).filter((h) => h.e >= `${year}-01-01` && h.s <= `${year}-12-31` && h.s >= `${year}-01-01`).forEach((h) => items.push({ date: h.s, kind: "s", name: `${h.n || "Vacances"} · ${TYPE[h.t]}`, t: h.t, end: h.e, row: L.text }));
    });
    const sel = items.filter((i) => !listMonth || +i.date.slice(5, 7) === +listMonth).sort((a, b) => a.date.localeCompare(b.date) || a.row.localeCompare(b.row));
    $("#tab-liste").innerHTML = `
      <div class="ycontrols">
        <button class="btn" id="lprev" ${ALMANACH.years.includes(year - 1) ? "" : "disabled"}>◀</button><strong style="font-size:1.2rem">${year}</strong><button class="btn" id="lnext" ${ALMANACH.years.includes(year + 1) ? "" : "disabled"}>▶</button>
        <select id="lm" aria-label="Mois"><option value="">Toute l'année</option>${MOIS_LONG.map((m, i) => `<option value="${i + 1}"${+listMonth === i + 1 ? " selected" : ""}>${m[0].toUpperCase() + m.slice(1)}</option>`).join("")}</select>
        <select id="lk" aria-label="Type"><option value="all"${listKind === "all" ? " selected" : ""}>Tout</option><option value="pub"${listKind === "pub" ? " selected" : ""}>Jours fériés</option><option value="school"${listKind === "school" ? " selected" : ""}>Vacances scolaires</option></select>
        <span class="hint">${sel.length} entrée${sel.length > 1 ? "s" : ""}</span>
      </div>
      <div class="card" style="overflow-x:auto;padding:.4rem"><table class="list"><thead><tr><th>Date</th><th>Événement</th><th>Ligne</th><th>Détail</th></tr></thead><tbody>
        ${sel.map((i) => `<tr><td>${fmt(i.date)}${i.end ? `<br><span class="hint">→ ${fmt(i.end)}</span>` : ""}</td>
          <td>${i.kind === "p" ? `<span class="dot" style="background:var(--pub)"></span>` : `<span class="dot t-${i.t}"></span>`}${i.name}${i.en && i.en !== i.name ? `<br><span class="hint">${i.en}</span>` : ""}</td>
          <td>${i.row}</td><td>${i.kind === "p" ? `<span class="lw">${i.extra}</span>` : `${diff(i.date, i.end) + 1} jours`}</td></tr>`).join("") || `<tr><td colspan="4" class="hint">Rien pour ce filtre.</td></tr>`}
      </tbody></table></div>`;
    $("#lprev").addEventListener("click", () => setYear(year - 1));
    $("#lnext").addEventListener("click", () => setYear(year + 1));
    $("#lm").addEventListener("change", (e) => { listMonth = e.target.value; renderListe(); });
    $("#lk").addEventListener("change", (e) => { listKind = e.target.value; renderListe(); });
  }

  // ---------- pied de page ----------
  function renderFoot() {
    const errs = ALMANACH.errors || [];
    $("#foot").innerHTML = `
      ${errs.length ? `<div class="warnbox">⚠️ Certaines données n'ont pas pu être actualisées (anciennes valeurs conservées) : ${errs.map((e) => e.scope).join(", ")}.</div>` : ""}
      <p>Données générées le ${new Date(ALMANACH.generated).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} (actualisées automatiquement chaque mois).</p>
      <p>Sources : <a href="https://calendrier.api.gouv.fr/jours-feries/">calendrier.api.gouv.fr</a> et <a href="https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/">data.education.gouv.fr</a> (Licence Ouverte) · <a href="https://date.nager.at/">Nager.Date</a> · <a href="https://www.gov.uk/bank-holidays">gov.uk</a> (Open Government Licence) · <a href="https://www.openholidaysapi.org/">OpenHolidays API</a> (ODbL).</p>
      <p>Vacances scolaires : France (zones A/B/C) et Allemagne (Länder). Les autres pays viendront plus tard. Vérifiez toujours auprès des sources officielles pour des dates importantes.</p>`;
  }

  // ---------- onglets ----------
  function showTab(name) {
    $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    $$(".panel").forEach((p) => (p.hidden = p.id !== "tab-" + name));
    store.set("tab", name);
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  function renderAll() { renderRows(); renderBientot(); renderAnnee(); renderListe(); }
  renderAll();
  renderFoot();
  const tab = location.hash.slice(1) || store.get("tab", "bientot");
  showTab($(`.tabs [data-tab="${tab}"]`) ? tab : "bientot");
})();
