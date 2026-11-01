import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Let's find selector + background: #fff / white / #f9fafb / #f3f4f6
rules = re.findall(r'([^{}\n]+)\s*\{[^}]*background(?:-color)?:\s*(?:#ffffff|#fff|white|#f9fafb|#fafafa|#f3f4f6)[^}]*\}', css, re.IGNORECASE)
print(f"Total matching selectors: {len(rules)}")
for r in rules[:30]:
    sel = r.strip()
    if not sel.startswith('@') and not sel.startswith('/*'):
        print(" -", sel)
