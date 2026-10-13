/* ─────────────────────────────────────────────────────────────────────────
   data.js — 단어 30개 · 수집 조건 · 캐릭터 · 셈법 · 입장 고르기 (2026.10.07 초기판 복귀 · 10.13 고르기)

   ⭐ 폰 · 진행자 화면 · 스크린이 **이 파일 한 곳**에서 읽습니다.
      숫자나 대응을 다른 파일에 따로 적으면 서로 어긋납니다.

   근거
   · 단어 30개 — 디알렉티카_포스터단어_260811.md (8.12 그대로, 사용자 "단어는 30개 그대로 써")
   · 캐릭터 — 디알렉티카_포스터단어_출처_261007_2.xlsx 캐릭터 열.
             기아 원문 근거 17개 + 놀공 임시값 13개(엑셀의 노란 칸 · 중간 공유회 리뷰 대상)
   · 조건 — 2026.10.07 오후 사용자 확정: 하나로 통일, 「이 단어의 Opposite을 적어 주세요.」
             ("조건을 하나로 통일하려고 해" · "오퍼짓 영어 단어를 직접 사용할거야" · "우선 이걸로 하고").
             엑셀은 디알렉티카_포스터단어_출처_261012.xlsx. 조건 넷(반대말·비슷한 말·색·질감)은 폐기
   · 셈법 — 단어 하나 +20 · 문장 하나 OU +10 · 게이지는 100에서 멈춤
   · 출발 비율 — 입장 때 고른 5개의 캐릭터 수 × 20 (2026.10.13 사용자 확정)
   ───────────────────────────────────────────────────────────────────────── */
