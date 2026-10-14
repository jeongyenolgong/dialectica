/* ─────────────────────────────────────────────────────────────────────────
   data.js — 셈법 · 글자 다루기 · 문구 꺼내기 (값은 settings.js ← 엑셀, 2026.10.14)

   ⭐ 폰 · 진행자 화면 · 스크린이 **이 파일 한 곳**에서 읽습니다.
      숫자나 대응을 다른 파일에 따로 적으면 서로 어긋납니다.

   근거
   · 단어 30개 — 디알렉티카_포스터단어_260811.md (8.12 그대로, 사용자 "단어는 30개 그대로 써")
   · 캐릭터 — 디알렉티카_포스터단어_출처_261007_2.xlsx 캐릭터 열.
             기아 원문 근거 17개 + 놀공 임시값 13개(엑셀의 노란 칸 · 중간 공유회 리뷰 대상)
   · 조건 — 2026.10.07 오후 사용자 확정: 하나로 통일, 「이 단어의 Opposite을 적어 주세요.」
             ("조건을 하나로 통일하려고 해" · "오퍼짓 영어 단어를 직접 사용할거야" · "우선 이걸로 하고").
             엑셀은 디알렉티카_포스터단어_출처_261012.xlsx. 조건 넷(반대말·비슷한 말·색·질감)은 폐기
   · 셈법 — 단어 하나 +20 · 게이지는 100에서 멈춤 (OU 게이지는 창작과 함께 삭제, 2026.10.14 정리)
   · 출발 비율 — 입장 때 고른 5개의 캐릭터 수 × 20 (2026.10.13 사용자 확정)
   ───────────────────────────────────────────────────────────────────────── */
(() => {
  /* ⭐ 값은 전부 settings.js(엑셀 디알렉티카_설정_*.xlsx → build_settings.py)에서 옵니다 (2026.10.14).
     여기에는 셈과 글자 다루기만 있습니다. 숫자·단어·문구를 고치려면 엑셀을 고치고 다시 만듭니다. */
  const SET = window.DLK_SET || (() => { throw new Error("settings.js 가 먼저 와야 합니다"); })();
  const CHARS = SET.chars;
  const COND = SET.cond;
  const WORDS = SET.words;
  const STEP = SET.nums.STEP, FULL = SET.nums.FULL;
  /* 문구 — T(열쇠, {n: 3}) → 엑셀 「문구」 시트의 글. 없는 열쇠는 ⟨열쇠⟩로 보여 바로 눈에 띕니다 */
  const TEXT = SET.text || {};
  const T = (k, v) => (k in TEXT ? TEXT[k] : "⟨" + k + "⟩").replace(/\{(\w+)\}/g, (_, n) => v && n in v ? v[n] : "");
  /* data-t=열쇠 가 붙은 요소는 화면이 뜰 때 그 문구로 채웁니다(입력 칸은 흐린 글자) */
  function fillText(root) {
    (root || document).querySelectorAll("[data-t]").forEach(el => {
      const s = T(el.dataset.t);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.placeholder = s; else el.textContent = s;
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => fillText());
  else fillText();
  const PICK_N = SET.nums.PICK_N;       /* 고르는 수 = 판 수 */
  const PICK_STEP = FULL / PICK_N;      /* 고른 단어 하나가 그 캐릭터 비율에 더하는 양 = 20 */
  function seeded(seed) {
    let h = 2166136261;
    for (const ch of String(seed || "")) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    let x = (h >>> 0) || 1;
    return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  const shuffled = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function pickRounds(seed) {
    const r = seeded(seed);
    const byCh = CHARS.map((_, k) => shuffled(WORDS.filter(x => x.ch === k).map(x => x.w), r));
    const per = Math.floor(WORDS.length / CHARS.length / PICK_N);     /* 캐릭터마다 한 판에 몇 개 = 2 */
    return Array.from({ length: PICK_N }, (_, i) =>
      shuffled(byCh.flatMap(list => list.slice(i * per, (i + 1) * per)), r));
  }
  /* 고른 5개 → 세 캐릭터 비율. 모르는 단어는 세지 않습니다 */
  function startFrom(picks) {
    const g = CHARS.map(() => 0);
    (picks || []).forEach(w => { const x = WORDS.find(o => o.w === w); if (x) g[x.ch] += PICK_STEP; });
    return g;
  }

  /* 내 게이지 — 출발값 + 모은 단어마다 +20, 100에서 멈춤 */
  function gauges(start, words) {
    const g = (start || [0, 0, 0]).slice();
    (words || []).forEach(w => {
      const x = WORDS.find(o => o.w === w);
      if (x) g[x.ch] = Math.min(FULL, g[x.ch] + STEP);
    });
    return g;
  }

  /* ── 천지인 자판 ─────────────────────────────────────────────────
     천지인은 「ㆍ」 점과 덜 조합된 자모를 거쳐 글자를 만듭니다.
     ⛔ 입력 중에는 칸을 절대 다시 쓰지 않습니다 — 조합이 끊겨 글자가 안 쳐집니다.
        정리는 「확인」을 누른 뒤 **한 번만** 여기서 합니다.               */
  /* ㆍ ᆞ ᆢ ‥ — 천지인이 남기는 점들. 가운뎃점(·)은 사람이 일부러 쓰는 글자라 남깁니다 */
  const DOTS = /[ㆍᆞᆢ‥]/g;
  const tidy = s => (s || "").normalize("NFC").replace(DOTS, "").replace(/\s+/g, " ").trim();
  /* 단어 대조용 — 홀로 남은 자모(조합이 덜 끝난 것)까지 지웁니다 */
  const tidyWord = s => tidy(s).replace(/[ㄱ-ㆎᄀ-ᇿ]/g, "");

  /* ── 관대한 대조 (8.14) ──
     ① 띄어쓰기는 무시 ② 자모 하나 차이는 통과.
     30개 단어끼리는 자모가 최소 3개씩 달라 하나를 봐줘도 서로 겹치지 않습니다(10.07 전수 검사) */
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
  const JONG = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";
  function jamo(s) {
    const out = [];
    for (const ch of (s || "").replace(/\s+/g, "")) {
      const o = ch.charCodeAt(0) - 0xAC00;
      if (o >= 0 && o < 11172) {
        out.push(CHO[Math.floor(o / 588)], JUNG[Math.floor((o % 588) / 28)]);
        const j = JONG[o % 28]; if (j !== " ") out.push(j);
      } else out.push(ch);
    }
    return out;
  }
  function near(a, b) {                       /* 편집거리 1 이하인가 */
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  function findWord(input) {
    const a = jamo(tidyWord(input));
    if (!a.length) return null;
    return WORDS.find(x => { const b = jamo(x.w); return a.join("") === b.join("") || near(a, b); }) || null;
  }
  /* 답이 포스터 단어를 그대로 쓴 것인가 — 띄어쓰기만 무시합니다 */
  const sameAsWord = (answer, w) => tidy(answer).replace(/\s+/g, "") === w.replace(/\s+/g, "");


  /* 사람이 쓴 글을 화면에 꽂을 때 — 꺾쇠가 태그로 읽히지 않게 */
  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");


  window.DLK = {
    CHARS, COND, WORDS, STEP, FULL, PICK_N, PICK_STEP,
    pickRounds, startFrom, gauges, tidy, tidyWord, findWord, sameAsWord, esc, T, fillText,
  };
})();
