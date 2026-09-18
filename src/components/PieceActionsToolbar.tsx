// src/components/PieceActionsToolbar.tsx
import React from 'react';
import { LDrawPartInstance } from '../data/ldrawModels';
import { getLegoPartImageUrl } from '../data/partCatalog';
import { ArrowLeftRight, RotateCw, Trash2, Undo2, X, ArrowUp, ArrowDown } from 'lucide-react';

interface PieceActionsToolbarProps {
  selectedPiece: LDrawPartInstance | null;
  onDelete: (id: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onOpenSwapModal: () => void;
  onRotate?: (axis: 'x' | 'y' | 'z', clockwise?: boolean) => void;
  onHeightStep?: (lduDelta: number) => void;
  onDeselect?: () => void;
}

export const PieceActionsToolbar: React.FC<PieceActionsToolbarProps> = ({
  selectedPiece,
  onDelete,
  onUndo,
  canUndo,
  onOpenSwapModal,
  onRotate,
  onHeightStep,
  onDeselect,
}) => {
  if (!selectedPiece && !canUndo) return null;

  const imgUrl = selectedPiece ? getLegoPartImageUrl(selectedPiece.designId) : '';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl bg-zinc-950/92 border border-zinc-700/80 p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
      {selectedPiece && (
        <>
          {/* Delinfo & Bild */}
          <div className="flex items-center gap-2.5 px-2 border-r border-zinc-800">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center shrink-0">
              <img
                src={imgUrl}
                alt={selectedPiece.pieceName}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                #{selectedPiece.designId}
              </div>
              <div className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                {selectedPiece.subAssembly || selectedPiece.partKey}
              </div>
            </div>
          </div>

          {/* Byt del */}
          <button
            onClick={onOpenSwapModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/90 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm"
            title="Ersätt delen med en annan från katalogen"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Byt ut</span>
          </button>

          {/* Rotera Y (90°) */}
          {onRotate && (
            <button
              onClick={() => onRotate('y', true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
              title="Rotera 90° i planet (Kortkommando: R)"
            >
              <RotateCw className="w-3.5 h-3.5 text-red-400" />
              <span>90° Horisontell</span>
            </button>
          )}

          {/* Rotera X (90°) */}
          {onRotate && (
            <button
              onClick={() => onRotate('x', true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
              title="Rotera 90° vertikalt (Kortkommando: Shift + R)"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400 rotate-90" />
              <span>90° Vertikal</span>
            </button>
          )}

          {/* Snabb höjdjustering */}
          {onHeightStep && (
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-1.5">
              <button
                onClick={() => onHeightStep(-8)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold transition cursor-pointer"
                title="Höj med 1 platta (8 LDU) [Tangent: E eller Shift+PilUpp]"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>+1 Platta</span>
              </button>
              <button
                onClick={() => onHeightStep(8)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-400 text-xs font-semibold transition cursor-pointer"
                title="Sänk med 1 platta (8 LDU) [Tangent: Q eller Shift+PilNed]"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>-1 Platta</span>
              </button>
            </div>
          )}

          {/* Radera vald bit */}
          <button
            onClick={() => onDelete(selectedPiece.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 hover:border-transparent text-xs font-semibold transition cursor-pointer"
            title="Kortkommando: Delete eller Backspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Radera</span>
          </button>
        </>
      )}

      {/* Ångra-knapp */}
      {canUndo && (
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold transition cursor-pointer"
          title="Ångra senaste raderingen (Kortkommando: Ctrl + Z)"
        >
          <Undo2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Ångra</span>
        </button>
      )}

      {/* Avmarkera */}
      {selectedPiece && onDeselect && (
        <button
          onClick={onDeselect}
          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer ml-1"
          title="Avmarkera kloss (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
