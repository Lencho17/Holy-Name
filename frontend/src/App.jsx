import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import {
  About,
  AdminSignUp,
  Admission,
  BelowSocialbtn,
  Career,
  Complaints,
  Contact,
  Courses,
  Faculty,
  Footer,
  Gallery,
  Header,
  Home,
  Notice,
  Principal,
  StudentPortal,
  JobApplicationForm,
} from "./Components/index";
import Layout from "./Layout";
import "./App.css";
import AdminLogin from "./Components/AdminLogin";
import AdminPage from "./Components/AdminPage";
import { SiteDataProvider, SiteDataContext } from "./context/SiteDataContext";
import { useContext, useEffect } from "react";

// Helper component to sync the browser favicon with the school logo
function FaviconManager() {
  const { schoolProfile } = useContext(SiteDataContext);
  
  useEffect(() => {
    if (schoolProfile?.logo) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = schoolProfile.logo;
      
      // Update the title as well if needed, though title is usually page-specific
      if (schoolProfile.name) {
        // Only update if it's the home page or a generic page
        // For now, let's stick to the icon as requested
      }
    }
  }, [schoolProfile?.logo]);

  return null;
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route 
          path="/" 
          element={<Layout />}
        errorElement={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-8 font-medium">We encountered an unexpected error. This usually happens if your session data is invalid.</p>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                >
                  Return Home
                </button>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Clear Cache & Reload
                </button>
              </div>
            </div>
          </div>
        }
      >
        <Route path="" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="header" element={<Header />} />
        <Route path="footer" element={<Footer />} />
        <Route path="career" element={<Career />} />
        <Route path="principal" element={<Principal />} />
        <Route path="courses" element={<Courses />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="admission" element={<Admission />} />
        <Route path="faculty" element={<Faculty />} />
        <Route path="notice" element={<Notice />} />
        <Route path="studentportal" element={<StudentPortal />} />
        <Route path="apply" element={<JobApplicationForm />} />
        <Route path="apply/:jobId" element={<JobApplicationForm />} />
        <Route path="belowsocialbtn" element={<BelowSocialbtn />} />
      </Route>

      {/* Admin routes without Header/Footer layout */}
      <Route path="adminLogin" element={<AdminLogin />} />
      <Route path="signup" element={<AdminSignUp />} />
      <Route path="admin" element={<AdminPage />} />
    </Route>
    ),
  );
  return (
    <SiteDataProvider>
      <FaviconManager />
      <RouterProvider router={router} />
    </SiteDataProvider>
  );
}

export default App;
