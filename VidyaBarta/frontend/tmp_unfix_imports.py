import os

filepath = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/SchoolHome.jsx'

with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('from "../../Components/Items"', 'from "./Items"')
content = content.replace('from "../../Components/EventsSection"', 'from "./EventsSection"')
content = content.replace('from "../../Components/VideoBlogSection"', 'from "./VideoBlogSection"')
content = content.replace('from "../../Components/HighlightsSection"', 'from "./HighlightsSection"')
content = content.replace('from "../../Components/AlumniSection"', 'from "./AlumniSection"')
content = content.replace('from "../../Components/HolidayCalendarSection"', 'from "./HolidayCalendarSection"')
content = content.replace('from "../../context/SiteDataContext"', 'from "../context/SiteDataContext"')

with open(filepath, 'w') as f:
    f.write(content)

print("SchoolHome imports reverted.")
