import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace global subjects dropdown display
content = content.replace("{s.name} ({s.code})", "{s.name} ({s.code?.replace(/^VB/, '')})")

# Replace class subjects table display
content = content.replace("<td className=\"p-4 font-mono text-gray-500\">{map.subjects?.code}</td>", 
                          "<td className=\"p-4 font-mono text-gray-500\">{map.subjects?.code?.replace(/^VB/, '')}</td>")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminPage.jsx patched successfully.")
