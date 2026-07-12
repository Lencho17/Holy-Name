import os

filepath = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/themes/academic/SchoolHome.jsx'

with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('from "./Items"', 'from "../../Components/Items"')
content = content.replace('from "./EventsSection"', 'from "../../Components/EventsSection"')
content = content.replace('from "./VideoBlogSection"', 'from "../../Components/VideoBlogSection"')
content = content.replace('from "./HighlightsSection"', 'from "../../Components/HighlightsSection"')
content = content.replace('from "./AlumniSection"', 'from "../../Components/AlumniSection"')
content = content.replace('from "./HolidayCalendarSection"', 'from "../../Components/HolidayCalendarSection"')
content = content.replace('from "../context/SiteDataContext"', 'from "../../context/SiteDataContext"')

with open(filepath, 'w') as f:
    f.write(content)

print("SchoolHome imports fixed.")
