/* ─────────────────────────────────────────────────────────────────────────
   sphere-lookup.js — 플레이어가 친 말을 거리표의 단어로 읽어 내는 규칙 (2026.10.12)

   거리표(sphere-table.js)는 기본형만 들고 있습니다(차분하다 · 밝다 · 자유롭다 · 역동 …).
   사람은 「차분함」「따뜻한」「자유로움」「기존의 틀」처럼 칩니다. 그 사이를 여기서 잇습니다.
     ① 띄어쓰기로 나눕니다. 조각마다 따로 찾아, 찾은 것들의 자리를 평균합니다.
     ② 조각이 그대로 없으면 활용형을 기본형으로 돌려 봅니다(함→하다 · 한→하다 · 움→ㅂ다 · 게→다 · 적→(명사) …).
     ③ 그래도 없으면 꼬리의 조사(의·와·과·에·을·를 …)를 떼고 다시.
     ④ 띄어쓰기 없이 붙여 친 「기존의틀」은 조사 자리에서 갈라 봅니다.
     ⑤ 영어는 소문자로, 꼬리(s·es·ed·ing·ly·ness…)를 떼어 봅니다. 한/영 전환을 깜빡한 입력은 한글로 되돌립니다.
   판정은 하지 않습니다 — 찾으면 자리를, 못 찾으면 「지도 밖」을 돌려줄 뿐입니다.
   ───────────────────────────────────────────────────────────────────────── */
