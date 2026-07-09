import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import SaaSLayout from "./SaaSLayout";
import SchoolLayout from "./SchoolLayout";
import "./App.css";
import { SiteDataProvider, SiteDataContext } from "./context/SiteDataContext";
import React, { useContext, useEffect, Suspense } from "react";
import { FaSpinner } from "react-icons/fa";

// SaaS Components
const SaaSHome = React.lazy(() => import("./Components/SaaSHome"));
const SuperAdminLogin = React.lazy(() => import("./Components/SuperAdminLogin"));
const AdminSignUp = React.lazy(() => import("./Components/AdminSignUp"));

// School Components
const SchoolHome = React.lazy(() => import("./Components/SchoolHome"));
const About = React.lazy(() => import("./Components/About"));
const Contact = React.lazy(() => import("./Components/Contact"));
const Gallery = React.lazy(() => import("./Components/Gallery"));
const Career = React.lazy(() => import("./Components/Career"));
const Principal = React.lazy(() => import("./Components/Principal"));
const Courses = React.lazy(() => import("./Components/Courses"));
const Complaints = React.lazy(() => import("./Components/Complaints"));
const Admission = React.lazy(() => import("./Components/Admission"));
const AdmissionForm = React.lazy(() => import("./Components/AdmissionForm"));
const AdmissionCheckout = React.lazy(() => import("./Components/AdmissionCheckout"));
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
const StaffSignUp = React.lazy(() => import("./Components/StaffSignUp"));
const AdminPage = React.lazy(() => import("./Components/AdminPage"));
const StaffPage = React.lazy(() => import("./Components/StaffPage"));

import SuperAdminLayout from "./Components/SuperAdmin/SuperAdminLayout";
import * as SA from "./Components/SuperAdmin/SuperAdminPages";
import ProtectedRoute from "./Components/ProtectedRoute";

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
  </div>
);

function DocumentHeadManager({ isSaaS }) {
  const { schoolProfile } = useContext(SiteDataContext);
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    // In SaaS mode (e.g. Vidyabarta landing page or SuperAdmin), always use the default favicon
    // In School mode, use the school's specific logo
    if (isSaaS) {
      link.href = '/favicon.png';
      document.title = 'VidyaBarta - School Management System';
    } else {
      link.href = schoolProfile?.logo || '/favicon.png';
      document.title = schoolProfile?.name || 'School Website';
    }
  }, [schoolProfile, isSaaS]);
  return null;
}

