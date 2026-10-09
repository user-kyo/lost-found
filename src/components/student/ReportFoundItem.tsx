import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { PlusCircle, Loader2 } from "lucide-react";

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
      <div className="max-w-3xl mx-auto p-12 bg-white rounded-3xl shadow-sm text-center border border-stone-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <PlusCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Item Submitted!</h2>
        <p className="text-stone-500">Thank you for reporting this found item. LGU staff will review it shortly.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Report a Found Item
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Submit details of an item you found. The public description will be visible to everyone, while private details are only visible to LGU Staff to verify ownership.
        </p>
      </div>

      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Category</label>
              <input required type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Electronics, Keys, Clothing" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 bg-stone-50/50" />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Primary Color</label>
              <input required type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Black, Blue" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 bg-stone-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Date Found</label>
              <input required type="date" value={dateFound} onChange={e => setDateFound(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 bg-stone-50/50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Area Found</label>
              <input required type="text" value={areaFound} onChange={e => setAreaFound(e.target.value)} placeholder="e.g. City Hall Lobby" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 bg-stone-50/50" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Public Description</label>
            <p className="text-xs text-stone-500 mb-2">This will be visible to everyone. Do not include sensitive information like serial numbers or full names.</p>
            <textarea required rows={3} value={publicDescription} onChange={e => setPublicDescription(e.target.value)} placeholder="e.g. Found a black backpack near the library entrance." className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 bg-stone-50/50 resize-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Item Image (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-300 border-dashed rounded-xl bg-stone-50/50 hover:bg-stone-100/50 transition-colors">
              <div className="space-y-1 text-center">
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img src={imageUrl} alt="Preview" className="h-32 w-auto rounded-lg object-cover shadow-sm" />
                    <button type="button" onClick={() => setImageUrl("")} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm hover:bg-red-200">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-stone-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-stone-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-700 hover:text-emerald-600 focus-within:outline-hidden focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500 px-1">
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
                    <p className="text-xs text-stone-500">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Private Verification Details (Hidden)</label>
            <p className="text-xs text-stone-500 mb-2">Only LGU Staff can see this. Include serial numbers, ID names, exact cash amounts, or specific contents to help verify the true owner.</p>
            <textarea required rows={3} value={privateDetails} onChange={e => setPrivateDetails(e.target.value)} placeholder="e.g. Contains a Macbook Pro with serial number XYZ123..." className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 bg-stone-50/50 resize-none"></textarea>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button disabled={loading} type="submit" className="px-8 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center space-x-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              <span>Submit Found Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
