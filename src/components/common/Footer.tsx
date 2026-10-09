import React from "react";
import { Shield, MapPin, Phone, HelpCircle, HardDrive, Lock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <div className="w-6 h-6 rounded-md bg-emerald-800 flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span>BalikHub Smart L&F</span>
            </div>
            <p className="text-stone-400 leading-relaxed">
              An intelligent civic lost-and-found system pairing NLP entity recognition with secure physical IoT municipal storage units.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-stone-200 font-bold text-xs tracking-wider uppercase">Municipal Storage Hubs</h4>
            <ul className="space-y-1.5">
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Unit A: City Hall Public Lobby</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Unit B: Central Community Center</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-stone-200 font-bold text-xs tracking-wider uppercase">Citizen Help & Support</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>LGU Helpdesk: (555) 019-2834</span>
              </li>
              <li className="flex items-center space-x-2">
                <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Civic Property Desk: Ground Floor</span>
              </li>
              <li className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verification Policy: Valid ID Required</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="text-stone-200 font-bold text-xs tracking-wider uppercase">System Protocol</h4>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              AI matching suggestions assist LGU officer decisions. No item is released without municipal officer verification and citizen ID validation.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-stone-500 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Encrypted Identity Logs Active</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px]">
          <p>© {new Date().getFullYear()} Municipal Government Information Network. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Connected Physical Storage Firmware v3.4.1 • Natural Tones Edition</p>
        </div>
      </div>
    </footer>
  );
};