function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-8 font-medium">We encountered an unexpected error.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg mb-3"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('clear_test_domain') === 'true') {
    localStorage.removeItem('test_domain');
  }
  
  const testDomain = urlParams.get('test_domain');
  if (testDomain) {
    localStorage.setItem('test_domain', testDomain);
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const hasTestDomain = localStorage.getItem('test_domain') !== null;
  const isSuperAdminPath = window.location.pathname.startsWith('/superadmin');
  
  // Determine if we should show the SaaS Landing Page
  // We show SaaS if domain is vidyabarta.in OR www.vidyabarta.in OR (localhost without test_domain)
  // OR if we are explicitly trying to access a superadmin route
  const isSaaS = hostname === 'vidyabarta.in' || hostname === 'www.vidyabarta.in' || (isLocalhost && !hasTestDomain) || isSuperAdminPath;

  const saasRouter = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/" element={<SaaSLayout />} errorElement={<ErrorBoundary />}>
          <Route index element={<Suspense fallback={<SuspenseFallback />}><SaaSHome /></Suspense>} />
        </Route>
        
        {/* Auth routes */}
        <Route path="superadmin-login" element={<Suspense fallback={<SuspenseFallback />}><SuperAdminLogin /></Suspense>} />
        <Route path="admin-signup" element={<Suspense fallback={<SuspenseFallback />}><AdminSignUp /></Suspense>} />
        
        {/* Super Admin routes */}
        <Route path="superadmin" element={<ProtectedRoute role="admin" />}>
          <Route element={<SuperAdminLayout />}>
            <Route index element={<SA.Dashboard />} />
            <Route path="schools" element={<SA.Schools />} />
            <Route path="packages" element={<SA.Packages />} />
            <Route path="addons" element={<SA.Addons />} />
            <Route path="features" element={<SA.Features />} />
            <Route path="subscription" element={<SA.Subscription />} />
            <Route path="subscription-transaction" element={<SA.SubscriptionTransaction />} />
            
            <Route path="staff-management/roles" element={<SA.RolePermission />} />
            <Route path="staff-management/staff" element={<SA.Staff />} />
            
            <Route path="web-settings/general" element={<SA.WebGeneralSettings />} />
            <Route path="web-settings/features" element={<SA.FeatureSections />} />
            <Route path="web-settings/faqs" element={<SA.Faqs />} />
            
            <Route path="system-settings/app" element={<SA.AppSettings />} />
            <Route path="system-settings/general" element={<SA.SystemGeneralSettings />} />
            <Route path="system-settings/subscription" element={<SA.SubscriptionSettings />} />
            <Route path="system-settings/guidance" element={<SA.Guidance />} />
            <Route path="system-settings/language" element={<SA.LanguageSettings />} />
            <Route path="system-settings/notification" element={<SA.NotificationSettings />} />
            <Route path="system-settings/email-config" element={<SA.EmailConfiguration />} />
            <Route path="system-settings/email-template" element={<SA.EmailTemplate />} />
            <Route path="system-settings/payment" element={<SA.PaymentSettings />} />
            <Route path="system-settings/privacy" element={<SA.PrivacyPolicy />} />
            <Route path="system-settings/contact" element={<SA.ContactUs />} />
            <Route path="system-settings/about" element={<SA.AboutUs />} />
            <Route path="system-settings/terms" element={<SA.TermsConditions />} />
            <Route path="system-settings/refund" element={<SA.RefundCancellation />} />
            <Route path="system-settings/school-terms" element={<SA.SchoolTermsCondition />} />
            
            <Route path="system-update" element={<SA.SystemUpdate />} />
          </Route>
        </Route>
      </Route>
    )
  );

  const schoolRouter = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/" element={<SchoolLayout />} errorElement={<ErrorBoundary />}>
          <Route index element={<Suspense fallback={<SuspenseFallback />}><SchoolHome /></Suspense>} />
          <Route path="about" element={<Suspense fallback={<SuspenseFallback />}><About /></Suspense>} />
          <Route path="contact" element={<Suspense fallback={<SuspenseFallback />}><Contact /></Suspense>} />
          <Route path="gallery" element={<Suspense fallback={<SuspenseFallback />}><Gallery /></Suspense>} />
          <Route path="career" element={<Suspense fallback={<SuspenseFallback />}><Career /></Suspense>} />
          <Route path="principal" element={<Suspense fallback={<SuspenseFallback />}><Principal /></Suspense>} />
          <Route path="courses" element={<Suspense fallback={<SuspenseFallback />}><Courses /></Suspense>} />
          <Route path="complaints" element={<Suspense fallback={<SuspenseFallback />}><Complaints /></Suspense>} />
          <Route path="admission" element={<Suspense fallback={<SuspenseFallback />}><Admission /></Suspense>} />
          <Route path="admission/form" element={<Suspense fallback={<SuspenseFallback />}><AdmissionForm /></Suspense>} />
          <Route path="admission/checkout" element={<Suspense fallback={<SuspenseFallback />}><AdmissionCheckout /></Suspense>} />
          <Route path="faculty" element={<Suspense fallback={<SuspenseFallback />}><Faculty /></Suspense>} />
          <Route path="emeritus" element={<Suspense fallback={<SuspenseFallback />}><Emeritus /></Suspense>} />
          <Route path="notice" element={<Suspense fallback={<SuspenseFallback />}><Notice /></Suspense>} />
          <Route path="student-portal" element={<Suspense fallback={<SuspenseFallback />}><StudentPortal /></Suspense>} />
          <Route path="job-application" element={<Suspense fallback={<SuspenseFallback />}><JobApplicationForm /></Suspense>} />
          <Route path="tenders" element={<Suspense fallback={<SuspenseFallback />}><Tenders /></Suspense>} />
          <Route path="tenders/apply/:id" element={<Suspense fallback={<SuspenseFallback />}><TenderApply /></Suspense>} />
          <Route path="center-of-excellence" element={<Suspense fallback={<SuspenseFallback />}><CenterOfExcellence /></Suspense>} />
          <Route path="appointment" element={<Suspense fallback={<SuspenseFallback />}><Appointment /></Suspense>} />
        </Route>
        
        <Route path="adminLogin" element={<Suspense fallback={<SuspenseFallback />}><AdminLogin /></Suspense>} />
        <Route path="staff-signup" element={<Suspense fallback={<SuspenseFallback />}><StaffSignUp /></Suspense>} />
        
        <Route path="admin/*" element={<ProtectedRoute role="admin" />}>
          <Route path="*" element={<Suspense fallback={<SuspenseFallback />}><AdminPage /></Suspense>} />
        </Route>
        
        <Route path="staff/*" element={<ProtectedRoute role="staff" />}>
          <Route path="*" element={<Suspense fallback={<SuspenseFallback />}><StaffPage /></Suspense>} />
        </Route>
      </Route>
    )
  );

  return (
    <SiteDataProvider>
      <DocumentHeadManager isSaaS={isSaaS} />
      <RouterProvider router={isSaaS ? saasRouter : schoolRouter} />
    </SiteDataProvider>
  );
}

export default App;
