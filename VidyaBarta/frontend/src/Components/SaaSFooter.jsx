import React from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer id="contact" className="bg-surface border-t border-outline-variant pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="VidyaBarta" className="h-auto w-32 md:w-40 object-contain" />
            </a>
            <p className="text-body-md text-on-surface-variant max-w-sm mb-6 leading-relaxed">
              The premium school management system designed to streamline your institution's daily operations.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-colors">
                <FiTwitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-colors">
                <FiLinkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-colors">
                <FiMail size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-title-md font-bold text-neutral mb-6 font-headline">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-title-md font-bold text-neutral mb-6 font-headline">Support</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">API Documentation</Link></li>
              <li><Link to="/" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-body-sm text-on-surface-variant">
            &copy; {new Date().getFullYear()} VidyaBarta. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-body-sm text-on-surface-variant">
            <Link to="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
