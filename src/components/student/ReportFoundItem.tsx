import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { PlusCircle, Loader2, PackageSearch } from "lucide-react";

export const ReportFoundItem: React.FC = () => {
  const { user, setStudentView } = useApp();

  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [dateFound, setDateFound] = useState(new Date().toISOString().split("T")[0]);
  const [areaFound, setAreaFound] = useState("");
  const [privateDetails, setPrivateDetails] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          category,
          color,
          publicDescription,
          dateFound,
          areaFound,
          privateDetails,
          imageUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => {
        setStudentView("home");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit post");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-[2rem] p-16 text-center space-y-6 shadow-sm flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto shadow-inner border border-emerald-100 relative">
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping opacity-75"></div>
          <PlusCircle className="w-10 h-10 text-emerald-500 relative z-10" />
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-stone-900">Item Submitted!</h3>
          <p className="text-base text-stone-500 max-w-md mx-auto mt-2 font-medium">
            Thank you for reporting this found item. LGU staff will review it shortly. Redirecting you home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-8 relative">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-teal-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-teal-500/30 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-emerald-300 shadow-inner">
            <PackageSearch className="w-4 h-4 text-emerald-400" />
            <span>Found Item Report</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-stone-400 tracking-tight">
            Report Found Item
          </h1>
          <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-xl font-medium">
            Submit details of an item you found. The public description will be visible to everyone, while private details are only visible to LGU Staff to verify ownership.
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-200/80">
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 text-red-700 rounded-2xl border border-red-200/60 text-sm font-semibold shadow-inner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Category</label>
                <input required type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Electronics, Keys, Clothing" className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-emerald-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all shadow-inner font-medium placeholder:font-normal" />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Primary Color</label>
                <input required type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Black, Blue" className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-emerald-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all shadow-inner font-medium placeholder:font-normal" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Date Found</label>
                <input required type="date" value={dateFound} onChange={e => setDateFound(e.target.value)} className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-emerald-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all shadow-inner font-medium" />
              </div>
              
              <div>
                <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Area Found</label>
                <input required type="text" value={areaFound} onChange={e => setAreaFound(e.target.value)} placeholder="e.g. City Hall Lobby" className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-emerald-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all shadow-inner font-medium placeholder:font-normal" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100/80">
            <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Public Description</label>
            <textarea required rows={3} value={publicDescription} onChange={e => setPublicDescription(e.target.value)} placeholder="e.g. Found a black backpack near the library entrance. Do not include sensitive info here." className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-emerald-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all resize-none shadow-inner font-medium placeholder:font-normal"></textarea>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Item Image (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-200 border-dashed rounded-2xl bg-stone-50/50 hover:bg-stone-50 transition-colors group relative overflow-hidden">
              <div className="space-y-1 text-center relative z-10">
                {imageUrl ? (
                  <div className="relative inline-block group/img">
                    <img src={imageUrl} alt="Preview" className="h-40 w-auto rounded-xl object-cover shadow-md" />
                    <button type="button" onClick={() => setImageUrl("")} className="absolute -top-3 -right-3 bg-red-100 text-red-600 rounded-full p-1.5 shadow-sm hover:bg-red-200 transition-colors opacity-0 group-hover/img:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-stone-100 mb-3 group-hover:scale-110 transition-transform">
                      <svg className="h-8 w-8 text-stone-400 group-hover:text-emerald-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex text-sm text-stone-600 justify-center font-medium">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-emerald-600 hover:text-emerald-700 px-1 transition-colors">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setImageUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100/80">
            <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Private Details (Hidden)</label>
            <p className="text-[11px] text-stone-400 mb-3 ml-1 font-medium leading-tight">Only LGU Staff can see this. Include serial numbers, ID names, exact cash amounts, etc.</p>
            <textarea required rows={3} value={privateDetails} onChange={e => setPrivateDetails(e.target.value)} placeholder="e.g. Contains a Macbook Pro with serial number XYZ123..." className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-emerald-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all resize-none shadow-inner font-medium placeholder:font-normal"></textarea>
          </div>

          <div className="pt-6">
            <button disabled={loading} type="submit" className="w-full py-4 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 disabled:opacity-70 text-white text-[15px] font-extrabold rounded-2xl shadow-xl shadow-stone-900/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              <span>Submit Found Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
