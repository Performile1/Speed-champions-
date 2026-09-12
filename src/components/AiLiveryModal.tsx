import React, { useState } from 'react';
import { Sparkles, Wand2, Check, RefreshCw, X, Lightbulb } from 'lucide-react';
import { CarPartColors, CarDecals } from '../types';

interface AiLiveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModelName: string;
  onApplyLivery: (colors: CarPartColors, decals: CarDecals, boxTitle?: string, boxSubtitle?: string) => void;
}

const AI_PRESETS = [
  {
    title: 'Ayrton Senna 1988 Tribute',
    prompt: 'Classic McLaren MP4/4 Marlboro red chevron nose and brilliant white bodywork with Ayrton Senna national yellow helmet and retro gold BBS rims.'
  },
  {
    title: 'Cyberpunk 2077 Night Race',
    prompt: 'Ultra modern neon magenta, electric cyan aero elements, satin matte carbon chassis with quantum tech sponsor decals and glowing yellow halo.'
  },
  {
    title: 'John Player Special Gold & Black',
    prompt: 'Imperial 1970s Lotus homage: Deep piano black gloss finish with opulent metallic pearl gold pinstripes, gold rear wing DRS flap, and classic #12.'
  },
  {
    title: 'Gulf Racing Heritage 1970',
    prompt: 'Legendary Steve McQueen Le Mans tribute: Baby powder blue chassis with vibrant tangerine orange center stripe and navy blue floor.'
  },
  {
    title: 'Brawn GP 2009 Miracle',
    prompt: 'Jenson Button championship white body with high-visibility fluorescent lime green wing edges and Virgin red accents.'
  },
  {
    title: 'Martini Racing Tricolor',
    prompt: 'Timeless pure white chassis with red, sky blue, and navy blue aerodynamic speed lines across sidepods and rear wing.'
  }
];

export const AiLiveryModal: React.FC<AiLiveryModalProps> = ({
  isOpen,
  onClose,
  currentModelName,
  onApplyLivery,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/generate-livery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse,
          currentModelName,
        }),
      });

      const data = await response.json();
      if (data.success && data.livery) {
        setResult(data.livery);
      } else {
        setError(data.error || 'Could not generate livery. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection error while contacting AI Livery Generator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyLivery(result.colors, result.decals, result.boxTitle, result.boxSubtitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Gemini AI Livery Concept Studio
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-2xs border border-amber-500">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Design custom color schemes, liveries, and sponsors for {currentModelName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Prompt Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Describe your dream livery idea or racing theme:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Vintage 1970s Gulf blue and orange, modern Miami neon, or matte carbon stealth..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-2xs"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all shrink-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Livery</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Idea Presets */}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Or pick a legendary concept:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AI_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  onClick={() => {
                    setPrompt(preset.prompt);
                    handleGenerate(preset.prompt);
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all group shadow-2xs"
                >
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {preset.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Result Preview Box */}
          {result && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">
                    AI Generated Theme
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">{result.themeName}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black italic px-2 py-0.5 rounded bg-amber-400 text-slate-950 border border-amber-500">
                    #{result.decals?.racingNumber || '01'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 italic">
                "{result.conceptDescription}"
              </p>

              {/* Color Swatch Preview Strip */}
              <div>
                <span className="text-[11px] text-slate-600 font-bold block mb-1.5">
                  Generated Piece Color Scheme:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.colors || {}).map(([key, hex]: [string, any]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-[10px] text-slate-700 capitalize font-medium">{key}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decal Overview */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Sponsors:</span>
                <span className="bg-amber-100 px-2 py-0.5 rounded text-amber-900 font-bold">
                  {result.decals?.sponsorPrimary}
                </span>
                <span>•</span>
                <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-medium">
                  {result.decals?.sponsorSecondary}
                </span>
                <span>•</span>
                <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-medium">
                  {result.decals?.sponsorEngine}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!result}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs disabled:opacity-40 border border-amber-500 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Livery to 3D Model</span>
          </button>
        </div>
      </div>
    </div>
  );
};
