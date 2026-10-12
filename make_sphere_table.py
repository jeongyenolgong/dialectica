# 거리표 만들기 (2026.10.12 — 어휘를 키운 2판) — sphere-table.js를 만듭니다. 공개 자료만:
#   한국어: 국립국어원 「한국어기초사전」 전체 내려받기(JSON, CC BY-SA 2.0 KR — 상업적 이용 허용·출처 표시·동일조건)
#           + 국립국어원 「한국어 학습용 어휘 목록」(2003, 공공누리 제1유형)
#   영어:   NGSL · NAWL · BSL · TSL (newgeneralservicelist.com, CC BY-SA 4.0)
#   모델:   intfloat/multilingual-e5-small (MIT) — ONNX
#   실행:   python make_sphere_table.py <내려받은폴더> data.js sphere-table.js <모델폴더> "query: "
#   함께 나오는 것: sphere-vec.bin — 단어마다 128차원 좌표(int8). 「사이에 있는 말」 후보를 폰에서 고를 때 씁니다.
#            3차원 자리로는 후보가 엉망이라(2026.10.12 실험) 128차원을 따로 둡니다. 384차원 전체와 거의 같은 결과.
#   내려받은폴더 안: vocab/krdict_words.tsv(extract_krdict.py가 만든 것) · vocab/ko8.txt · vocab/{ngsl,nawl,bsl,tsl}.csv
import sys, re, json, base64, csv, time
import numpy as np, onnxruntime as ort
from tokenizers import Tokenizer
DL, DATAJS, OUT, MDIR, PFX = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]

# ── 한국어 어휘 ── 등급도 같이(초급 1 · 중급 2 · 고급·없음 3) — 중간 단어 후보는 1·2에서만 뽑습니다
ko = []; LVL = {}
for line in open(f"{DL}/vocab/krdict_words.tsv", encoding="utf-8"):
    c = line.rstrip("\n").split("\t"); w = c[0].strip()
    if not w: continue
    ko.append(w)
    l = {"초급": 1, "중급": 2}.get(c[2] if len(c) > 2 else "", 3)
    LVL[w] = min(LVL.get(w, 3), l)
n_krdict = len(set(ko))
for line in open(f"{DL}/vocab/ko8.txt", encoding="utf-8"):
    c = line.rstrip("\r\n").split("\t")
    if len(c) < 3 or not c[0].strip().isdigit(): continue
    if c[2] not in ("명", "동", "형", "부"): continue
    w = re.sub(r"\d+$", "", c[1]).strip()
    if w and re.fullmatch(r"[가-힣]+", w): ko.append(w); LVL.setdefault(w, 2)   # 학습용 어휘는 중급으로
# ── 영어 어휘 — 네 목록의 표제어(첫 열). ## 줄은 설명 ──
en = []
for name in ("ngsl", "nawl", "bsl", "tsl"):
    for line in open(f"{DL}/vocab/{name}.csv", encoding="utf-8-sig", errors="ignore"):
        if line.startswith("#"): continue
        w = line.split(",")[0].strip().lower()
        if w in ("lemma", ""): continue
        if re.fullmatch(r"[a-z]+", w): en.append(w); LVL.setdefault(w, 1 if name == "ngsl" else 3)   # 영어는 NGSL만 흔한 말
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

lvl = base64.b64encode(bytes(LVL.get(w, 3) for w in vocab)).decode()
# 128차원 좌표 — 주성분 128개에 얹고 단위 길이로 맞춰 int8(×127)로. 코사인은 int8 내적으로 셉니다
K = 128
# 어휘 뒤에 포스터 단어 30개를 덧붙입니다 — 「기존의 틀」 같은 구절은 어휘에 없어서 따로 실어야 합니다(순서는 data.js 그대로)
D128 = np.vstack([V, P]) @ vecs[:, -K:][:, ::-1]
D128 /= np.linalg.norm(D128, axis=1, keepdims=True)
q = np.clip(np.round(D128 * 127), -127, 127).astype(np.int8)
open(OUT.replace("sphere-table.js", "sphere-vec.bin"), "wb").write(q.tobytes())
print("vec", q.shape)
js = ("/* 거리표 — make_sphere_table.py가 만듭니다. 손으로 고치지 마세요.\n"
      "   어휘: 국립국어원 「한국어기초사전」(krdict.korean.go.kr, CC BY-SA 2.0 KR) · 국립국어원 「한국어 학습용 어휘 목록」(2003, 공공누리 제1유형)\n"
      "         NGSL · NAWL · BSL · TSL (newgeneralservicelist.com, CC BY-SA 4.0)\n"
      "   모델: intfloat/multilingual-e5-small (MIT)\n"
      "   이 표는 위 자료를 가공한 것이라 같은 조건(저작자 표시·동일조건변경허락)으로 배포합니다. */\n"
      "window.SPH = " + json.dumps({"words": vocab, "dir": base64.b64encode(dirq.tobytes()).decode(), "rad": rad, "lvl": lvl, "vdim": K, "posters": posters}, ensure_ascii=False) + ";\n")
open(OUT, "w", encoding="utf-8").write(js)
print("bytes", len(js.encode()))
