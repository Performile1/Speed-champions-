import React, { useState } from 'react';
import { LEGO_COLORS, findLegoColorName } from '../data/legoColors';
import { LegoColor } from '../types';
import { ExternalLink, Check, Copy, Hash, Layers } from 'lucide-react';

interface F1PartSpec {
  designId: string;
  name: string;
  dimensions: string;
  elementIds: Record<string, string>;
  category: string;
}

const F1_PARTS_DATABASE: Record<string, F1PartSpec> = {
  'Nose Cone': {
    designId: '15068',
    name: 'Slope Curved 2 x 2 x 2/3',
    dimensions: '2 x 2 x 0.67 studs',
    category: 'Slopes',
    elementIds: {
      '#C91A09': '6058177', // Red (Ferrari)
      '#FE8A18': '6338181', // McLaren Orange
      '#1B1B1B': '6051508', // Black
      '#0055BF': '6058178', // Blue
      '#F2F3F2': '6058176', // White
      '#FBE822': '6058179', // Yellow
      '#00573D': '6390124', // Aston Green
    },
  },
  'Front Wing Main Flap': {
    designId: '6636',
    name: 'Tile 1 x 6 Flat',
    dimensions: '1 x 6 x 0.33 studs',
    category: 'Tiles',
    elementIds: {
      '#C91A09': '663621',
      '#1B1B1B': '4560178',
      '#FBE822': '6000606',
      '#0055BF': '663623',
      '#F2F3F2': '663601',
    },
  },
  'Front Wing Endplates': {
    designId: '92280',
    name: 'Plate Special 1 x 2 with Clip on Top',
    dimensions: '1 x 2 studs',
    category: 'Plates',
    elementIds: {
      '#19325A': '6000652',
      '#00573D': '6092585',
      '#C91A09': '6000651',
      '#1B1B1B': '6092582',
    },
  },
  'Halo Safety Device': {
    designId: '18920',
    name: 'Curved Halo Titanium Protection Bar',
    dimensions: '1 x 3 curved bar',
    category: 'Aero & Halo',
    elementIds: {
      '#F2F3F2': '6338210',
      '#1B1B1B': '6227184',
      '#6C6E68': '6254045',
      '#C91A09': '6338211',
    },
  },
  'Cockpit & Headrest': {
    designId: '27925',
    name: 'Tile 2 x 2 Curved',
    dimensions: '2 x 2 studs',
    category: 'Tiles',
    elementIds: {
      '#0055BF': '6172366',
      '#C91A09': '6172383',
      '#1B1B1B': '6172384',
      '#FE8A18': '6338183',
    },
  },
  'Undercut Sidepods (Left)': {
    designId: '6564',
    name: 'Wedge 3 x 2 Left',
    dimensions: '3 x 2 x 1 studs',
    category: 'Slopes',
    elementIds: {
      '#C91A09': '4188298',
      '#19325A': '6252040',
      '#FE8A18': '6338185',
      '#1B1B1B': '4188299',
    },
  },
  'Engine Cover & Airbox': {
    designId: '60481',
    name: 'Slope 45° 2 x 1 Curved',
    dimensions: '2 x 1 x 0.67 studs',
    category: 'Slopes',
    elementIds: {
      '#C91A09': '4515364',
      '#00573D': '6037746',
      '#1B1B1B': '4515365',
      '#FE8A18': '6338187',
    },
  },
  'Shark Fin & Spine': {
    designId: '2431',
    name: 'Tile 1 x 4 Flat / Aero Fin',
    dimensions: '1 x 4 x 0.33 studs',
    category: 'Tiles',
    elementIds: {
      '#C91A09': '243121',
      '#1B1B1B': '4560182',
      '#F2F3F2': '243101',
      '#FE8A18': '6338189',
    },
  },
  'Rear Wing DRS Flap': {
    designId: '2431',
    name: 'Tile 1 x 4 Flat Drag Reduction Blade',
    dimensions: '1 x 4 studs',
    category: 'Tiles',
    elementIds: {
      '#00573D': '6254045',
      '#1B1B1B': '243126',
      '#C91A09': '243121',
      '#FE8A18': '6338189',
    },
  },
  'Floor & Venturi Strakes': {
    designId: '3460',
    name: 'Plate 1 x 8 Flat Carbon Base',
    dimensions: '1 x 8 x 0.33 studs',
    category: 'Plates',
    elementIds: {
      '#1B1B1B': '346026',
      '#6C6E68': '4210633',
    },
  },
  'Wheel Rims / Aerodisc Covers': {
    designId: '72206',
    name: 'Wheel Rim 18mm x 14mm 8-Spoke',
    dimensions: '18 x 14 mm',
    category: 'Wheels & Axles',
    elementIds: {
      '#1B1B1B': '6383188',
      '#36AEBF': '6338428',
      '#A0A5A9': '6383189',
    },
  },
  'Pirelli Racing Slick Tire': {
    designId: '69909',
    name: 'F1 Racing Smooth Slick Tire 30.4 x 14',
    dimensions: '30.4 x 14 mm',
    category: 'Wheels & Axles',
    elementIds: {
      '#DC2626': '6383177', // Soft - Red Ring
      '#EAB308': '6383178', // Medium - Yellow Ring
      '#F8FAFC': '6383179', // Hard - White Ring
      '#16A34A': '6383180', // Inter - Green Ring
    },
  },
};

