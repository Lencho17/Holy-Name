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
    
    has_school_profile = "schoolProfile" in content
    occurrences = len(re.findall(r'Holy Name', content, flags=re.IGNORECASE))
    
    if occurrences > 0:
        print(f"{f}: {occurrences} occurrences. Has schoolProfile: {has_school_profile}")
