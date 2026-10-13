#!/bin/zsh
# 기획서 그림 셋을 찍습니다. 먼저 mockup/ 에서 python3 -m http.server 8001 을 켜 두세요(server.py가 아닙니다 — 그쪽은 연결을 열어 둬 촬영이 안 끝납니다).
#   ./build_figs.sh <출력폴더>
OUT=${1:-.}; CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; B="http://localhost:8001/fig"   # 장부 서버(8000)가 아니라 그냥 파일 서버 — 연결을 열어 두지 않아 촬영이 끝납니다
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1250,900 --virtual-time-budget=6000 --timeout=20000 --screenshot="$OUT/fig-collect.png" "$B/fig-collect.html?t=$(date +%s)" 2>/dev/null
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1250,320 --virtual-time-budget=3000 --timeout=20000 --screenshot="$OUT/fig-cond.png" "$B/fig-cond.html?t=$(date +%s)" 2>/dev/null
ls -la "$OUT"/fig-*.png
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1110,200 --virtual-time-budget=3000 --timeout=20000 --screenshot="$OUT/fig-dialectic.png" "$B/fig-dialectic.html?t=$(date +%s)" 2>/dev/null
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1250,900 --virtual-time-budget=6000 --timeout=20000 --host-resolver-rules="MAP broker.emqx.io 127.0.0.1" --screenshot="$OUT/fig-pick.png" "$B/fig-pick.html?t=$(date +%s)" 2>/dev/null
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1600,900 --virtual-time-budget=8000 --timeout=20000 --host-resolver-rules="MAP broker.emqx.io 127.0.0.1" --screenshot="$OUT/fig-review.png" "$B/fig-review.html?t=$(date +%s)" 2>/dev/null
# 2026.10.13 — 고르기·리뷰. --host-resolver-rules 는 인터넷 중계를 끊어 「혼자」 모드로 찍는 것(하네스가 장부 씨앗을 심습니다). 실제 방 장부를 건드리지 않습니다