(() => {
  /* 캐릭터 셋 — 기아 공식 국문 표기(OU 설명자료 15쪽) */
  const CHARS = [
    { ko: "문화의 선구자",   short: "선구자", en: "CULTURE VANGUARD",      color: "#FFC83D" },
    { ko: "창의적 모험가",   short: "모험가", en: "CREATIVE RISK-TAKERS",  color: "#FF7A8A" },
    { ko: "끊임없는 혁신가", short: "혁신가", en: "RELENTLESS INNOVATORS", color: "#5FE6B0" },
  ];
  /* 창작 단계에서만 나타나는 네 번째 게이지 */
  const OU = { ko: "OU", short: "OU", en: "OPPOSITES UNITED", color: "#FFFFFF" };

  /* 수집 조건 하나 — 단어 30개 모두 같은 질문입니다(2026.10.07 오후 통일). 대소문자는 디자인에서.
     안내 글자(hint)는 두지 않습니다 — 예시를 주면 답이 그 말로 몰립니다 */
  const COND = {
    "Opposite": { q: "이 단어의 Opposite을 적어 주세요.", hint: "" },
  };

  /* 단어 30개 — w 단어 · c 조건(전부 Opposite) · ch 캐릭터(0 선구자 · 1 모험가 · 2 혁신가) */
  const WORDS = [
    { w: "응시",         c: "Opposite", ch: 0 },
    { w: "도전",         c: "Opposite", ch: 1 },
    { w: "사색",         c: "Opposite", ch: 2 },
    { w: "포용",         c: "Opposite", ch: 1 },   /* 임시 */
    { w: "상상",         c: "Opposite", ch: 1 },   /* 임시 */
    { w: "조화",         c: "Opposite", ch: 1 },   /* 임시 */
    { w: "역동성",       c: "Opposite", ch: 1 },   /* 임시 */
    { w: "직관",         c: "Opposite", ch: 0 },
    { w: "관점",         c: "Opposite", ch: 0 },
    { w: "일상",         c: "Opposite", ch: 0 },
    { w: "프로토타입",   c: "Opposite", ch: 2 },
    { w: "헤리티지",     c: "Opposite", ch: 2 },   /* 임시 */
    { w: "경계",         c: "Opposite", ch: 0 },
    { w: "물성",         c: "Opposite", ch: 2 },   /* 임시 — 기아 근거는 「모험가 또는 혁신가」까지 */
    { w: "본질",         c: "Opposite", ch: 2 },   /* 임시 */
    { w: "뜻밖의 설렘",  c: "Opposite", ch: 0 },
    { w: "따뜻한 감수성", c: "Opposite", ch: 2 },
    { w: "변화의 흐름",  c: "Opposite", ch: 0 },
    { w: "기존의 틀",    c: "Opposite", ch: 1 },
    { w: "인간 중심",    c: "Opposite", ch: 0 },
    { w: "모험가 정신",  c: "Opposite", ch: 1 },
    { w: "영감의 언덕",  c: "Opposite", ch: 1 },
    { w: "오래된 사유",  c: "Opposite", ch: 2 },
    { w: "감각의 언어",  c: "Opposite", ch: 2 },   /* 임시 */
    { w: "잊힌 흔적",    c: "Opposite", ch: 0 },
    { w: "지속되는 태도", c: "Opposite", ch: 2 },   /* 임시 */
    { w: "오래된 언어",  c: "Opposite", ch: 1 },   /* 임시 — 기아 근거는 「모험가 또는 혁신가」까지 */
    { w: "손의 감각",    c: "Opposite", ch: 2 },   /* 임시 */
    { w: "도시의 결",    c: "Opposite", ch: 0 },   /* 임시 */
    { w: "방심의 시간",  c: "Opposite", ch: 1 },   /* 임시 */
  ];

  /* ⭐ 셈법은 이 네 줄뿐입니다 — 테스트 뒤에 여기만 갈아 끼웁니다 */
  const STEP = 20;      /* 단어 하나가 그 캐릭터 게이지를 올리는 양 (내부 테스트용, 사용자 "좋아") */
  const OU_STEP = 10;   /* 문장 하나가 OU 게이지를 올리는 양 */
  const FULL = 100;     /* 게이지는 여기서 멈춥니다 */

  /* ── 입장 때 고르기 → 출발 비율 (2026.10.13 사용자) ──
     「이름 입력한 다음 30개 중 5개를 고르는 화면은 한 화면에 6개의 단어씩 보여주고 하나를 선택하라고 할거야.
      선택한 단어에 매핑된 세 가지 캐릭터를 분석해서 상태 비율을 표시해 주는 거고.」
     · 다섯 판 × 여섯 단어. 30개가 캐릭터별로 10·10·10이라 한 판에 캐릭터마다 둘씩 넣으면 남김없이 나옵니다.
     · 묶음과 순서는 폰마다 섞되, 같은 폰은 다시 열어도 같은 판(씨앗 = 이 폰의 이름표).
     · 비율 = 고른 5개의 캐릭터 수 × 20 (사용자 "입장 비율은 동의해"). 한 캐릭터만 다섯이면 100·0·0.
     ⛔ 예전의 난수 출발 비율(셋의 합 100 · 10 단위 · 각각 10~70)은 폐기 — 되살리지 말 것 */
  const PICK_N = 5;                     /* 고르는 수 = 판 수 */
  /* 짝짓기 — 두 사람이 같이 적은 포스터가 적을수록 잰 거리를 방 평균 쪽으로 당깁니다(2026.10.14).
   겹침이 PAIR_K장이면 절반쯤 당겨집니다. 🔴값은 흉내 30명으로 돌려 보며 정하는 손잡이 — 사용자 미확정 */
  const PAIR_K = 3;
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
  const ouOf = n => Math.min(FULL, (n || 0) * OU_STEP);

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

  /* 문장에 두 단어가 다 들어 있나 — 띄어쓰기만 무시합니다 */
  const bare = s => tidy(s).replace(/\s+/g, "");
  const hasBoth = (text, a, b) => bare(text).includes(bare(a)) && bare(text).includes(bare(b));

  /* 사람이 쓴 글을 화면에 꽂을 때 — 꺾쇠가 태그로 읽히지 않게 */
  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* 두 단어 쌍의 이름 — 순서와 상관없이 같은 쌍은 같은 이름 */
  const pairKey = (a, b) => [a, b].sort().join("|");

  window.DLK = {
    CHARS, OU, COND, WORDS, STEP, OU_STEP, FULL, PICK_N, PICK_STEP, PAIR_K,
    pickRounds, startFrom, gauges, ouOf, tidy, tidyWord, findWord, sameAsWord, hasBoth, esc, pairKey,
  };
})();
