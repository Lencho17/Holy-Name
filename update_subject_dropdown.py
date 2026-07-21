import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SuperAdmin/SuperAdminPages.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add AHSEC_SEBA_SUBJECTS list before GlobalSubjects component
subjects_list = """const AHSEC_SEBA_SUBJECTS = [
  "Accountancy", "Advanced Mathematics", "Alternative English", "Anthropology", "Arabic",
  "Art", "Artificial Intelligence", "Assamese", "Bengali", "Bihu", "Biology", "Biotechnology",
  "Bodo", "Bookkeeping", "Business Studies", "Chemistry", "Classical Languages",
  "Commercial Mathematics and Statistics", "Computer Science", "Computer Science & Application",
  "Dance", "Economic Geography", "Economics", "Education", "English", "Entrepreneurship Development",
  "Finance", "Financial Literacy", "Fine Art", "Garo", "General Studies", "Geography", "Geology",
  "Hindi", "History", "Hmar", "Home Science", "Information Technology", "Khasi", "Logic & Philosophy",
  "Manipuri", "Mathematics", "Mizo", "Modern Indian Languages", "Music", "Nepali", "Persian",
  "Physical Education", "Physics", "Political Science", "Psychology", "Salesmanship & Advertising",
  "Sanskrit", "Science", "Sign Language", "Social Science", "Sociology", "Statistics", "Swadesh Adhyayan",
  "Urdu"
];

export const GlobalSubjects = () => {"""
content = content.replace("export const GlobalSubjects = () => {", subjects_list)

# 2. Add state for dropdown inside GlobalSubjects
state_marker = "const [loading, setLoading] = useState(true);"
new_state = """const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const generateSubjectPrefix = (name) => name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
  
  const filteredSubjects = AHSEC_SEBA_SUBJECTS.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  if (searchTerm && !filteredSubjects.some(s => s.toLowerCase() === searchTerm.toLowerCase())) {
    filteredSubjects.unshift(searchTerm);
  }"""
content = content.replace(state_marker, new_state)

# 3. Replace the input with the custom dropdown
input_pattern = re.compile(r'<div>\s*<label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>\s*<input required type="text" list="subject-list".*?</datalist>\s*</div>', re.DOTALL)
custom_dropdown = """<div className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
          <div 
            className="w-full border border-gray-300 p-2.5 rounded-lg bg-white cursor-pointer flex justify-between items-center"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className={newGlobalSubject.name ? 'text-gray-900' : 'text-gray-400'}>
              {newGlobalSubject.name ? `${newGlobalSubject.name} (${generateSubjectPrefix(newGlobalSubject.name)})` : 'Select or type subject...'}
            </span>
            <span className="text-gray-500 text-xs">▼</span>
          </div>
          
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search subjects..." 
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-primary text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <ul className="py-1">
                {filteredSubjects.map((sub, idx) => {
                  const prefix = generateSubjectPrefix(sub);
                  return (
                    <li 
                      key={idx}
                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer flex justify-between items-center text-sm"
                      onClick={() => {
                        setNewGlobalSubject({...newGlobalSubject, name: sub});
                        setDropdownOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      <span className="font-medium text-gray-800">{sub}</span>
                      {prefix && <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">{prefix}</span>}
                    </li>
                  );
                })}
                {filteredSubjects.length === 0 && (
                  <li className="px-4 py-3 text-sm text-gray-500 text-center">No subjects found. Type to add custom.</li>
                )}
              </ul>
            </div>
          )}
        </div>"""
content = re.sub(input_pattern, custom_dropdown, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Subject dropdown updated successfully.")
