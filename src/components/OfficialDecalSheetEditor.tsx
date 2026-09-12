import React, { useState } from 'react';
import { OfficialStickerSheet, OfficialStickerItem, CarDecals, CarPartKey } from '../types';
import {
  OFFICIAL_LEGO_STICKER_SHEETS,
  PRESET_SPONSOR_LOGOS,
  PresetSponsorLogo,
  getPresetSponsorDataUrl,
} from '../data/legoDecalBlueprints';
import {
  Layers,
  FileDown,
  Upload,
  Sparkles,
  Check,
  RotateCcw,
  Palette,
  Eye,
  Hash,
  Info,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface OfficialDecalSheetEditorProps {
  decals: CarDecals;
  onUpdateDecals: (updated: Partial<CarDecals>) => void;
  onSelectPart?: (part: CarPartKey) => void;
}

export const OfficialDecalSheetEditor: React.FC<OfficialDecalSheetEditorProps> = ({
  decals,
  onUpdateDecals,
  onSelectPart,
}) => {
  const [selectedSheetId, setSelectedSheetId] = useState<string>(
    decals.activeStickerSheetId || OFFICIAL_LEGO_STICKER_SHEETS[0].id
  );

  const [activeLayer, setActiveLayer] = useState<'all' | 'livery' | 'sponsor' | 'number'>('all');
  const [editingStickerId, setEditingStickerId] = useState<string | null>(null);
  const [customStickerData, setCustomStickerData] = useState<Record<string, Partial<OfficialStickerItem>>>({});

  // Active sheet
  const currentSheet: OfficialStickerSheet =
    OFFICIAL_LEGO_STICKER_SHEETS.find((s) => s.id === selectedSheetId) ||
    OFFICIAL_LEGO_STICKER_SHEETS[0];

  // Helper to get active sticker data (with user customizations)
  const getSticker = (item: OfficialStickerItem): OfficialStickerItem => {
    const custom = customStickerData[item.id] || {};
    return { ...item, ...custom };
  };

  const selectedSticker = editingStickerId
    ? getSticker(currentSheet.stickers.find((s) => s.id === editingStickerId) || currentSheet.stickers[0])
    : null;

  // Handle Sheet selection
  const handleSheetChange = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    onUpdateDecals({ activeStickerSheetId: sheetId });
    setEditingStickerId(null);
  };

  // Update specific sticker
  const handleUpdateSticker = (stickerId: string, updates: Partial<OfficialStickerItem>) => {
    setCustomStickerData((prev) => ({
      ...prev,
      [stickerId]: { ...prev[stickerId], ...updates },
    }));

    // If it's a primary sponsor or number sticker, sync to 3D car decals
    const target = currentSheet.stickers.find((s) => s.id === stickerId);
    if (target) {
      if (updates.customText) {
        if (target.category === 'number') {
          const numOnly = updates.customText.replace(/[^0-9]/g, '');
          if (numOnly) onUpdateDecals({ racingNumber: numOnly });
        } else if (target.category === 'sponsor') {
          onUpdateDecals({ sponsorPrimary: updates.customText });
        }
      }
      if (updates.customLogoUrl) {
        onUpdateDecals({
          uploadedLogoUrl: updates.customLogoUrl,
          uploadedLogoName: updates.name || target.name,
        });
      }
    }
  };

  // Upload custom image for specific sticker
  const handleStickerImageUpload = (e: React.ChangeEvent<HTMLInputElement>, stickerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      handleUpdateSticker(stickerId, { customLogoUrl: url });
      onUpdateDecals({
        uploadedLogoUrl: url,
        uploadedLogoName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Assign preset sponsor to sticker
  const handleAssignPreset = (stickerId: string, preset: PresetSponsorLogo) => {
    const dataUrl = getPresetSponsorDataUrl(preset);
    handleUpdateSticker(stickerId, {
      customText: preset.name.toUpperCase(),
      customLogoUrl: dataUrl,
      bgColor: preset.bgColor,
      color: preset.textColor,
    });
    onUpdateDecals({
      sponsorPrimary: preset.name.toUpperCase(),
      uploadedLogoUrl: dataUrl,
      uploadedLogoName: preset.name,
    });
  };

  // Reset customizations for this sheet
  const handleResetSheet = () => {
    setCustomStickerData({});
  };

  // Download Printable Decal Sheet as High-Res PDF
  const handleDownloadDecalPdf = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4', // 297 x 210 mm
    });

    // Page styling - Wax blue backing sheet
    doc.setFillColor(224, 242, 254);
    doc.rect(15, 15, 267, 180, 'F');

    // Outer border & die-cut frame
    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(1.2);
    doc.rect(15, 15, 267, 180, 'S');

    // Title & Official LEGO header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(3, 105, 161);
    doc.text(`LEGO® SPEED CHAMPIONS™ • SET #${currentSheet.setNumber}`, 22, 26);

    doc.setFontSize(10);
    doc.setTextColor(14, 116, 144);
    doc.text(
      `OFFICIAL REPLACEMENT DECAL SPECIFICATION • 1:1 TRUE BUILD SCALE • ${currentSheet.name.toUpperCase()}`,
      22,
      32
    );

    // Die-cut instructions
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Cut along dashed lines. Print on glossy vinyl or waterproof sticker paper at 100% scale (no fit to page).', 22, 38);

    // Render each sticker
    let curX = 22;
    let curY = 46;
    let rowHeight = 0;

    currentSheet.stickers.forEach((rawSticker) => {
      const sticker = getSticker(rawSticker);
      const w = Math.max(sticker.dimensionsMm.width * 1.5, 28);
      const h = Math.max(sticker.dimensionsMm.height * 1.5, 18);

      if (curX + w > 270) {
        curX = 22;
        curY += rowHeight + 12;
        rowHeight = 0;
      }
      rowHeight = Math.max(rowHeight, h);

      // Draw sticker die-cut border (dashed line)
      doc.setLineDashPattern([2, 1.5], 0);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.rect(curX, curY, w, h, 'S');
      doc.setLineDashPattern([], 0); // reset dash

      // Sticker background
      doc.setFillColor(sticker.bgColor || '#ffffff');
      doc.rect(curX + 0.5, curY + 0.5, w - 1, h - 1, 'F');

      // Sticker number badge in corner
      doc.setFillColor(3, 105, 161);
      doc.circle(curX + 4, curY + 4, 2.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${sticker.number}`, curX + 2.8, curY + 5);

      // Sticker text content
      doc.setFontSize(9);
      doc.setTextColor(sticker.color === '#FFFFFF' ? 255 : 30, sticker.color === '#FFFFFF' ? 255 : 30, sticker.color === '#FFFFFF' ? 255 : 30);
      const displayText = sticker.customText || sticker.name;
      doc.text(displayText.slice(0, 16), curX + 9, curY + 9);

      // Target brick info
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`Brick #${sticker.targetDesignId} (${sticker.studWidth} studs)`, curX + 2, curY + h - 2);

      curX += w + 8;
    });

    // Save PDF
    doc.save(`LEGO_SpeedChampions_${currentSheet.setNumber}_StickerSheet.pdf`);
  };

  const filteredStickers = currentSheet.stickers.filter((s) => {
    if (activeLayer === 'all') return true;
    return s.category === activeLayer;
  });

  return (
    <div className="space-y-5">
      {/* Header & Sheet Selection */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-wider border border-sky-500/30">
                Lego Blueprint
              </span>
              <h2 className="text-base font-black text-white">LEGO® Dekal-Ritningar</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Officiella Speed Champions dekalark med redigerbara lager för sponsorer, fartränder och startnummer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSheet}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Återställ dekalark till original"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Återställ
            </button>
            <button
              onClick={handleDownloadDecalPdf}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Ladda ner Dekalark (PDF)
            </button>
          </div>
        </div>

        {/* Sheet Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {OFFICIAL_LEGO_STICKER_SHEETS.map((sheet) => {
            const isActive = sheet.id === selectedSheetId;
            return (
              <button
                key={sheet.id}
                onClick={() => handleSheetChange(sheet.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Set #{sheet.setNumber}</span>
                <span className="opacity-75 font-normal text-[11px]">{sheet.team}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layer Controls & Quick Filters */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            Lager:
          </span>
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeLayer === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Alla ({currentSheet.stickers.length})
          </button>
          <button
            onClick={() => setActiveLayer('sponsor')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeLayer === 'sponsor'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sponsorer
          </button>
          <button
            onClick={() => setActiveLayer('number')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeLayer === 'number'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Startnummer
          </button>
          <button
            onClick={() => setActiveLayer('livery')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeLayer === 'livery'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Livery & Ränder
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Klicka på valfri dekal för att redigera eller byta logga
        </div>
      </div>

      {/* THE 2D DECAL BLUEPRINT SHEET CANVAS */}
      <div className="relative p-6 rounded-2xl bg-[#e0f2fe] border-2 border-[#38bdf8] shadow-inner overflow-hidden">
        {/* Authentic Light Blue Wax Paper Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#0284c7 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* LEGO Official Sheet Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-sky-300/60">
          <div>
            <div className="text-xs font-black tracking-widest text-sky-800 uppercase font-mono">
              LEGO® SPEED CHAMPIONS™ • STICKER SHEET #{currentSheet.setNumber}
            </div>
            <div className="text-[11px] font-bold text-sky-600">
              {currentSheet.name} • 1:1 Scale Precision Die-Cut Sheet
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-sky-200 text-sky-900 text-xs font-mono font-black">
            {currentSheet.dimensionsMm.width} x {currentSheet.dimensionsMm.height} mm
          </span>
        </div>

        {/* Sticker Grid / Die-Cut Stickers */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredStickers.map((rawSticker) => {
            const sticker = getSticker(rawSticker);
            const isEditing = editingStickerId === sticker.id;

            return (
              <div
                key={sticker.id}
                onClick={() => {
                  setEditingStickerId(sticker.id);
                  if (onSelectPart) {
                    if (sticker.targetComponent.includes('Nose')) onSelectPart('nose');
                    else if (sticker.targetComponent.includes('Wing')) onSelectPart('rearWing');
                    else if (sticker.targetComponent.includes('Sidepod')) onSelectPart('sidepods');
                    else if (sticker.targetComponent.includes('Halo')) onSelectPart('halo');
                  }
                }}
                className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer group ${
                  isEditing
                    ? 'border-sky-600 bg-white shadow-lg ring-3 ring-sky-400/40 scale-[1.02]'
                    : 'border-dashed border-slate-400 bg-white/90 hover:bg-white hover:border-slate-600 shadow-xs'
                }`}
              >
                {/* Sticker Number Circle */}
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-sky-600 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  {sticker.number}
                </div>

                {/* Target Brick Info Badge */}
                <div className="text-right mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    #{sticker.targetDesignId} • {sticker.studWidth} studs
                  </span>
                </div>

                {/* Graphic Decal Body Preview */}
                <div
                  className="w-full h-16 rounded-lg flex items-center justify-center p-2 relative overflow-hidden border border-slate-200/60 transition-transform group-hover:scale-[1.01]"
                  style={{ backgroundColor: sticker.bgColor }}
                >
                  {sticker.customLogoUrl ? (
                    <img
                      src={sticker.customLogoUrl}
                      alt={sticker.name}
                      className="max-h-12 max-w-full object-contain filter drop-shadow-sm"
                    />
                  ) : (
                    <span
                      className="font-black italic text-sm text-center px-2 tracking-wide select-none"
                      style={{ color: sticker.color }}
                    >
                      {sticker.customText || sticker.name}
                    </span>
                  )}
                </div>

                {/* Sticker Description & Target */}
                <div className="mt-2.5">
                  <div className="text-xs font-black text-slate-900 truncate">{sticker.name}</div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                    <span>Del: {sticker.targetComponent}</span>
                    <span className="text-sky-600 font-bold group-hover:underline">Redigera</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED STICKER INSPECTOR & EDITOR */}
      {selectedSticker && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                #{selectedSticker.number}
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">{selectedSticker.name}</h3>
                <p className="text-xs text-slate-500">
                  Monteras på: <strong className="text-slate-800">{selectedSticker.targetComponent}</strong> (Design #{selectedSticker.targetDesignId})
                </p>
              </div>
            </div>

            <button
              onClick={() => setEditingStickerId(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Stäng redigerare
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Text & Custom Upload */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dekaltext / Sponsor:
                </label>
                <input
                  type="text"
                  value={selectedSticker.customText || ''}
                  onChange={(e) =>
                    handleUpdateSticker(selectedSticker.id, { customText: e.target.value })
                  }
                  placeholder={selectedSticker.name}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Upload Custom PNG/SVG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ersätt med egen logga (PNG / SVG):
                </label>
                <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-sky-400 bg-sky-50/50 hover:bg-sky-50 text-sky-700 text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Välj bildfil från datorn</span>
                  <input
                    type="file"
                    accept="image/png, image/svg+xml, image/jpeg"
                    onChange={(e) => handleStickerImageUpload(e, selectedSticker.id)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Bakgrundsfärg:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedSticker.bgColor || '#ffffff'}
                      onChange={(e) =>
                        handleUpdateSticker(selectedSticker.id, { bgColor: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{selectedSticker.bgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Textfärg:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedSticker.color || '#000000'}
                      onChange={(e) =>
                        handleUpdateSticker(selectedSticker.id, { color: e.target.value })
                      }
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{selectedSticker.color}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Preset Sponsors */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Eller välj officiell F1-sponsor:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SPONSOR_LOGOS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAssignPreset(selectedSticker.id, preset)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
                  >
                    <div
                      className="w-10 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: preset.svgIcon }}
                    />
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