export const LegoPartInspector: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<string>('Nose Cone');
  const [selectedColor, setSelectedColor] = useState<LegoColor>(LEGO_COLORS[0]); // Red
  const [copied, setCopied] = useState(false);

  const currentPart = F1_PARTS_DATABASE[selectedElement] || {
    designId: '3001',
    name: 'Standard LEGO Brick',
    dimensions: '2 x 4 studs',
    category: 'Bricks',
    elementIds: {},
  };

  // Dynamic Element ID calculation
  const currentElementId =
    currentPart.elementIds[selectedColor.hex] ||
    `${currentPart.designId}${selectedColor.id < 10 ? `0${selectedColor.id}` : selectedColor.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentElementId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-red-600" />
            LEGO® Artikelnummer & Design ID Inspector
          </h3>
          <p className="text-[11px] text-slate-500">
            Dynamisk koppling mellan 3D-val, färg & officiella LEGO Element IDs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Select Element */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Välj F1-Komponent (3D Mesh):
          </label>
          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
          >
            {Object.keys(F1_PARTS_DATABASE).map((partName) => (
              <option key={partName} value={partName}>
                {partName}
              </option>
            ))}
          </select>
        </div>

        {/* Select Color */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Officiell LEGO Färg:
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {LEGO_COLORS.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                  selectedColor.id === c.id
                    ? 'scale-115 border-slate-900 shadow-sm'
                    : 'border-slate-300'
                }`}
                style={{ backgroundColor: c.hex }}
                title={`${c.name} (#${c.id})`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic LEGO Element Card */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
            Officiellt Element ID (Artikelnummer)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-black font-mono rounded-md">
              #{currentElementId}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Kopiera artikelnummer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Design ID (Form):</span>
            <span className="font-mono font-black text-slate-800">#{currentPart.designId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Kategori:</span>
            <span className="font-bold text-slate-800">{currentPart.category}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block text-[10px]">Klossnamn & Dimension:</span>
            <span className="font-medium text-slate-800">
              {currentPart.name} ({currentPart.dimensions})
            </span>
          </div>
        </div>

        {/* Links to BrickLink and Rebrickable */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
          <a
            href={`https://www.bricklink.com/v2/catalog/catalogitem.page?P=${currentPart.designId}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            BrickLink Katalog
          </a>
          <span className="text-slate-300">•</span>
          <a
            href={`https://rebrickable.com/parts/${currentPart.designId}`}
            target="_blank"
            rel="noreferrer"
            className="text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Rebrickable API Ref
          </a>
        </div>
      </div>
    </div>
  );
};
