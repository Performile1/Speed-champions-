import React, { useState, useEffect } from 'react';
import { CarPartColors, CarPartKey, CustomPieceOverrides } from '../types';
import { LDrawPartInstance } from '../data/ldrawModels';
import { LEGO_COLORS, TIRE_COMPOUNDS, findLegoColorName } from '../data/legoColors';
import { PART_LABELS } from '../data/legoSets';
import {
  Palette,
  RefreshCw,
  Paintbrush,
  Box,
  Layers,
  Sparkles,
  RotateCcw,
  X,
  MousePointerClick,
  SlidersHorizontal,
} from 'lucide-react';

export interface ColorCustomizerProps {
  colors: CarPartColors;
  selectedPart: CarPartKey;
  onSelectPart: (part: CarPartKey) => void;
  onUpdateColor: (part: CarPartKey, colorHex: string) => void;
  onApplyAllAero: (colorHex: string) => void;
  onResetFactoryColors: () => void;
  // Instance-based brick color overrides & selection
  selectedInstanceId?: string | null;
  selectedInstance?: LDrawPartInstance | null;
  customBrickColors?: CustomPieceOverrides;
  onUpdateIndividualBrickColor?: (instanceId: string, colorHex: string) => void;
  onResetIndividualBrickColor?: (instanceId: string) => void;
  onResetAllBrickOverrides?: () => void;
  onSelectInstanceId?: (id: string | null) => void;
}

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  colors,
  selectedPart,
  onSelectPart,
  onUpdateColor,
  onApplyAllAero,
  onResetFactoryColors,
  selectedInstanceId,
  selectedInstance,
  customBrickColors = {},
  onUpdateIndividualBrickColor,
  onResetIndividualBrickColor,
  onResetAllBrickOverrides,
  onSelectInstanceId,
}) => {
  // Paint mode: 'single' (paint only the selected individual brick) vs 'section' (paint entire assembly)
  const [paintMode, setPaintMode] = useState<'single' | 'section'>(() =>
    selectedInstanceId ? 'single' : 'single'
  );

  // When a piece is clicked on the 3D car, automatically switch to 'single' piece mode so the user can paint it directly
  useEffect(() => {
    if (selectedInstanceId) {
      setPaintMode('single');
    }
  }, [selectedInstanceId]);

  const currentPartLabel = PART_LABELS[selectedPart] || { label: selectedPart, description: '' };
  const partKeys = Object.keys(PART_LABELS) as CarPartKey[];

  // Determine current active color based on mode
  const activeBrickCustomHex = selectedInstanceId ? customBrickColors[selectedInstanceId] : undefined;
  const sectionHex = colors[selectedPart] || '#C91A09';
  const effectiveSingleHex = activeBrickCustomHex || (selectedInstance ? colors[selectedInstance.partKey] || selectedInstance.colorHex : sectionHex);
  const currentHex = paintMode === 'single' && selectedInstance ? effectiveSingleHex : sectionHex;
  const currentLegoColorName = findLegoColorName(currentHex);

  // Active overrides count
  const overrideEntries = Object.entries(customBrickColors) as [string, string][];
  const activeOverridesCount = overrideEntries.length;

  const handleColorClick = (hex: string) => {
    if (paintMode === 'single' && selectedInstance && onUpdateIndividualBrickColor) {
      // 1. SPECIFIK KLOSSFÄRG: Måla BARA denna instans
      onUpdateIndividualBrickColor(selectedInstance.id, hex);
    } else {
      // 2. KATEGORIFÄRG: Måla hela överordnade sektionen
      onUpdateColor(selectedPart, hex);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      {/* 1. TOP HEADER & FACTORY RESET */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Färgläggare & Livery
            </h2>
            <p className="text-[11px] text-slate-500">
              Välj om du vill måla enskilda klossar eller hela sektioner
            </p>
          </div>
        </div>
        <button
          onClick={onResetFactoryColors}
          className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors font-medium cursor-pointer"
          title="Återställ till fabriksfärger för setet"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Återställ</span>
        </button>
      </div>

      {/* 2. MODE SWITCH: ENSKILD KLOSS vs HELA SEKTIONEN */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setPaintMode('single')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            paintMode === 'single'
              ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Box className={`w-3.5 h-3.5 ${paintMode === 'single' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>Enskild kloss</span>
          {activeBrickCustomHex && (
            <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        <button
          onClick={() => setPaintMode('section')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            paintMode === 'section'
              ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${paintMode === 'section' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>Hela sektionen</span>
        </button>
      </div>

      {/* 3. ACTIVE CONTEXT BANNER */}
      {paintMode === 'single' ? (
        /* SINGLE BRICK CONTEXT */
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5">
          {selectedInstance ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Box className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">#{selectedInstance.designId} {selectedInstance.pieceName}</span>
                </div>
                {activeBrickCustomHex ? (
                  <button
                    onClick={() => onResetIndividualBrickColor?.(selectedInstance.id)}
                    className="text-[10px] font-bold text-amber-800 hover:text-red-700 bg-white px-2 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Ta bort egen klossfärg och följ sektionens färg"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Återställ kloss</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-white/70 px-2 py-0.5 rounded-lg border border-slate-200">
                    Följer sektion
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1 font-mono">
                <span>Zon: <strong className="font-sans text-slate-800">{selectedInstance.subAssembly || PART_LABELS[selectedInstance.partKey]?.label}</strong></span>
                <span>Z: {Math.round(selectedInstance.z)} LDU</span>
              </div>

              <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Aktuell färg: <strong className="text-slate-900">{currentLegoColorName}</strong>
                </span>
                <div
                  className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: effectiveSingleHex }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 py-1 text-xs text-amber-900">
              <MousePointerClick className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Klicka på valfri kloss på 3D-bilen</p>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Då kan du ändra färg på precis den biten oberoende av resten av karossen.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ENTIRE SECTION CONTEXT */
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">
            Välj sektion att färglägga:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {partKeys.map((key) => {
              const isSelected = selectedPart === key;
              const partColor = colors[key];

              return (
                <button
                  key={key}
                  onClick={() => onSelectPart(key)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                    style={{ backgroundColor: partColor }}
                  />
                  <span className={`text-[11px] truncate ${isSelected ? 'font-bold text-amber-950' : 'font-medium text-slate-700'}`}>
                    {PART_LABELS[key]?.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-3 shadow-2xs mt-2.5">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Aktiv Sektion</div>
              <div className="text-xs font-bold text-slate-900">{currentPartLabel.label}</div>
              <div className="text-[11px] text-amber-700 font-semibold">{currentLegoColorName}</div>
            </div>

            {/* Quick Paint-All Aero Button */}
            {selectedPart !== 'tireCompound' && (
              <button
                onClick={() => onApplyAllAero(sectionHex)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-400 hover:text-slate-950 border border-slate-300 text-xs text-slate-700 font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
                title="Applicera denna färg på alla aerodynamiska paneler"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Måla all kaross</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. COLOR PALETTE SWATCHES */}
      {selectedPart === 'tireCompound' && paintMode === 'section' ? (
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">
            Pirelli F1 Däckblandningar:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIRE_COMPOUNDS.map((compound) => {
              const isSelected = currentHex.toLowerCase() === compound.color.toLowerCase();
              return (
                <button
                  key={compound.name}
                  onClick={() => onUpdateColor('tireCompound', compound.color)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                    style={{ backgroundColor: compound.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{compound.name}</div>
                    <div className="text-[11px] text-slate-500">{compound.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              Officiella LEGO ABS-Färger:
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-hex-input" className="text-[11px] font-semibold text-slate-600">
                Egen Hex:
              </label>
              <input
                id="custom-hex-input"
                type="color"
                value={currentHex}
                onChange={(e) => handleColorClick(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-slate-300 bg-white"
                title="Välj anpassad hex-färg"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
            {LEGO_COLORS.map((legoColor) => {
              const isSelected = currentHex.toLowerCase() === legoColor.hex.toLowerCase();

              return (
                <button
                  key={legoColor.id}
                  onClick={() => handleColorClick(legoColor.hex)}
                  title={`${legoColor.name} (#${legoColor.id})`}
                  className={`group relative flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-xs scale-105'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:scale-102'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg border border-slate-300 shadow-inner"
                    style={{ backgroundColor: legoColor.hex }}
                  />
                  <span className="text-[9px] font-medium text-slate-600 mt-1 truncate w-full text-center">
                    {legoColor.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ACTIVE PIECE OVERRIDES SUMMARY (Instansbaserade överstyrningar) */}
      {activeOverridesCount > 0 && (
        <div className="pt-3 border-t border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Anpassade klossfärger ({activeOverridesCount})</span>
            </span>
            {onResetAllBrickOverrides && (
              <button
                onClick={onResetAllBrickOverrides}
                className="text-[10px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Återställ alla anpassade klossar till sektionsfärgerna"
              >
                Rensa alla
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {overrideEntries.map(([instanceId, hex]) => {
              const isCurrent = selectedInstanceId === instanceId;
              const colorName = findLegoColorName(hex);

              return (
                <div
                  key={instanceId}
                  onClick={() => onSelectInstanceId?.(instanceId)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-amber-50 border-amber-400 font-bold text-amber-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={`Klicka för att välja kloss ${instanceId}`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-slate-300"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="truncate max-w-[100px] font-mono text-[10px]">
                    {instanceId.replace('ldr-77242-', '')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetIndividualBrickColor?.(instanceId);
                    }}
                    className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                    title="Återställ denna kloss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
