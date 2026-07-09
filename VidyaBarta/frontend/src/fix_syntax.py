import os
import re

files = [
    "Components/AdmissionCheckout.jsx",
    "Components/AdmissionForm.jsx",
    "Components/Career.jsx",
    "Components/TenderApply.jsx",
    "Components/JobApplicationForm.jsx",
    "Components/Footer.jsx",
    "Components/IDCardViewer.jsx",
    "Components/Gallery.jsx",
    "SchoolLayout.jsx",
]

base_dir = "/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src"

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r') as file:
        content = file.read()
    
    original_content = content
    
    # 1. Fix `" ${schoolProfile?.name || "Our School"} "` -> `(schoolProfile?.name || "Our School")`
    # We look for nested ones like `schoolProfile?.name || "${schoolProfile?.name || "Our School"}"`
    # and replace with `schoolProfile?.name || "Our School"`
    content = content.replace('"${schoolProfile?.name || "Our School"}"', '"Our School"')
    content = content.replace("'${schoolProfile?.name || \"Our School\"}'", "'Our School'")
    
    # Fix the Gallery issue: `"Video highlight from ${schoolProfile?.name || "Our School"}."`
    content = content.replace('"Video highlight from ${schoolProfile?.name || "Our School"}."', '`Video highlight from ${schoolProfile?.name || "Our School"}.`')
    
    if content != original_content:
        with open(path, 'w') as file:
            file.write(content)
        print(f"Fixed {f}")
