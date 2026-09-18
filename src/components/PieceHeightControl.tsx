// src/components/PieceHeightControl.tsx
import React from 'react';
import { LDrawPartInstance } from '../data/ldrawModels';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PieceHeightControlProps {
  selectedPiece: LDrawPartInstance | null;
  onUpdateHeight: (instanceId: string, newY: number) => void;
}

export const PieceHeightControl: React.FC<PieceHeightControlProps> = ({
  selectedPiece,
  onUpdateHeight,
}) => {
  if (!selectedPiece) return null;

  // Räkna ut höjden i antal plattor relativt marken (Y = 0 är golvnivå)
  const currentY = selectedPiece.y;
  const platesFromGround = Math.round(Math.abs(currentY) / 8);

  const handleStep = (lduDelta: number) => {
    // Minus i Y flyttar biten UPPÅT i LDraw (-Y = uppåt)
    onUpdateHeight(selectedPiece.id, currentY + lduDelta);
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-900/90 border border-zinc-800 p-2.5 text-white">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-zinc-300">Höjdjustering (Y-axel)</span>
        <span className="font-mono text-[11px] text-amber-400">
          Y: {currentY.toFixed(1)} LDU (~{platesFromGround} plattor)
        </span>
      </div>

      {/* Stegknappar för exakta LEGO-steg */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => handleStep(-24)}
          title="Höj med 1 hel kloss (24 LDU, tangent: Shift+E)"
          className="flex flex-col items-center justify-center rounded-lg bg-zinc-800 p-1.5 hover:bg-zinc-700 active:scale-95 transition text-center cursor-pointer"
        >
          <div className="flex items-center text-xs font-bold text-emerald-400">
            <ArrowUp className="w-3.5 h-3.5 -mr-1.5" />
            <ArrowUp className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] text-zinc-300 font-medium">+1 Kloss</span>
        </button>

        <button
          onClick={() => handleStep(-8)}
          title="Höj med 1 platta (8 LDU, tangent: E eller Shift+PilUpp)"
          className="flex flex-col items-center justify-center rounded-lg bg-zinc-800 p-1.5 hover:bg-zinc-700 active:scale-95 transition text-center cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[9px] text-zinc-300 font-medium">+1 Platta</span>
        </button>

        <button
          onClick={() => handleStep(8)}
          title="Sänk med 1 platta (8 LDU, tangent: Q eller Shift+PilNed)"
          className="flex flex-col items-center justify-center rounded-lg bg-zinc-800 p-1.5 hover:bg-zinc-700 active:scale-95 transition text-center cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[9px] text-zinc-300 font-medium">-1 Platta</span>
        </button>

        <button
          onClick={() => handleStep(24)}
          title="Sänk med 1 hel kloss (24 LDU, tangent: Shift+Q)"
          className="flex flex-col items-center justify-center rounded-lg bg-zinc-800 p-1.5 hover:bg-zinc-700 active:scale-95 transition text-center cursor-pointer"
        >
          <div className="flex items-center text-xs font-bold text-red-400">
            <ArrowDown className="w-3.5 h-3.5 -mr-1.5" />
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] text-zinc-300 font-medium">-1 Kloss</span>
        </button>
      </div>

      {/* Slider för steglös/snabb scrubbing */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] text-zinc-500 font-mono">-72</span>
        <input
          type="range"
          min={-72}
          max={0}
          step={8} // Snappar automatiskt till hela plattor (8 LDU)
          value={currentY}
          onChange={(e) => onUpdateHeight(selectedPiece.id, parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <span className="text-[10px] text-zinc-500 font-mono">0</span>
      </div>
    </div>
  );
};
