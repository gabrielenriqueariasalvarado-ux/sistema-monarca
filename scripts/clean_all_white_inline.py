import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("Original HTML length:", len(html))

# 1. Transform inline white inputs in modals and forms
html = re.sub(
    r'style="([^"]*?)background:\s*#ffffff;\s*border:\s*1px\s+solid\s+#d1d5db;([^"]*?)"',
    r'style="\1background: #0b0e15; border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc;\2"',
    html
)

html = re.sub(
    r'style="([^"]*?)background:\s*#ffffff;([^"]*?)"',
    r'style="\1background: #0f131d;\2"',
    html
)

html = re.sub(
    r'style="([^"]*?)background:\s*#f9fafb;([^"]*?)"',
    r'style="\1background: #121725;\2"',
    html
)

html = re.sub(
    r'style="([^"]*?)background:\s*#f3f4f6;([^"]*?)"',
    r'style="\1background: rgba(255, 255, 255, 0.05);\2"',
    html
)

html = re.sub(
    r'border:\s*1px\s+solid\s+#e5e7eb;',
    r'border: 1px solid rgba(255, 255, 255, 0.08);',
    html
)

html = re.sub(
    r'border:\s*1px\s+solid\s+#d1d5db;',
    r'border: 1px solid rgba(255, 255, 255, 0.1);',
    html
)

# Text colors
html = html.replace('color: #111827;', 'color: #f8fafc;')
html = html.replace('color: #1f2937;', 'color: #f8fafc;')
html = html.replace('color: #374151;', 'color: #cbd5e1;')
html = html.replace('color: #4b5563;', 'color: #94a3b8;')

# Canvas ruleta
html = html.replace('background: #0f131d; border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.12);', 'background: #141926; border-radius: 50%; border: 2px solid rgba(99, 102, 241, 0.4); box-shadow: 0 0 30px rgba(99, 102, 241, 0.25);')

# Jarvis live transcript box
html = html.replace('border: 1.5px dashed rgba(255, 255, 255, 0.1);', 'border: 1.5px dashed rgba(99, 102, 241, 0.4); background: #0b0e15;')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("✓ index.html limpiado de estilos inline blancos!")
