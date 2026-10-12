/* ─────────────────────────────────────────────────────────────────────────
   sphere.js — 거리 구 (2026.10.12, 목업에서 떼어 낸 공용 그리기)

   포스터 단어가 중심(앰버)에서 빛나고, 거리표의 단어들이 흰 점으로 구 안에 놓입니다.
   내가 쓴 Opposite은 민트 점으로, 포스터 단어와 가까울수록 중심 쪽에 놓입니다.
   점마다 가까운 이웃 셋을 이어 다면체 관계망이 되고, 점은 제자리에서 숨 쉬듯 떠다니며 구 전체가 천천히 돕니다.
   중심과 내 점은 직선으로 잇지 않습니다 — 각자 이웃 셋과 이어져 망을 거쳐 닿습니다(2026.10.12 사용자 "이 버전으로").
   판정하지 않습니다 — 숫자도, 맞음·틀림 색도 없습니다.

   쓰는 법:  SPHERE.mount(canvas) → SPHERE.poster(단어) → SPHERE.place(내 답) → SPHERE.start() … SPHERE.stop()
   거리표 sphere-table.js(SPH)와 읽기 규칙 sphere-lookup.js(LOOKUP)가 먼저 실려 있어야 합니다.
   ───────────────────────────────────────────────────────────────────────── */
