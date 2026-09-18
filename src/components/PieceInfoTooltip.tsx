// src/components/PieceInfoTooltip.tsx
import React, { useState } from 'react';
import { LDrawPartInstance } from '../data/ldrawModels';
import { getLegoPartImageUrl, getBrickLinkItemUrl, getRebrickablePartUrl } from '../data/partCatalog';
import { ExternalLink, X, Compass, Layers } from 'lucide-react';
import { PieceHeightControl } from './PieceHeightControl';

interface PieceInfoTooltipProps {
  selectedPiece: LDrawPartInstance | null;
  onUpdateHeight?: (instanceId: string, newY: number) => void;
  onClose?: () => void;
}

export const PieceInfoTooltip: React.FC<PieceInfoTooltipProps> = ({
  selectedPiece,
  onUpdateHeight,
  onClose,
}) => {
  const [showHeightPanel, setShowHeightPanel] = useState(true);

  if (!selectedPiece) return null;

  const bricklinkImgUrl = getLegoPartImageUrl(selectedPiece.designId);
  const bricklinkPageUrl = getBrickLinkItemUrl(selectedPiece.designId);
  const rebrickablePageUrl = getRebrickablePartUrl(selectedPiece.designId);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 w-80 max-w-[calc(100vw-3rem)]">
      <div className="flex items-center gap-3">
        {/* Klossbild från BrickLink */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 p-1.5">
          <img
            src={bricklinkImgUrl}
            alt={selectedPiece.pieceName}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {/* Färgindikator-plupp */}
          <span
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 shadow-sm"
            style={{ backgroundColor: selectedPiece.colorHex || '#C91A09' }}
            title={`Färgkod: ${selectedPiece.colorCode}`}
          />
        </div>

        {/* Textinformation & Artikelnummer */}
        <div className="flex flex-col flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-black tracking-wider text-red-400">
              ITEM #{selectedPiece.designId}
            </span>
            {selectedPiece.elementId && (
              <span className="font-mono text-[10px] text-zinc-400">
                ({selectedPiece.elementId})
              </span>
            )}
          </div>

          <div className="text-xs font-bold text-zinc-100 truncate">
            {selectedPiece.pieceName}
          </div>

          <div className="flex items-center gap-2 pt-0.5 text-[10px] text-zinc-400 font-mono">
            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-sans font-medium text-zinc-300">
              {selectedPiece.subAssembly || selectedPiece.partKey}
            </span>
            <span>
              X:{selectedPiece.x.toFixed(0)} Y:{selectedPiece.y.toFixed(0)} Z:{selectedPiece.z.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Knappar för höjdkontroll-toggle och stäng */}
        <div className="flex items-center gap-1 self-start">
          {onUpdateHeight && (
            <button
              onClick={() => setShowHeightPanel((prev) => !prev)}
              className={`rounded-md p-1 transition cursor-pointer ${
                showHeightPanel
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Växla höjdjusteringspanel"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              aria-label="Stäng ruta"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Höjdjustering med LEGO-steg (Kloss/Platta) */}
      {onUpdateHeight && showHeightPanel && (
        <PieceHeightControl
          selectedPiece={selectedPiece}
          onUpdateHeight={onUpdateHeight}
        />
      )}

      {/* Externa verifieringsknappar: BrickLink & Rebrickable */}
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80 text-[11px]">
        <a
          href={bricklinkPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition"
          title="Öppna klossens officiella katalogblad på BrickLink"
        >
          <ExternalLink className="w-3 h-3 text-amber-400" />
          <span>BrickLink</span>
        </a>
        <a
          href={rebrickablePageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition"
          title="Öppna specifikation och alternativa färger på Rebrickable"
        >
          <Compass className="w-3 h-3 text-emerald-400" />
          <span>Rebrickable</span>
        </a>
      </div>
    </div>
  );
};
