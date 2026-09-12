import React, { useState } from 'react';
import { LiveryTemplateKey, CarPartColors, CarDecals } from '../types';
import { LIVERY_TEMPLATES, LiveryTemplateDefinition } from '../data/legoDecalBlueprints';
import { LEGO_COLORS, findLegoColorName } from '../data/legoColors';
import { Sparkles, Palette, Check, RefreshCw } from 'lucide-react';

interface LiveryTemplatesSelectorProps {
  currentColors: CarPartColors;
  decals: CarDecals;
  onApplyLiveryColors: (colors: Partial<CarPartColors>, templateKey: LiveryTemplateKey) => void;
  onUpdateDecals: (updated: Partial<CarDecals>) => void;
}

export const LiveryTemplatesSelector: React.FC<LiveryTemplatesSelectorProps> = ({
  currentColors,
  decals,
  onApplyLiveryColors,
  onUpdateDecals,
}) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<LiveryTemplateKey>(
    decals.selectedLiveryTemplate || 'downwash-slash'
  );

  const activeTemplate =
    LIVERY_TEMPLATES.find((t) => t.id === selectedTemplateKey) || LIVERY_TEMPLATES[0];

  const [colorPrimary, setColorPrimary] = useState<string>(
    decals.liveryColorPrimary || activeTemplate.defaultColors.primary
  );
  const [colorSecondary, setColorSecondary] = useState<string>(
    decals.liveryColorSecondary || activeTemplate.defaultColors.secondary
  );
  const [colorAccent, setColorAccent] = useState<string>(
    decals.liveryColorAccent || activeTemplate.defaultColors.accent
  );

  // Apply template with current colors
  const handleApply = (
    template: LiveryTemplateDefinition,
    p: string,
    s: string,
    a: string
  ) => {
    setSelectedTemplateKey(template.id);
    const newColors = template.applyToCar(p, s, a);
    onApplyLiveryColors(newColors, template.id);
    onUpdateDecals({
      selectedLiveryTemplate: template.id,
      liveryColorPrimary: p,
      liveryColorSecondary: s,
      liveryColorAccent: a,
      accentStripeColor: a,
    });
  };

  // Switch template
  const handleSelectTemplate = (template: LiveryTemplateDefinition) => {
    setSelectedTemplateKey(template.id);
    setColorPrimary(template.defaultColors.primary);
    setColorSecondary(template.defaultColors.secondary);
    setColorAccent(template.defaultColors.accent);
    handleApply(
      template,
      template.defaultColors.primary,
      template.defaultColors.secondary,
      template.defaultColors.accent
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Förbyggda Racerbils-Liverys (Livery Templates)
          </h3>
          <p className="text-xs text-slate-500">
            Välj ett klassiskt eller modernt aerodynamiskt färgmönster och anpassa färgerna.
          </p>
        </div>
      </div>

      {/* Templates Horizontal Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {LIVERY_TEMPLATES.map((tmpl) => {
          const isSelected = tmpl.id === selectedTemplateKey;
          return (
            <button
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/40 shadow-sm ring-2 ring-amber-400/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Color Bar Preview */}
              <div className="h-4 rounded-md mb-2 flex overflow-hidden border border-slate-200/60 shadow-xs">
                <div className="w-1/2 h-full" style={{ backgroundColor: tmpl.defaultColors.primary }} />
                <div className="w-1/3 h-full" style={{ backgroundColor: tmpl.defaultColors.secondary }} />
                <div className="w-1/6 h-full" style={{ backgroundColor: tmpl.defaultColors.accent }} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{tmpl.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 font-bold" />}
                </div>
                <div className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                  {tmpl.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tri-Color Palette Customizer for Active Livery */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Anpassa Livery-Palett för {activeTemplate.name}
          </span>
          <button
            onClick={() =>
              handleSelectTemplate(activeTemplate)
            }
            className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Fabriksfärger
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Color A: Primary */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              Färg A (Huvudkaross):
            </span>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={colorPrimary}
                onChange={(e) => {
                  setColorPrimary(e.target.value);
                  handleApply(activeTemplate, e.target.value, colorSecondary, colorAccent);
                }}
                className="w-7 h-7 rounded-md border border-slate-200 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 truncate">
                {findLegoColorName(colorPrimary)}
              </span>
            </div>
            {/* Quick swatches */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {LEGO_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setColorPrimary(c.hex);
                    handleApply(activeTemplate, c.hex, colorSecondary, colorAccent);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-300 shrink-0 cursor-pointer"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Color B: Secondary */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              Färg B (Kontrast & Vingar):
            </span>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={colorSecondary}
                onChange={(e) => {
                  setColorSecondary(e.target.value);
                  handleApply(activeTemplate, colorPrimary, e.target.value, colorAccent);
                }}
                className="w-7 h-7 rounded-md border border-slate-200 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 truncate">
                {findLegoColorName(colorSecondary)}
              </span>
            </div>
            {/* Quick swatches */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {LEGO_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setColorSecondary(c.hex);
                    handleApply(activeTemplate, colorPrimary, c.hex, colorAccent);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-300 shrink-0 cursor-pointer"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Color C: Accent */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              Färg C (Aero / Fartrand):
            </span>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={colorAccent}
                onChange={(e) => {
                  setColorAccent(e.target.value);
                  handleApply(activeTemplate, colorPrimary, colorSecondary, e.target.value);
                }}
                className="w-7 h-7 rounded-md border border-slate-200 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 truncate">
                {findLegoColorName(colorAccent)}
              </span>
            </div>
            {/* Quick swatches */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {LEGO_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setColorAccent(c.hex);
                    handleApply(activeTemplate, colorPrimary, colorSecondary, c.hex);
                  }}
                  className="w-5 h-5 rounded-full border border-slate-300 shrink-0 cursor-pointer"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
