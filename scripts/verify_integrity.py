import sys
import glob

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

# Verificación de sintaxis y balance de llaves JS
def check_js_syntax(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    stack = []
    i = 0
    n = len(code)
    line = 1
    col = 1
    in_str = None
    in_comment = None
    while i < n:
        ch = code[i]
        if ch == '\n':
            line += 1
            col = 0
            if in_comment == 'line':
                in_comment = None
        col += 1
        if in_comment == 'line':
            i += 1
            continue
        elif in_comment == 'block':
            if ch == '*' and i + 1 < n and code[i+1] == '/':
                in_comment = None
                i += 2
                col += 1
                continue
            i += 1
            continue
        if in_str:
            if ch == '\\':
                i += 2
                col += 1
                continue
            elif ch == in_str:
                in_str = None
            i += 1
            continue
        if ch == '/' and i + 1 < n:
            if code[i+1] == '/':
                in_comment = 'line'
                i += 2
                col += 1
                continue
            elif code[i+1] == '*':
                in_comment = 'block'
                i += 2
                col += 1
                continue
        if ch in ('"', "'", '`'):
            in_str = ch
            i += 1
            continue
        if ch in ('{', '(', '['):
            stack.append((ch, line, col))
        elif ch in ('}', ')', ']'):
            expected = {'}': '{', ')': '(', ']': '['}[ch]
            if not stack:
                print(f'{filename}: ERROR unexpected {ch} at line {line}, col {col}')
                return False
            last, l_line, l_col = stack.pop()
            if last != expected:
                print(f'{filename}: ERROR mismatched {ch} at line {line}, col {col}, expected {last} from line {l_line}')
                return False
        i += 1
    if stack:
        for item in stack:
            print(f'{filename}: UNCLOSED {item[0]} from line {item[1]}, col {item[2]}')
        return False
    print(f"PASS JS: {filename}")
    return True

for f in ['js/finanzas.js', 'js/dinamicas.js', 'js/core.js']:
    if not check_js_syntax(f):
        sys.exit(1)

print("\n✓ TODOS LOS COMPONENTES, IDS, ENLACES Y SINTAXIS JS ESTÁN 100% INTACTOS.")
