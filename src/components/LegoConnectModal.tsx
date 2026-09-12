import React, { useState } from 'react';
import { LegoF1Set, CarPartColors, GranularLegoPart } from '../types';
import { getGranularLegoParts, generateBrickLinkXml, generateBrickLinkCsv } from '../data/legoPartsDatabase';
import { ExternalLink, Download, Check, X, ShieldCheck, Copy, FileCode, Layers } from 'lucide-react';

interface LegoConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  set: LegoF1Set;
  colors: CarPartColors;
}

export const LegoConnectModal: React.FC<LegoConnectModalProps> = ({
  isOpen,
  onClose,
  set,
  colors,
}) => {
  const [copiedXml, setCopiedXml] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  if (!isOpen) return null;

  const granularParts: GranularLegoPart[] = getGranularLegoParts(colors);

  const handleCopyXml = () => {
    const xml = generateBrickLinkXml(granularParts);
    navigator.clipboard.writeText(xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handleDownloadXml = () => {
    const xml = generateBrickLinkXml(granularParts);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lego-${set.articleNumber}-bricklink-wanted-list.xml`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csv = generateBrickLinkCsv(granularParts);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lego-${set.articleNumber}-parts-inventory.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-black text-sm shadow-2xs">
              #{set.articleNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  BrickLink Integration & Kloss-Inventering (BOM)
                </h2>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold font-mono">
                  <ShieldCheck className="w-3 h-3" /> Officiell Artikel #{set.articleNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {set.name} • {set.team} ({set.year}) • {granularParts.length} Unika Klossar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Quick BrickLink Upload Card */}
          <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wide">
                  <FileCode className="w-4 h-4 text-amber-600" />
                  <span>Direkt Uppladdning till BrickLink Wanted List</span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed max-w-xl">
                  Ladda ner XML-filen nedan. Gå sedan till BrickLink Wanted List Upload och klistra in eller ladda upp filen för att direkt få prisjämförelse och beställa äkta LEGO-klossar.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={handleCopyXml}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{copiedXml ? 'Kopierad XML!' : 'Kopiera XML'}</span>
                </button>

                <button
                  onClick={handleDownloadXml}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ladda ner XML</span>
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ladda ner CSV</span>
                </button>

                <a
                  href="https://www.bricklink.com/v2/wanted/upload.page"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span>Öppna BrickLink Upload</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* External LEGO & Community Portals */}
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2.5 block">
              Officiella Referenser & Databaser:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <a
                href={set.officialLegoUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 group-hover:text-amber-700 mb-1">
                    <span className="text-[11px] uppercase font-bold tracking-wider">LEGO.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                    Officiell #{set.articleNumber}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  LEGO Shop & PDF Manual
                </div>
              </a>

              <a
                href={set.brickLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 group-hover:text-blue-600 mb-1">
                    <span className="text-[11px] uppercase font-bold tracking-wider">BrickLink</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                    BrickLink Set Catalog
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Komplett marknadsplats & prisguide
                </div>
              </a>

              <a
                href={set.brickEconomyUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 group-hover:text-emerald-700 mb-1">
                    <span className="text-[11px] uppercase font-bold tracking-wider">BrickEconomy</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    Samlarvärdering
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Prisutveckling och investering
                </div>
              </a>

              <a
                href={set.rebrickableUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-500 group-hover:text-purple-600 mb-1">
                    <span className="text-[11px] uppercase font-bold tracking-wider">Rebrickable</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600">
                    Alternativa MOCs
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  MOC-modeller & reservdelar
                </div>
              </a>
            </div>
          </div>

          {/* Granular Bill of Materials (BOM) Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-800 font-bold block flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  Granulär Kloss-Inventering ({granularParts.length} Typer):
                </span>
                <span className="text-[11px] text-slate-500">
                  Element ID, BrickLink Design ID och färgkod för varje bit
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                    <th className="py-2.5 px-3">Design ID</th>
                    <th className="py-2.5 px-3">Element ID</th>
                    <th className="py-2.5 px-3">Klossbeskrivning</th>
                    <th className="py-2.5 px-3">Delområde</th>
                    <th className="py-2.5 px-3">Färg & BrickLink ID</th>
                    <th className="py-2.5 px-3 text-right">Antal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {granularParts.map((part, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-amber-700">
                        <a
                          href={`https://www.bricklink.com/v2/catalog/catalogitem.page?P=${part.designId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>#{part.designId}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">{part.elementId}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{part.name}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] font-medium">{part.subAssembly}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: part.colorHex }}
                          />
                          <span className="text-[11px] text-slate-700 font-medium">
                            {part.colorName}{' '}
                            <span className="text-[10px] font-mono text-amber-800">
                              (BL #{part.brickLinkColorId})
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                        {part.quantity}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Totalt klossantal i modellen: <strong className="text-slate-900">{set.pieceCount} bitar</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-xs border border-amber-500 transition-colors cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