window.LOOKUP = (() => {
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ", JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
  const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const dec = ch => { const c = ch.charCodeAt(0) - 0xAC00; return (c < 0 || c > 11171) ? null : [Math.floor(c / 588), Math.floor(c % 588 / 28), c % 28]; };
  const comp = (a, b, c) => String.fromCharCode(0xAC00 + a * 588 + b * 28 + c);
  const J = x => JONG.indexOf(x);
  /* 마지막 글자의 받침을 바꿉니다 */
  const setJong = (s, jong) => { const d = dec(s.at(-1)); return d ? s.slice(0, -1) + comp(d[0], d[1], J(jong)) : null; };

  /* 어간 → 기본형 후보. 받침 없는 어간이면 ㅂ·ㄹ 불규칙(어두운→어둡다 · 먼→멀다)도 함께 */
  function bases(stem){
    if(!stem) return [];
    const out = [stem + "다"], d = dec(stem.at(-1));
    if(d && d[2] === 0) out.push(setJong(stem, "ㅂ") + "다", setJong(stem, "ㄹ") + "다");
    return out;
  }
  /* 한 조각의 한국어 후보들 — 앉은 순서대로 찾아 첫 것을 씁니다 */
  function koCandidates(t){
    const c = [t], n = t.length;
    const last = t.at(-1), d = dec(last), head = t.slice(0, -1);   /* 한 글자(먼·큰·쉼)도 받침 규칙으로 돌립니다 */
    if(!d) return c;
    if(last === "음" || last === "은" || last === "는") c.push(...bases(head));          /* 밝음→밝다 · 작은→작다 · 흐르는→흐르다 */
    if(last === "움" || last === "운") c.push(setJong(head, "ㅂ") + "다", ...bases(head)); /* 즐거움→즐겁다 · 어두운→어둡다 */
    if(last === "게") c.push(...bases(head));                                            /* 차분하게→차분하다 · 밝게→밝다 */
    if(last === "히") c.push(head + "하다");                                             /* 조용히→조용하다 */
    if(last === "적") c.push(head);                                                      /* 역동적→역동 */
    const jong = d[2];
    if(jong === J("ㅁ") || jong === J("ㄴ") || jong === J("ㄹ")) c.push(...bases(head + comp(d[0], d[1], 0)));  /* 차분함→차분하다 · 따뜻한→따뜻하다 · 기쁨→기쁘다 */
    if(jong === J("ㄻ")) c.push(head + comp(d[0], d[1], J("ㄹ")) + "다");                 /* 삶→살다 */
    if(n >= 3 && /[성감들]$/.test(t)) c.push(head, head + "적", head + "하다");            /* 역동성→역동·역동적 · 안정감→안정 */
    return c.filter(Boolean);
  }
  /* 꼬리 조사 — 조각이 그대로는 없을 때만 떼어 봅니다 */
  const PARTICLES = ["에서", "으로", "처럼", "같은", "보다", "의", "와", "과", "에", "로", "을", "를", "이", "가", "은", "는", "도", "만"];

  /* 영어 — 소문자, 꼬리 떼기 */
  function enCandidates(t){
    const w = t.toLowerCase(), c = [w];
    const rules = [[/ies$/, "y"], [/es$/, ""], [/s$/, ""], [/ied$/, "y"], [/ed$/, ""], [/ed$/, "e"], [/ing$/, ""], [/ing$/, "e"],
                   [/ly$/, ""], [/ness$/, ""], [/er$/, ""], [/est$/, ""], [/ful$/, ""], [/less$/, ""]];
    rules.forEach(([re, rep]) => { if(re.test(w)){ const x = w.replace(re, rep); if(x.length >= 2) c.push(x); } });
    return c;
  }
  /* 한/영 전환을 깜빡한 입력 — 영문 자판 글자를 한글로 되돌립니다 */
  const KEY = {q:"ㅂ",w:"ㅈ",e:"ㄷ",r:"ㄱ",t:"ㅅ",y:"ㅛ",u:"ㅕ",i:"ㅑ",o:"ㅐ",p:"ㅔ",a:"ㅁ",s:"ㄴ",d:"ㅇ",f:"ㄹ",g:"ㅎ",
    h:"ㅗ",j:"ㅓ",k:"ㅏ",l:"ㅣ",z:"ㅋ",x:"ㅌ",c:"ㅊ",v:"ㅍ",b:"ㅠ",n:"ㅜ",m:"ㅡ",Q:"ㅃ",W:"ㅉ",E:"ㄸ",R:"ㄲ",T:"ㅆ",O:"ㅒ",P:"ㅖ"};
  const VV = {"ㅗㅏ":"ㅘ","ㅗㅐ":"ㅙ","ㅗㅣ":"ㅚ","ㅜㅓ":"ㅝ","ㅜㅔ":"ㅞ","ㅜㅣ":"ㅟ","ㅡㅣ":"ㅢ"};
  const CC = {"ㄱㅅ":"ㄳ","ㄴㅈ":"ㄵ","ㄴㅎ":"ㄶ","ㄹㄱ":"ㄺ","ㄹㅁ":"ㄻ","ㄹㅂ":"ㄼ","ㄹㅅ":"ㄽ","ㄹㅌ":"ㄾ","ㄹㅍ":"ㄿ","ㄹㅎ":"ㅀ","ㅂㅅ":"ㅄ"};
  function toHangul(t){
    const Jm = [...t].map(c => KEY[c] || KEY[c.toLowerCase()] || c), V = x => JUNG.includes(x), C = x => CHO.includes(x);
    let out = "", i = 0;
    while(i < Jm.length){
      if(C(Jm[i]) && V(Jm[i+1])){
        const cho = Jm[i]; let v = Jm[i+1]; i += 2;
        if(VV[v + Jm[i]]){ v = VV[v + Jm[i]]; i++; }
        let f = "";
        if(JONG.includes(Jm[i]) && Jm[i] && !V(Jm[i+1])){
          f = Jm[i]; i++;
          if(CC[f + Jm[i]] && !V(Jm[i+1])){ f = CC[f + Jm[i]]; i++; }
        }
        out += String.fromCharCode(0xAC00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(v)) * 28 + JONG.indexOf(f));
      } else out += Jm[i++];
    }
    return out;
  }

  /* 한 조각을 찾습니다. has(단어) → 거리표에 있는가. 찾으면 그 기본형, 아니면 null */
  function one(token, has){
    const t = token.trim(); if(!t) return null;
    const first = arr => arr.find(has) || null;
    if(/^[A-Za-z]+$/.test(t)){
      const e = first(enCandidates(t)); if(e) return e;
      const h = toHangul(t); if(/^[가-힣]+$/.test(h)) return one(h, has);   /* 영문 자판으로 친 한글 */
      return null;
    }
    if(!/^[가-힣]+$/.test(t)) return null;
    let r = first(koCandidates(t)); if(r) return r;
    for(const p of PARTICLES){                                               /* 조사 떼기 */
      if(t.length > p.length + 1 && t.endsWith(p)){ r = first(koCandidates(t.slice(0, -p.length))); if(r) return r; }
    }
    return null;
  }
  /* 붙여 쓴 두 말 — 「기존의틀」을 조사 자리에서 갈라 봅니다(양쪽 다 두 글자 이상) */
  function splitJoined(t, has){
    for(const p of ["의", "와", "과", "에", "로"]){
      let k = t.indexOf(p, 2);
      while(k > 0 && k < t.length - 1){                                        /* 오른쪽은 한 글자(틀)여도 됩니다 */
        const a = one(t.slice(0, k), has), b = one(t.slice(k + 1), has);
        if(a && b) return [{ text: t.slice(0, k), lemma: a }, { text: t.slice(k + 1), lemma: b }];
        k = t.indexOf(p, k + 1);
      }
    }
    return null;
  }

  /* 입력 전체 → 조각마다 { text, lemma }. lemma가 null이면 그 조각은 지도 밖 */
  function resolve(text, has){
    const parts = (text || "").normalize("NFC").trim().split(/\s+/).filter(Boolean);
    const out = [];
    for(const p of parts){
      const l = one(p, has);
      if(l){ out.push({ text: p, lemma: l }); continue; }
      const sp = /^[가-힣]{4,}$/.test(p) ? splitJoined(p, has) : null;
      if(sp) out.push(...sp); else out.push({ text: p, lemma: null });
    }
    return out;
  }
  return { resolve, one, koCandidates, enCandidates, toHangul };
})();
