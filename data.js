/* ─────────────────────────────────────────────────────────────────────────
   data.js — 셈법 · 글자 다루기 · 문구 꺼내기 (값은 settings.js ← 엑셀, 2026.10.14)

   ⭐ 폰 · 진행자 화면 · 스크린이 **이 파일 한 곳**에서 읽습니다.
      숫자나 대응을 다른 파일에 따로 적으면 서로 어긋납니다.

   근거
   · 단어 30개·캐릭터 — 디알렉티카_포스터단어_출처_261012.xlsx(출처·판단 근거). 게임이 읽는 값은 설정 엑셀 「단어」 시트.
             기아 원문 근거 17개 + 놀공 값 13개(노란 칸). 2026.10.14 확정, 10.15 중간 공유회 뒤 바뀔 수 있음
   · 조건 — 2026.10.07 오후 사용자 확정: 하나로 통일, 「이 단어의 Opposite을 적어 주세요.」
             ("조건을 하나로 통일하려고 해" · "오퍼짓 영어 단어를 직접 사용할거야" · "우선 이걸로 하고").
             엑셀은 디알렉티카_포스터단어_출처_261012.xlsx.
   · 셈법 — 게이지 = 고른 5개 + 모은 단어의 캐릭터별 개수 비율(합 100, 상한 없음). 결과 화면과 같은 셈 (2026.10.14 사용자 "결과화면의 처리 방식과 동일하게")
   · 출발 비율 — 같은 셈을 고른 5개에만 (2026.10.13 사용자 확정)
   ───────────────────────────────────────────────────────────────────────── */
(() => {
  /* ⭐ 값은 전부 settings.js(엑셀 디알렉티카_설정_*.xlsx → build_settings.py)에서 옵니다 (2026.10.14).
     여기에는 셈과 글자 다루기만 있습니다. 숫자·단어·문구를 고치려면 엑셀을 고치고 다시 만듭니다. */
  const SET = window.DLK_SET || (() => { throw new Error("settings.js 가 먼저 와야 합니다"); })();
  const CHARS = SET.chars;
  const COND = SET.cond;
  const WORDS = SET.words;
  const FULL = SET.nums.FULL;
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
  function seeded(seed) {
    let h = 2166136261;
    for (const ch of String(seed || "")) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    let x = (h >>> 0) || 1;
    return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  const shuffled = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* 다섯 판 × 여섯 단어 — **모든 사람이 같은 판을 같은 순서로** 봅니다(2026.10.14 사용자 「판마다 나오는 여섯 단어가 사람마다 동일한 것으로」).
     그래서 씨앗은 사람과 상관없는 고정값입니다. */
  function pickRounds() {
    const r = seeded("dialectica");
    const byCh = CHARS.map((_, k) => shuffled(WORDS.filter(x => x.ch === k).map(x => x.w), r));
    const per = Math.floor(WORDS.length / CHARS.length / PICK_N);     /* 캐릭터마다 한 판에 몇 개 = 2 */
    /* 배치 — 세 캐릭터를 고루(사용자 「여섯 단어의 배치는 3가지 캐릭터를 골고루」).
       캐릭터 순서 a·b·c를 판마다 섞어 a b c a b c 로 놓으면, 두 칸씩 세 줄인 화면에서
       (a b)(c a)(b c) — 한 줄에 같은 캐릭터가 둘 오지 않고, 세로 한 줄에 세 캐릭터가 다 들어갑니다. */
    return Array.from({ length: PICK_N }, (_, i) => {
      const order = shuffled(CHARS.map((_, k) => k), r);
      const out = [];
      for (let j = 0; j < per; j++) order.forEach(k => out.push(byCh[k][i * per + j]));
      return out;
    });
  }
  /* 비율 — 개수를 FULL(100) 나눔으로, 반올림한 셋의 합이 꼭 FULL이 되게(나머지가 큰 순으로 1씩) */
  function pct(n) {
    const t = n.reduce((a, v) => a + v, 0); if (!t) return n.map(() => 0);
    const raw = n.map(v => v * FULL / t), out = raw.map(Math.floor);
    raw.map((v, i) => [v - out[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])
       .slice(0, FULL - out.reduce((a, v) => a + v, 0)).forEach(([, i]) => out[i]++);
    return out;
  }
  /* 캐릭터별 단어 개수. 모르는 단어는 세지 않습니다 */
  function countOf(words) {
    const n = CHARS.map(() => 0);
    (words || []).forEach(w => { const x = WORDS.find(o => o.w === w); if (x) n[x.ch]++; });
    return n;
  }
  /* 고른 5개 → 세 캐릭터 비율 */
  const startFrom = picks => pct(countOf(picks));
  /* 내 게이지 — 고른 5개 + 모은 단어의 캐릭터별 개수를 비율로. 결과 화면과 같은 셈, 상한 없음 (2026.10.14 사용자 "결과화면의 처리 방식과 동일하게") */
  const gauges = (picks, words) => pct(countOf((picks || []).concat(words || [])));

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
    CHARS, COND, WORDS, FULL, PICK_N,
    pickRounds, pct, startFrom, gauges, tidy, tidyWord, findWord, sameAsWord, esc, T, fillText,
  };
})();
