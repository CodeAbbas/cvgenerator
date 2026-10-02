// app/page.tsx
"use client";

import { useState } from "react";

export default function CVGenerator() {
  const [cvText, setCvText] = useState("");
  const [title, setTitle] = useState("Abbas_Uddin_CV");
  const [docUrl, setDocUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDocUrl("");
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/generate-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: cvText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to communicate with the API.");
      }

      const data = await response.json();
      if (data.url) {
        setDocUrl(data.url);
      }
    } catch (err) {
      console.error("Failed to generate CV", err);
      setError("Unable to generate your document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 sm:p-8 font-sans antialiased text-[#1D1D1F]">
      
      <main className="w-full max-w-2xl bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-12 overflow-hidden">
        
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F] mb-2">
            CV Generator
          </h1>
          <p className="text-[17px] text-[#86868B] leading-relaxed">
            Instantly format your raw markdown into a polished Google Document.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          
          {/* Title Input */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5 ml-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-transparent focus:border-[#007AFF]/30 focus:bg-white focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl p-4 text-[17px] text-[#1D1D1F] placeholder:text-[#86868B] outline-none transition-all duration-200"
              placeholder="e.g., Abbas_Uddin_CV"
              required
            />
          </div>

          {/* CV Content Textarea */}
          <div>
            <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5 ml-1">
              Raw Content
            </label>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              className="w-full h-72 bg-[#F5F5F7] border border-transparent focus:border-[#007AFF]/30 focus:bg-white focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl p-4 text-[15px] font-mono text-[#1D1D1F] placeholder:text-[#86868B] outline-none resize-none transition-all duration-200"
              placeholder="Paste your raw text or markdown here..."
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007AFF] hover:bg-[#0071E3] text-white font-semibold text-[17px] rounded-2xl py-4 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              "Generate Google Doc"
            )}
          </button>
        </form>

        {/* Error State */}
        {error && (
          <div className="mt-8 p-4 bg-[#FF3B30]/10 rounded-xl animate-in fade-in duration-300">
            <p className="text-[#FF3B30] text-[15px] font-medium text-center">
              {error}
            </p>
          </div>
        )}

        {/* Success State */}
        {docUrl && (
          <div className="mt-8 p-5 bg-[#34C759]/10 rounded-2xl animate-in fade-in duration-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#34C759] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <p className="text-[#1D1D1F] font-medium text-[15px]">
                Document created successfully.
              </p>
            </div>
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#007AFF] border border-[#007AFF]/20 hover:bg-[#F5F5F7] rounded-xl text-[15px] font-semibold text-center transition-colors duration-200"
            >
              Open File
            </a>
          </div>
        )}
      </main>
    </div>
  );
}