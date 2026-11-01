import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

js_dir = 'js'
for filename in os.listdir(js_dir):
    if filename.endswith('.js'):
        path = os.path.join(js_dir, filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        matches = re.findall(r'background(?:-color)?:\s*(?:#ffffff|#fff|white|#f9fafb|#fafafa|#f3f4f6|#f8fafc)', content, re.IGNORECASE)
        if matches:
            print(f"{filename}: {len(matches)} white backgrounds injected in HTML")
