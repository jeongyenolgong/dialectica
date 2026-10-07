/* ─────────────────────────────────────────────────────────────────────────
   screen.js — 스크린 다섯 장이 함께 쓰는 손 (2026.10.07)
   ⭐ 판은 공항 출발 안내판처럼 갈립니다 — 순위가 뒤집히면 목록 전부가 좌르륵(9.2).
      판때기 한 장 20ms × 훑는 장수 10 (2026.08.12 확정값 그대로)
   ───────────────────────────────────────────────────────────────────────── */
(() => {
  const MS = 20, K = 10;

  /* 픽셀이 안 깨지는 크기 — Galmuri11은 12px 단위(6.1) */
  const snap = (px, unit) => Math.max(unit, Math.round(px / unit) * unit);
  function sizes(glyph) {
    const r = document.documentElement.style;
    r.setProperty("--glyph", snap(innerWidth * (glyph || 0.026), 12) + "px");
    r.setProperty("--rank",  snap(innerWidth * 0.016, 12) + "px");
    r.setProperty("--stage", snap(innerWidth * 0.025, 12) + "px");
    r.setProperty("--title", snap(innerWidth * 0.019, 12) + "px");
    r.setProperty("--sub",   snap(innerWidth * 0.0125, 12) + "px");
  }

  /* ── 한글 플랩 — 초성·종성은 두고 중성만 굴러가다 목표 글자에 섭니다 ── */
  const HB = 0xAC00, HN = 11172, STRIDE = 28;
  function scan(ch) {
    const out = [], c = ch.charCodeAt(0);
    for (let i = K; i >= 1; i--) {
      if (c >= HB && c < HB + HN) out.push(String.fromCharCode(HB + (((c - HB) - STRIDE * i) % HN + HN) % HN));
      else if (/[0-9]/.test(ch)) out.push(String((+ch - i + 100) % 10));
      else out.push(String.fromCharCode(HB + ((i * STRIDE * 13) % HN)));
    }
    return out;
  }
  const live = []; let raf = null;
  function flip(el, target, delay) {
    live.push({ el, target, seq: scan(target || " "), t0: performance.now() + delay, last: -1 });
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    for (let i = live.length - 1; i >= 0; i--) {
      const c = live[i], e = now - c.t0;
      if (e < 0) continue;
      const idx = Math.floor(e / MS), folded = (e - idx * MS) < MS * 0.45;
      c.el.style.transform = folded ? "scaleY(.18)" : "scaleY(1)";
      c.el.style.filter = folded ? "brightness(1.9)" : "brightness(1)";
      if (idx !== c.last) { c.last = idx; c.el.textContent = idx < c.seq.length ? c.seq[idx] : c.target; }
      if (idx >= c.seq.length) { c.el.style.transform = "scaleY(1)"; c.el.style.filter = "brightness(1)"; live.splice(i, 1); }
    }
    raf = live.length ? requestAnimationFrame(loop) : null;
  }
  function cells(box, n) {
    box.innerHTML = "";
    for (let i = 0; i < n; i++) { const s = document.createElement("span"); s.className = "cell"; s.textContent = " "; box.appendChild(s); }
  }
  /* 한 줄을 갈아 끼웁니다 — center면 가운데 맞춤 */
  function line(field, text, row, center) {
    const cs = [...field.querySelectorAll(".cell")], n = cs.length;
    const t = [...(text || "")].slice(0, n);
    const pad = center ? Math.floor((n - t.length) / 2) : 0;
    const full = Array(n).fill(" ");
    t.forEach((ch, i) => full[pad + i] = ch);
    cs.forEach((c, j) => flip(c, full[j], (row + j) * MS * 0.9));
  }

  /* ── Top 3 목록 — 순위가 바뀔 때만 판이 갈립니다 ── */
  function top3(ol, width, withRank) {
    ol.innerHTML = "";
    const fields = [];
    for (let i = 0; i < 3; i++) {
      const li = document.createElement("li");
      if (withRank) li.innerHTML = `<span class="rank">${i + 1}</span>`;
      const f = document.createElement("span"); f.className = "field"; cells(f, width);
      li.appendChild(f); ol.appendChild(li); fields.push(f);
    }
    let prev = null;
    return function set(list, force) {
      const key = list.join("|");
      if (!force && key === prev) return false;
      prev = key;
      fields.forEach((f, i) => line(f, list[i] || "", i, !withRank));
      return true;
    };
  }

  /* ── 방 평균 막대 ── */
  function bars(el, rows) {
    el.innerHTML = rows.map(r =>
      `<div class="b" style="--gc:${r.color}"><div class="top"><span>${r.ko}</span><span class="v"></span></div>`
      + `<div class="cells">${"<i></i>".repeat(20)}</div></div>`).join("");
    return function set(vals) {
      [...el.children].forEach((b, i) => {
        const v = vals ? vals[i] : null;
        b.querySelector(".v").textContent = v == null ? "" : v;
        [...b.querySelectorAll(".cells i")].forEach((c, k) => c.classList.toggle("on", v != null && v >= (k + 1) * 5));
      });
    };
  }
  /* 방 평균 — 이름을 낸 사람만 */
  function roomAvg(b) {
    const P = (b.players || []).filter(p => p.name && p.g);
    if (!P.length) return null;
    const s = [0, 0, 0]; let ou = 0;
    P.forEach(p => { p.g.forEach((v, i) => s[i] += v); ou += p.ou || 0; });
    return { g: s.map(v => Math.round(v / P.length)), ou: Math.round(ou / P.length), n: P.length };
  }

  window.SC = { MS, K, sizes, flip, cells, line, top3, bars, roomAvg };
})();
