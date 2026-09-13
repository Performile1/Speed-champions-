import React, { useState } from 'react';
import { LDrawPartInstance } from '../data/ldrawModels';
import {
  getCompatibleAlternatives,
  ModularPartOption,
} from '../data/modularPartOptions';
import { LEGO_COLORS } from '../data/legoColors';
import { X, ArrowLeftRight, Check, Sparkles, Wind, Gauge, Palette } from 'lucide-react';

interface ModularPartSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: LDrawPartInstance | null;
  currentColorHex: string;
  onSwapPart: (
    instanceId: string,
    newDesignId: string,
    newElementId: string,
    newPieceName: string,
    category: string
  ) => void;
  onRecolorPart?: (instanceId: string, hex: string) => void;
}

export const ModularPartSwapModal: React.FC<ModularPartSwapModalProps> = ({
  isOpen,
  onClose,
  instance,
  currentColorHex,
  onSwapPart,
  onRecolorPart,
}) => {
  if (!isOpen || !instance) return null;

  const alternatives = getCompatibleAlternatives(instance.designId, instance.partKey);
  const [selectedHex, setSelectedHex] = useState(currentColorHex || instance.colorHex);
  const [activeTab, setActiveTab] = useState<'swap' | 'recolor'>('swap');

  const handleApplySwap = (option: ModularPartOption) => {
    onSwapPart(
      instance.id,
      option.designId,
      option.elementId,
      option.name,
      option.category
    );
    if (onRecolorPart && selectedHex !== instance.colorHex) {
      onRecolorPart(instance.id, selectedHex);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Modular Part Swapper
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  #{instance.designId}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Swap shape or configure {instance.pieceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Part Snapshot Bar */}
        <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs shrink-0"
              style={{ backgroundColor: selectedHex }}
            />
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                {instance.pieceName}
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Art. #{instance.elementId} • LDraw #{instance.designId}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('swap')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'swap'
                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alternative Shapes
            </button>
            <button
              onClick={() => setActiveTab('recolor')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'recolor'
                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recolor Brick
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'swap' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Compatible Aerodynamic & Structural Replacements:
              </div>

              {alternatives.map((opt) => {
                const isCurrent = opt.designId === instance.designId;

                return (
                  <div
                    key={opt.designId}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 text-xs">
                            {opt.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            #{opt.designId}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                          {opt.description}
                        </p>

                        {(opt.downforceImpact || opt.dragImpact) && (
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                            {opt.downforceImpact && (
                              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                                <Wind className="w-3 h-3" />
                                {opt.downforceImpact}
                              </span>
                            )}
                            {opt.dragImpact && (
                              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                                <Gauge className="w-3 h-3" />
                                {opt.dragImpact}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleApplySwap(opt)}
                        disabled={isCurrent}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs hover:shadow'
                        }`}
                      >
                        {isCurrent ? 'Mounted' : 'Swap Part'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'recolor' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Official LEGO Color for this Piece:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LEGO_COLORS.map((col) => {
                  const isSelected = selectedHex.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.id}
                      onClick={() => {
                        setSelectedHex(col.hex);
                        if (onRecolorPart) {
                          onRecolorPart(instance.id, col.hex);
                        }
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-amber-400 bg-amber-50/50 shadow-xs ring-1 ring-amber-400'
                          : 'border-slate-200 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-lg border border-slate-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {col.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {col.hex}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Element #{instance.elementId} • Step {instance.stepNumber}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
