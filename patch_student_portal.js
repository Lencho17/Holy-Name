const fs = require('fs');
const path = require('path');

const portalPath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/StudentPortal.jsx');
let content = fs.readFileSync(portalPath, 'utf8');

if (!content.includes('import StudentDues')) {
  // Add import
  content = content.replace(
    'import { SiteDataContext } from "../context/SiteDataContext";',
    'import { SiteDataContext } from "../context/SiteDataContext";\nimport StudentDues from "./StudentDues";'
  );
  
  // Add tab state
  content = content.replace(
    'const [query, setQuery] = useState("");',
    'const [activePortalTab, setActivePortalTab] = useState("tracker");\n  const [query, setQuery] = useState("");'
  );
  
  // Add tab toggle UI and wrap existing body
  const tabUI = `
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-14 relative z-20 mb-6">
        <div className="flex bg-white rounded-full shadow-lg p-1 border border-gray-100 mb-6">
          <button 
            onClick={() => setActivePortalTab('tracker')}
            className={\`flex-1 py-3 rounded-full text-sm font-bold transition-all \${activePortalTab === 'tracker' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            Admission Tracker
          </button>
          <button 
            onClick={() => setActivePortalTab('dues')}
            className={\`flex-1 py-3 rounded-full text-sm font-bold transition-all \${activePortalTab === 'dues' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            My Dues & Payments
          </button>
        </div>
      </div>
`;
  
  // Replace the start of the card content to include the tab switch
  content = content.replace(
    '<div className="max-w-4xl mx-auto px-4 md:px-8 -mt-14 relative z-20">',
    tabUI + '\n      <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-20">'
  );
  
  // Wrap the search card in a conditional block
  content = content.replace(
    '{/* Search Card */}',
    '{activePortalTab === "tracker" && (\n        <>\n        {/* Search Card */}'
  );
  
  // Close the conditional block right before the return statement ends.
  // Wait, the StudentPortal component has a lot of nesting. Let's find the closing tag for the main container.
  content = content.replace(
    '</div>\n    </div>\n  );\n}\n\nexport default StudentPortal;',
    '  </>\n      )}\n      {activePortalTab === "dues" && <StudentDues />}\n      </div>\n    </div>\n  );\n}\n\nexport default StudentPortal;'
  );

  fs.writeFileSync(portalPath, content, 'utf8');
  console.log('StudentPortal.jsx patched with StudentDues tab!');
} else {
  console.log('StudentDues already exists in StudentPortal.jsx');
}
