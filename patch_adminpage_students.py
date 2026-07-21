import re

with open('/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the exact block for the students tab
start_marker = "          {activeTab === 'students' && ("
end_marker = "          {viewingIdCardFor && ("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

# Ensure we capture the exact end of the students tab (it's the ')}' just before end_marker)
# Let's find the last ')}' before end_marker.
last_closing_idx = content.rfind("          )}", start_idx, end_idx)

if last_closing_idx == -1:
    print("Could not find closing brace")
    exit(1)

new_students_tab = """          {activeTab === 'students' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              {/* Header and Controls */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b pb-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <h3 className="text-xl font-bold text-gray-800">Student Directory</h3>
                  
                  <select 
                    value={studentViewStatus}
                    onChange={(e) => setStudentViewStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 font-semibold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="active">Active Students</option>
                    <option value="not_progressed">Not Progressed Students</option>
                    <option value="dropbox">Dropbox Students</option>
                    <option value="prev_session">Active Session (Prev Session)</option>
                    <option value="all">All Students (Legacy)</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                  <button 
                    onClick={() => setShowGlobalSearchModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm whitespace-nowrap"
                  >
                    <FaSearch /> Global Student Search
                  </button>
                  <button 
                    onClick={() => setShowAddStudentModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap"
                  >
                    <FaPlus /> Add Student
                  </button>
                  <button 
                    onClick={handleExportStudents}
                    disabled={isExportingStudents || students.length === 0}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
                  >
                    {isExportingStudents ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                    Export
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Search Name/PEN</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Class</label>
                  <select 
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm"
                  >
                    <option value="">All Classes</option>
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Section</label>
                  <select 
                    value={studentSectionFilter}
                    onChange={(e) => setStudentSectionFilter(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm"
                  >
                    <option value="">All Sections</option>
                    {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sort By</label>
                  <select 
                    value={studentSortBy}
                    onChange={(e) => setStudentSortBy(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm"
                  >
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="date_desc">Newest First</option>
                  </select>
                </div>
              </div>

              {/* Add Student Modal */}
              {showAddStudentModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-gray-800">Add Student Manually</h3>
                      <button onClick={() => setShowAddStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                        <FaTimes className="text-xl" />
                      </button>
                    </div>
                    <form onSubmit={handleAddStudentManual} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Student Name</label>
                        <input type="text" required className="w-full p-3 border rounded-xl" value={newStudentForm.name} onChange={e => setNewStudentForm({...newStudentForm, name: e.target.value})} placeholder="e.g. John Doe" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Class / Grade</label>
                          <input type="text" required className="w-full p-3 border rounded-xl" value={newStudentForm.classLevel} onChange={e => setNewStudentForm({...newStudentForm, classLevel: e.target.value})} placeholder="e.g. 10" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Section</label>
                          <input type="text" className="w-full p-3 border rounded-xl" value={newStudentForm.section} onChange={e => setNewStudentForm({...newStudentForm, section: e.target.value})} placeholder="e.g. A" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Admission ID / Roll No</label>
                        <input type="text" required className="w-full p-3 border rounded-xl" value={newStudentForm.rollNumber} onChange={e => setNewStudentForm({...newStudentForm, rollNumber: e.target.value})} placeholder="e.g. 2024001" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Father's Name</label>
                        <input type="text" className="w-full p-3 border rounded-xl" value={newStudentForm.fatherName || ''} onChange={e => setNewStudentForm({...newStudentForm, fatherName: e.target.value})} placeholder="Father's Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mother's Name</label>
                        <input type="text" className="w-full p-3 border rounded-xl" value={newStudentForm.motherName || ''} onChange={e => setNewStudentForm({...newStudentForm, motherName: e.target.value})} placeholder="Mother's Name" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
                        <input type="tel" className="w-full p-3 border rounded-xl" value={newStudentForm.phone} onChange={e => setNewStudentForm({...newStudentForm, phone: e.target.value})} placeholder="10-digit number" />
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setShowAddStudentModal(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                        <button type="submit" disabled={isAddingStudent} className="px-6 py-2 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                          {isAddingStudent ? 'Adding...' : 'Add Student'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Global Search Modal */}
              {showGlobalSearchModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><FaSearch className="text-indigo-600" /> Global Student Search</h3>
                      <button onClick={() => { setShowGlobalSearchModal(false); setGlobalSearchResults([]); }} className="text-gray-400 hover:text-gray-600">
                        <FaTimes className="text-xl" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleGlobalSearch} className="mb-6">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={globalSearchQuery}
                          onChange={(e) => setGlobalSearchQuery(e.target.value)}
                          placeholder="Search by PEN Number or Aadhaar..."
                          className="flex-1 p-3 border border-gray-300 rounded-xl"
                        />
                        <button 
                          type="submit" 
                          disabled={isSearchingGlobal}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isSearchingGlobal ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Only students who have been marked as 'Dropboxed' by their previous school will appear in global search.</p>
                    </form>

                    {globalSearchResults.length > 0 ? (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3">Name</th>
                              <th className="p-3">PEN Number</th>
                              <th className="p-3">DOB</th>
                              <th className="p-3">Parents</th>
                              <th className="p-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {globalSearchResults.map(s => (
                              <tr key={s.id}>
                                <td className="p-3 font-bold text-gray-800">{s.student_name}</td>
                                <td className="p-3 text-sm text-gray-600 font-mono">{s.pen_number || 'N/A'}</td>
                                <td className="p-3 text-sm text-gray-600">{s.date_of_birth || 'N/A'}</td>
                                <td className="p-3 text-sm text-gray-600">
                                  {s.father_name && <div>F: {s.father_name}</div>}
                                  {s.mother_name && <div>M: {s.mother_name}</div>}
                                </td>
                                <td className="p-3">
                                  <button 
                                    onClick={() => handleImportStudent(s.id)}
                                    disabled={isImportingStudent}
                                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                  >
                                    Import Student
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      globalSearchQuery && !isSearchingGlobal && (
                        <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-500">
                          No dropboxed students found with this PEN.
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {students.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FaUsers className="mx-auto text-gray-300 text-4xl mb-3" />
                  <p className="text-gray-500">No students found matching the current filters.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    // Summary stats table
                    const classOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
                    const stats = { total: 0, boys: 0, girls: 0, transgender: 0, classes: {} };
                    
                    classOrder.forEach(c => {
                      stats.classes[c] = { boys: 0, girls: 0, transgender: 0, total: 0 };
                    });

                    students.forEach(student => {
                      stats.total++;
                      const gender = (student.gender || '').toLowerCase();
                      const studentClass = (student.grade || '').toUpperCase();
                      
                      let isBoy = gender === 'male' || gender === 'boy';
                      let isGirl = gender === 'female' || gender === 'girl';
                      let isTrans = gender === 'transgender';

                      if (isBoy) stats.boys++;
                      if (isGirl) stats.girls++;
                      if (isTrans) stats.transgender++;

                      if (!stats.classes[studentClass]) {
                        stats.classes[studentClass] = { boys: 0, girls: 0, transgender: 0, total: 0 };
                        if (!classOrder.includes(studentClass)) {
                          classOrder.push(studentClass);
                        }
                      }
                      stats.classes[studentClass].total++;
                      if (isBoy) stats.classes[studentClass].boys++;
                      if (isGirl) stats.classes[studentClass].girls++;
                      if (isTrans) stats.classes[studentClass].transgender++;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-6 bg-white p-4 border-b border-gray-100">
                          <div className="flex items-center gap-2 font-bold text-blue-700">
                            <FaEdit className="text-gray-700" /> Total Enrolments : {stats.total}
                          </div>
                          <div className="w-px h-5 bg-gray-300 hidden sm:block"></div>
                          <div className="flex items-center gap-2 font-bold text-blue-700">
                            <FaUser className="text-gray-700" /> Total Boys : {stats.boys}
                          </div>
                          <div className="w-px h-5 bg-gray-300 hidden sm:block"></div>
                          <div className="flex items-center gap-2 font-bold text-blue-700">
                            <FaUser className="text-gray-700" /> Total Girls : {stats.girls}
                          </div>
                          <div className="w-px h-5 bg-gray-300 hidden sm:block"></div>
                          <div className="flex items-center gap-2 font-bold text-blue-700">
                            <FaTransgender className="text-gray-700" /> Total Transgender : {stats.transgender}
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left">
                            <thead className="bg-[#215E8B] text-white">
                              <tr>
                                <th className="py-3 px-4 font-bold">Class/Grade</th>
                                <th className="py-3 px-4 font-bold text-center">Boys</th>
                                <th className="py-3 px-4 font-bold text-center">Girls</th>
                                <th className="py-3 px-4 font-bold text-center">Transgender</th>
                                <th className="py-3 px-4 font-bold text-center">Total Students</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {classOrder.map(className => {
                                const classData = stats.classes[className];
                                return (
                                  <tr key={className} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-gray-800">{className}</td>
                                    <td className="py-3 px-4 text-center text-gray-700">{classData.boys}</td>
                                    <td className="py-3 px-4 text-center text-gray-700">{classData.girls}</td>
                                    <td className="py-3 px-4 text-center text-gray-700">{classData.transgender}</td>
                                    <td className="py-3 px-4 text-center font-bold text-gray-700">{classData.total}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  <h4 className="text-lg font-bold text-gray-800 border-b pb-2 pt-4 flex justify-between items-center">
                    Detailed Student List
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">S.No</th>
                        <th className="py-3 px-4">Basic Details</th>
                        <th className="py-3 px-4">Student PEN/Class/Section</th>
                        <th className="py-3 px-4">Parents Details</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student, index) => {
                        const sId = student._id || student.id;
                        return (
                        <tr key={sId} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 text-center text-gray-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex flex-col gap-1">
                               <span className="font-bold text-gray-800 text-base">{student.studentName || student.student_name}</span>
                               <span className="text-xs text-gray-500">Gender: <span className="font-medium capitalize text-gray-700">{student.gender || 'N/A'}</span></span>
                               <span className="text-xs text-gray-500">DOB: <span className="font-medium text-gray-700">{student.dateOfBirth || student.date_of_birth || 'N/A'}</span></span>
                             </div>
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex flex-col gap-1">
                               <span className="text-xs text-gray-500">PEN: <span className="font-bold text-indigo-600">{student.penNumber || student.pen_number || 'N/A'}</span></span>
                               <span className="text-xs text-gray-500">Class: <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{student.grade}</span></span>
                               <span className="text-xs text-gray-500">Section: <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{student.section || 'N/A'}</span></span>
                             </div>
                          </td>
                          <td className="py-4 px-4">
                             <div className="flex flex-col gap-1">
                               <span className="text-xs text-gray-500">Father's Name: <span className="font-medium text-gray-700">{student.fatherName || student.father_name || 'N/A'}</span></span>
                               <span className="text-xs text-gray-500">Mother's Name: <span className="font-medium text-gray-700">{student.motherName || student.mother_name || 'N/A'}</span></span>
                               {(!student.fatherName && !student.motherName && student.guardianName) && (
                                 <span className="text-xs text-gray-500">Guardian: <span className="font-medium text-gray-700">{student.guardianName}</span></span>
                               )}
                             </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                             <div className="flex flex-col items-end gap-2">
                               <div className="flex gap-2">
                                 <button 
                                   onClick={() => setViewingProfileFor(student)}
                                   className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                                   title="View Profile"
                                 >
                                   <FaUser size={16} />
                                 </button>
                                 <button 
                                   onClick={() => setViewingIdCardFor(student)}
                                   className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
                                   title="View ID Card"
                                 >
                                   <FaIdBadge size={16} />
                                 </button>
                               </div>
                               
                               <select
                                 value={student.enrollment_status || 'active'}
                                 onChange={(e) => handleUpdateStudentStatus(sId, e.target.value)}
                                 className="text-xs border border-gray-300 rounded p-1 font-medium mt-1 w-32"
                               >
                                 <option value="active">Mark Active</option>
                                 <option value="not_progressed">Not Progressed</option>
                                 <option value="dropbox">Move to Dropbox</option>
                                 <option value="prev_session">Prev Session</option>
                               </select>

                               <button 
                                 onClick={async () => {
                                   if(window.confirm(`Permanently delete ${student.studentName || student.student_name} from database?`)) {
                                     try {
                                        const token = localStorage.getItem('adminToken');
                                        const res = await fetch(`${API_URL}/students/${sId}`, {
                                          method: 'DELETE',
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        if(res.ok) {
                                          setStudents(students.filter(s => (s._id || s.id) !== sId));
                                          alert("Student deleted permanently.");
                                        }
                                     } catch(err) {
                                       alert("Failed to delete student: " + err.message);
                                     }
                                   }
                                 }} 
                                 className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors mt-1 flex items-center gap-1"
                               >
                                 <FaTrash size={10} /> Delete
                               </button>
                             </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          )}"""

new_content = content[:start_idx] + new_students_tab + "\n" + content[last_closing_idx+12:]

with open('/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Patch applied successfully.")
