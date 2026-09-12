import React, { useState } from 'react';
import { LEGO_F1_SETS } from '../data/legoSets';
import { LegoF1Set, Era } from '../types';
import { Search, ExternalLink, Filter } from 'lucide-react';

interface SetSelectorProps {
  currentSet: LegoF1Set;
  onSelectSet: (set: LegoF1Set) => void;
  onOpenConnectModal: (set: LegoF1Set) => void;
}

export const SetSelector: React.FC<SetSelectorProps> = ({
  currentSet,
  onSelectSet,
  onOpenConnectModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEraFilter, setActiveEraFilter] = useState<Era | 'all'>('all');

  const filteredSets = LEGO_F1_SETS.filter((set) => {
    const matchesSearch =
      set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.articleNumber.includes(searchTerm) ||
      set.team.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEra = activeEraFilter === 'all' || set.era === activeEraFilter;
    return matchesSearch && matchesEra;
  });

  return (
    <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-3xl p-5 lg:p-6 shadow-sm">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-amber-600 font-extrabold">Official LEGO Catalog</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {LEGO_F1_SETS.length} Models
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
            Speed Champions F1 Article Numbers
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search #77242, Ferrari, 8-wide..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Era Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-bold flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" /> Era:
        </span>
        <button
          onClick={() => setActiveEraFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            activeEraFilter === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Eras ({LEGO_F1_SETS.length})
        </button>
        <button
          onClick={() => setActiveEraFilter('modern-8-wide')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            activeEraFilter === 'modern-8-wide'
              ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Modern 8-Stud (2022–Present)
        </button>
        <button
          onClick={() => setActiveEraFilter('classic-6-wide')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            activeEraFilter === 'classic-6-wide'
              ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Classic 6-Stud (2015–2018)
        </button>
        <button
          onClick={() => setActiveEraFilter('polybag-mini')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            activeEraFilter === 'polybag-mini'
              ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Polybags & Mini
        </button>
      </div>

      {/* Set Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredSets.map((set) => {
          const isSelected = set.articleNumber === currentSet.articleNumber;

          return (
            <div
              key={set.articleNumber}
              onClick={() => onSelectSet(set)}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
              }`}
            >
              <div>
                {/* Top badges: Article number and era */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                      #{set.articleNumber}
                    </span>
                    {set.isBundle && (
                      <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-md font-bold uppercase">
                        10-Car Grid
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {set.year}
                  </span>
                </div>

                {/* Set Title */}
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                  {set.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                  {set.team}
                </p>
              </div>

              {/* Bottom Specs & Connect trigger */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>{set.pieceCount} pcs</span>
                  {set.minifigures ? <span>• {set.minifigures} fig</span> : null}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenConnectModal(set);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:text-slate-950 hover:bg-amber-400 rounded-lg border border-amber-300 flex items-center gap-1 transition-colors shadow-2xs"
                  title="Connect to LEGO, BrickLink & BrickEconomy"
                >
                  <span>Connect</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredSets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium">
            No LEGO F1 sets matched your query "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
};
