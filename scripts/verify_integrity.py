import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

checks = [
    'id="vista-menu"',
    'id="player-title"',
    'id="player-level"',
    'id="cloud-sync-badge"',
    'monarca-bottom-hud',
    "cambiarVista('vista-perfil')",
    "cambiarVista('vista-acciones-progresion')",
    "cambiarVista('vista-ejercicios')",
    "cambiarVista('vista-estado-personal')",
    "cambiarVista('vista-finanzas')",
    "cambiarVista('vista-ideas')",
    "cambiarVista('vista-conocimiento')",
    "cambiarVista('vista-labores')",
    "cambiarVista('vista-personas')",
    "cambiarVista('vista-ruleta')",
    "cambiarVista('vista-calendario')",
    "cambiarVista('vista-inventario')",
    "btn-jarvis-voz-flotante",
    "btn-asistente-flotante"
]

all_passed = True
for c in checks:
    if c not in text:
        print(f"FAILED TO FIND: {c}")
        all_passed = False
    else:
        print(f"PASS: {c}")

if not all_passed:
    sys.exit(1)

print("\n✓ TODOS LOS COMPONENTES, IDS Y ENLACES ESTÁN 100% INTACTOS.")
