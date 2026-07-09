import os
import re

files = [
    "SchoolLayout.jsx",
    "Components/About.jsx",
    "Components/AdminPage.jsx",
    "Components/AdmissionCheckout.jsx",
    "Components/AdmissionForm.jsx",
    "Components/Appointment.jsx",
    "Components/Career.jsx",
    "Components/CenterOfExcellence.jsx",
    "Components/Complaints.jsx",
    "Components/Contact.jsx",
    "Components/EventsSection.jsx",
    "Components/ExcellenceSection.jsx",
    "Components/Faculty.jsx",
    "Components/FAQ.jsx",
    "Components/Footer.jsx",
    "Components/Gallery.jsx",
    "Components/Header.jsx",
    "Components/HighlightsSection.jsx",
    "Components/HolidayCalendarSection.jsx",
    "Components/IDCardViewer.jsx",
    "Components/JobApplicationForm.jsx",
    "Components/Notice.jsx",
    "Components/Principal.jsx",
    "Components/StaffPayroll.jsx",
    "Components/TenderApply.jsx",
    "Components/Tenders.jsx"
]

base_dir = "/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src"

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r') as file:
        content = file.read()
    
    original_content = content
    
    # 1. JSX text: >Holy Name School< -> >{schoolProfile?.name || 'Our School'}<
    content = re.sub(r'>\s*Holy Name(?: High School| HS School| School)?\s*<', r'>{schoolProfile?.name || "Our School"}<', content, flags=re.IGNORECASE)
    
    # 2. JSX text with punctuation: >Why Holy Name?< -> >Why {schoolProfile?.name || 'Our School'}?<
    content = re.sub(r'>\s*Why Holy Name\?\s*<', r'>Why {schoolProfile?.name || "Our School"}?<', content, flags=re.IGNORECASE)
    
    # 3. Inside template literals: `${title} — Holy Name School` -> `${title} — ${schoolProfile?.name || 'Our School'}`
    content = re.sub(r'(?<=`)((?:[^`]|\\`)*)Holy Name(?: High School| HS School| School)?((?:[^`]|\\`)*)(?=`|})', r'\1${schoolProfile?.name || "Our School"}\2', content, flags=re.IGNORECASE)
    
    # 4. Inside double quotes (likely PDF doc.text or similar)
    content = re.sub(r'["\']HOLY NAME(?: HIGH SCHOOL| HS SCHOOL| SCHOOL)?["\']', r'(schoolProfile?.name?.toUpperCase() || "OUR SCHOOL")', content)
    content = re.sub(r'["\']Holy Name(?: High School| HS School| School)?["\']', r'(schoolProfile?.name || "Our School")', content, flags=re.IGNORECASE)
    
    # 5. JSX attributes: alt="About Holy Name" -> alt={`About ${schoolProfile?.name || "Our School"}`}
    content = re.sub(r'alt=["\']([^"\']*)Holy Name(?: High School| HS School| School)?([^"\']*)["\']', r'alt={`\1${schoolProfile?.name || "Our School"}\2`}', content, flags=re.IGNORECASE)

    # 6. Plain text embedded inside other words/paragraphs in JSX (outside tags)
    # We will just replace 'Holy Name High School', 'Holy Name School' and 'Holy Name' with {schoolProfile?.name || "Our School"}
    # But ONLY if not inside quotes or tag definitions
    def safe_replace(match):
        # If it's already wrapped in quotes or template literals, skip (should be handled above, but just in case)
        # We replace with {schoolProfile?.name || "Our School"}
        return r"{schoolProfile?.name || 'Our School'}"

    # Do a cautious replace for remaining occurrences
    content = re.sub(r'(?<!["\'`\.])Holy Name(?: High School| HS School| School)?(?![a-zA-Z"\'`])', r"{schoolProfile?.name || 'Our School'}", content)

    if content != original_content:
        with open(path, 'w') as file:
            file.write(content)
        print(f"Updated {f}")
