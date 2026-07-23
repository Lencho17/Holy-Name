import os
import re

dir_path = "/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src"

# Target specific formatted strings that render full dates, and replace with dd-mm-yyyy logic
regexes = [
    (re.compile(r"\.toLocaleDateString\('en-US',\s*\{\s*month:\s*'long',\s*day:\s*'numeric',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\('en-US',\s*\{\s*month:\s*'short',\s*day:\s*'numeric',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\(undefined,\s*\{\s*day:\s*'2-digit',\s*month:\s*'short',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\('en-GB',\s*\{\s*day:\s*'2-digit',\s*month:\s*'short',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\(undefined,\s*\{\s*weekday:\s*'short',\s*day:\s*'2-digit',\s*month:\s*'short',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\('en-IN',\s*\{\s*day:\s*'2-digit',\s*month:\s*'long',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\('en-IN',\s*\{\s*day:\s*'numeric',\s*month:\s*'long',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    (re.compile(r"\.toLocaleDateString\('en-IN',\s*\{\s*month:\s*'short',\s*day:\s*'numeric',\s*year:\s*'numeric'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-')"),
    # Time formatted ones
    (re.compile(r"\.toLocaleDateString\('en-IN',\s*\{\s*year:\s*'numeric',\s*month:\s*'short',\s*day:\s*'numeric',\s*hour:\s*'2-digit',\s*minute:\s*'2-digit'\s*\}\)"), r".toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' + new Date(entry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })")
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
            
            # Special case for WalletDashboard where we matched entry.created_at or requested_at or w.last_updated
            new_content = re.sub(
                r"\.toLocaleDateString\('en-GB'\)\.replace\(/\\//g, '-'\) \+ ' ' \+ new Date\(entry\.created_at\)",
                r".toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' + new Date(entry?.created_at || new Date())",
                new_content
            )

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated {file}")

print(f"Total files updated: {count}")
