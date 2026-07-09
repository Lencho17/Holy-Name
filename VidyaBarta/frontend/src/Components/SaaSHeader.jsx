import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX, FiArrowRight } from 'react-icons/fi';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-outline-variant ${isScrolled ? 'bg-surface-variant/95 backdrop-blur-md shadow-sm py-1.5' : 'bg-surface-variant/80 backdrop-blur-sm py-2'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 group">
          <img src="/logo.png" alt="VidyaBarta" className="h-auto w-28 md:w-32 object-contain group-hover:scale-105 transition-transform" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors">Features</a>
          <a href="#pricing" className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors">Pricing</a>
          <a href="#contact" className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors">Contact</a>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" target="_blank" rel="noopener noreferrer" className="text-body-md font-bold text-neutral hover:text-primary transition-colors">
            Login
          </Link>
          <Link to="/superadmin" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-body-md hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
            Dashboard
            <FiArrowRight />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-neutral p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-surface shadow-lg border-t border-outline-variant py-4 px-6 flex flex-col gap-4 md:hidden animate-slideDown">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-body-lg font-medium text-neutral py-2 border-b border-outline-variant">Features</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-body-lg font-medium text-neutral py-2 border-b border-outline-variant">Pricing</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-body-lg font-medium text-neutral py-2 border-b border-outline-variant">Contact</a>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/login" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 rounded-lg font-bold text-neutral border border-outline hover:bg-surface-variant">Login</Link>
            <Link to="/superadmin" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 bg-primary text-white rounded-lg font-bold">Go to Dashboard</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
