import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Settings, User, Bell, Globe, ShieldCheck } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { user, role } = useApp();
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  const isTagalog = document.cookie.includes('/en/tl');

  return (
    <div className="w-full max-w-3xl mx-auto pb-24 md:pb-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">Settings</h1>
          <p className="text-sm md:text-base text-stone-500 font-medium">Manage preferences and account.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <section className="bg-white p-5 md:p-6 rounded-[2rem] border border-stone-200/50 shadow-xs">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-stone-100">
            <div className="p-2 bg-blue-50 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Profile Information</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="w-full px-4 py-3 bg-stone-50 border border-stone-200/80 rounded-2xl text-stone-700 text-sm font-semibold">
                {user?.fullName || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="w-full px-4 py-3 bg-stone-50 border border-stone-200/80 rounded-2xl text-stone-700 text-sm font-semibold">
                {user?.email || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider">Account Role</label>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/50 rounded-lg text-sm font-bold capitalize">
                  {role}
                </span>
                {role === 'staff' && (
                  <span className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-lg text-sm font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Language Settings */}
        <section className="bg-white p-5 md:p-6 rounded-[2rem] border border-stone-200/50 shadow-xs">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-stone-100">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Language Preferences</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                document.cookie = "googtrans=/en/en; path=/";
                document.cookie = "googtrans=/en/en; domain=" + window.location.hostname + "; path=/";
                window.location.reload();
              }}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 ${!isTagalog ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 shadow-sm' : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-stone-200'}`}
            >
              <span>English</span>
            </button>
            <button 
              onClick={() => {
                document.cookie = "googtrans=/en/tl; path=/";
                document.cookie = "googtrans=/en/tl; domain=" + window.location.hostname + "; path=/";
                window.location.reload();
              }}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-200 ${isTagalog ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 shadow-sm' : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-stone-200'}`}
            >
              <span>Tagalog</span>
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white p-5 md:p-6 rounded-[2rem] border border-stone-200/50 shadow-xs">
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-stone-100">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Notifications</h2>
          </div>
          
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 cursor-pointer hover:bg-stone-100/80 transition-colors"
              onClick={() => setEmailNotif(!emailNotif)}
            >
              <div>
                <span className="block text-sm font-bold text-stone-800">Email Notifications</span>
                <span className="block text-xs font-medium text-stone-500 mt-0.5">Receive updates via email</span>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotif ? 'bg-blue-600' : 'bg-stone-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
            
            <div 
              className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 cursor-pointer hover:bg-stone-100/80 transition-colors"
              onClick={() => setSmsNotif(!smsNotif)}
            >
              <div>
                <span className="block text-sm font-bold text-stone-800">SMS Alerts</span>
                <span className="block text-xs font-medium text-stone-500 mt-0.5">Get text messages for urgent matches</span>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsNotif ? 'bg-blue-600' : 'bg-stone-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsNotif ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
