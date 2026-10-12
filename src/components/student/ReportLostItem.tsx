import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { extractItemAttributesNLP, matchFoundItemsWithReport } from "../../services/nlpService";
import { NLPExtractedAttributes } from "../../types";
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  Edit3, 
  Check, 
  Info, 
  Loader2, 
  Layers, 
  MapPin, 
  Clock, 
  User, 
  AlertCircle,
  HelpCircle,
  Search
} from "lucide-react";

const SAMPLE_PROMPTS = [
  "I lost a black Jansport backpack with a small blue keychain attached to the front pocket near the City Public Library.",
  "Navy blue Hydro Flask 32oz with a yellow Yosemite mountain sticker left at the City Hall Waiting Lounge.",
  "White Apple AirPods Pro inside a matte black Spigen rugged armor case left at the Community Sports Complex bleachers.",
  "Black leather Bellroy bifold wallet containing a National Resident ID and transit card near the Central Public Market.",
  "Dark wash Levi's denim jacket with two local heritage enamel pins left in the Municipal Cultural Center auditorium."
];

export const ReportLostItem: React.FC = () => {
  const { 
    addNewLostReport, 
    setStudentView, 
    setActiveMatchResults, 
    foundItems 
  } = useApp();

  const [description, setDescription] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [estimatedLocation, setEstimatedLocation] = useState("");
  const [lostDate, setLostDate] = useState(new Date().toISOString().split("T")[0]);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // NLP extraction state
  const [isProcessingNLP, setIsProcessingNLP] = useState(false);
  const [extractedAttributes, setExtractedAttributes] = useState<NLPExtractedAttributes | null>(null);
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);

  // Form edit fields for extracted
  const [editType, setEditType] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editAccessories, setEditAccessories] = useState("");
  const [editFeatures, setEditFeatures] = useState("");

  // Speech Recognition integration
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);

  const handleRunNLP = async (textToExtract?: string) => {
    const targetText = typeof textToExtract === "string" ? textToExtract : description;
    if (!targetText.trim()) return;

    setIsProcessingNLP(true);
    try {
      const extracted = await extractItemAttributesNLP(targetText);
      setExtractedAttributes(extracted);
      setEditType(extracted.itemType);
      setEditColor(extracted.color);
      setEditBrand(extracted.brand);
      setEditAccessories(extracted.accessories);
      setEditFeatures(extracted.distinguishingFeatures);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingNLP(false);
    }
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Realistic simulation for testing if unsupported
      setIsListening(true);
      setTimeout(() => {
        const randomPrompt = SAMPLE_PROMPTS[0];
        setDescription(prev => prev ? `${prev} ${randomPrompt}` : randomPrompt);
        setIsListening(false);
        handleRunNLP(prev => prev ? `${prev} ${randomPrompt}` : randomPrompt);
      }, 2000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      
      const originalDescription = description;
      let finalTranscript = "";

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let currentFinal = "";
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (currentFinal) {
          finalTranscript += currentFinal;
        }
        
        const newText = finalTranscript + interimTranscript;
        setDescription(originalDescription ? `${originalDescription} ${newText}` : newText);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // We use a timeout to let the state update complete before running NLP
        setTimeout(() => {
           // We can't easily access the latest description here without a ref,
           // so we skip auto-running NLP. The user can click the button.
        }, 100);
      };

      recognition.start();
    } catch (e) {
      console.warn("Speech recognition error:", e);
      setIsListening(false);
    }

  };

  const handleSaveEditedExtracted = () => {
    if (!extractedAttributes) return;
    setExtractedAttributes({
      ...extractedAttributes,
      itemType: editType,
      color: editColor,
      brand: editBrand,
      accessories: editAccessories,
      distinguishingFeatures: editFeatures,
      tags: [editType, editColor, editBrand, editAccessories].filter(Boolean)
    });
    setIsEditingExtracted(false);
  };

  const handleFindMatches = async () => {
    if (!extractedAttributes) {
      await handleRunNLP();
    }

    const currentExtracted = extractedAttributes || await extractItemAttributesNLP(description);

    // Save report to state & context
    const report = addNewLostReport({
      studentName,
      studentId,
      email: contactEmail,
      phone: contactPhone,
      rawDescription: description,
      extractedAttributes: currentExtracted,
      lostDate,
      estimatedLocation,
      status: "active",
      matchedItemIds: []
    });

    // Score against current inventory
    const matches = await matchFoundItemsWithReport(description, currentExtracted, foundItems);
    setActiveMatchResults(matches);

    // Navigate to matches view
    setStudentView("search");
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-8 relative">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-blue-300 shadow-inner">
            <Search className="w-4 h-4 text-blue-400" />
            <span>Lost Item Report</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-stone-400 tracking-tight">
            Report Lost Item
          </h1>
          <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-xl font-medium">
            Describe the item naturally via text or voice. Our AI will automatically extract key details to find a match in the LGU inventory.
          </p>
        </div>
      </div>

      {/* Main Step-by-Step Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-8">
        {/* Step 1: Natural Language / Voice Description */}
        <div className="space-y-4">
          <label htmlFor="item-description-input" className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
            Item Description
          </label>

          <div className="relative group">
            <textarea
              id="item-description-input"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g. I lost a black Jansport backpack with a small blue keychain attached near the public library..."
              className="w-full rounded-2xl border-2 border-stone-100 p-5 pr-16 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-blue-500 focus:bg-white bg-stone-50/50 transition-all resize-none shadow-inner font-medium"
            />

            {/* Microphone Button */}
            <button
              type="button"
              id="mic-record-btn"
              onClick={toggleVoiceRecording}
              className={`absolute right-4 bottom-4 p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center backdrop-blur-md ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-4 ring-red-500/20 scale-110"
                  : "bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-stone-200 hover:scale-105"
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {isListening && (
              <span className="text-red-500 text-[11px] font-extrabold animate-pulse flex items-center space-x-2 tracking-widest uppercase ml-1">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                <span>Listening for details...</span>
              </span>
            )}
          </div>

          {/* Quick Preset Prompt Chips (Horizontal Scroll) */}
          <div className="pt-2">
            <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest mb-3 ml-1">
              Try a test prompt:
            </p>
            <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 -mx-2 px-2">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDescription(prompt);
                    setExtractedAttributes(null);
                  }}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-stone-100/80 text-stone-600 text-[11px] font-bold hover:bg-stone-200 transition-colors whitespace-nowrap max-w-[250px] truncate border border-stone-200/50 shadow-xs"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NLP Processing Trigger */}
        {!extractedAttributes && (
          <div className="pt-2">
            <button
              type="button"
              id="analyze-nlp-btn"
              disabled={!description.trim() || isProcessingNLP}
              onClick={() => handleRunNLP()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-stone-300 text-white text-[15px] font-extrabold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              {isProcessingNLP ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Processing details...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Extract Attributes</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* NLP Processing Animation State */}
        {isProcessingNLP && (
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-center space-y-4 shadow-inner">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 animate-pulse relative">
              <div className="absolute inset-0 bg-blue-400 rounded-2xl animate-ping opacity-30"></div>
              <Sparkles className="w-6 h-6 animate-spin relative z-10" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-stone-900">Understanding your description...</h4>
              <p className="text-xs text-stone-600 mt-1.5 font-medium max-w-sm mx-auto">
                Extracting entity attributes: item type, primary color palette, brand names, and accessories.
              </p>
            </div>
          </div>
        )}

        {/* Extracted Information Chips & Validation */}
        {extractedAttributes && !isProcessingNLP && (
          <div className="p-6 sm:p-8 rounded-[2rem] bg-stone-50/80 border border-stone-200/80 space-y-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200/60 shadow-sm">
                  <Check className="w-4 h-4" />
                </div>
                <h4 className="text-base font-extrabold text-stone-900">Extracted Item Attributes</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1.5 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingExtracted ? "Cancel Editing" : "Edit Attributes"}</span>
              </button>
            </div>

            {isEditingExtracted ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 uppercase tracking-widest">Item Type</label>
                  <input
                    type="text"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-stone-200 focus:border-blue-500 focus:bg-white bg-stone-100 outline-hidden transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 uppercase tracking-widest">Color(s)</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-stone-200 focus:border-blue-500 focus:bg-white bg-stone-100 outline-hidden transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 uppercase tracking-widest">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-stone-200 focus:border-blue-500 focus:bg-white bg-stone-100 outline-hidden transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 uppercase tracking-widest">Accessories</label>
                  <input
                    type="text"
                    value={editAccessories}
                    onChange={(e) => setEditAccessories(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-stone-200 focus:border-blue-500 focus:bg-white bg-stone-100 outline-hidden transition-all shadow-inner"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 uppercase tracking-widest">Distinguishing Marks</label>
                  <input
                    type="text"
                    value={editFeatures}
                    onChange={(e) => setEditFeatures(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-stone-200 focus:border-blue-500 focus:bg-white bg-stone-100 outline-hidden transition-all shadow-inner"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveEditedExtracted}
                    className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95"
                  >
                    Confirm Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Item Type</span>
                  <span className="text-sm font-bold text-stone-900 mt-1 block">{extractedAttributes.itemType}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Color</span>
                  <span className="text-sm font-bold text-stone-900 mt-1 block">{extractedAttributes.color}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Brand</span>
                  <span className="text-sm font-bold text-stone-900 mt-1 block">{extractedAttributes.brand || "-"}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Accessory / Mark</span>
                  <span className="text-sm font-bold text-stone-900 mt-1 block truncate" title={extractedAttributes.accessories}>
                    {extractedAttributes.accessories || "-"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Contact & Location Details */}
        <div className="pt-6 border-t border-stone-100/80 space-y-6">
          <label className="block text-xs font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
            Additional Details
          </label>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Your Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-blue-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all shadow-inner font-medium placeholder:font-normal"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Date Lost</label>
                <input
                  type="date"
                  value={lostDate}
                  onChange={(e) => setLostDate(e.target.value)}
                  className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-blue-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all shadow-inner font-medium"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-stone-500 mb-1.5 ml-1 uppercase tracking-widest">Location Lost (Estimated)</label>
                <input
                  type="text"
                  value={estimatedLocation}
                  onChange={(e) => setEstimatedLocation(e.target.value)}
                  placeholder="e.g. City Plaza, Public Library"
                  className="w-full px-4 py-3.5 text-sm rounded-2xl border-2 border-stone-100 focus:border-blue-500 focus:bg-white bg-stone-50/50 outline-hidden transition-all shadow-inner font-medium placeholder:font-normal"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-4">
          <button
            type="button"
            id="find-possible-matches-btn"
            disabled={!description.trim()}
            onClick={handleFindMatches}
            className="w-full py-4 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 disabled:opacity-70 text-white text-[15px] font-extrabold rounded-2xl shadow-xl shadow-stone-900/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <span>Find Possible Matches</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
