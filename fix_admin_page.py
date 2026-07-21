import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add globalSubjects state back
state_marker = "const [classSubjects, setClassSubjects] = useState([]);"
new_state = "const [globalSubjects, setGlobalSubjects] = useState([]);\n  const [classSubjects, setClassSubjects] = useState([]);"
content = content.replace(state_marker, new_state)

# 2. Add functions back
functions_marker = "  const fetchStudents = async () => {"
new_functions = """  const fetchGlobalSubjects = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGlobalSubjects(await res.json());
    } catch (err) {}
  };

  const fetchClassSubjects = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setClassSubjects(await res.json());
    } catch (err) {}
  };
  
  const handleMapClassSubject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newClassSubject)
      });
      if (res.ok) {
        fetchClassSubjects();
        alert('Subject mapped to class successfully');
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error mapping subject');
      }
    } catch (err) {
      alert('Error mapping subject');
    }
  };
  
  const handleDeleteClassSubject = async (id) => {
    if (!window.confirm('Are you sure you want to remove this mapping?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/mapping/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchClassSubjects();
    } catch (err) {}
  };

  const fetchStudents = async () => {"""
content = content.replace(functions_marker, new_functions)

# 3. Restore fetchGlobalSubjects in the polling loop
# Since we replaced { fetchClassSubjects(); fetchGlobalSubjects(); } with { fetchClassSubjects(); } earlier,
# let's change it back.
content = content.replace("{ fetchClassSubjects(); }", "{ fetchClassSubjects(); fetchGlobalSubjects(); }")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminPage.jsx fixed.")
