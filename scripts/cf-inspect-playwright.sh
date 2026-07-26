#!/usr/bin/env bash
set -euo pipefail
cd "$HOME/nagarik-watch/apps/web"
python3 <<'PY'
from pathlib import Path
t = Path('.open-next/server-functions/default/apps/web/handler.mjs').read_text(encoding='utf-8', errors='ignore')
idx = t.find('playwright')
print('first', idx)
print(repr(t[max(0,idx-100):idx+180]))
# largest unique nearby tokens
import re
hits = [m.start() for m in re.finditer('playwright', t)]
print('hits', len(hits))
# sample 5 contexts
for i in hits[:5]:
    print('---', repr(t[max(0,i-60):i+80].replace('\n',' '))[:160])
PY
