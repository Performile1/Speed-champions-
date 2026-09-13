import React, { useState, useMemo } from 'react';
import { GranularLegoPart, CarPartKey, BomPart } from '../types';
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
  ListFilter,
  CheckCircle2,
  Box,
} from 'lucide-react';
import { generateBrickLinkXml, generateBrickLinkCsv, groupPartsToBom } from '../data/legoPartsDatabase';
import { LEGO_COLORS, findLegoColorName } from '../data/legoColors';

interface GranularPartsManagerProps {
  parts: GranularLegoPart[];
  hiddenPartIds: Set<string>;
  isolatedPartId: string | null;
  selectedInstanceId?: string | null;
  onSelectInstanceId?: (id: string | null) => void;
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
  selectedInstanceId,
  onSelectInstanceId,
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
  const [viewMode, setViewMode] = useState<'all' | 'bom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubAssembly, setSelectedSubAssembly] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedXml, setCopiedXml] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [activeColorPickerPartId, setActiveColorPickerPartId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Consolidated Bill of Materials (BOM)
  const bomParts = useMemo(() => groupPartsToBom(parts), [parts]);

  // Extract unique sub-assemblies for the 275 individual parts
  const subAssemblies = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => set.add(p.subAssembly));
    return Array.from(set);
  }, [parts]);

  // Extract unique categories for the BOM view
  const categories = useMemo(() => {
    const set = new Set<string>();
    bomParts.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [bomParts]);

  // Filter individual parts based on query and subassembly
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

  // Filter BOM parts based on query and category
  const filteredBom = useMemo(() => {
    return bomParts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.designId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.elementId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.colorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat =
        selectedCategory === 'all' || p.category === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [bomParts, searchQuery, selectedCategory]);

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
    a.download = `bricklink-wanted-list-f1-moc-${parts.length}pcs.xml`;
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
    a.download = `bricklink-inventory-parts-${bomParts.length}elements.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              Granulär Kloss-Inspektör & BOM
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-mono px-2 py-0.5 rounded-full font-bold">
              {parts.length} Bitar Totalt
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-full font-bold">
              {bomParts.length} Unika Artiklar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspektera alla 275 individuella klossar, markera i 3D, byt färg per enskild bit eller se konsoliderad stycklista.
          </p>
        </div>

        {/* Bulk Visibility Actions */}
        <div className="flex items-center gap-2 flex-wrap">
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
              title="Återställ alla delar till standard"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Återställ</span>
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

      {/* VIEW MODE TOGGLE (All 275 Parts vs Grouped BOM) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'all'
              ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span>Alla {parts.length} Bitar (Individuell 3D-styrning)</span>
        </button>

        <button
          onClick={() => setViewMode('bom')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'bom'
              ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-indigo-500" />
          <span>Summerad Stycklista / BOM ({bomParts.length} Unika Artiklar)</span>
        </button>
      </div>

      {/* BrickLink Wanted List Direct XML & Upload Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300/80 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wide">
              <FileCode className="w-4 h-4 text-amber-600" />
              <span>BrickLink XML Wanted List & Export</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
              Genererar en fullständig, konsoliderad Wanted List för alla {parts.length} klossar i dina aktiva färger redo att ladda upp direkt till BrickLink.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleCopyXml}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
              <span>{copiedXml ? 'Kopierad XML!' : 'Kopiera XML'}</span>
            </button>

            <button
              onClick={handleDownloadXml}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Ladda ner XML</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
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
              <span>Öppna BrickLink</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              viewMode === 'all'
                ? 'Sök bland alla 275 bitar (artikelnummer, namn, färg)...'
                : 'Sök i stycklistan (t.ex. 3020, 15068, Slope, Plate)...'
            }
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {viewMode === 'all' ? (
          <select
            value={selectedSubAssembly}
            onChange={(e) => setSelectedSubAssembly(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="all">Alla delområden ({parts.length} bitar)</option>
            {subAssemblies.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="all">Alla kategorier ({bomParts.length} artiklar)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* VIEW 1: ALL 275 INDIVIDUAL BRICKS */}
      {viewMode === 'all' && (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredParts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Inga klossar matchade sökningen.
            </div>
          ) : (
            filteredParts.map((part) => {
              const isHidden = hiddenPartIds.has(part.id);
              const isIsolated = isolatedPartId === part.id;
              const isSelectedIn3D = selectedInstanceId === part.id;
              const isColorPickerOpen = activeColorPickerPartId === part.id;

              return (
                <div
                  key={part.id}
                  onClick={() => {
                    onSelectInstanceId?.(part.id);
                    onSelectPartKey(part.partKey);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelectedIn3D
                      ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/60 shadow-sm'
                      : isIsolated
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/50 shadow-sm'
                      : isHidden
                      ? 'bg-slate-100/60 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Swatch & Brick Specs */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Individual Color Swatch button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColorPickerPartId(isColorPickerOpen ? null : part.id);
                        }}
                        className="relative group mt-0.5 shrink-0"
                        title="Klicka för att byta färg på denna enskilda kloss"
                      >
                        <div
                          className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs transition-transform group-hover:scale-110 flex items-center justify-center cursor-pointer"
                          style={{ backgroundColor: part.colorHex }}
                        >
                          <Palette className="w-3 h-3 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            #{part.designId}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {part.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Art #{part.elementId}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Steg {part.assemblyStep}
                          </span>
                          {isSelectedIn3D && (
                            <span className="text-[10px] font-black text-amber-900 bg-amber-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Aktiv i 3D
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                          <span className="text-slate-700 font-semibold">{part.subAssembly}</span>
                          <span>•</span>
                          <span>{part.dimensions}</span>
                          <span>•</span>
                          <span className="text-slate-800 font-semibold">{part.colorName}</span>
                          <span>•</span>
                          <span className="text-amber-800 font-mono text-[10px]">
                            BL Color #{part.brickLinkColorId}
                          </span>
                        </div>

                        {/* Assembly Direction & Stud Orientation */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 w-fit">
                          <Compass className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{part.directionText}</span>
                          <span className="text-slate-400">({part.studOrientation})</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Hide, Isolate, BrickLink) */}
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onToggleHidePart(part.id)}
                        className={`p-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          isHidden
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title={isHidden ? 'Visa del' : 'Göm del'}
                      >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onIsolatePart(isIsolated ? null : part.id)}
                        className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
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
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                        title={`Öppna artikel #${part.designId} på BrickLink`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Inline Individual Brick Color Swatch Palette */}
                  {isColorPickerOpen && (
                    <div
                      className="mt-3 pt-3 border-t border-slate-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span>Välj unik LEGO-färg för denna kloss:</span>
                        <button
                          onClick={() => setActiveColorPickerPartId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Stäng
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {LEGO_COLORS.slice(0, 24).map((col) => (
                          <button
                            key={col.id}
                            onClick={() => {
                              onUpdatePartColor(part.id, col.hex);
                              setActiveColorPickerPartId(null);
                            }}
                            className="group relative p-0.5 rounded-lg hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer"
                            title={`${col.name} (${col.hex})`}
                          >
                            <div
                              className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs transition-transform group-hover:scale-110"
                              style={{ backgroundColor: col.hex }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: CONSOLIDATED BILL OF MATERIALS (BOM) */}
      {viewMode === 'bom' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 border-b border-slate-200">
            <div className="col-span-2">Antal & Kategori</div>
            <div className="col-span-5">Klossnamn & Mått</div>
            <div className="col-span-3">Färg & BrickLink ID</div>
            <div className="col-span-2 text-right">Element / LDraw ID</div>
          </div>

          {filteredBom.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Inga artiklar matchade sökningen i stycklistan.
            </div>
          ) : (
            filteredBom.map((item, idx) => (
              <div
                key={`${item.designId}_${item.brickLinkColorId}_${idx}`}
                className="grid grid-cols-12 items-center p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 text-xs transition-all shadow-2xs"
              >
                {/* Antal & Kategori */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className="font-black text-xs text-slate-900 bg-amber-200 px-2 py-0.5 rounded-md">
                    {item.quantity}x
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    {item.category}
                  </span>
                </div>

                {/* Klossnamn */}
                <div className="col-span-5 pr-2">
                  <div className="font-bold text-slate-900 truncate">
                    {item.name}
                  </div>
                </div>

                {/* Färg */}
                <div className="col-span-3 flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-md border border-slate-300 shrink-0"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 block truncate">
                      {item.colorName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Color #{item.brickLinkColorId}
                    </span>
                  </div>
                </div>

                {/* Element & Design ID */}
                <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                  <div>
                    <span className="font-mono font-bold text-amber-700 block">
                      #{item.designId}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block">
                      Art #{item.elementId}
                    </span>
                  </div>
                  <a
                    href={`https://www.bricklink.com/v2/catalog/catalogitem.page?P=${item.designId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors"
                    title="Öppna på BrickLink"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
