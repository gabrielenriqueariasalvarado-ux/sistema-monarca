import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

for name in ['js/inventario.js', 'js/ideas.js', 'js/dinamicas.js', 'js/calendario.js', 'app.js']:
    with open(name, 'r', encoding='utf-8') as f:
        text = f.read()

    # Replacements
    text = text.replace('background: #ffffff;', 'background: #121725;')
    text = text.replace('background:#ffffff;', 'background: #121725;')
    text = text.replace('background: #f9fafb;', 'background: #0b0e15;')
    text = text.replace('background:#f9fafb;', 'background: #0b0e15;')
    text = text.replace('background: #f3f4f6;', 'background: rgba(255, 255, 255, 0.05);')
    text = text.replace('border: 1px solid #e5e7eb;', 'border: 1px solid rgba(255, 255, 255, 0.08);')
    text = text.replace('border: 1px solid #d1d5db;', 'border: 1px solid rgba(255, 255, 255, 0.1);')
    text = text.replace('color: #111827;', 'color: #f8fafc;')
    text = text.replace('color: #1f2937;', 'color: #f8fafc;')
    text = text.replace('color: #374151;', 'color: #cbd5e1;')
    text = text.replace('color: #4b5563;', 'color: #94a3b8;')

    with open(name, 'w', encoding='utf-8') as f:
        f.write(text)

    print(f"✓ {name} limpiado de estilos blancos!")
