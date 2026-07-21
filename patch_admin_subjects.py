import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert State Variables
state_insert_marker = "const [isImportingStudent, setIsImportingStudent] = useState(false);"
new_states = """  const [isImportingStudent, setIsImportingStudent] = useState(false);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [newGlobalSubject, setNewGlobalSubject] = useState({ name: '', code: '', type: 'Theory' });
  const [newClassSubject, setNewClassSubject] = useState({ class_level: 'I', subject_id: '' });"""
content = content.replace(state_insert_marker, new_states)

# 2. Insert Fetch Methods
fetch_insert_marker = "const fetchJobs = async () => {"
new_fetches = """  const fetchGlobalSubjects = async () => {
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

  const fetchJobs = async () => {"""
content = content.replace(fetch_insert_marker, new_fetches)


# 3. Add to useEffect triggers
tab_trigger_marker = "if (activeTab === 'dashboard' || activeTab === 'jobApplications') fetchJobApplications();"
new_triggers = """if (activeTab === 'dashboard' || activeTab === 'jobApplications') fetchJobApplications();
      if (activeTab === 'dashboard' || activeTab === 'globalSubjects') fetchGlobalSubjects();
      if (activeTab === 'dashboard' || activeTab === 'classSubjects') { fetchClassSubjects(); fetchGlobalSubjects(); }"""
content = content.replace(tab_trigger_marker, new_triggers)


# 4. Insert Sidebar Items
academics_sidebar = """            <SubItem active={activeTab === 'timetables'} onClick={() => { setActiveTab('timetables'); setIsSidebarOpen(false); }} label="Class Timetables" />"""
new_academics_sidebar = """            <SubItem active={activeTab === 'classSubjects'} onClick={() => { setActiveTab('classSubjects'); setIsSidebarOpen(false); }} label="Class Subjects" />
            <SubItem active={activeTab === 'timetables'} onClick={() => { setActiveTab('timetables'); setIsSidebarOpen(false); }} label="Class Timetables" />"""
content = content.replace(academics_sidebar, new_academics_sidebar)

system_sidebar = """            <SubItem active={activeTab === 'domains'} onClick={() => { setActiveTab('domains'); setIsSidebarOpen(false); }} label="Custom Domains" />"""
new_system_sidebar = """            <SubItem active={activeTab === 'domains'} onClick={() => { setActiveTab('domains'); setIsSidebarOpen(false); }} label="Custom Domains" />
            {(adminUser?.role === 'superadmin' || adminUser?.role === 'developer') && (
              <SubItem active={activeTab === 'globalSubjects'} onClick={() => { setActiveTab('globalSubjects'); setIsSidebarOpen(false); }} label="Global Subjects" />
            )}"""
content = content.replace(system_sidebar, new_system_sidebar)


# 5. Insert JSX Blocks before the Settings tab
settings_tab_marker = "          {activeTab === 'settings' && (adminUser?.role === 'superadmin' || adminUser?.role === 'developer') && renderSettingsTab()}"
new_jsx_blocks = """
          {activeTab === 'globalSubjects' && (adminUser?.role === 'superadmin' || adminUser?.role === 'developer') && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Global Subjects Management</h3>
              
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
                <button type="submit" className="bg-indigo-600 text-white p-2.5 rounded-lg font-bold hover:bg-indigo-700 w-full">Add Subject</button>
              </form>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm font-bold uppercase">
                    <tr>
                      <th className="p-4">Subject Name</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {globalSubjects.map(sub => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="p-4 font-semibold text-gray-800">{sub.name}</td>
                        <td className="p-4 font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block mt-2">{sub.code}</td>
                        <td className="p-4 text-sm text-gray-500">{sub.type}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDeleteGlobalSubject(sub.id)} className="text-red-500 hover:text-red-700 p-2">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {globalSubjects.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">No global subjects created yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'classSubjects' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaGraduationCap className="text-blue-600" /> Class Subjects Mappings
              </h3>
              
              <form onSubmit={handleMapClassSubject} className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Select Class</label>
                  <select required value={newClassSubject.class_level} onChange={e => setNewClassSubject({...newClassSubject, class_level: e.target.value})} className="w-full border-blue-200 p-2.5 rounded-lg">
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Select Global Subject</label>
                  <select required value={newClassSubject.subject_id} onChange={e => setNewClassSubject({...newClassSubject, subject_id: e.target.value})} className="w-full border-blue-200 p-2.5 rounded-lg">
                    <option value="" disabled>-- Select Subject --</option>
                    {globalSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-700 w-full flex items-center justify-center gap-2">
                  <FaPlus /> Map Subject to Class
                </button>
              </form>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm font-bold uppercase">
                    <tr>
                      <th className="p-4">Class</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classSubjects.map(map => (
                      <tr key={map.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800 bg-gray-100 w-24 text-center">{map.class_level}</td>
                        <td className="p-4 font-semibold text-gray-800">{map.subjects?.name}</td>
                        <td className="p-4 font-mono text-gray-500">{map.subjects?.code}</td>
                        <td className="p-4 text-sm text-gray-500">{map.subjects?.type}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDeleteClassSubject(map.id)} className="text-red-500 hover:text-red-700 p-2">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {classSubjects.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No subjects mapped to classes yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (adminUser?.role === 'superadmin' || adminUser?.role === 'developer') && renderSettingsTab()}"""
content = content.replace(settings_tab_marker, new_jsx_blocks)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminPage.jsx patched successfully")
