import React, { useState, useEffect } from 'react';
import {
  BricksetItem,
  loadSetInventory,
  exportSetInventoryToCsv,
  SPEED_CHAMPIONS_F1_REGISTRY,
} from '../utils/bricksetInventory';
import { LegoF1Set } from '../types';
import { Download, ExternalLink, X, Search, ShieldCheck, Check } from 'lucide-react';

interface BricksetInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSet: LegoF1Set;
}

export const BricksetInventoryModal: React.FC<BricksetInventoryModalProps> = ({
  isOpen,
  onClose,
  currentSet,
}) => {
  const [items, setItems] = useState<BricksetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const cleanSetNum = currentSet.articleNumber.replace(/[^0-9]/g, '') || '77242';
  const meta = SPEED_CHAMPIONS_F1_REGISTRY[cleanSetNum] || SPEED_CHAMPIONS_F1_REGISTRY['77242'];

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    loadSetInventory(cleanSetNum).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [isOpen, cleanSetNum]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.elementName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.elementId.includes(searchQuery) ||
      item.designId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.colour.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);

  const handleDownloadCsv = () => {
    const csvContent = exportSetInventoryToCsv(cleanSetNum, items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Brickset_Inventory_${cleanSetNum}-1_${currentSet.team.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
              #{cleanSetNum}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Officiell Brickset Inventarielista ({cleanSetNum}-1)
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verifierad
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentSet.name} • {totalQuantity} klossar ({items.length} unika element)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Ladda ner CSV</span>
            </button>
            <a
              href={meta.bricksetUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Öppna på Brickset.com"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Key Model Highlights Bar */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-5 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="font-bold text-slate-900">Framhjulsdeflektorer:</span>{' '}
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">
                #{meta.wheelDeflectors.leftElem} (V) / #{meta.wheelDeflectors.rightElem} (H)
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Aero Navkapsel:</span>{' '}
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">
                #{meta.rimCaps.elementId}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Halo:</span>{' '}
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">
                #{meta.haloAndHelmet.haloElem}
              </span>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-amber-800">
            Källa: /public/data/inventories/{cleanSetNum}-1.csv
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök element-ID (#6515219), form (#3388), namn eller färg..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alla ({items.length})
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Pieces Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
              Läser in officiell Brickset inventarielista...
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3">Antal</th>
                  <th className="py-2 px-3">Element-ID</th>
                  <th className="py-2 px-3">Design / Form</th>
                  <th className="py-2 px-3">Elementnamn</th>
                  <th className="py-2 px-3">Färg</th>
                  <th className="py-2 px-3">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => (
                  <tr key={`${item.elementId}-${idx}`} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono">
                        {item.qty}x
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      #{item.elementId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {item.designId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.elementName}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-slate-300"
                          style={{
                            backgroundColor:
                              item.colour.toLowerCase().includes('red')
                                ? '#dc2626'
                                : item.colour.toLowerCase().includes('blue')
                                ? '#1e3a8a'
                                : item.colour.toLowerCase().includes('black')
                                ? '#18181b'
                                : item.colour.toLowerCase().includes('white')
                                ? '#ffffff'
                                : item.colour.toLowerCase().includes('green')
                                ? '#15803d'
                                : item.colour.toLowerCase().includes('orange') || item.colour.toLowerCase().includes('papaya')
                                ? '#ea580c'
                                : '#94a3b8',
                          }}
                        />
                        {item.colour}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      {item.category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Visar {filteredItems.length} av {items.length} unika element
          </div>
          {copiedNotification && (
            <div className="flex items-center gap-1 text-emerald-600 font-bold animate-pulse">
              <Check className="w-4 h-4" /> CSV-fil nedladdad till datorn!
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
