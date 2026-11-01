import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's inspect vista-perfil
perfil_match = re.search(r'<div id="vista-perfil"[^>]*>([\s\S]*?)<div id="vista-', html)
if perfil_match:
    print("=== VISTA PERFIL SNIPPET ===")
    print(perfil_match.group(0)[:1500])

# Let's inspect vista-estado-personal
estado_match = re.search(r'<div id="vista-estado-personal"[^>]*>([\s\S]*?)<div id="vista-', html)
if estado_match:
    print("\n=== VISTA ESTADO PERSONAL SNIPPET ===")
    print(estado_match.group(0)[:1500])

