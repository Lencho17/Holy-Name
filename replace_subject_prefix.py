import re

files = [
    '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/StudentPortal.jsx',
    '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/ResultsPortal.jsx',
    '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/ExamManagement.jsx'
]

# Patterns we want to match: {grade.subject}, {m.subject}, {g.subject}, {subject} etc.
# We will just replace common variable names we found.

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace in JSX curly braces
        content = re.sub(r'\{grade\.subject\}', '{grade.subject?.replace(/^VB/, \'\')}', content)
        content = re.sub(r'\{m\.subject\}', '{m.subject?.replace(/^VB/, \'\')}', content)
        content = re.sub(r'\{g\.subject\}', '{g.subject?.replace(/^VB/, \'\')}', content)
        
        # In StudentPortal.jsx line 533: {g.exam?.name} - {g.subject}
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Patched {filepath}")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for f in files:
    replace_in_file(f)
