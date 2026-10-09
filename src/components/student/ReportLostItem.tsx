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
  HelpCircle
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

  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Realistic simulation for testing
      setIsListening(true);
      setTimeout(() => {
        const randomPrompt = SAMPLE_PROMPTS[0];
        setDescription(randomPrompt);
        setIsListening(false);
      }, 2000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.warn("Speech recognition error:", e);
      setIsListening(false);
    }
  };

  const handleRunNLP = async () => {
    if (!description.trim()) return;

    setIsProcessingNLP(true);
    try {
      const extracted = await extractItemAttributesNLP(description);
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
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-stone-500 mb-2">
          <button onClick={() => setStudentView("home")} className="hover:text-emerald-800">Home</button>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Report Lost Item</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Report a Lost Item
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Describe the item naturally. Our NLP engine will structure key attributes to find matching items in municipal storage.
        </p>
      </div>

      {/* Main Step-by-Step Card */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Step 1: Natural Language / Voice Description */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="item-description-input" className="block text-sm font-bold text-stone-900">
              1. Item Description
            </label>
            <span className="text-xs text-stone-400">Natural Language or Voice Input</span>
          </div>

          <div className="relative">
            <textarea
              id="item-description-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="I lost a black Jansport backpack with a small blue keychain attached to the front pocket..."
              className="w-full rounded-2xl border border-stone-200 p-4 pr-14 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:border-transparent leading-relaxed resize-none transition-all shadow-inner bg-stone-50/40"
            />

            {/* Microphone Button */}
            <button
              type="button"
              id="mic-record-btn"
              onClick={toggleVoiceRecording}
              title={isListening ? "Listening... click to stop" : "Click to speak description"}
              className={`absolute right-3.5 bottom-3.5 p-2.5 rounded-xl transition-all shadow-xs ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-4 ring-red-100"
                  : "bg-stone-100 text-stone-600 hover:bg-emerald-800 hover:text-white"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500">
            <div className="flex items-center space-x-1.5 text-stone-500">
              <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Tip: Include type, color, brand, unique marks, scratches, or attached accessories.</span>
            </div>
            {isListening && (
              <span className="text-red-600 font-semibold animate-pulse flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Listening for speech...</span>
              </span>
            )}
          </div>

          {/* Quick Preset Prompt Chips */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
              Quick Test Prompts (Click to fill):
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDescription(prompt);
                    setExtractedAttributes(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 text-xs transition-colors text-left border border-stone-200/80 font-medium"
                >
                  "{prompt.slice(0, 48)}..."
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NLP Processing Trigger */}
        {!extractedAttributes && (
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Click below to parse your description into structured attributes.
            </span>
            <button
              type="button"
              id="analyze-nlp-btn"
              disabled={!description.trim() || isProcessingNLP}
              onClick={handleRunNLP}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-2 active:scale-98"
            >
              {isProcessingNLP ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Understanding your description...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Extract Attributes with AI NLP</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* NLP Processing Animation State */}
        {isProcessingNLP && (
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">Understanding your description...</h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Extracting entity attributes: item type, primary color palette, brand names, and accessories.
              </p>
            </div>
          </div>
        )}

        {/* Extracted Information Chips & Validation */}
        {extractedAttributes && !isProcessingNLP && (
          <div className="p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900">Extracted Item Attributes</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingExtracted ? "Cancel Editing" : "Edit Attributes"}</span>
              </button>
            </div>

            {isEditingExtracted ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Item Type</label>
                  <input
                    type="text"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Color(s)</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Accessories</label>
                  <input
                    type="text"
                    value={editAccessories}
                    onChange={(e) => setEditAccessories(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Distinguishing Marks</label>
                  <input
                    type="text"
                    value={editFeatures}
                    onChange={(e) => setEditFeatures(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveEditedExtracted}
                    className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold"
                  >
                    Confirm Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Item Type</span>
                  <span className="text-xs font-bold text-stone-900 mt-0.5 block">{extractedAttributes.itemType}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Color</span>
                  <span className="text-xs font-bold text-stone-900 mt-0.5 block">{extractedAttributes.color}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Brand</span>
                  <span className="text-xs font-bold text-stone-900 mt-0.5 block">{extractedAttributes.brand}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Accessory / Mark</span>
                  <span className="text-xs font-bold text-stone-900 mt-0.5 block truncate" title={extractedAttributes.accessories}>
                    {extractedAttributes.accessories}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Contact & Location Details */}
        <div className="pt-4 border-t border-stone-100 space-y-4">
          <h4 className="text-sm font-bold text-stone-900">2. Claimant & Location Information</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Citizen / Resident Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Citizen / Resident ID or Reference</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Estimated City / Municipal Location Lost</label>
              <input
                type="text"
                value={estimatedLocation}
                onChange={(e) => setEstimatedLocation(e.target.value)}
                placeholder="e.g. City Public Library, City Hall Lobby, Central Market"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Approximate Date Lost</label>
              <input
                type="date"
                value={lostDate}
                onChange={(e) => setLostDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400">
            Submitting searches real-time inventory and saves your active report.
          </p>

          <button
            type="button"
            id="find-possible-matches-btn"
            disabled={!description.trim()}
            onClick={handleFindMatches}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>Find Possible Matches</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
