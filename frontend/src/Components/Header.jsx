import { useState, useContext, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import AdminLoginBtn from "./AdminLoginBtn.jsx";
import { GiHamburgerMenu } from "react-icons/gi";
import { SiteDataContext } from "../context/SiteDataContext";
import { motion, AnimatePresence } from "framer-motion";

function Header() {
  const { schoolProfile } = useContext(SiteDataContext);
  const [showMediaIcons, setShowMediaIcons] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Body scroll lock
  useEffect(() => {
    if (showMediaIcons) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMediaIcons]);

  // Helper for NavLink
  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 font-semibold transition-all duration-300 rounded-full text-sm ${
      isActive
        ? "bg-primary/10 text-primary"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  // Helper for Dropdown Link
  const dropdownLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? "bg-primary/10 text-primary"
        : "text-slate-600 hover:bg-slate-50 hover:text-primary"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto flex justify-between items-center w-full px-4 md:px-8 py-3">
          {/* Branding */}
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <img
              src={schoolProfile?.logo || "/Pictures/Logo.jpg"}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300 object-cover"
              alt="Holy Name School Logo"
            />
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-900 tracking-tight text-[13px] sm:text-[14px] xl:text-[16px] leading-tight whitespace-nowrap">
                {schoolProfile?.name || "Holy Name School"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-bold text-primary">
                  {schoolProfile?.punchLine || "Let Your Light Shine"}
                </span>
                <span className="hidden md:flex items-center text-[10px] text-slate-400 gap-1 border-l border-slate-300 pl-2">
                  <span className="material-symbols-outlined text-[12px]">
                    call
                  </span>{" "}
                  {schoolProfile?.phone || "6901055733"}
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/principal" className={navLinkClass}>
              Principal
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <NavLink to="/courses" className={navLinkClass}>
              Courses
            </NavLink>
            <NavLink to="/admission" className={navLinkClass}>
              Admission
            </NavLink>
            <NavLink to="/notice" className={navLinkClass}>
              Notice
            </NavLink>

            {/* More Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowMore(true)}
              onMouseLeave={() => setShowMore(false)}
            >
              <button
                className={`flex items-center gap-1 px-4 py-2 font-semibold transition-all duration-300 rounded-full text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${showMore ? "bg-slate-100" : ""}`}
              >
                More{" "}
                <span
                  className={`material-symbols-outlined text-sm transition-transform duration-300 ${showMore ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>

              {showMore && (
                <div className="absolute top-full right-0 pt-2 w-48">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1">
                    <NavLink to="/faculty" className={dropdownLinkClass}>
                      <span className="material-symbols-outlined text-[18px]">
                        group
                      </span>{" "}
                      Faculty
                    </NavLink>
                    <NavLink to="/gallery" className={dropdownLinkClass}>
                      <span className="material-symbols-outlined text-[18px]">
                        gallery_thumbnail
                      </span>{" "}
                      Gallery
                    </NavLink>
                    <NavLink to="/career" className={dropdownLinkClass}>
                      <span className="material-symbols-outlined text-[18px]">
                        work
                      </span>{" "}
                      Career
                    </NavLink>
                    <NavLink to="/complaints" className={dropdownLinkClass}>
                      <span className="material-symbols-outlined text-[18px]">
                        lightbulb
                      </span>{" "}
                      Suggestions
                    </NavLink>
                    <NavLink to="/contact" className={dropdownLinkClass}>
                      <span className="material-symbols-outlined text-[18px]">
                        contact_support
                      </span>{" "}
                      Contact
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Admin Login, Phone & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <AdminLoginBtn />
            </div>
            <a
              href={`tel:${schoolProfile?.phone || "6901055733"}`}
              className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-primary text-white rounded-full hover:bg-primary-container hover:scale-105 transition-all shadow-md group"
              title="Call Us Now"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[20px] group-hover:animate-pulse">
                call
              </span>
            </a>
            <button
              className="xl:hidden p-2 text-primary focus:outline-none bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setShowMediaIcons(true)}
            >
              <GiHamburgerMenu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Move out of header to fix layout */}
      <AnimatePresence>
        {showMediaIcons && (
          <div className="fixed inset-0 z-[100] xl:hidden overflow-hidden">
            {/* Backdrop blur layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowMediaIcons(false)}
            />

            {/* Menu Content Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 w-[300px] h-screen bg-white shadow-2xl flex flex-col border-l border-white/20"
            >
              {/* Menu Header with Close Button */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <span className="font-bold text-slate-800 uppercase tracking-[0.15em] text-xs">
                  Navigation
                </span>
                <button
                  onClick={() => setShowMediaIcons(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-hide">
                <ul className="flex flex-col gap-2">
                  <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pointer-events-none">
                    Main Pages
                  </p>
                  {[
                    { to: "/", label: "Home", icon: "home" },
                    { to: "/principal", label: "Principal", icon: "person" },
                    { to: "/about", label: "About", icon: "info" },
                    { to: "/courses", label: "Courses", icon: "book" },
                    { to: "/admission", label: "Admission", icon: "school" },
                    { to: "/notice", label: "Notice", icon: "notifications" },
                  ].map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                            isActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                          }`
                        }
                        onClick={() => setShowMediaIcons(false)}
                      >
                        <span className="material-symbols-outlined">
                          {item.icon}
                        </span>
                        {item.label}
                      </NavLink>
                    </li>
                  ))}

                  <div className="h-px bg-slate-100 my-4 mx-4"></div>
                  <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pointer-events-none">
                    Academic Resources
                  </p>

                  {[
                    { to: "/faculty", label: "Faculty", icon: "groups" },
                    { to: "/gallery", label: "Gallery", icon: "photo_library" },
                    { to: "/career", label: "Career", icon: "work" },
                    { to: "/complaints", label: "Feedback", icon: "forum" },
                    { to: "/contact", label: "Contact", icon: "mail" },
                  ].map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                          }`
                        }
                        onClick={() => setShowMediaIcons(false)}
                      >
                        <span className="material-symbols-outlined">
                          {item.icon}
                        </span>
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Menu Footer */}
              <div className="p-6 bg-slate-50 mt-auto flex flex-col gap-4 border-t border-slate-100">
                <AdminLoginBtn onClick={() => setShowMediaIcons(false)} />
                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${schoolProfile?.phone || "6901055733"}`}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">
                      call
                    </span>
                  </a>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-none">
                      Questions?
                    </span>
                    <span className="text-sm font-bold text-slate-800 leading-tight">
                      {schoolProfile?.phone || "6901055733"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Header;
