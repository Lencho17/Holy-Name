import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminPages.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = "export const GlobalSubjects = () => {"

new_component = """export const GlobalSubjects = () => {
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [newGlobalSubject, setNewGlobalSubject] = useState({ name: '', marking_system: 'Marking' });
  const [loading, setLoading] = useState(true);
  
  // Filtering and Sorting state
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('All');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const fetchGlobalSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global?sortBy=${sortBy}&filterBy=${filterBy}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGlobalSubjects(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalSubjects();
  }, [sortBy, filterBy]);

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
        setNewGlobalSubject({ name: '', marking_system: 'Marking' });
        fetchGlobalSubjects();
        alert('Draft Subject Created successfully.');
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error creating global subject');
      }
    } catch (err) {
      alert('Error creating global subject');
    }
  };
  
  const handleUpdateDraft = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global/${editSubject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editSubject.name, marking_system: editSubject.marking_system })
      });
      if (res.ok) {
        setIsEditing(false);
        setEditSubject(null);
        fetchGlobalSubjects();
        alert('Draft updated successfully.');
      } else {
         const errorData = await res.json();
         alert(errorData.message || 'Error updating draft');
      }
    } catch(err) {
      alert('Error updating draft');
    }
  };

  const handleFinalize = async (id) => {
    if (!window.confirm('Are you sure you want to finalize this subject? Once finalized, the code will be generated and it cannot be edited.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global/${id}/finalize`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        alert('Subject finalized and code generated successfully!');
        fetchGlobalSubjects();
      } else {
         const errorData = await res.json();
         alert(errorData.message || 'Error finalizing subject');
      }
    } catch (err) {}
  };

  const handleDeleteGlobalSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchGlobalSubjects();
    } catch (err) {}
  };

  return (
    <PageWrapper title="Global Subjects">
      {/* Create / Edit Form */}
      {isEditing && editSubject ? (
        <form onSubmit={handleUpdateDraft} className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
            <input 
              type="text" required autoFocus
              placeholder="e.g. Mathematics"
              value={editSubject.name} 
              onChange={e => setEditSubject({...editSubject, name: e.target.value})} 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Marking System</label>
            <select required value={editSubject.marking_system} onChange={e => setEditSubject({...editSubject, marking_system: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary outline-none">
              <option value="Marking">Marking</option>
              <option value="Grade">Grade</option>
            </select>
          </div>
          <div className="flex gap-2">
             <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-700 flex-1">Save Draft</button>
             <button type="button" onClick={() => { setIsEditing(false); setEditSubject(null); }} className="bg-gray-300 text-gray-800 p-2.5 rounded-lg font-bold hover:bg-gray-400 flex-1">Cancel</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCreateGlobalSubject} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
            <input 
              type="text" required 
              placeholder="e.g. Mathematics"
              value={newGlobalSubject.name} 
              onChange={e => setNewGlobalSubject({...newGlobalSubject, name: e.target.value})} 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Marking System</label>
            <select required value={newGlobalSubject.marking_system} onChange={e => setNewGlobalSubject({...newGlobalSubject, marking_system: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary outline-none">
              <option value="Marking">Marking</option>
              <option value="Grade">Grade</option>
            </select>
          </div>
          <button type="submit" className="bg-primary text-white p-2.5 rounded-lg font-bold hover:bg-primary-dark w-full">Add Subject (Draft)</button>
        </form>
      )}

      {/* Filter and Sort Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">Filter:</label>
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="border border-gray-300 text-sm p-2 rounded-lg bg-gray-50">
            <option value="All">All Systems</option>
            <option value="Marking">Marking</option>
            <option value="Grade">Grade</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 text-sm p-2 rounded-lg bg-gray-50">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-surface-variant text-on-surface-variant text-sm font-bold uppercase">
            <tr>
              <th className="p-4">Subject Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Marking System</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant bg-surface">
            {globalSubjects.map(sub => (
              <tr key={sub.id} className="hover:bg-surface-variant/50">
                <td className="p-4 font-semibold text-on-surface">{sub.name}</td>
                <td className="p-4">
                  {sub.is_finalized ? (
                    <span className="font-mono font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">{sub.code}</span>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold italic bg-gray-100 px-2 py-1 rounded">Draft</span>
                  )}
                </td>
                <td className="p-4 text-sm text-on-surface-variant">{sub.marking_system}</td>
                <td className="p-4 text-right flex justify-end items-center gap-2">
                  {!sub.is_finalized && (
                    <>
                      <button onClick={() => { setIsEditing(true); setEditSubject(sub); }} className="text-blue-600 hover:text-blue-800 p-1.5 font-bold text-sm bg-blue-50 rounded border border-blue-100">
                        Edit
                      </button>
                      <button onClick={() => handleFinalize(sub.id)} className="text-green-700 hover:text-green-900 p-1.5 font-bold text-sm bg-green-50 rounded border border-green-100">
                        Finalize
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDeleteGlobalSubject(sub.id)} className="text-error hover:text-error/80 p-2 bg-red-50 rounded ml-2 border border-red-100">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {globalSubjects.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">No global subjects found.</td></tr>}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};
"""

start_idx = content.find(old_start)
if start_idx != -1:
    content = content[:start_idx] + new_component
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced GlobalSubjects component successfully")
else:
    print("Could not find GlobalSubjects component")
