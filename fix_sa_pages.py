import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminPages.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Bad state block that was injected
bad_block = """  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const generateSubjectPrefix = (name) => name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
  
  const filteredSubjects = AHSEC_SEBA_SUBJECTS.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  if (searchTerm && !filteredSubjects.some(s => s.toLowerCase() === searchTerm.toLowerCase())) {
    filteredSubjects.unshift(searchTerm);
  }"""

# Clean it up from everywhere. But we need it in GlobalSubjects!
# Let's remove it globally first.
content = content.replace(bad_block, "")

# Now inject it specifically inside GlobalSubjects.
# Let's find GlobalSubjects = () => { ...
# and inject the good state.
good_block = """  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const generateSubjectPrefix = (name) => {
    const p = name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
    return p ? `VB-${p}` : '';
  };
  
  const filteredSubjects = AHSEC_SEBA_SUBJECTS.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  if (searchTerm && !filteredSubjects.some(s => s.toLowerCase() === searchTerm.toLowerCase())) {
    filteredSubjects.unshift(searchTerm);
  }"""

# GlobalSubjects starts with:
# export const GlobalSubjects = () => {
#   const [globalSubjects, setGlobalSubjects] = useState([]);
global_marker = "export const GlobalSubjects = () => {\n  const [globalSubjects, setGlobalSubjects] = useState([]);\n  const [newGlobalSubject, setNewGlobalSubject] = useState({ name: '', class_level: '', type: 'Theory' });\n  const [loading, setLoading] = useState(true);"
new_global = f"{global_marker}\n{good_block}"

content = content.replace(global_marker, new_global)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SuperAdminPages.jsx cleaned and prefix updated.")
