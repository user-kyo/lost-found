import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Mail, Lock, User, Shield, CreditCard, ArrowRight, Loader2, Info } from "lucide-react";

export const AuthScreens: React.FC = () => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"citizen" | "admin">("citizen");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, fullName, role });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-stone-50 selection:bg-blue-200 animate-in fade-in duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md px-4 sm:px-0 animate-in slide-in-from-bottom-4 fade-in zoom-in-95 duration-700">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-500">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 shadow-lg mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">BalikHub</h1>
            <p className="text-sm text-stone-500 mt-2 font-medium">Community Lost &amp; Found Hub</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-start space-x-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`relative flex items-center justify-center p-3 cursor-pointer rounded-xl border-2 transition-all duration-200 ${role === 'citizen' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-stone-100 bg-stone-50/50 text-stone-500 hover:bg-stone-100'}`}>
                      <input type="radio" value="citizen" checked={role === "citizen"} onChange={() => setRole("citizen")} className="sr-only" />
                      <span className="font-medium text-sm">Citizen</span>
                    </label>
                    <label className={`relative flex items-center justify-center p-3 cursor-pointer rounded-xl border-2 transition-all duration-200 ${role === 'admin' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-stone-100 bg-stone-50/50 text-stone-500 hover:bg-stone-100'}`}>
                      <input type="radio" value="admin" checked={role === "admin"} onChange={() => setRole("admin")} className="sr-only" />
                      <span className="font-medium text-sm">LGU Staff</span>
                    </label>
                  </div>
                </div>
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-stone-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-stone-400" />
                    </div>
                    <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="block w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" placeholder="Juan Dela Cruz" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-stone-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400" />
                </div>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" placeholder="example@gmail.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-stone-700">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" placeholder="••••••••" />
              </div>
            </div>

            <button disabled={loading} type="submit" className="group relative w-full flex justify-center items-center py-3.5 px-4 mt-6 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="ml-2 w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); }} 
              className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-blue-600 transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="ml-1 text-blue-600 font-semibold underline decoration-2 underline-offset-4 decoration-blue-500/30">Sign up</span></>
              ) : (
                <>Already have an account? <span className="ml-1 text-blue-600 font-semibold underline decoration-2 underline-offset-4 decoration-blue-500/30">Sign in</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
