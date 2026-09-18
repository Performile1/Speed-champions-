// src/components/PartSwapModal.tsx
import React, { useState } from 'react';
import { PART_SWAP_CATALOG, SwapCandidate, getLegoPartImageUrl } from '../data/partCatalog';
import { LDrawPartInstance } from '../data/ldrawModels';
import { X, ArrowLeftRight, Layers, Box, Check, Sparkles } from 'lucide-react';

export interface PartSwapModalProps {
  selectedPart: LDrawPartInstance | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSwap: (instanceId: string, newDesignId: string, newName: string) => void;
}

export const PartSwapModal: React.FC<PartSwapModalProps> = ({
  selectedPart,
  isOpen,
  onClose,
  onSelectSwap,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');

  if (!isOpen || !selectedPart) return null;

  // Hämta kategori eller fallback
  const defaultCategoryKey = selectedPart.partKey || 'engineCover';
  const availableSwaps: SwapCandidate[] =
    activeCategory === 'all'
      ? (PART_SWAP_CATALOG[defaultCategoryKey] || PART_SWAP_CATALOG['engineCover'])
      : (PART_SWAP_CATALOG[activeCategory] || PART_SWAP_CATALOG['engineCover']);

  const currentImgUrl = getLegoPartImageUrl(selectedPart.designId);
  const allCategories = Object.keys(PART_SWAP_CATALOG);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4 sm:p-5 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Ersätt LEGO-del (Part Swap Mode)
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </h2>
              <p className="text-xs text-zinc-400">
                Klicka på den del du vill byta till för att uppdatera 3D-modellen direkt.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nuvarande del */}
        <div className="bg-zinc-950/80 p-4 border-b border-zinc-800 flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center p-2 shrink-0">
            <img
              src={currentImgUrl}
              alt={selectedPart.pieceName}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-950/50 border border-red-800/60 px-2 py-0.5 rounded-md">
                Nuvarande kloss
              </span>
              <span className="text-xs text-zinc-400 font-mono truncate">
                Zon: {selectedPart.subAssembly || selectedPart.partKey}
              </span>
            </div>
            <div className="text-sm font-bold text-white truncate mt-1">
              {selectedPart.pieceName} <span className="text-zinc-400 font-normal">#{selectedPart.designId}</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
              LDraw Position: X={selectedPart.x.toFixed(0)} Y={selectedPart.y.toFixed(0)} Z={selectedPart.z.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Kategori-tabs */}
        <div className="px-4 py-2 bg-zinc-950/50 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-zinc-500 text-[11px] font-semibold mr-1">Kategori:</span>
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-red-600 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Matchad ({defaultCategoryKey})
          </button>
          {allCategories.map((catKey) => (
            <button
              key={catKey}
              onClick={() => setActiveCategory(catKey)}
              className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer shrink-0 capitalize ${
                activeCategory === catKey
                  ? 'bg-red-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {catKey.replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>

        {/* Galleri med alternativ */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              Tillgängliga ersättningsdelar:
            </h3>
            <span className="text-[11px] text-zinc-500">
              CDN: BrickLink Official
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {availableSwaps.map((item) => {
              const imgUrl = getLegoPartImageUrl(item.designId);
              const isCurrent = item.designId === selectedPart.designId;

              return (
                <button
                  key={item.designId}
                  disabled={isCurrent}
                  onClick={() => {
                    onSelectSwap(selectedPart.id, item.designId, item.name);
                    onClose();
                  }}
                  className={`group flex flex-col items-center text-center p-3 rounded-2xl border transition text-left relative ${
                    isCurrent
                      ? 'border-red-600/40 bg-red-950/20 opacity-60 cursor-not-allowed'
                      : 'border-zinc-800 bg-zinc-950 hover:border-red-500 hover:bg-zinc-800/80 cursor-pointer shadow-sm hover:shadow-md'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5" /> Aktiv
                    </span>
                  )}
                  <div className="w-20 h-20 bg-zinc-900 rounded-xl p-2 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                    <img
                      src={imgUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.3';
                      }}
                    />
                  </div>
                  <div className="text-xs font-bold text-zinc-100 group-hover:text-red-400 transition truncate w-full">
                    #{item.designId}
                  </div>
                  <div className="text-[11px] text-zinc-300 font-medium truncate w-full">{item.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2 w-full">{item.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
