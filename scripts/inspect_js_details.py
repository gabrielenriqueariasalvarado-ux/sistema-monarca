import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/perfil.js', 'r', encoding='utf-8') as f:
    print("=== PERFIL.JS ===")
    print(f.read()[:1200])

with open('js/estado-personal.js', 'r', encoding='utf-8') as f:
    print("\n=== ESTADO-PERSONAL.JS (overview snippet) ===")
    content = f.read()
    idx = content.find('hud-avatar-overview')
    if idx != -1:
        print(content[idx-100:idx+800])
    else:
        print(content[:800])
