import React, { useState } from 'react';
import { LegoF1Set, CarPartColors, CarDecals, ManualStep, GranularLegoPart } from '../types';
import { findLegoColorName } from '../data/legoColors';
import { getGranularLegoParts } from '../data/legoPartsDatabase';
import { generateInstructionManualPdf } from '../utils/pdfGenerator';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowDown,
  ArrowRight,
  ArrowDownRight,
  RotateCw,
  Compass,
  FileText,
  Printer,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstructionManualProps {
  set: LegoF1Set;
  colors: CarPartColors;
  decals: CarDecals;
  snapshotUrl?: string;
  parts?: GranularLegoPart[];
}

export const InstructionManual: React.FC<InstructionManualProps> = ({
  set,
  colors,
  decals,
  snapshotUrl,
  parts,
}) => {
  // Booklet page state: 0 = Cover page, 1..10 = Steps, 11 = Complete BOM Index
  const [currentPage, setCurrentPage] = useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const granularParts: GranularLegoPart[] = parts && parts.length > 0 ? parts : getGranularLegoParts(colors);

  // Generate 10 authentic LEGO building steps with exact element IDs, dimensions, and directional arrows
  const manualSteps: ManualStep[] = [
    {
      stepNumber: 1,
      title: 'Chassis Undertray & Ground-Effect Diffuser',
      subAssembly: 'Floor & Ground Effect',
      assemblyDirection: 'down',
      directionLabel: 'Press Downward Flush onto Flat Surface',
      studAlignment: 'Studs facing upward. Ensure 0.5mm ground clearance under Venturi tunnels.',
      description:
        'Construct the low-drag chassis foundation using dark undertray plates. Align the rear inverted aero diffuser tunnels and lateral bargeboard edges.',
      partsRequired: [
        {
          piece: 'Plate 2x4 Underside Structural Floor',
          designId: '3020',
          elementId: '6388484',
          quantity: 4,
          colorHex: colors.floor,
          colorName: findLegoColorName(colors.floor),
          dimensions: '32x16 mm',
        },
        {
          piece: 'Plate 1x6 Venturi Edge Strakes',
          designId: '3666',
          elementId: '6327409',
          quantity: 2,
          colorHex: colors.floor,
          colorName: findLegoColorName(colors.floor),
          dimensions: '48x8 mm',
        },
        {
          piece: 'Slope Inverted 45 2x2 Diffuser Ramp',
          designId: '3660',
          elementId: '6245250',
          quantity: 2,
          colorHex: '#1B1B1B',
          colorName: 'Black',
          dimensions: '16x16 mm Inverted',
        },
      ],
      arrowDirection: {
        type: 'down',
        label: 'Press Downward (Studs Snap ↓)',
        rotationDeg: 0,
      },
      tip: 'Assemble all undertray plates on a firm flat tabletop so the floor stays completely straight without warping.',
    },
    {
      stepNumber: 2,
      title: 'Monocoque Cockpit Cell & Minifigure Driver Seat',
      subAssembly: 'Cockpit Cell',
      assemblyDirection: 'down',
      directionLabel: 'Insert Vertically into Cockpit Cavity',
      studAlignment: 'Central stud lock. Steering wheel tilts 40° toward minifigure hands.',
      description:
        'Build the driver survival cell with side impact bolsters. Install the steering binnacle and seat the racing minifigure driver.',
      partsRequired: [
        {
          piece: 'Brick 2x2 Monocoque Tub',
          designId: '3003',
          elementId: '614126',
          quantity: 2,
          colorHex: colors.cockpit,
          colorName: findLegoColorName(colors.cockpit),
          dimensions: '16x16x10 mm',
        },
        {
          piece: 'Minifig Steering Wheel Stand with Binnacle',
          designId: '3829c01',
          elementId: '6284070',
          quantity: 1,
          colorHex: '#1B1B1B',
          colorName: 'Black',
          dimensions: '1x2 with Angled Wheel',
        },
        {
          piece: 'Minifigure Racing Helmet with Aerodynamic Visor',
          designId: '18674',
          elementId: '6428165',
          quantity: 1,
          colorHex: colors.driverHelmet,
          colorName: findLegoColorName(colors.driverHelmet),
          dimensions: 'Minifig Headgear',
        },
      ],
      arrowDirection: {
        type: 'down',
        label: 'Align Centered & Press Down ↓',
        rotationDeg: 0,
      },
      tip: 'Tilt the steering wheel down slightly before inserting the minifigure so their hands grip the wheel with authentic racing posture.',
    },
    {
      stepNumber: 3,
      title: 'Stepped Aerodynamic Nose Cone & Crash Structure',
      subAssembly: 'Nose Cone',
      assemblyDirection: 'forward',
      directionLabel: 'Slide Forward & Lock Down onto Bulkhead',
      studAlignment: 'Studs facing forward/upward (SNOT technique). Seamless taper to nose tip.',
      description:
        'Assemble the sculpted stepped nose crash structure using curved wedge slopes, locking the upper vanity panel over the front axle line.',
      partsRequired: [
        {
          piece: 'Wedge Slope 4x2 Stepped Nose Cone',
          designId: '93606',
          elementId: '6330191',
          quantity: 2,
          colorHex: colors.nose,
          colorName: findLegoColorName(colors.nose),
          dimensions: '32x16 mm Sloped',
        },
        {
          piece: 'Slope Curved 2x1 No Studs Nose Tip',
          designId: '11477',
          elementId: '6047222',
          quantity: 1,
          colorHex: colors.nose,
          colorName: findLegoColorName(colors.nose),
          dimensions: '16x8 mm Curved',
        },
        {
          piece: 'Tile 1x2 with Groove Racing Number Vanity Plate',
          designId: '3069b',
          elementId: '6252044',
          quantity: 2,
          colorHex: colors.nose,
          colorName: findLegoColorName(colors.nose),
          dimensions: '16x8 mm Smooth',
        },
      ],
      arrowDirection: {
        type: 'front-slide',
        label: 'Slide Forward & Press Onto Front Studs →',
        rotationDeg: 90,
      },
      tip: 'Ensure the nose tip aligns dead-center between the front wheels to channel high-speed airflow evenly to left and right sidepod inlets.',
    },
    {
      stepNumber: 4,
      title: 'Dual-Flap Front Wing & Outwash Endplates',
      subAssembly: 'Front Wing Assembly',
      assemblyDirection: 'inward-left',
      directionLabel: 'Mount Endplates Inward onto Main Wing Beam',
      studAlignment: 'Horizontal airfoil flap. Endplates vertical 90° outwash alignment.',
      description:
        'Mount the high-downforce front wing mainplane beneath the nose cone and attach the lateral endplate fences that divert tire wake vortexes.',
      partsRequired: [
        {
          piece: 'Tile 1x4 Downforce Wing Airfoil Mainplane',
          designId: '2431',
          elementId: '6254045',
          quantity: 2,
          colorHex: colors.frontWing,
          colorName: findLegoColorName(colors.frontWing),
          dimensions: '32x8 mm',
        },
        {
          piece: 'Plate 2x2 Corner Wing Outwash Endplate (Left)',
          designId: '2420',
          elementId: '6284699',
          quantity: 1,
          colorHex: colors.frontWingEndplates,
          colorName: findLegoColorName(colors.frontWingEndplates),
          dimensions: '16x16 mm Corner',
        },
        {
          piece: 'Plate 2x2 Corner Wing Outwash Endplate (Right)',
          designId: '2420',
          elementId: '6284700',
          quantity: 1,
          colorHex: colors.frontWingEndplates,
          colorName: findLegoColorName(colors.frontWingEndplates),
          dimensions: '16x16 mm Corner',
        },
      ],
      arrowDirection: {
        type: 'horizontal-in',
        label: 'Snap Endplates Inward onto Wing Tips ← →',
        rotationDeg: 180,
      },
      tip: 'Press firmly on the two central studs underneath the nose to ensure maximum rigidity against track vibration.',
    },
    {
      stepNumber: 5,
      title: 'FIA Titanium Halo Cockpit Safety Ring',
      subAssembly: 'Halo Safety Structure',
      assemblyDirection: 'down',
      directionLabel: 'Engage Central Pylon, Then Click Twin Rear Mounts',
      studAlignment: 'Tri-point connection: 1 forward central stud + 2 rear cockpit pillars.',
      description:
        'Lock the mandatory titanium Halo hoop securely over the driver cockpit cell to shield the driver minifigure in compliance with FIA safety specs.',
      partsRequired: [
        {
          piece: 'Speed Champions Titanium Halo Protection Ring',
          designId: '65633',
          elementId: '6330190',
          quantity: 1,
          colorHex: colors.halo,
          colorName: findLegoColorName(colors.halo),
          dimensions: 'Curved Specialized Halo',
        },
      ],
      arrowDirection: {
        type: 'down',
        label: 'Lower Vertically & Snap into Cockpit Frame ↓',
        rotationDeg: 0,
      },
      tip: 'The center strut clicks into the single stud directly ahead of the steering column. Press gently until you hear a solid LEGO click.',
    },
    {
      stepNumber: 6,
      title: 'Undercut Venturi Sidepods & Radiator Grilles',
      subAssembly: 'Undercut Sidepods',
      assemblyDirection: 'inward-left',
      directionLabel: 'Slide Inward from Both Sides into Chassis Rails',
      studAlignment: 'Inverted studs slide onto horizontal side brackets (8-stud authentic width).',
      description:
        'Install the sculpted left and right sidepod cowlings with deep undercuts that guide clean air along the floor edge toward the rear diffuser.',
      partsRequired: [
        {
          piece: 'Slope Curved 4x2 Sculpted Sidepod Shell (Left)',
          designId: '93606',
          elementId: '6342817',
          quantity: 2,
          colorHex: colors.sidepods,
          colorName: findLegoColorName(colors.sidepods),
          dimensions: '32x16 mm Curved',
        },
        {
          piece: 'Slope Curved 4x2 Sculpted Sidepod Shell (Right)',
          designId: '93606',
          elementId: '6342818',
          quantity: 2,
          colorHex: colors.sidepods,
          colorName: findLegoColorName(colors.sidepods),
          dimensions: '32x16 mm Curved',
        },
        {
          piece: 'Tile 1x2 Radiator Air Grille Matrix',
          designId: '2412b',
          elementId: '6174917',
          quantity: 2,
          colorHex: '#1B1B1B',
          colorName: 'Black',
          dimensions: '16x8 mm Grille',
        },
      ],
      arrowDirection: {
        type: 'horizontal-in',
        label: 'Push Inward from Left and Right → ←',
        rotationDeg: 270,
      },
      tip: 'Ensure the radiator grille ribs face straight forward into the airflow for maximum cooling efficiency.',
    },
    {
      stepNumber: 7,
      title: 'Engine Cover Airbox & Dorsal Shark Fin',
      subAssembly: 'Engine Cover & Airbox',
      assemblyDirection: 'down',
      directionLabel: 'Press Down along Center Spine from Airbox to Rear',
      studAlignment: 'Centerline stud lock. Shark fin vertical 90° blade orientation.',
      description:
        'Enclose the V6 Turbo-Hybrid power unit with the sleek engine cowling and mount the prominent dorsal shark fin for high-speed yaw stability.',
      partsRequired: [
        {
          piece: 'Slope Curved 2x2x2/3 Power Unit Engine Cowling',
          designId: '15068',
          elementId: '6245249',
          quantity: 4,
          colorHex: colors.engineCover,
          colorName: findLegoColorName(colors.engineCover),
          dimensions: '16x16 mm Curved',
        },
        {
          piece: 'Round Plate 1x1 Turbo Compressor Air Intake',
          designId: '6141',
          elementId: '614101',
          quantity: 1,
          colorHex: '#1B1B1B',
          colorName: 'Black',
          dimensions: '8 mm Round',
        },
        {
          piece: 'Tile 1x4 Dorsal Shark Fin Yaw Stabilizer',
          designId: '2431',
          elementId: '6254047',
          quantity: 2,
          colorHex: colors.sharkFin,
          colorName: findLegoColorName(colors.sharkFin),
          dimensions: '32x8 mm Fin',
        },
      ],
      arrowDirection: {
        type: 'down',
        label: 'Press Down along Car Centerline ↓',
        rotationDeg: 0,
      },
      tip: 'Align the shark fin precisely in a straight line with the Halo rear mounts and rear wing center pylon.',
    },
    {
      stepNumber: 8,
      title: 'Dual-Plane Rear Wing & DRS Actuator',
      subAssembly: 'Rear Wing & DRS Assembly',
      assemblyDirection: 'down',
      directionLabel: 'Mount Mainplane, Then Clip-In DRS Variable Flap',
      studAlignment: 'Swan-neck vertical supports. Upper DRS flap pivots on horizontal bar clip.',
      description:
        'Assemble the high-downforce rear wing assembly featuring swan-neck central pylons, slotted endplates, and an adjustable DRS flap.',
      partsRequired: [
        {
          piece: 'Tile 1x4 Downforce Beam Lower Mainplane',
          designId: '2431',
          elementId: '6254048',
          quantity: 2,
          colorHex: colors.rearWing,
          colorName: findLegoColorName(colors.rearWing),
          dimensions: '32x8 mm',
        },
        {
          piece: 'Tile 1x2 DRS Drag Reduction System Upper Flap',
          designId: '3069b',
          elementId: '6252045',
          quantity: 2,
          colorHex: colors.rearWing,
          colorName: findLegoColorName(colors.rearWing),
          dimensions: '16x8 mm Flap',
        },
        {
          piece: 'Bar 1L with Clip Mechanical DRS Hydraulic Actuator',
          designId: '11090',
          elementId: '6015344',
          quantity: 1,
          colorHex: '#1B1B1B',
          colorName: 'Black',
          dimensions: 'Bar Clip Pivot',
        },
      ],
      arrowDirection: {
        type: 'tilt-down',
        label: 'Clip DRS Flap into Center Actuator Bar ⤵',
        rotationDeg: 45,
      },
      tip: 'You can tilt the upper DRS flap open to simulate low drag overtaking mode on the straights!',
    },
    {
      stepNumber: 9,
      title: '18-Inch Aero Wheel Covers & Pirelli Slick Tires',
      subAssembly: 'Wheels & Running Gear',
      assemblyDirection: 'axle-press',
      directionLabel: 'Push Tires onto Technic Axles, Press In Aero Covers',
      studAlignment: 'Technic friction pin axle press-fit on all 4 corners.',
      description:
        'Fit the 4 wide rubber slick tires onto the Technic axle pins. Press the aerodynamic wheel discs into each rim hub to minimize aerodynamic drag.',
      partsRequired: [
        {
          piece: 'Speed Champions 18" Aero Rim Disc',
          designId: '6014',
          elementId: '6327408',
          quantity: 4,
          colorHex: colors.rims,
          colorName: findLegoColorName(colors.rims),
          dimensions: '18 mm Disc Hub',
        },
        {
          piece: 'F1 Slick Racing Rubber Tire with Compound Ring',
          designId: '80249',
          elementId: '6342816',
          quantity: 4,
          colorHex: colors.tireCompound,
          colorName: findLegoColorName(colors.tireCompound),
          dimensions: '30.4x14 mm Rubber',
        },
      ],
      arrowDirection: {
        type: 'wheel-mount',
        label: 'Press Tires onto 4 Technic Axle Pins ➔',
        rotationDeg: 90,
      },
      tip: 'The wider rear tires provide maximum grip and the authentic Speed Champions 8-stud wide aggressive track stance.',
    },
    {
      stepNumber: 10,
      title: 'Decal Sheet Application & Final Quality Inspection',
      subAssembly: 'Livery Decals & Polish',
      assemblyDirection: 'down',
      directionLabel: 'Apply Sticker Elements with Tweezers or Separator Edge',
      studAlignment: 'Center decals on smooth tiles and wings with uniform borders.',
      description: `Apply your customized decals: Driver #${decals.racingNumber} on the nose cone, ${decals.sponsorPrimary} on the sidepods, and ${decals.sponsorEngine} on the engine cowl.`,
      partsRequired: [
        {
          piece: `Sticker #${decals.racingNumber} Driver Nose & Fin Badge`,
          designId: 'STK-01',
          elementId: 'STK-77242',
          quantity: 1,
          colorHex: decals.accentStripeColor,
          colorName: 'Die-cut Sticker',
          dimensions: 'Adhesive Vinyl',
        },
        {
          piece: `Sticker ${decals.sponsorPrimary} Undercut Sidepod Decals`,
          designId: 'STK-02',
          elementId: 'STK-77242',
          quantity: 2,
          colorHex: '#FFFFFF',
          colorName: 'Die-cut Sticker',
          dimensions: 'Adhesive Vinyl',
        },
      ],
      arrowDirection: {
        type: 'down',
        label: 'Align Decal Edge & Smooth Down Firmly ↓',
        rotationDeg: 0,
      },
      tip: 'Use the tip of a LEGO brick separator or tweezers to position decals precisely before smoothing down.',
    },
  ];

  const totalPages = manualSteps.length + 2; // Cover + Steps + BOM

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    try {
      generateInstructionManualPdf(
        set,
        colors,
        decals,
        manualSteps,
        granularParts,
        snapshotUrl
      );
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 1200);
    }
  };

  const currentStep = currentPage > 0 && currentPage <= manualSteps.length ? manualSteps[currentPage - 1] : null;

  return (
    <div className="flex flex-col gap-5 bg-white border border-slate-200 rounded-3xl p-5 lg:p-6 shadow-sm">
      {/* Header with Title & Download PDF Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-xs border border-amber-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                Officiell LEGO Byggmanual med Monteringspilar
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200 font-bold">
                Bläddringsbar PDF-Booklet
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Set #{set.articleNumber} • Sida {currentPage + 1} av {totalPages}
            </p>
          </div>
        </div>

        {/* Download Flippable PDF Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 shadow-xs border border-amber-500 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingPdf ? 'Skapar PDF...' : 'Ladda ner bläddringsbar PDF'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors shadow-2xs"
            title="Skriv ut direkt via webbläsaren"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Skriv ut</span>
          </button>
        </div>
      </div>

      {/* Page Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setCurrentPage(0)}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
            currentPage === 0
              ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Omslag
        </button>

        {manualSteps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
              currentPage === idx + 1
                ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Steg {step.stepNumber}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(manualSteps.length + 1)}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
            currentPage === manualSteps.length + 1
              ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Artikellista (BOM)
        </button>
      </div>

      {/* MAIN FLIPPABLE BOOKLET VIEW */}
      {/* ---------------------------------------------------- */}
      {/* PAGE 0: COVER PAGE */}
      {/* ---------------------------------------------------- */}
      {currentPage === 0 && (
        <div className="relative bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg overflow-hidden min-h-[460px] flex flex-col justify-between border border-slate-800">
          {/* Top authentic LEGO yellow band */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-amber-400" />

          <div className="flex items-start justify-between gap-4 pt-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md italic">
                LEGO
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black italic tracking-tight">
                  SPEED <span className="text-amber-400">CHAMPIONS</span>
                </h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                  Officiella Bygginstruktioner • Formel 1
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-amber-400">#{set.articleNumber}</span>
              <p className="text-xs text-slate-400">{set.pieceCount} Klossar</p>
            </div>
          </div>

          {/* Center: Car Hero Image or 3D Render Snapshot */}
          <div className="flex flex-col items-center justify-center my-6 py-4">
            {snapshotUrl ? (
              <img
                src={snapshotUrl}
                alt={set.name}
                className="max-h-60 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <div className="text-center p-8 bg-slate-800/60 rounded-3xl border border-slate-700 max-w-md">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">{set.name}</h3>
                <p className="text-xs text-slate-400">
                  {set.team} ({set.year}) • {set.pieceCount} Delar i anpassad lackering
                </p>
              </div>
            )}
          </div>

          {/* Cover Footer Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-4">
              <span>Åldersgräns: {set.era === 'classic-6-wide' ? '8+' : '10+'}</span>
              <span>•</span>
              <span>Chassi: 8 Knoppar Bredd (8-Wide)</span>
              <span>•</span>
              <span>Minifigur Förare: #{decals.racingNumber}</span>
            </div>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black font-sans flex items-center gap-2 transition-all"
            >
              <span>Börja Bygga (Steg 1)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PAGES 1..10: STEP PAGES WITH DIRECTIONAL ARROWS */}
      {/* ---------------------------------------------------- */}
      {currentStep && (
        <div className="relative bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm min-h-[460px] flex flex-col justify-between overflow-hidden">
          {/* Top Yellow LEGO band */}
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-amber-400" />

          {/* Step Top Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-xs border border-amber-500 shrink-0">
                {currentStep.stepNumber}
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Delområde: {currentStep.subAssembly}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
                  {currentStep.description}
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end text-right text-xs text-slate-500 font-mono">
              <span className="font-bold text-slate-800">Set #{set.articleNumber}</span>
              <span>Steg {currentStep.stepNumber} av {manualSteps.length}</span>
            </div>
          </div>

          {/* Main Grid: Required Parts (Left) & Directional Assembly Illustration (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-stretch">
            {/* Left Column: Required Parts Callout Box with Element Numbers */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-800">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Klossar för steg {currentStep.stepNumber}:</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Element ID</span>
                </div>

                <div className="space-y-2.5">
                  {currentStep.partsRequired.map((part, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-lg border border-slate-300 shadow-2xs shrink-0"
                          style={{ backgroundColor: part.colorHex }}
                        />
                        <div>
                          <div className="font-bold text-slate-900 leading-snug">{part.piece}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Kloss #{part.designId} • Art #{part.elementId} • {part.dimensions}
                          </div>
                          <div className="text-[10px] text-amber-700 font-medium">
                            {part.colorName}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-black text-slate-950 text-base px-2.5 py-1 bg-amber-100 rounded-xl border border-amber-300/80 shrink-0">
                        {part.quantity}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stud alignment notice */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{currentStep.studAlignment}</span>
              </div>
            </div>

            {/* Right Column: Directional Assembly Diagram with directional arrow indicators */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between items-center relative overflow-hidden">
              {/* Direction Indicator Banner */}
              <div className="w-full flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-950 font-bold mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>MONTERINGSRIKTNING:</span>
                  <span className="text-amber-800 font-black">{currentStep.directionLabel}</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded font-mono">
                  {currentStep.assemblyDirection.toUpperCase()}
                </span>
              </div>

              {/* Central Arrow Visualization Stage */}
              <div className="w-full flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl relative min-h-[180px]">
                {/* Visual Assembly Direction Arrow Box */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md border-2 border-amber-500 transition-transform hover:scale-105">
                    {currentStep.arrowDirection.type === 'down' && <ArrowDown className="w-10 h-10 stroke-[3]" />}
                    {currentStep.arrowDirection.type === 'front-slide' && <ArrowRight className="w-10 h-10 stroke-[3]" />}
                    {currentStep.arrowDirection.type === 'horizontal-in' && <ArrowDownRight className="w-10 h-10 stroke-[3]" />}
                    {currentStep.arrowDirection.type === 'tilt-down' && <RotateCw className="w-10 h-10 stroke-[3]" />}
                    {currentStep.arrowDirection.type === 'wheel-mount' && <ArrowRight className="w-10 h-10 stroke-[3]" />}
                  </div>

                  <div className="text-center">
                    <span className="text-sm font-black text-slate-900 block">
                      {currentStep.arrowDirection.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      Tryck tills klossen klickar fast mot underliggande knoppar
                    </span>
                  </div>
                </div>

                {/* Background snapshot overlay if available */}
                {snapshotUrl && (
                  <div className="absolute right-3 bottom-3 opacity-25 pointer-events-none max-w-[120px]">
                    <img src={snapshotUrl} alt="3D reference" className="w-full object-contain" />
                  </div>
                )}
              </div>

              {/* Sub-Assembly Step Note */}
              <div className="w-full mt-4 text-center text-xs text-slate-500 font-mono">
                Figur {currentStep.stepNumber}.1: Knoppjustering för {currentStep.subAssembly}
              </div>
            </div>
          </div>

          {/* Master Builder Tip Banner */}
          {currentStep.tip && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 mb-4 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong className="font-bold text-amber-900">LEGO Master Builder Tips: </strong>
                {currentStep.tip}
              </span>
            </div>
          )}

          {/* Bottom Flipping Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Föregående sida</span>
            </button>

            <span className="text-xs text-slate-600 font-mono font-semibold">
              Sida {currentPage + 1} av {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-xs border border-amber-500 transition-all cursor-pointer"
            >
              <span>Nästa sida</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FINAL PAGE: COMPLETE BILL OF MATERIALS (BOM) INDEX */}
      {/* ---------------------------------------------------- */}
      {currentPage === manualSteps.length + 1 && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Komplett Artikellista & Kloss-Inventering (BOM)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alla {granularParts.length} unika LEGO-element med artikelnummer och BrickLink Color IDs för #{set.articleNumber}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs border border-amber-500"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Spara som PDF</span>
                </button>
              </div>
            </div>

            {/* Parts Inventory Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs max-h-[460px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                    <th className="py-2.5 px-3">Design ID</th>
                    <th className="py-2.5 px-3">Artikelnummer (Element ID)</th>
                    <th className="py-2.5 px-3">Klossbeskrivning</th>
                    <th className="py-2.5 px-3">Delområde</th>
                    <th className="py-2.5 px-3">Färg</th>
                    <th className="py-2.5 px-3 text-right">Antal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {granularParts.map((part, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-amber-700">
                        #{part.designId}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {part.elementId}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {part.name}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {part.subAssembly}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: part.colorHex }}
                          />
                          <span className="text-[11px] text-slate-700">{part.colorName}</span>
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

          {/* Bottom Flipping Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-4">
            <button
              onClick={() => setCurrentPage(manualSteps.length)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Föregående sida (Steg 10)</span>
            </button>

            <span className="text-xs text-slate-600 font-mono font-semibold">
              Sida {totalPages} av {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(0)}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-xs border border-amber-500 transition-all cursor-pointer"
            >
              <span>Tillbaka till Omslag</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
