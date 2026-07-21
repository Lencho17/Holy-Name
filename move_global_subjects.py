import re
import os

# 1. Read AdminPage.jsx and remove the Global Subjects stuff
admin_file = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx'
with open(admin_file, 'r', encoding='utf-8') as f:
    admin_content = f.read()

# Remove Global Subjects state
admin_content = re.sub(r'  const \[globalSubjects, setGlobalSubjects\] = useState\(\[\]\);\n', '', admin_content)
admin_content = re.sub(r"  const \[newGlobalSubject, setNewGlobalSubject\] = useState\(\{ name: '', code: '', type: 'Theory' \}\);\n", '', admin_content)

# Remove Global Subjects fetches
fetch_pattern = re.compile(r'  const fetchGlobalSubjects = async \(\) => \{.*?\};\n\n', re.DOTALL)
admin_content = re.sub(fetch_pattern, '', admin_content)

create_pattern = re.compile(r'  const handleCreateGlobalSubject = async \(e\) => \{.*?\};\n\n', re.DOTALL)
admin_content = re.sub(create_pattern, '', admin_content)

delete_pattern = re.compile(r'  const handleDeleteGlobalSubject = async \(id\) => \{.*?\};\n\n', re.DOTALL)
admin_content = re.sub(delete_pattern, '', admin_content)

# Update triggers
trigger_pattern = re.compile(r"      if \(activeTab === 'dashboard' \|\| activeTab === 'globalSubjects'\) fetchGlobalSubjects\(\);\n")
admin_content = re.sub(trigger_pattern, '', admin_content)
admin_content = admin_content.replace("{ fetchClassSubjects(); fetchGlobalSubjects(); }", "{ fetchClassSubjects(); }")

# Remove from Sidebar
sidebar_pattern = re.compile(r"            \{\(adminUser\?\.role === 'superadmin' \|\| adminUser\?\.role === 'developer'\) && \(\n              <SubItem active=\{activeTab === 'globalSubjects'\} onClick=\{\(\) => \{ setActiveTab\('globalSubjects'\); setIsSidebarOpen\(false\); \}\} label=\"Global Subjects\" />\n            \)\}\n")
admin_content = re.sub(sidebar_pattern, '', admin_content)

# Remove JSX block
jsx_pattern = re.compile(r"          \{activeTab === 'globalSubjects' && \(adminUser\?\.role === 'superadmin' \|\| adminUser\?\.role === 'developer'\) && \(\n.*?          \)\}\n\n", re.DOTALL)
admin_content = re.sub(jsx_pattern, '', admin_content)

with open(admin_file, 'w', encoding='utf-8') as f:
    f.write(admin_content)

# 2. Add GlobalSubjects to SuperAdminPages.jsx
sa_pages_file = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminPages.jsx'
with open(sa_pages_file, 'r', encoding='utf-8') as f:
    sa_pages_content = f.read()

global_subjects_comp = """
export const GlobalSubjects = () => {
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [newGlobalSubject, setNewGlobalSubject] = useState({ name: '', code: '', type: 'Theory' });
  const [loading, setLoading] = useState(true);

  const fetchGlobalSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGlobalSubjects(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalSubjects();
  }, []);

  const handleCreateGlobalSubject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newGlobalSubject)
      });
      if (res.ok) {
        setNewGlobalSubject({ name: '', code: '', type: 'Theory' });
        fetchGlobalSubjects();
        alert('Global Subject Created');
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error creating global subject');
      }
    } catch (err) {
      alert('Error creating global subject');
    }
  };

  const handleDeleteGlobalSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this global subject?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchGlobalSubjects();
    } catch (err) {}
  };

  return (
    <PageWrapper title="Global Subjects">
      <form onSubmit={handleCreateGlobalSubject} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
          <input required type="text" value={newGlobalSubject.name} onChange={e => setNewGlobalSubject({...newGlobalSubject, name: e.target.value})} className="w-full border-gray-300 p-2.5 rounded-lg" placeholder="e.g. Mathematics" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">6-Digit Code</label>
          <input required type="text" maxLength={6} minLength={6} value={newGlobalSubject.code} onChange={e => setNewGlobalSubject({...newGlobalSubject, code: e.target.value.toUpperCase()})} className="w-full border-gray-300 p-2.5 rounded-lg font-mono uppercase" placeholder="e.g. MAT101" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
          <select required value={newGlobalSubject.type} onChange={e => setNewGlobalSubject({...newGlobalSubject, type: e.target.value})} className="w-full border-gray-300 p-2.5 rounded-lg">
            <option value="Theory">Theory</option>
            <option value="Practical">Practical</option>
            <option value="Both">Both</option>
          </select>
        </div>
        <button type="submit" className="bg-primary text-white p-2.5 rounded-lg font-bold hover:bg-primary-dark w-full">Add Subject</button>
      </form>

      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-surface-variant text-on-surface-variant text-sm font-bold uppercase">
            <tr>
              <th className="p-4">Subject Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Type</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant bg-surface">
            {globalSubjects.map(sub => (
              <tr key={sub.id} className="hover:bg-surface-variant/50">
                <td className="p-4 font-semibold text-on-surface">{sub.name}</td>
                <td className="p-4"><span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded inline-block">{sub.code}</span></td>
                <td className="p-4 text-sm text-on-surface-variant">{sub.type}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteGlobalSubject(sub.id)} className="text-error hover:text-error/80 p-2">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {globalSubjects.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">No global subjects created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};
"""
sa_pages_content += global_subjects_comp

with open(sa_pages_file, 'w', encoding='utf-8') as f:
    f.write(sa_pages_content)

# 3. Update SuperAdminLayout.jsx
sa_layout_file = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminLayout.jsx'
with open(sa_layout_file, 'r', encoding='utf-8') as f:
    sa_layout_content = f.read()

# Add FiBook import
import_pattern = "FiMenu, FiGlobe"
sa_layout_content = sa_layout_content.replace(import_pattern, import_pattern + ", FiBook")

sidebar_pattern = """<SidebarItem to="/superadmin/domain-requests" icon={FiGlobe} label="Domain Requests" />"""
sidebar_new = sidebar_pattern + """\n          <SidebarItem to="/superadmin/global-subjects" icon={FiBook} label="Global Subjects" />"""
sa_layout_content = sa_layout_content.replace(sidebar_pattern, sidebar_new)

with open(sa_layout_file, 'w', encoding='utf-8') as f:
    f.write(sa_layout_content)

# 4. Update App.jsx
app_file = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/App.jsx'
with open(app_file, 'r', encoding='utf-8') as f:
    app_content = f.read()

route_pattern = """<Route path="domain-requests" element={<SA.DomainRequests />} />"""
route_new = route_pattern + """\n            <Route path="global-subjects" element={<SA.GlobalSubjects />} />"""
app_content = app_content.replace(route_pattern, route_new)

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Migration completed.")
