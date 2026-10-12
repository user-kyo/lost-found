import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Mail, Lock, User, Shield, ArrowRight, Loader2, Info, IdCard, GraduationCap, School } from "lucide-react";

export const AuthScreens: React.FC = () => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userType, setUserType] = useState<"student" | "faculty" | "staff">("student");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick Demo Account Helper
  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setIsLogin(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ 
          email, 
          password, 
          fullName, 
          schoolId, 
          userType: "student"
        });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-stone-50 selection:bg-blue-200 py-10 px-4 animate-in fade-in duration-500">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in zoom-in-95 duration-700">
        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/80 shadow-2xl rounded-3xl p-6 sm:p-10 transition-all duration-500">
          
          {/* School Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg mb-4 text-white">
              <School className="w-8 h-8" />
            </div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">BalikHub</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                Guidance Office
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5 font-medium">
              School Property Custody &amp; Recovery Portal
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs sm:text-sm text-red-600 animate-in fade-in duration-300">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">Student Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input 
                      required 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-hidden" 
                      placeholder="e.g. Maria Clara Santos" 
                    />
                  </div>
                </div>

                {/* Student ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">Student ID Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <IdCard className="h-4 w-4" />
                    </div>
                    <input 
                      required 
                      type="text" 
                      value={schoolId} 
                      onChange={e => setSchoolId(e.target.value)} 
                      className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-hidden" 
                      placeholder="e.g. 2024-00101" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">School / Institutional Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-hidden" 
                  placeholder="student@school.edu" 
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="block w-full pl-10 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-hidden" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full flex justify-center items-center py-3 px-4 mt-4 rounded-xl shadow-md text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-hidden disabled:opacity-70 transition-all active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Register Student Account"}</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); }} 
              className="text-xs font-semibold text-stone-500 hover:text-blue-600 transition-colors"
            >
              {isLogin ? (
                <>New student? <span className="text-blue-600 underline">Register student account</span></>
              ) : (
                <>Already have an account? <span className="text-blue-600 underline">Sign in</span></>
              )}
            </button>
          </div>

          {/* Quick Demo Role Picker for all 5 Approved Roles (Development Only) */}
          {Boolean((import.meta as any).env?.DEV) && (
            <div className="mt-8 pt-6 border-t border-stone-100">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5 text-center">
                Quick Test Logins (Password: password123)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setDemoAccount("student@school.edu")}
                  className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-900 border border-blue-200/80 text-left transition-all active:scale-95 group shadow-2xs"
                >
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-sm">🎓</span>
                    <span className="font-extrabold text-[11px] text-blue-900">Claimant</span>
                  </div>
                  <p className="text-[9px] text-blue-600 font-medium">Search &amp; Claims</p>
                  <p className="text-[8px] text-stone-400 font-mono mt-0.5 truncate">student@school.edu</p>
                </button>

                <button 
                  type="button"
                  onClick={() => setDemoAccount("encoder@guidance.edu")}
                  className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/80 text-left transition-all active:scale-95 group shadow-2xs"
                >
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-sm">📝</span>
                    <span className="font-extrabold text-[11px] text-indigo-900">Guidance Encoder</span>
                  </div>
                  <p className="text-[9px] text-indigo-600 font-medium">Intake &amp; Verify</p>
                  <p className="text-[8px] text-stone-400 font-mono mt-0.5 truncate">encoder@guidance.edu</p>
                </button>

                <button 
                  type="button"
                  onClick={() => setDemoAccount("head@guidance.edu")}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/80 text-left transition-all active:scale-95 group shadow-2xs"
                >
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-sm">👑</span>
                    <span className="font-extrabold text-[11px] text-emerald-900">Guidance Head</span>
                  </div>
                  <p className="text-[9px] text-emerald-600 font-medium">Publish &amp; Release</p>
                  <p className="text-[8px] text-stone-400 font-mono mt-0.5 truncate">head@guidance.edu</p>
                </button>

                <button 
                  type="button"
                  onClick={() => setDemoAccount("schooladmin@school.edu")}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 text-left transition-all active:scale-95 group shadow-2xs"
                >
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-sm">📊</span>
                    <span className="font-extrabold text-[11px] text-amber-900">School Admin</span>
                  </div>
                  <p className="text-[9px] text-amber-600 font-medium">Read-Only Reports</p>
                  <p className="text-[8px] text-stone-400 font-mono mt-0.5 truncate">schooladmin@school.edu</p>
                </button>

                <button 
                  type="button"
                  onClick={() => setDemoAccount("admin@school.edu")}
                  className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-900 border border-purple-200/80 text-left transition-all active:scale-95 group shadow-2xs col-span-2 sm:col-span-1"
                >
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-sm">⚙️</span>
                    <span className="font-extrabold text-[11px] text-purple-900">System Admin</span>
                  </div>
                  <p className="text-[9px] text-purple-600 font-medium">Technical Config</p>
                  <p className="text-[8px] text-stone-400 font-mono mt-0.5 truncate">admin@school.edu</p>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
