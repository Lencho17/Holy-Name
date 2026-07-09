import sys

file_path = 'VidyaBarta/frontend/src/Components/AdminPage.jsx'

with open(file_path, 'r') as f:
    content = f.read()

# Replace the end of the file correctly
old_end = """        {renderStatusUpdateModal()}
        {renderTenderBidModal()}
      </div>
    </div>
      </main>
    </div>
  );
}

export default AdminPage;"""

new_end = """        {renderStatusUpdateModal()}
        {renderTenderBidModal()}
      </div>
    </main>
  </div>
  );
}

export default AdminPage;"""

content = content.replace(old_end, new_end)

with open(file_path, 'w') as f:
    f.write(content)
print("Fixed tail of AdminPage.jsx")
