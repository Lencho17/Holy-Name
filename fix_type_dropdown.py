import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminPages.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the initial state
content = content.replace("type: 'Theory'", "type: 'Core'")

# Replace the dropdown options
old_dropdown = """<option value="Theory">Theory</option>
            <option value="Practical">Practical</option>
            <option value="Both">Both</option>"""
new_dropdown = """<option value="Core">Core</option>
            <option value="Elective">Elective</option>
            <option value="MIL">MIL</option>"""
content = content.replace(old_dropdown, new_dropdown)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Type dropdown fixed.")
