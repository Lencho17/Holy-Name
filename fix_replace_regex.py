import re

files = [
    '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx',
    '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/StudentPortal.jsx',
    '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/ResultsPortal.jsx',
    '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/ExamManagement.jsx'
]

def fix_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        content = content.replace("replace(/^VB/, '')", "replace(/^VB-?/, '')")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for f in files:
    fix_in_file(f)

print("Regexes updated.")
