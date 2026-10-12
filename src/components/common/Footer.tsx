import React from "react";
import { Shield, MapPin, Phone, HelpCircle, HardDrive, Lock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-50 border-t border-stone-200 text-stone-500 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-stone-600 text-lg tracking-tight">
                BalikHub
              </span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
              A community-driven lost and found platform dedicated to helping citizens recover their misplaced belongings securely and efficiently.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-stone-900 font-bold text-sm tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">Report Lost Item</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">Report Found Item</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">How it Works</a>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h4 className="text-stone-900 font-bold text-sm tracking-wide">Contact & Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Main Office, City Hall</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <HelpCircle className="w-4 h-4 text-stone-400 shrink-0" />
                <span>support@balikhub.gov</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <p>© {new Date().getFullYear()} BalikHub. All rights reserved.</p>
          <div className="mt-4 sm:mt-0 flex space-x-4">
            <a href="#" className="hover:text-stone-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
