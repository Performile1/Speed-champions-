import React, { useRef, useState } from 'react';
import { CarDecals, LegoF1Set, CarPartKey, DecalPlacementKey, CarPartColors, LiveryTemplateKey } from '../types';
import {
  PRESET_SPONSOR_LOGOS,
  PresetSponsorLogo,
  getPresetSponsorDataUrl,
} from '../data/legoDecalBlueprints';
import { LiveryTemplatesSelector } from './LiveryTemplatesSelector';
import { OfficialDecalSheetEditor } from './OfficialDecalSheetEditor';
import { LegoPartInspector } from './LegoPartInspector';
import {
  Tag,
  Upload,
  Image as ImageIcon,
  Sliders,
  RotateCw,
  Move,
  Maximize2,
  Minimize2,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileDown,
  Sparkles,
  Palette,
  Hash,
  Copy,
} from 'lucide-react';

interface DecalCustomizerProps {
  decals: CarDecals;
  currentSet: LegoF1Set;
  currentColors: CarPartColors;
  onUpdateDecals: (updated: Partial<CarDecals>) => void;
  onApplyLiveryColors: (colors: Partial<CarPartColors>, templateKey: LiveryTemplateKey) => void;
  selectedPart: CarPartKey;
  onSelectPart: (part: CarPartKey) => void;
}

const PLACEMENT_OPTIONS: {
  key: DecalPlacementKey;
  partKey: CarPartKey;
  name: string;
  studs: string;
  designId: string;
}[] = [
  { key: 'nose', partKey: 'nose', name: 'Nose Cone', studs: '2x2 studs (16mm)', designId: '15068' },
  { key: 'frontWing', partKey: 'frontWing', name: 'Front Wing Flap', studs: '1x6 studs (48mm)', designId: '6636' },
  { key: 'sidepod', partKey: 'sidepods', name: 'Left Sidepod', studs: '3x2 wedge (24mm)', designId: '6564' },
  { key: 'sharkFin', partKey: 'sharkFin', name: 'Shark Fin & Spine', studs: '1x4 tile (32mm)', designId: '2431' },
  { key: 'rearWing', partKey: 'rearWing', name: 'Rear Wing DRS Blade', studs: '1x4 tile (32mm)', designId: '2431' },
  { key: 'halo', partKey: 'halo', name: 'Cockpit Halo Arch', studs: '1x3 bar (24mm)', designId: '18920' },
  { key: 'rims', partKey: 'rims', name: 'Wheel Rim Aerodisc', studs: '18mm circular', designId: '72206' },
];

