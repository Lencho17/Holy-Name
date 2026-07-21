import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminPages.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace state initialization
content = content.replace("const [newGlobalSubject, setNewGlobalSubject] = useState({ name: '', code: '', type: 'Theory' });",
                          "const [newGlobalSubject, setNewGlobalSubject] = useState({ name: '', class_level: '', type: 'Theory' });")

# Replace set after creation
content = content.replace("setNewGlobalSubject({ name: '', code: '', type: 'Theory' });",
                          "setNewGlobalSubject({ name: '', class_level: '', type: 'Theory' });")

# Replace the form and table headers
form_pattern = re.compile(r'<form onSubmit=\{handleCreateGlobalSubject\}.*?</form>', re.DOTALL)
new_form = """<form onSubmit={handleCreateGlobalSubject} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
          <input required type="text" list="subject-list" value={newGlobalSubject.name} onChange={e => setNewGlobalSubject({...newGlobalSubject, name: e.target.value})} className="w-full border-gray-300 p-2.5 rounded-lg" placeholder="e.g. Mathematics" />
          <datalist id="subject-list">
            <option value="Mathematics" />
            <option value="Science" />
            <option value="English" />
            <option value="Social Studies" />
            <option value="Hindi" />
            <option value="Computer Science" />
            <option value="Physical Education" />
            <option value="Art" />
            <option value="Music" />
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Class Level</label>
          <select required value={newGlobalSubject.class_level} onChange={e => setNewGlobalSubject({...newGlobalSubject, class_level: e.target.value})} className="w-full border-gray-300 p-2.5 rounded-lg">
            <option value="" disabled>Select Class</option>
            {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
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
      </form>"""
content = re.sub(form_pattern, new_form, content)

# Replace table headers
content = content.replace('<th className="p-4">Code</th>', '<th className="p-4">Class</th>\n              <th className="p-4">Code</th>')

# Replace table body rows
row_pattern = re.compile(r'<td className="p-4"><span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded inline-block">\{sub\.code\}</span></td>')
new_row = """<td className="p-4 text-sm font-bold text-gray-600">{sub.class_level || 'N/A'}</td>
                <td className="p-4"><span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded inline-block">{sub.code}</span></td>"""
content = re.sub(row_pattern, new_row, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SuperAdminPages.jsx patched successfully.")
