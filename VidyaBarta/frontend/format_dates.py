import os
import re

dir_path = "/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src"

regex = re.compile(r'\.toLocaleDateString\([^)]*\)')
replacement = r".toLocaleDateString('en-GB').replace(/\//g, '-')"

count = 0
for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = regex.sub(replacement, content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated {file}")

print(f"Total files updated: {count}")
