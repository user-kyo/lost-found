import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

export const AuthScreens: React.FC = () => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"citizen" | "admin">("citizen");
  const [idType, setIdType] = useState("");
  const [idLast4, setIdLast4] = useState("");
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
        await register({ email, password, fullName, role, idType, idLast4 });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800">BalikHub</h1>
          <p className="text-stone-500 mt-2">San Pablo City Central Lost & Found</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700">I am a...</label>
                <div className="mt-1 flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" value="citizen" checked={role === "citizen"} onChange={() => setRole("citizen")} className="text-emerald-600 focus:ring-emerald-500" />
                    <span className="ml-2 text-stone-700">Citizen</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" value="admin" checked={role === "admin"} onChange={() => setRole("admin")} className="text-emerald-600 focus:ring-emerald-500" />
                    <span className="ml-2 text-stone-700">LGU Staff</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700">Full Name</label>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
              </div>

              {role === "citizen" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700">ID Type (Optional)</label>
                    <select value={idType} onChange={e => setIdType(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border">
                      <option value="">Select ID</option>
                      <option value="Student ID">Student ID</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="National ID">National ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700">ID Last 4 Digits</label>
                    <input type="text" maxLength={4} value={idLast4} onChange={e => setIdLast4(e.target.value)} placeholder="e.g. 1234" className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border" />
          </div>

          <button disabled={loading} type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50">
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-sm text-emerald-600 hover:text-emerald-500">
            {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
