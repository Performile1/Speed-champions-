import React, { useState, useMemo } from 'react';
import { GranularLegoPart, CarPartKey } from '../types';
import {
  Eye,
  EyeOff,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Palette,
  Compass,
  FileCode,
  Upload,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { generateBrickLinkXml, generateBrickLinkCsv } from '../data/legoPartsDatabase';
import { LEGO_COLORS, findLegoColorName } from '../data/legoColors';

interface GranularPartsManagerProps {
  parts: GranularLegoPart[];
  hiddenPartIds: Set<string>;
  isolatedPartId: string | null;
  onToggleHidePart: (partId: string) => void;
  onIsolatePart: (partId: string | null) => void;
  onShowAllParts: () => void;
  onHideOuterAero: () => void;
  onUpdatePartColor: (partId: string, hex: string) => void;
  onSelectPartKey: (key: CarPartKey) => void;
  onAddPart?: (part: GranularLegoPart) => void;
  onRemovePart?: (partId: string) => void;
  onResetParts?: () => void;
  onLoadLDrawFile?: (content: string, filename: string) => void;
}

export const GranularPartsManager: React.FC<GranularPartsManagerProps> = ({
  parts,
  hiddenPartIds,
  isolatedPartId,
  onToggleHidePart,
  onIsolatePart,
  onShowAllParts,
  onHideOuterAero,
  onUpdatePartColor,
  onSelectPartKey,
  onAddPart,
  onRemovePart,
  onResetParts,
  onLoadLDrawFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubAssembly, setSelectedSubAssembly] = useState<string>('all');
  const [copiedXml, setCopiedXml] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [activeColorPickerPartId, setActiveColorPickerPartId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Part Form State
  const [newPartName, setNewPartName] = useState('Slope Curved 2x2');
  const [newPartDesignId, setNewPartDesignId] = useState('15068');
  const [newPartCategory, setNewPartCategory] = useState<'Plates' | 'Tiles' | 'Slopes' | 'Special Aero' | 'Technic' | 'Minifig' | 'Wheels & Hubs' | 'Tires'>('Slopes');
  const [newPartSubAssembly, setNewPartSubAssembly] = useState('Front Wing / Aero');
  const [newPartPartKey, setNewPartPartKey] = useState<CarPartKey>('frontWing');
  const [newPartQty, setNewPartQty] = useState(2);
  const [newPartColorHex, setNewPartColorHex] = useState(LEGO_COLORS[0].hex);
  const [newPartDirection, setNewPartDirection] = useState('Monteras i färdriktning ovanpå chassit');

  // Extract unique sub-assemblies
  const subAssemblies = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => set.add(p.subAssembly));
    return Array.from(set);
  }, [parts]);

  // Filter parts based on query and subassembly
  const filteredParts = useMemo(() => {
    return parts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.designId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.elementId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subAssembly.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.colorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSub =
        selectedSubAssembly === 'all' || p.subAssembly === selectedSubAssembly;

      return matchSearch && matchSub;
    });
  }, [parts, searchQuery, selectedSubAssembly]);

  // Copy BrickLink XML
  const handleCopyXml = () => {
    const xml = generateBrickLinkXml(parts);
    navigator.clipboard.writeText(xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  // Download BrickLink XML
  const handleDownloadXml = () => {
    const xml = generateBrickLinkXml(parts);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bricklink-wanted-list-f1-moc.xml`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  // Download BrickLink CSV
  const handleDownloadCsv = () => {
    const csv = generateBrickLinkCsv(parts);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bricklink-inventory-parts.csv`;
    a.click();
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  // LDraw file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLoadLDrawFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onLoadLDrawFile(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Granulär Byggdels-Inspektör
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-mono px-2 py-0.5 rounded-full font-bold">
              {parts.length} Unika Kloss-Typer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspektera varje enskild kloss, artikelnummer, göm/visa delar för att se chassi, eller byt färg per bit.
          </p>
        </div>

        {/* Bulk Visibility Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onAddPart && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition-all shadow-xs flex items-center gap-1.5 border border-amber-500 cursor-pointer"
              title="Lägg till en ny LEGO-del till modellen"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lägg till kloss</span>
            </button>
          )}

          <button
            onClick={onShowAllParts}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Visa alla klossar"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Visa alla</span>
          </button>

          <button
            onClick={onHideOuterAero}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Göm ytterkaross för att se chassi, golv och sittbrunn"
          >
            <EyeOff className="w-3.5 h-3.5 text-rose-500" />
            <span>Göm kaross</span>
          </button>

          {onResetParts && (
            <button
              onClick={onResetParts}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Återställ till fabrikens standarddelar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Återställ delar</span>
            </button>
          )}

          {isolatedPartId && (
            <button
              onClick={() => onIsolatePart(null)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Avsluta isolering</span>
            </button>
          )}
        </div>
      </div>

      {/* BrickLink Wanted List Direct XML & Upload Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300/80 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wide">
              <FileCode className="w-4 h-4 text-amber-600" />
              <span>BrickLink XML Wanted List & Uppladdning</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
              Ladda ned eller kopiera en fullständig XML-fil för alla klossar i dina valda färger, och ladda upp direkt till BrickLink för att beställa äkta delar.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleCopyXml}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
              <span>{copiedXml ? 'Kopierad XML!' : 'Kopiera XML'}</span>
            </button>

            <button
              onClick={handleDownloadXml}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Ladda ner XML</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Ladda ner CSV</span>
            </button>

            <a
              href="https://www.bricklink.com/v2/wanted/upload.page"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span>Öppna BrickLink Upload</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* LDraw .ldr / .io Importer tool */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-slate-800">Läs in extern LDraw / Studio-fil:</span>
          <span className="text-slate-500">Stöder .ldr, .mpd och .io MOC-filer</span>
        </div>
        <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-amber-600" />
          <span>Välj .ldr / .io fil</span>
          <input
            type="file"
            accept=".ldr,.mpd,.io,.dat"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Search & Sub-Assembly Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök på artikelnummer, klossnamn (t.ex. 93606, 3069b), färg..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <select
          value={selectedSubAssembly}
          onChange={(e) => setSelectedSubAssembly(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="all">Alla delområden (Alla {parts.length} bitar)</option>
          {subAssemblies.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Granular Parts Interactive List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredParts.map((part) => {
          const isHidden = hiddenPartIds.has(part.id);
          const isIsolated = isolatedPartId === part.id;
          const isColorPickerOpen = activeColorPickerPartId === part.id;

          return (
            <div
              key={part.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isIsolated
                  ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/50 shadow-sm'
                  : isHidden
                  ? 'bg-slate-100/60 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Swatch & Brick Specs */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setActiveColorPickerPartId(isColorPickerOpen ? null : part.id)}
                    className="relative group mt-0.5"
                    title="Klicka för att byta färg på denna specifika kloss"
                  >
                    <div
                      className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs transition-transform group-hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: part.colorHex }}
                    >
                      <Palette className="w-3 h-3 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        #{part.designId}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{part.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Art #{part.elementId}
                      </span>
                      <span className="text-[10px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                        {part.quantity}x
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                      <span>{part.subAssembly}</span>
                      <span>•</span>
                      <span>{part.dimensions}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-semibold">{part.colorName}</span>
                      <span>•</span>
                      <span className="text-amber-800 font-mono text-[10px]">
                        BL Color ID #{part.brickLinkColorId}
                      </span>
                    </div>

                    {/* Assembly Direction details */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      <Compass className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{part.directionText}</span>
                      <span className="text-slate-400">({part.studOrientation})</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Hide, Isolate, BrickLink) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onToggleHidePart(part.id)}
                    className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                      isHidden
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={isHidden ? 'Visa del' : 'Göm del (för att se underliggande delar)'}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onIsolatePart(isIsolated ? null : part.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isIsolated
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={isIsolated ? 'Avsluta isolering' : 'Isolera denna del'}
                  >
                    {isIsolated ? 'Isolerad' : 'Isolera'}
                  </button>

                  <a
                    href={`https://www.bricklink.com/v2/catalog/catalogitem.page?P=${part.designId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                    title={`Öppna artikel #${part.designId} på BrickLink`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {onRemovePart && (
                    <button
                      onClick={() => onRemovePart(part.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Ta bort denna del ur modellen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Quick Color Swatch Picker for this specific element */}
              {isColorPickerOpen && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span>Välj officiell LEGO-färg för denna kloss:</span>
                    <button
                      onClick={() => setActiveColorPickerPartId(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Stäng
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LEGO_COLORS.slice(0, 18).map((col) => (
                      <button
                        key={col.id}
                        onClick={() => {
                          onUpdatePartColor(part.id, col.hex);
                          onSelectPartKey(part.partKey);
                          setActiveColorPickerPartId(null);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs hover:scale-125 transition-transform"
                        style={{ backgroundColor: col.hex }}
                        title={`${col.name} (ID ${col.id})`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Part Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-bold text-slate-950">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black uppercase text-slate-900">
                  Lägg till LEGO-del i Modellen
                </h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Delnamn / Beskrivning</label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-amber-500"
                  placeholder="t.ex. Wedge Plate 4x2 Left"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">BrickLink Design ID</label>
                  <input
                    type="text"
                    value={newPartDesignId}
                    onChange={(e) => setNewPartDesignId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono"
                    placeholder="15068"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Antal bitar</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={newPartCategory}
                    onChange={(e) => setNewPartCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-slate-800 bg-white"
                  >
                    <option value="Plates">Plates</option>
                    <option value="Tiles">Tiles</option>
                    <option value="Slopes">Slopes</option>
                    <option value="Special Aero">Special Aero</option>
                    <option value="Technic">Technic</option>
                    <option value="Minifig">Minifig</option>
                    <option value="Wheels & Hubs">Wheels & Hubs</option>
                    <option value="Tires">Tires</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Placering / Modul</label>
                  <select
                    value={newPartPartKey}
                    onChange={(e) => {
                      const key = e.target.value as CarPartKey;
                      setNewPartPartKey(key);
                      setNewPartSubAssembly(
                        key === 'frontWing' ? 'Front Wing / Aero' :
                        key === 'rearWing' ? 'Rear Wing DRS' :
                        key === 'sidepods' ? 'Undercut Sidepods' :
                        key === 'halo' ? 'Safety Halo' :
                        key === 'nose' ? 'Nose Cone' :
                        key === 'engineCover' ? 'Engine Airbox' :
                        key === 'floor' ? 'Ground Effect Floor' : 'Cockpit'
                      );
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-slate-800 bg-white"
                  >
                    <option value="frontWing">Framvinge</option>
                    <option value="nose">Noskon</option>
                    <option value="sidepods">Sidopontoner</option>
                    <option value="halo">Halo-båge</option>
                    <option value="engineCover">Motorkåpa / Hajfena</option>
                    <option value="rearWing">Bakvinge DRS</option>
                    <option value="floor">Venturi-golv</option>
                    <option value="cockpit">Förarplats</option>
                    <option value="rims">Fälgar / Navkapslar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bygganvisning / Monteringsriktning</label>
                <input
                  type="text"
                  value={newPartDirection}
                  onChange={(e) => setNewPartDirection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  placeholder="t.ex. Tryck nedåt i färdriktning med 2 knoppars förskjutning"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Färg</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {LEGO_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewPartColorHex(col.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newPartColorHex === col.hex ? 'border-amber-500 scale-125 shadow-xs' : 'border-slate-300 hover:scale-110'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={`${col.name}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  if (!onAddPart) return;
                  const chosenColor = LEGO_COLORS.find(c => c.hex.toLowerCase() === newPartColorHex.toLowerCase()) || LEGO_COLORS[0];
                  const newPart: GranularLegoPart = {
                    id: `custom-part-${Date.now()}`,
                    name: newPartName,
                    elementId: `${Math.floor(6000000 + Math.random() * 900000)}`,
                    designId: newPartDesignId || '3020',
                    partKey: newPartPartKey,
                    category: (newPartCategory === 'Special Aero' ? 'Aero & Halo' : newPartCategory === 'Technic' ? 'Bricks' : newPartCategory === 'Wheels & Hubs' || newPartCategory === 'Tires' ? 'Wheels & Axles' : newPartCategory) as any,
                    subAssembly: newPartSubAssembly,
                    dimensions: 'Standard 8-Wide',
                    colorName: chosenColor.name,
                    colorHex: chosenColor.hex,
                    brickLinkColorId: chosenColor.id,
                    legoColorId: chosenColor.id,
                    quantity: newPartQty,
                    direction: 'down',
                    directionText: newPartDirection,
                    assemblyStep: 3,
                    studOrientation: 'Studs facing UP',
                  };
                  onAddPart(newPart);
                  setIsAddModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black border border-amber-500 shadow-xs cursor-pointer"
              >
                Lägg till i Bygget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
