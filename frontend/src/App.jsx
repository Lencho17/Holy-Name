import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Layout from "./Layout";
import "./App.css";
import { SiteDataProvider, SiteDataContext } from "./context/SiteDataContext";
import React, { useContext, useEffect, Suspense } from "react";
import { FaSpinner } from "react-icons/fa";

// Lazy Load Route Components
const Home = React.lazy(() => import("./Components/Home"));
const About = React.lazy(() => import("./Components/About"));
const Contact = React.lazy(() => import("./Components/Contact"));
const Gallery = React.lazy(() => import("./Components/Gallery"));
const Header = React.lazy(() => import("./Components/Header"));
const Footer = React.lazy(() => import("./Components/Footer"));
const Career = React.lazy(() => import("./Components/Career"));
const Principal = React.lazy(() => import("./Components/Principal"));
const Courses = React.lazy(() => import("./Components/Courses"));
const Complaints = React.lazy(() => import("./Components/Complaints"));
const Admission = React.lazy(() => import("./Components/Admission"));
const Faculty = React.lazy(() => import("./Components/Faculty"));
const Emeritus = React.lazy(() => import("./Components/Emeritus"));
const Notice = React.lazy(() => import("./Components/Notice"));
const StudentPortal = React.lazy(() => import("./Components/StudentPortal"));
const JobApplicationForm = React.lazy(() => import("./Components/JobApplicationForm"));
const Tenders = React.lazy(() => import("./Components/Tenders"));
const TenderApply = React.lazy(() => import("./Components/TenderApply"));
const CenterOfExcellence = React.lazy(() => import("./Components/CenterOfExcellence"));
const BelowSocialbtn = React.lazy(() => import("./Components/BelowSocialbtn"));
const Appointment = React.lazy(() => import("./Components/Appointment"));

const AdminLogin = React.lazy(() => import("./Components/AdminLogin"));
const AdminSignUp = React.lazy(() => import("./Components/AdminSignUp"));
const AdminPage = React.lazy(() => import("./Components/AdminPage"));

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
  </div>
);

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
        <Route path="" element={<Suspense fallback={<SuspenseFallback />}><Home /></Suspense>} />
        <Route path="about" element={<Suspense fallback={<SuspenseFallback />}><About /></Suspense>} />
        <Route path="contact" element={<Suspense fallback={<SuspenseFallback />}><Contact /></Suspense>} />
        <Route path="gallery" element={<Suspense fallback={<SuspenseFallback />}><Gallery /></Suspense>} />
        <Route path="header" element={<Suspense fallback={<SuspenseFallback />}><Header /></Suspense>} />
        <Route path="footer" element={<Suspense fallback={<SuspenseFallback />}><Footer /></Suspense>} />
        <Route path="career" element={<Suspense fallback={<SuspenseFallback />}><Career /></Suspense>} />
        <Route path="principal" element={<Suspense fallback={<SuspenseFallback />}><Principal /></Suspense>} />
        <Route path="courses" element={<Suspense fallback={<SuspenseFallback />}><Courses /></Suspense>} />
        <Route path="complaints" element={<Suspense fallback={<SuspenseFallback />}><Complaints /></Suspense>} />
        <Route path="admission" element={<Suspense fallback={<SuspenseFallback />}><Admission /></Suspense>} />
        <Route path="faculty" element={<Suspense fallback={<SuspenseFallback />}><Faculty /></Suspense>} />
        <Route path="excellence" element={<Suspense fallback={<SuspenseFallback />}><CenterOfExcellence /></Suspense>} />
        <Route path="emeritus" element={<Suspense fallback={<SuspenseFallback />}><Emeritus /></Suspense>} />
        <Route path="notice" element={<Suspense fallback={<SuspenseFallback />}><Notice /></Suspense>} />
        <Route path="studentportal" element={<Suspense fallback={<SuspenseFallback />}><StudentPortal /></Suspense>} />
        <Route path="apply" element={<Suspense fallback={<SuspenseFallback />}><JobApplicationForm /></Suspense>} />
        <Route path="apply/:jobId" element={<Suspense fallback={<SuspenseFallback />}><JobApplicationForm /></Suspense>} />
        <Route path="tenders" element={<Suspense fallback={<SuspenseFallback />}><Tenders /></Suspense>} />
        <Route path="tender-apply/:id" element={<Suspense fallback={<SuspenseFallback />}><TenderApply /></Suspense>} />
        <Route path="belowsocialbtn" element={<Suspense fallback={<SuspenseFallback />}><BelowSocialbtn /></Suspense>} />
        <Route path="appointment" element={<Suspense fallback={<SuspenseFallback />}><Appointment /></Suspense>} />
      </Route>

      {/* Admin routes without Header/Footer layout */}
      <Route path="adminLogin" element={<Suspense fallback={<SuspenseFallback />}><AdminLogin /></Suspense>} />
      <Route path="signup" element={<Suspense fallback={<SuspenseFallback />}><AdminSignUp /></Suspense>} />
      <Route path="admin" element={<Suspense fallback={<SuspenseFallback />}><AdminPage /></Suspense>} />
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
