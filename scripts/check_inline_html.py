import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'background(?:-color)?:\s*(?:#ffffff|#fff|white|#f9fafb|#fafafa|#f3f4f6)[^;"]*', text, re.IGNORECASE)
print('Remaining inline white in index.html:', len(matches))
for m in matches[:20]:
    print(' -', m.strip())
