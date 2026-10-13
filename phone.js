/* ─────────────────────────────────────────────────────────────────────────
   phone.js — 참가자 폰 화면이 함께 쓰는 손 (2026.10.07)
   bus.js · data.js 다음에 불러옵니다.
   ───────────────────────────────────────────────────────────────────────── */
(() => {
  const D = window.DLK;

  /* ── 화면 크기 ──────────────────────────────────────────────────────
     폰 — 화면을 꽉 채웁니다. 자판이 올라오면 보이는 높이만큼으로 줄이고 내용을 밀어 올립니다.
     노트북 — 390×844 상자를 창 높이에 맞춰 줄여 보여 줍니다(안의 크기는 그대로).        */
  const touch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  function size() {
    const phone = document.querySelector(".phone");
    if (!phone) return;
    if (touch) {
      const h = (window.visualViewport && visualViewport.height) || innerHeight;
      document.documentElement.style.setProperty("--appH", Math.round(h) + "px");
      /* iOS는 자판이 올라와도 창을 안 줄이고 화면을 밀어 올립니다 — 맨 위로 되돌려 둡니다 */
      if (window.visualViewport && visualViewport.offsetTop) window.scrollTo(0, 0);
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName))
        setTimeout(() => a.scrollIntoView({ block: "center" }), 60);
    } else {
      const s = Math.min(1, (innerHeight - 24) / 844);
      phone.style.transform = `scale(${s})`;
      phone.style.marginTop = "12px";
      phone.style.marginBottom = (844 * (s - 1)) + "px";
    }
  }
  function boot() {
    if (touch) document.body.classList.add("touch");
    size();
    addEventListener("resize", size);
    if (window.visualViewport) visualViewport.addEventListener("resize", size);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", boot); else boot();

  /* ── 타이머 묶음 — 화면을 옮길 때 한꺼번에 지웁니다 ── */
  let timers = [];
  const later = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  /* 한 글자씩 찍기 */
  function typeOut(el, text, ms, done) {
    el.textContent = "";
    const chars = [...text];
    chars.forEach((_, i) => later((i + 1) * ms, () => { el.textContent = chars.slice(0, i + 1).join(""); }));
    later(chars.length * ms + 10, () => done && done());
  }

  /* ── ⭐ 입력을 마무리하고 읽기 ────────────────────────────────────
     천지인·한글 자판은 마지막 글자를 아직 조합 중일 수 있습니다. 그대로 읽으면
     「도전」이 「도」로 들어옵니다. **자판을 먼저 내려 조합을 끝낸 뒤** 읽습니다.  */
  let composing = false;
  addEventListener("compositionstart", () => { composing = true; }, true);
  addEventListener("compositionend", () => { composing = false; }, true);
  function commit(input, cb) {
    input.blur();
    const read = () => cb(input.value);
    /* blur가 조합을 끝내면 compositionend → input 순서로 값이 들어옵니다 */
    setTimeout(() => composing ? setTimeout(read, 120) : read(), 80);
  }

  /* ── 기기 안 쪽지 — 막혀 있어도(사생활 모드 등) 화면은 돌아야 합니다 ── */
  const load = (k, dflt) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? dflt : v; } catch (e) { return dflt; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* ── 내 상태 — 장부(진행자 화면)가 진실이고, 폰 쪽지는 장부가 늦을 때 메웁니다 ── */
  function state(b) {
    const me = window.Bus.mine(b) || null;
    const id = window.Bus.me();
    const local = load("dlk.pairs." + id, []);
    const fromBook = (me && me.got) || [];
    /* 단어별로 하나만 — 장부와 폰에 둘 다 있으면 장부 것을 씁니다 */
    const byW = {};
    local.forEach(p => { byW[p.w] = p; });
    fromBook.forEach(p => { byW[p.w] = p; });
    const words = Object.values(byW).sort((a, c) => (a.n || 0) - (c.n || 0));
    const start = (me && me.start) || null;
    return {
      me, start, words,
      g: start ? D.gauges(start, words.map(p => p.w)) : null,
    };
  }

  /* ── 게이지 줄 ──────────────────────────────────────────────────── */
  function strip(el) {
    const rows = D.CHARS;
    el.innerHTML = rows.map((c, i) =>
      `<div class="g" data-i="${i}" style="--gc:${c.color}">`
      + `<span class="nm">${c.short}</span>`
      + `<span class="bar">${"<i></i>".repeat(10)}</span>`
      + `<span class="v"></span></div>`).join("");
    const set = g => {
      const vals = g || [null, null, null];
      [...el.children].forEach((row, i) => {
        const v = vals[i];
        row.querySelector(".v").textContent = v == null ? "" : v;
        [...row.querySelectorAll(".bar i")].forEach((b, k) => b.classList.toggle("on", v != null && v >= (k + 1) * 10));
        row.classList.toggle("full", v != null && v >= D.FULL);
      });
    };
    const pulse = i => {
      const row = el.children[i]; if (!row) return;
      row.classList.remove("pulse"); void row.offsetWidth; row.classList.add("pulse");
    };
    return { set, pulse };
  }

  /* ── 알림 띠 ── */
  let toastTimer = null;
  function toast(html, ms) {
    const t = document.getElementById("toast"); if (!t) return;
    t.innerHTML = html;
    clearTimeout(toastTimer);
    t.classList.add("on");
    if (ms !== 0) toastTimer = setTimeout(() => t.classList.remove("on"), ms || 3500);
  }
  const hideToast = () => { const t = document.getElementById("toast"); if (t) t.classList.remove("on"); };

  function blink(el) {
    [0, 1, 2, 3].forEach(i => setTimeout(() => el.classList.toggle("flash", i % 2 === 0), i * 90));
  }
  function shake(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  function flash() {
    const f = document.getElementById("flash"); if (!f) return;
    f.style.display = "block"; setTimeout(() => f.style.display = "none", 60);
  }

  window.PH = { touch, size, later, clear, typeOut, commit, load, save, state, strip,
                toast, hideToast, blink, shake, flash };
})();
