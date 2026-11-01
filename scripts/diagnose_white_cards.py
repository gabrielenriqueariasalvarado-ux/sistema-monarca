import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

print("HTML length:", len(html))
print("CSS length:", len(css))

# Look for inline style white backgrounds in HTML
inline_whites = re.findall(r'style="[^"]*background(?:-color)?:\s*(?:#ffffff|#fff|white|#f9fafb|#fafafa|#f3f4f6|#f1f5f9)[^"]*"', html, re.IGNORECASE)
print(f"Inline light backgrounds in index.html: {len(inline_whites)}")

# Look for CSS rules in style.css that still have background: #ffffff or white
css_whites = re.findall(r'([^{}]+)\{[^{}]*background(?:-color)?:\s*(?:#ffffff|#fff|white|#f9fafb|#fafafa|#f3f4f6)[^{}]*\}', css, re.IGNORECASE)
print(f"CSS rules with light background in style.css: {len(css_whites)}")

# Check references to "Monarca" and "Jarvis"
monarca_count_html = len(re.findall(r'monarca', html, re.IGNORECASE))
jarvis_count_html = len(re.findall(r'jarvis', html, re.IGNORECASE))
print(f"Occurrences in index.html -> Monarca: {monarca_count_html}, Jarvis: {jarvis_count_html}")
