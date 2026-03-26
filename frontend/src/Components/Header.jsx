import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import AdminLoginBtn from "./AdminLoginBtn.jsx";
import { GiHamburgerMenu } from "react-icons/gi";

function Header() {
  const [showMediaIcons, setShowMediaIcons] = useState(false);
  const [showMore, setShowMore] = useState(false);

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
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full px-4 md:px-6 py-3">
        {/* Branding */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <img
            src="/Pictures/Logo.jpg"
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300 object-cover"
            alt="Holy Name School Logo"
          />
          <div className="flex flex-col">
            <h1 className="font-bold text-slate-900 tracking-tight text-sm sm:text-[15px] md:text-lg leading-tight">
              Holy Name Higher Secondary School
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-bold text-primary">
                Let Your Light Shine
              </span>
              <span className="hidden md:flex items-center text-[10px] text-slate-400 gap-1 border-l border-slate-300 pl-2">
                <span className="material-symbols-outlined text-[12px]">
                  call
                </span>{" "}
                6901055733
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
            href="tel:6901055733"
            className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-primary text-white rounded-full hover:bg-primary-container hover:scale-105 transition-all shadow-md group"
            title="Call Us Now"
          >
            <span className="material-symbols-outlined text-[18px] md:text-[20px] group-hover:animate-pulse">
              call
            </span>
          </a>
          <button
            className="xl:hidden p-2 text-primary focus:outline-none bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setShowMediaIcons(!showMediaIcons)}
          >
            <GiHamburgerMenu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`xl:hidden flex flex-col bg-white transition-all duration-300 ease-in-out border-t border-slate-100 ${
          showMediaIcons ? "max-h-[calc(100dvh-70px)] overflow-y-auto shadow-xl" : "max-h-0 overflow-hidden"
        }`}
      >
        <ul className="flex flex-col font-medium py-4 px-6 gap-2">
          <li>
            <NavLink
              to="/"
              className={navLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/principal"
              className={navLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Principal
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={navLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              About
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/courses"
              className={navLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Courses
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admission"
              className={navLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Admission
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/notice"
              className={navLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Notice
            </NavLink>
          </li>
          <div className="h-px bg-slate-100 my-2 w-full"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            More Details
          </p>
          <li>
            <NavLink
              to="/faculty"
              className={dropdownLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Faculty
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/gallery"
              className={dropdownLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Gallery
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/career"
              className={dropdownLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Career
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/complaints"
              className={dropdownLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Suggestions
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={dropdownLinkClass}
              onClick={() => setShowMediaIcons(false)}
            >
              Contact
            </NavLink>
          </li>
          <div className="h-px bg-slate-100 my-2 w-full"></div>
          <li className="mt-2 text-center flex justify-center w-full pb-4">
            <AdminLoginBtn onClick={() => setShowMediaIcons(false)} />
          </li>
        </ul>
      </div>
    </header>
  );
}

export default Header;
