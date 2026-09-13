import React, { useState } from 'react';
import { X, Check, ShieldCheck, AlertTriangle, RefreshCw, Copy, FileCode, CheckCircle2 } from 'lucide-react';
import { parseLDrawDocument, LDrawParseDiagnostics } from '../utils/ldrawParser';
import { OFFICIAL_77242_LDR } from '../data/official77242Ldr';
import { LegoF1Set, CarPartColors } from '../types';

interface LdrIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSet: LegoF1Set;
  colors: CarPartColors;
  activeLdrContent: string;
  onApplyLdrContent: (ldrText: string) => void;
  diagnostics?: LDrawParseDiagnostics | null;
}

export const LdrIngestionModal: React.FC<LdrIngestionModalProps> = ({
  isOpen,
  onClose,
  currentSet,
  colors,
  activeLdrContent,
  onApplyLdrContent,
  diagnostics,
}) => {
  const [editorText, setEditorText] = useState(activeLdrContent || OFFICIAL_77242_LDR);
  const [copied, setCopied] = useState(false);
  const [localDiag, setLocalDiag] = useState<LDrawParseDiagnostics | null>(diagnostics || null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetToOfficial77242 = () => {
    setEditorText(OFFICIAL_77242_LDR);
    const parsed = parseLDrawDocument(OFFICIAL_77242_LDR, '77242', colors);
    setLocalDiag(parsed.diagnostics);
  };

  const handleApply = () => {
    const parsed = parseLDrawDocument(editorText, currentSet.articleNumber, colors);
    setLocalDiag(parsed.diagnostics);
    onApplyLdrContent(editorText);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
  };

  const activeDiagnostics = localDiag || diagnostics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm shadow-2xs">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  LDraw Parser & Officiell LDR-Ingestion Engine
                </h2>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> Bounding Box & Y-Inversion Aktiv
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Direkt ingestion av LDR/MPD-ritningar med automatisk sanitering av skenande koordinater och hjulgaranti.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Status Strip */}
        <div className="my-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Y-Axel Transform</div>
            <div className="text-slate-900 font-mono font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Y = -ldraw_y (Inverterad)
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Skenande Z-Plattor</div>
            <div className="text-slate-900 font-mono font-bold mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              {activeDiagnostics?.outOfBoundsStrippedCount || 0} Strippade (&gt;220 LDU)
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Bakvinge Endplates</div>
            <div className="text-slate-900 font-mono font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              Tile 2x4 (#87079) Slät
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Hjulmontering</div>
            <div className="text-slate-900 font-mono font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              4 Hjul Garanterade
            </div>
          </div>
        </div>

        {/* Notice of Sanitizer Warnings if any */}
        {activeDiagnostics && activeDiagnostics.warnings.length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Saniteringsrapport för LDR-modellen:</span>
            </div>
            {activeDiagnostics.warnings.map((w, idx) => (
              <div key={idx} className="text-amber-800 font-mono text-[11px] pl-5">
                • {w}
              </div>
            ))}
          </div>
        )}

        {/* LDR Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-1.5 text-xs text-slate-600 font-semibold">
            <span>Redigera eller klistra in LDR-källkod (Line type 1 part references):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetToOfficial77242}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Ladda Officiell 77242.ldr
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleCopy}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Kopierad!' : 'Kopiera LDR'}
              </button>
            </div>
          </div>

          <textarea
            value={editorText}
            onChange={(e) => setEditorText(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 p-3.5 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl border border-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none overflow-y-auto leading-relaxed"
            placeholder="Klistra in LDraw 77242.ldr innehåll här..."
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {appliedNotice ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> LDR-modellen har sanerats och renderas nu i 3D-visaren!
              </span>
            ) : (
              <span>Automatiska sanitizers appliceras vid parsning.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Stäng
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <FileCode className="w-4 h-4" />
              <span>Parsa & Applicera LDR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
