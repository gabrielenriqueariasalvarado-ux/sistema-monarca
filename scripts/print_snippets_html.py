import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'background(?:-color)?:\s*(?:#ffffff|#fff|white|#f9fafb|#fafafa|#f3f4f6)[^;"]*', text, re.IGNORECASE):
    start = max(0, m.start() - 60)
    end = min(len(text), m.end() + 60)
    snippet = text[start:end].replace('\n', ' ')
    print(f"[{m.start()}]: ...{snippet}...")