export const DecalCustomizer: React.FC<DecalCustomizerProps> = ({
  decals,
  currentSet,
  currentColors,
  onUpdateDecals,
  onApplyLiveryColors,
  selectedPart,
  onSelectPart,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tabs matching user UI & requests:
  // 'applicator' (Decal Applicator & Scaling), 'livery' (Livery & Sponsors), 'blueprints' (Lego Dekal-ritningar), 'inspector' (Element ID)
  const [activeTab, setActiveTab] = useState<'applicator' | 'livery' | 'blueprints' | 'inspector'>('applicator');

  const activePlacement = decals.uploadedLogoPlacement || 'sidepod';
  const currentPlacementInfo =
    PLACEMENT_OPTIONS.find((p) => p.key === activePlacement) || PLACEMENT_OPTIONS[2];

  // Handle image upload (PNG, SVG, JPG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onUpdateDecals({
        uploadedLogoUrl: reader.result as string,
        uploadedLogoName: file.name,
        uploadedLogoPlacement: decals.uploadedLogoPlacement || 'sidepod',
        decalScale: decals.decalScale || 1.0,
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded logo
  const handleRemoveLogo = () => {
    onUpdateDecals({
      uploadedLogoUrl: undefined,
      uploadedLogoName: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Select a preset high-resolution vector sponsor logo
  const handleSelectPreset = (preset: PresetSponsorLogo) => {
    const dataUrl = getPresetSponsorDataUrl(preset);
    onUpdateDecals({
      uploadedLogoUrl: dataUrl,
      uploadedLogoName: preset.name,
      sponsorPrimary: preset.name.toUpperCase(),
      decalSpanStuds: preset.defaultWidthStuds,
      decalScale: (preset.defaultWidthStuds / 3),
    });
  };

  // Cycle to next/prev part in bottom selector bar
  const handleCyclePart = (direction: 'next' | 'prev') => {
    const currentIndex = PLACEMENT_OPTIONS.findIndex((p) => p.key === activePlacement);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= PLACEMENT_OPTIONS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = PLACEMENT_OPTIONS.length - 1;

    const target = PLACEMENT_OPTIONS[nextIndex];
    onUpdateDecals({ uploadedLogoPlacement: target.key });
    onSelectPart(target.partKey);
  };

  return (
    <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
      {/* Top Header Navigation Tabs matching uploaded screenshot */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('applicator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'applicator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Brick Decal Applicator
          </button>

          <button
            onClick={() => setActiveTab('livery')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'livery'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            Livery & Sponsormönster
          </button>

          <button
            onClick={() => setActiveTab('blueprints')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'blueprints'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Lego Dekal-Ritningar
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'inspector'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-rose-400" />
            Element ID Inspector
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BRICK DECAL APPLICATOR & MULTI-TILE LOGO SCALER */}
      {/* ========================================================================= */}
      {activeTab === 'applicator' && (
        <div className="space-y-4">
          {/* Header Description */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Apply Decals & Multi-Tile Scaling
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Projiceras direkt på bilens 3D-mesh
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ladda upp loggor och skala dem exakt över flera klossar med precision i studs (knappar) och mm.
            </p>
          </div>

          {/* Quick Preset Sponsor Logos (As seen in image.png) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Välj Officiell Sponsorlogo (1-Klick Applicering):
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {PRESET_SPONSOR_LOGOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="h-11 p-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 shadow-2xs flex flex-col items-center justify-center transition-all cursor-pointer group"
                  title={`${preset.name} (${preset.category})`}
                >
                  <div
                    className="w-full h-6 flex items-center justify-center filter group-hover:scale-105 transition-transform"
                    dangerouslySetInnerHTML={{ __html: preset.svgIcon }}
                  />
                  <span className="text-[9px] font-black text-slate-600 truncate w-full text-center mt-0.5">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Custom Logo (PNG / SVG) */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors">
            {decals.uploadedLogoUrl ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs">
                    <img
                      src={decals.uploadedLogoUrl}
                      alt="Aktiv logga"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {decals.uploadedLogoName || 'Egen Logo / Sponsor'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Placerad på:{' '}
                      <strong className="text-slate-700">{currentPlacementInfo.name}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Byt bild
                  </button>
                  <button
                    onClick={handleRemoveLogo}
                    className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Ta bort logga"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Ladda upp egen logga (PNG, SVG, JPG)
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                  Transparent bakgrund rekommenderas för bästa resultat på LEGO-plasten.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  Välj Fil
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/svg+xml, image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Precision Controls: Scale, Rotation, Offsets */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Skalning & Projektion
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Yta: {currentPlacementInfo.name} ({currentPlacementInfo.studs})
              </span>
            </div>

            {/* 1. Scale Slider (Studs & Percentage) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Skala logga över klossar:</span>
                <span className="font-mono text-amber-600">
                  {Math.round((decals.decalScale || 1.0) * 100)}% (ca{' '}
                  {((decals.decalScale || 1.0) * 3).toFixed(1)} studs /{' '}
                  {Math.round((decals.decalScale || 1.0) * 24)} mm)
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={decals.decalScale || 1.0}
                onChange={(e) => onUpdateDecals({ decalScale: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 stud (8mm)</span>
                <span>2 studs (16mm)</span>
                <span>3 studs (24mm)</span>
                <span>6 studs (48mm)</span>
              </div>
            </div>

            {/* 2. Position Offset X & Y */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>Horisontell Offset (X):</span>
                  <span className="font-mono text-slate-500">
                    {Math.round((decals.decalOffsetX || 0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  value={decals.decalOffsetX || 0}
                  onChange={(e) => onUpdateDecals({ decalOffsetX: parseFloat(e.target.value) })}
                  className="w-full accent-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>Vertikal Offset (Y):</span>
                  <span className="font-mono text-slate-500">
                    {Math.round((decals.decalOffsetY || 0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  value={decals.decalOffsetY || 0}
                  onChange={(e) => onUpdateDecals({ decalOffsetY: parseFloat(e.target.value) })}
                  className="w-full accent-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Rotation Angle */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-slate-500" />
                  Rotationsvinkel:
                </span>
                <span className="font-mono text-slate-800">{decals.decalRotation || 0}°</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={decals.decalRotation || 0}
                  onChange={(e) =>
                    onUpdateDecals({ decalRotation: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-slate-700 cursor-pointer"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onUpdateDecals({ decalRotation: 0 })}
                    className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    0°
                  </button>
                  <button
                    onClick={() =>
                      onUpdateDecals({
                        decalRotation: ((decals.decalRotation || 0) + 90) % 360,
                      })
                    }
                    className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    +90°
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Mirror to opposite side toggle */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Spegla till båda sidor
                </span>
                <span className="text-[11px] text-slate-500">
                  Applicerar automatiskt samma dekal symmetriskt på höger & vänster sida.
                </span>
              </div>
              <input
                type="checkbox"
                checked={decals.decalMirrorSides ?? true}
                onChange={(e) => onUpdateDecals({ decalMirrorSides: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* BOTTOM PARTS SELECTOR BAR (Matching image.png: < [Nose] [Wing] [Sidepod] >) */}
          <div className="p-3 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-sm">
            <button
              onClick={() => handleCyclePart('prev')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Föregående del"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 overflow-x-auto px-2 scrollbar-none">
              {PLACEMENT_OPTIONS.map((opt) => {
                const isSelected = activePlacement === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      onUpdateDecals({ uploadedLogoPlacement: opt.key });
                      onSelectPart(opt.partKey);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs scale-105'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{opt.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">#{opt.designId}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handleCyclePart('next')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Nästa del"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVERY TEMPLATES & SPONSORS */}
      {/* ========================================================================= */}
      {activeTab === 'livery' && (
        <div className="space-y-5">
          <LiveryTemplatesSelector
            currentColors={currentColors}
            decals={decals}
            onApplyLiveryColors={onApplyLiveryColors}
            onUpdateDecals={onUpdateDecals}
          />

          {/* Driver Racing Number & Typography */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-600" />
              Startnummer & Förarnamn
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Startnummer (#):
                </label>
                <input
                  type="text"
                  value={decals.racingNumber}
                  onChange={(e) => onUpdateDecals({ racingNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-black font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="16"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Förarnamn på Sittbrunn:
                </label>
                <input
                  type="text"
                  value={decals.customDriverName || ''}
                  onChange={(e) => onUpdateDecals({ customDriverName: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="C. Leclerc"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OFFICIAL LEGO DECAL BLUEPRINT SHEETS */}
      {/* ========================================================================= */}
      {activeTab === 'blueprints' && (
        <OfficialDecalSheetEditor
          decals={decals}
          onUpdateDecals={onUpdateDecals}
          onSelectPart={onSelectPart}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ELEMENT ID ARTICLE NUMBER INSPECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'inspector' && <LegoPartInspector />}
    </div>
  );
};