window.SPHERE = (() => {
  const N_NODE = 180, N_LINK = 3;        /* 점 수 · 점마다 잇는 이웃 수 — 셋이면 선이 면을 이룹니다 */
  const BREATH = .045;                    /* 숨 — 점이 제자리에서 떠다니는 폭 */
  const FPS = 15;                         /* 게임 화면의 뚝뚝 끊기는 움직임에 맞춥니다 */
  const TILT = .38, SPIN = .22;           /* 기울기 · 초당 회전(라디안) */
  const CORE = "255,200,61", MINE = "95,230,176";   /* 앰버 · 민트 — data.js의 선구자·혁신가 색과 같은 값 */

  function rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function hash(t){ let h = 2166136261; for(const ch of t){ h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function inBall(r){ for(;;){ const p = [r()*2-1, r()*2-1, r()*2-1]; if(p[0]*p[0]+p[1]*p[1]+p[2]*p[2] <= 1) return p; } }

  /* ── 거리표 풀기 — 한 번만 ── */
  const b64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
  let DIR = null, IDX = null;
  function table(){
    if(DIR) return;
    DIR = b64(SPH.dir); IDX = new Map(SPH.words.map((w, i) => [w, i]));
  }

  /* ── 포스터 단어마다 한 벌 — 흰 점 자리·숨·관계망. 같은 단어는 다시 안 만듭니다 ── */
  const sets = new Map();
  function setFor(word){
    table();
    if(sets.has(word)) return sets.get(word);
    const RAD = b64(SPH.rad[word]);
    /* 깊이 — 백분위를 세제곱근으로 펴서 구 안을 고르게 채웁니다 */
    const pos = i => {
      const d = [0,1,2].map(k => DIR[i*3+k] / 127.5 - 1), n = Math.hypot(...d) || 1;
      const r = .08 + .92 * Math.cbrt(RAD[i] / 255);
      return d.map(v => v / n * r);
    };
    /* 흰 점 — 어휘를 가까운 순으로 줄 세워 고르게 뽑습니다(실제 자리 그대로) */
    const order = SPH.words.map((_, i) => i).sort((x, y) => RAD[x] - RAD[y]);
    const pick = Array.from({length: N_NODE}, (_, k) => order[Math.floor(k * order.length / N_NODE)]);
    const base = pick.map(pos);
    const sway = base.map((_, i) => { const r = rng(i * 7919 + 17), d = inBall(r), n = Math.hypot(...d) || 1;
      return { d: d.map(v => v / n), f: .35 + .45 * r(), ph: r() * Math.PI * 2 }; });
    const nearest = (p, n) => base.map((b, j) => [j, (p[0]-b[0])**2 + (p[1]-b[1])**2 + (p[2]-b[2])**2])
      .sort((x, y) => x[1] - y[1]).slice(0, n).map(x => x[0]);
    const links = [];
    base.forEach((a, i) => {
      base.map((b, j) => [j, (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2])
          .filter(x => x[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, N_LINK)
          .forEach(([j]) => { if(!links.some(l => (l[0] === i && l[1] === j) || (l[0] === j && l[1] === i))) links.push([i, j]); });
    });
    const s = { pos, base, sway, nodes: base.map(p => p.slice()), links, coreLinks: nearest([0,0,0], N_LINK), nearest };
    sets.set(word, s); return s;
  }

  /* ── 상태 ── */
  let cv = null, cx = null, W = 0, raf = 0, last = 0, ang = 0;
  let cur = null, mine = null, mineLinks = [];

  function mount(canvas){
    cv = canvas; cx = cv.getContext("2d");
    addEventListener("resize", () => { if(raf) fit(); });
  }
  function fit(){
    const dpr = devicePixelRatio || 1;
    W = cv.clientWidth; cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function poster(word){ cur = setFor(word); mine = null; mineLinks = []; }

  /* 내 답 — sphere-lookup.js가 기본형으로 읽습니다. 조각이 둘이면 찾은 것들의 자리를 평균.
     하나도 못 찾으면 지도 밖: 껍질 바깥, 방향만 글자로 정합니다 */
  function place(text){
    const parts = LOOKUP.resolve(text, w => IDX.has(w)), hits = parts.filter(x => x.lemma);
    const outside = hits.length === 0, readAs = hits.map(x => x.lemma).join(" · ");
    if(outside){
      const r = rng(hash(text)), d = inBall(r), n = Math.hypot(...d) || 1;
      mine = d.map(v => v / n * 1.15);
    } else {
      const ps = hits.map(x => cur.pos(IDX.get(x.lemma)));
      if(ps.length === 1) mine = ps[0];
      else {
        const m = [0,1,2].map(k => ps.reduce((a, p) => a + p[k], 0) / ps.length);
        const r = ps.reduce((a, p) => a + Math.hypot(...p), 0) / ps.length, n = Math.hypot(...m) || 1;
        mine = m.map(v => v / n * r);
      }
    }
    mineLinks = cur.nearest(mine, N_LINK);
    return { outside, readAs };
  }

  function breathe(t){
    const { base, sway, nodes } = cur;
    for(let i = 0; i < nodes.length; i++){ const w = sway[i], a = BREATH * Math.sin(t / 1000 * w.f * Math.PI * 2 + w.ph);
      for(let k = 0; k < 3; k++) nodes[i][k] = base[i][k] + w.d[k] * a; }
  }
  function proj(p){
    const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(TILT), st = Math.sin(TILT);
    let x = p[0]*ca + p[2]*sa, z = -p[0]*sa + p[2]*ca, y = p[1];
    const y2 = y*ct - z*st; z = y*st + z*ct; y = y2;
    const k = 2.6 / (2.6 + z), s = W * .38;
    return { x: W/2 + x*s*k, y: W/2 + y*s*k, z, k };
  }
  function draw(t){
    raf = requestAnimationFrame(draw);
    if(last && t - last < 1000 / FPS) return;        /* 첫 프레임은 늘 그립니다 — 페이지가 뜨자마자 열리면 t가 작아 건너뛰던 것 */
    ang += SPIN * (last ? (t - last) / 1000 : 0); last = t;
    cx.clearRect(0, 0, W, W);
    breathe(t);
    const P = cur.nodes.map(proj);

    /* 관계망 선 */
    cx.lineWidth = 1;
    cur.links.forEach(([i, j]) => {
      const a = P[i], b = P[j], f = (2 - (a.z + b.z) / 2) / 3;
      cx.strokeStyle = `rgba(255,255,255,${(.07 + .20 * f).toFixed(3)})`;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
    });

    const items = P.map(p => ({p, kind:"node"}));
    const C = proj([0,0,0]); items.push({p:C, kind:"core"});
    let M = null; if(mine){ M = proj(mine); items.push({p:M, kind:"mine"}); }
    items.sort((a, b) => b.p.z - a.p.z);

    /* 중심과 내 점 — 각자 이웃 셋과 */
    cx.lineWidth = 1.2;
    cur.coreLinks.forEach(j => { const b = P[j], f = (1 - b.z) / 2;
      cx.strokeStyle = `rgba(${CORE},${(.25 + .35 * f).toFixed(3)})`;
      cx.beginPath(); cx.moveTo(C.x, C.y); cx.lineTo(b.x, b.y); cx.stroke(); });
    if(M) mineLinks.forEach(j => { const b = P[j], f = (1 - b.z) / 2;
      cx.strokeStyle = `rgba(${MINE},${(.3 + .4 * f).toFixed(3)})`;
      cx.beginPath(); cx.moveTo(M.x, M.y); cx.lineTo(b.x, b.y); cx.stroke(); });

    const pulse = .85 + .15 * Math.sin(t / 380);
    items.forEach(({p, kind}) => {
      const f = (1 - p.z) / 2;                       /* 앞일수록 1에 가깝습니다 */
      if(kind === "node"){
        const s = Math.max(1.5, 2.6 * p.k);
        cx.fillStyle = `rgba(255,255,255,${(.35 + .65 * f).toFixed(3)})`;
        cx.fillRect(Math.round(p.x - s/2), Math.round(p.y - s/2), s, s);   /* 픽셀처럼 네모 점 */
      } else if(kind === "core"){
        const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, W * .16 * pulse);
        g.addColorStop(0, `rgba(${CORE},.75)`); g.addColorStop(.35, `rgba(${CORE},.22)`); g.addColorStop(1, `rgba(${CORE},0)`);
        cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, W * .16 * pulse, 0, Math.PI*2); cx.fill();
        cx.fillStyle = `rgb(${CORE})`; const s = 9; cx.fillRect(Math.round(p.x - s/2), Math.round(p.y - s/2), s, s);
      } else {
        const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16 * p.k);
        g.addColorStop(0, `rgba(${MINE},.6)`); g.addColorStop(1, `rgba(${MINE},0)`);
        cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, 16 * p.k, 0, Math.PI*2); cx.fill();
        cx.fillStyle = `rgb(${MINE})`; const s = Math.round(7 * p.k); cx.fillRect(Math.round(p.x - s/2), Math.round(p.y - s/2), s, s);
      }
    });
  }
  function start(){ fit(); last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  function stop(){ cancelAnimationFrame(raf); raf = 0; }
  return { mount, poster, place, start, stop };
})();
