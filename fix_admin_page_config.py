import re

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/AdminPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if "import ClassSubjectConfig from './ClassSubjectConfig';" not in content:
    content = content.replace("import { FaPlus,", "import ClassSubjectConfig from './ClassSubjectConfig';\nimport { FaPlus,")

# 2. Find the tab content for classSubjects
# Replace the form and the table with <ClassSubjectConfig API_URL={API_URL} />

old_content_start = "          {activeTab === 'classSubjects' && ("
# We need to replace everything from here down to the end of that condition
# Let's use regex to find the block
pattern = re.compile(r"          \{activeTab === 'classSubjects' && \(\n            <div className=\"bg-white rounded-xl shadow-sm border border-gray-100 p-8\">\n              <div className=\"flex justify-between items-center mb-8\">\n                <h2 className=\"text-2xl font-bold text-blue-900\">Class Subjects Mapping</h2>\n              </div>.*?</div>\n          \)}", re.DOTALL)

new_content = """          {activeTab === 'classSubjects' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-blue-900">Class Subjects Configuration</h2>
              </div>
              <ClassSubjectConfig API_URL={API_URL} />
            </div>
          )}"""

content = re.sub(pattern, new_content, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminPage.jsx updated with ClassSubjectConfig.")
