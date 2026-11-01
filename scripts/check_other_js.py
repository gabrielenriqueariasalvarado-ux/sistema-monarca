import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

for name in ['js/inventario.js', 'js/ideas.js', 'js/dinamicas.js', 'js/calendario.js']:
    with open(name, 'r', encoding='utf-8') as f:
        text = f.read()
    
    matches = re.findall(r'background(?:-color)?:\s*(?:#ffffff|#fff|white|#f9fafb|#fafafa|#f3f4f6)[^;"]*', text, re.IGNORECASE)
    print(f"{name}: {len(matches)} matches")
    for m in matches[:5]:
        print("  -", m.strip())
