# 거리표 만들기 (2026.10.12 — 어휘를 키운 2판) — sphere-table.js를 만듭니다. 공개 자료만:
#   한국어: 국립국어원 「한국어기초사전」 전체 내려받기(JSON, CC BY-SA 2.0 KR — 상업적 이용 허용·출처 표시·동일조건)
#           + 국립국어원 「한국어 학습용 어휘 목록」(2003, 공공누리 제1유형)
#   영어:   NGSL · NAWL · BSL · TSL (newgeneralservicelist.com, CC BY-SA 4.0)
#   모델:   intfloat/multilingual-e5-small (MIT) — ONNX
#   실행:   python make_sphere_table.py <내려받은폴더> data.js sphere-table.js <모델폴더> "query: "
#   내려받은폴더 안: vocab/krdict_words.tsv(extract_krdict.py가 만든 것) · vocab/ko8.txt · vocab/{ngsl,nawl,bsl,tsl}.csv
import sys, re, json, base64, csv, time
import numpy as np, onnxruntime as ort
from tokenizers import Tokenizer
DL, DATAJS, OUT, MDIR, PFX = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]

# ── 한국어 어휘 ──
ko = []
for line in open(f"{DL}/vocab/krdict_words.tsv", encoding="utf-8"):
    w = line.split("\t")[0].strip()
    if w: ko.append(w)
n_krdict = len(set(ko))
for line in open(f"{DL}/vocab/ko8.txt", encoding="utf-8"):
    c = line.rstrip("\r\n").split("\t")
    if len(c) < 3 or not c[0].strip().isdigit(): continue
    if c[2] not in ("명", "동", "형", "부"): continue
    w = re.sub(r"\d+$", "", c[1]).strip()
    if w and re.fullmatch(r"[가-힣]+", w): ko.append(w)
# ── 영어 어휘 — 네 목록의 표제어(첫 열). ## 줄은 설명 ──
en = []
for name in ("ngsl", "nawl", "bsl", "tsl"):
    for line in open(f"{DL}/vocab/{name}.csv", encoding="utf-8-sig", errors="ignore"):
        if line.startswith("#"): continue
        w = line.split(",")[0].strip().lower()
        if w in ("lemma", ""): continue
        if re.fullmatch(r"[a-z]+", w): en.append(w)
vocab = list(dict.fromkeys(ko + en))
posters = re.findall(r'\{ w: "([^"]+)"', open(DATAJS, encoding="utf-8").read())
assert len(posters) == 30, len(posters)
print("ko", len(set(ko)), "(krdict", n_krdict, ") en", len(set(en)), "vocab", len(vocab), flush=True)

tok = Tokenizer.from_file(f"{MDIR}/tokenizer.json")
tok.enable_padding(); tok.enable_truncation(32)
sess = ort.InferenceSession(f"{MDIR}/model.onnx")
names = [i.name for i in sess.get_inputs()]
def embed(words):
    out = []; t0 = time.time()
    for i in range(0, len(words), 256):
        enc = tok.encode_batch([PFX + w for w in words[i:i+256]])
        ids = np.array([e.ids for e in enc], dtype=np.int64)
        am = np.array([e.attention_mask for e in enc], dtype=np.int64)
        feed = {"input_ids": ids, "attention_mask": am}
        if "token_type_ids" in names: feed["token_type_ids"] = np.zeros_like(ids)
        h = sess.run(None, feed)[0]
        v = (h * am[..., None]).sum(1) / am.sum(1, keepdims=True)
        out.append((v / np.linalg.norm(v, axis=1, keepdims=True)).astype(np.float32))
        if (i // 256) % 20 == 0: print(f"  {i}/{len(words)} {time.time()-t0:.0f}s", flush=True)
    return np.vstack(out)
V = embed(vocab); P = embed(posters)

# 언어 보정 — 다국어 모델은 같은 뜻이어도 언어가 다르면 멀게 잽니다.
#   영어·한국어 어휘를 각자의 평균으로 빼서 「언어」라는 축을 지웁니다(포스터 단어는 한국어 평균).
isen = np.array([bool(re.fullmatch(r"[a-z]+", w)) for w in vocab])
mk, me = V[~isen].mean(0), V[isen].mean(0)
V = V - np.where(isen[:, None], me, mk); P = P - mk
V /= np.linalg.norm(V, axis=1, keepdims=True); P /= np.linalg.norm(P, axis=1, keepdims=True)

# 방향 — 어휘 전체를 3차원으로 접은 뜻의 대략적 지도(주성분). 5만 행 SVD는 공분산으로 돕니다
C = (V.T @ V) / len(V)
_, vecs = np.linalg.eigh(C)
D3 = V @ vecs[:, -3:]
D3 /= np.linalg.norm(D3, axis=1, keepdims=True)
dirq = np.clip(np.round((D3 + 1) * 127.5), 0, 255).astype(np.uint8)

# 깊이 — 포스터 단어마다, 어휘 전체 중 몇 번째로 가까운가(백분위). 0 = 가장 가까움
rad = {}
sims = P @ V.T
for k, w in enumerate(posters):
    order = np.argsort(-sims[k]); pct = np.empty(len(vocab)); pct[order] = np.arange(len(vocab)) / (len(vocab) - 1)
    rad[w] = base64.b64encode(np.round(pct * 255).astype(np.uint8).tobytes()).decode()
    print(w, "→", [vocab[j] for j in order[:10]])

js = ("/* 거리표 — make_sphere_table.py가 만듭니다. 손으로 고치지 마세요.\n"
      "   어휘: 국립국어원 「한국어기초사전」(krdict.korean.go.kr, CC BY-SA 2.0 KR) · 국립국어원 「한국어 학습용 어휘 목록」(2003, 공공누리 제1유형)\n"
      "         NGSL · NAWL · BSL · TSL (newgeneralservicelist.com, CC BY-SA 4.0)\n"
      "   모델: intfloat/multilingual-e5-small (MIT)\n"
      "   이 표는 위 자료를 가공한 것이라 같은 조건(저작자 표시·동일조건변경허락)으로 배포합니다. */\n"
      "window.SPH = " + json.dumps({"words": vocab, "dir": base64.b64encode(dirq.tobytes()).decode(), "rad": rad}, ensure_ascii=False) + ";\n")
open(OUT, "w", encoding="utf-8").write(js)
print("bytes", len(js.encode()))
