routes_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/backend/routes/subjects.js'
with open(routes_path, 'r', encoding='utf-8') as f:
    routes_content = f.read()

# Add POST /config route
routes_content = routes_content.replace(
    "router.get('/mapping', protect, subjectController.getClassSubjectMappings);",
    "router.get('/mapping', protect, subjectController.getClassSubjectMappings);\nrouter.post('/mapping/config', protect, subjectController.saveClassSubjectConfig);"
)

with open(routes_path, 'w', encoding='utf-8') as f:
    f.write(routes_content)

print("Route updated.")
