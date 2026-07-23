import os
import re

dir_path = "/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src"

# This regex matches .toLocaleDateString() or .toLocaleDateString('en-IN') or .toLocaleDateString('en-GB')
# specifically with NO options object.
regexes = [
    (re.compile(r"\.toLocaleDateString\(\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\('en-IN'\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\('en-GB'\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')")
]

count = 0
for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for regex, replacement in regexes:
                new_content = regex.sub(replacement, new_content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated {file}")

print(f"Total files updated: {count}")
