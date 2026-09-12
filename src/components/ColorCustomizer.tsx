import React from 'react';
import { CarPartColors, CarPartKey } from '../types';
import { LEGO_COLORS, TIRE_COMPOUNDS, findLegoColorName } from '../data/legoColors';
import { PART_LABELS } from '../data/legoSets';
import { Palette, RefreshCw, Paintbrush } from 'lucide-react';

interface ColorCustomizerProps {
  colors: CarPartColors;
  selectedPart: CarPartKey;
  onSelectPart: (part: CarPartKey) => void;
  onUpdateColor: (part: CarPartKey, colorHex: string) => void;
  onApplyAllAero: (colorHex: string) => void;
  onResetFactoryColors: () => void;
}

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  colors,
  selectedPart,
  onSelectPart,
  onUpdateColor,
  onApplyAllAero,
  onResetFactoryColors,
}) => {
  const currentPartLabel = PART_LABELS[selectedPart] || { label: selectedPart, description: '' };
  const currentHex = colors[selectedPart];
  const currentLegoColorName = findLegoColorName(currentHex);

  const partKeys = Object.keys(PART_LABELS) as CarPartKey[];

  return (
    <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
            Individual Piece Colorizer
          </h2>
        </div>
        <button
          onClick={onResetFactoryColors}
          className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 transition-colors font-medium"
          title="Reset to factory Lego set colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Factory Reset</span>
        </button>
      </div>

      {/* 1. Part Selector Grid */}
      <div>
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">
          Select Element to Paint (or click on 3D car):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
          {partKeys.map((key) => {
            const isSelected = selectedPart === key;
            const partColor = colors[key];

            return (
              <button
                key={key}
                onClick={() => onSelectPart(key)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-amber-50/90 border-amber-500 ring-1 ring-amber-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-xs"
                  style={{ backgroundColor: partColor }}
                />
                <span className={`text-xs truncate ${isSelected ? 'font-bold text-amber-950' : 'font-medium text-slate-700'}`}>
                  {PART_LABELS[key]?.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Selected Part Details */}
      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Currently Editing</div>
          <div className="text-sm font-bold text-slate-900">{currentPartLabel.label}</div>
          <div className="text-xs text-amber-600 font-semibold">{currentLegoColorName}</div>
        </div>

        {/* Quick Paint-All Aero Button */}
        {selectedPart !== 'tireCompound' && (
          <button
            onClick={() => onApplyAllAero(currentHex)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-400 hover:text-slate-950 border border-slate-300 text-xs text-slate-700 font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            title="Paint all aerodynamic panels this color"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Paint All Bodywork</span>
          </button>
        )}
      </div>

      {/* 3. Color Swatches (Official LEGO Palette or Pirelli Compounds if tire) */}
      {selectedPart === 'tireCompound' ? (
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2 block">
            Pirelli F1 Slick & Wet Compounds:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIRE_COMPOUNDS.map((compound) => {
              const isSelected = currentHex.toLowerCase() === compound.color.toLowerCase();
              return (
                <button
                  key={compound.name}
                  onClick={() => onUpdateColor('tireCompound', compound.color)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-xs"
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
              Official LEGO ABS Plastic Swatches:
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-hex-input" className="text-[11px] font-semibold text-slate-600">Custom Hex:</label>
              <input
                id="custom-hex-input"
                type="color"
                value={currentHex}
                onChange={(e) => onUpdateColor(selectedPart, e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-slate-300 bg-white"
                title="Choose custom color"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2 max-h-40 overflow-y-auto pr-1">
            {LEGO_COLORS.map((legoColor) => {
              const isSelected = currentHex.toLowerCase() === legoColor.hex.toLowerCase();

              return (
                <button
                  key={legoColor.id}
                  onClick={() => onUpdateColor(selectedPart, legoColor.hex)}
                  title={`${legoColor.name} (#${legoColor.id})`}
                  className={`group relative flex flex-col items-center p-1.5 rounded-xl border transition-all ${
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
                    #{legoColor.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
