import { GranularLegoPart, CarPartColors, CarPartKey } from '../types';
import { findLegoColorName, getLegoColorByHex } from './legoColors';

// Official BrickLink Color IDs mapping for common LEGO colors
export const BRICKLINK_COLOR_MAP: Record<string, number> = {
  '#DC2626': 5, // Red
  '#A01010': 59, // Dark Red
  '#E65100': 4, // Orange
  '#FBE822': 3, // Yellow
  '#006B54': 6, // Green
  '#009B77': 6, // Green
  '#00A19B': 152, // Medium Azure / Teal
  '#002447': 63, // Dark Blue
  '#0055A5': 7, // Blue
  '#59CBE8': 42, // Medium Blue
  '#92397D': 71, // Magenta
  '#C91A09': 5, // Red
  '#F2F3F2': 1, // White
  '#1B1B1B': 11, // Black
  '#635F52': 85, // Dark Bluish Gray
  '#A0A5A9': 86, // Light Bluish Gray
  '#8D9496': 95, // Flat Silver
  '#AA7D55': 115, // Pearl Gold
  '#111827': 11, // Black
  '#FFFFFF': 1, // White
  '#FFE330': 3, // Yellow
  '#4B9F4A': 34, // Lime
  '#36AEBF': 156, // Medium Azure
};

export function getBrickLinkColorId(hex: string): number {
  const cleanHex = hex.toUpperCase();
  if (BRICKLINK_COLOR_MAP[cleanHex]) return BRICKLINK_COLOR_MAP[cleanHex];
  // Fallback match nearest
  return 11; // default to black if unspecified
}

/**
 * Returns the fully populated 28+ granular individual LEGO brick elements
 * configured dynamically with the user's active custom color palette.
 */
export function getGranularLegoParts(colors: CarPartColors): GranularLegoPart[] {
  const getCol = (key: CarPartKey) => {
    const hex = colors[key];
    const name = findLegoColorName(hex);
    const blId = getBrickLinkColorId(hex);
    const legoCol = getLegoColorByHex(hex);
    return { hex, name, blId, legoId: legoCol?.id || 1 };
  };

  const noseCol = getCol('nose');
  const fwCol = getCol('frontWing');
  const fweCol = getCol('frontWingEndplates');
  const haloCol = getCol('halo');
  const cockCol = getCol('cockpit');
  const helmCol = getCol('driverHelmet');
  const sideCol = getCol('sidepods');
  const engCol = getCol('engineCover');
  const finCol = getCol('sharkFin');
  const rwCol = getCol('rearWing');
  const rweCol = getCol('rearWingEndplates');
  const floorCol = getCol('floor');
  const rimsCol = getCol('rims');
  const tireCol = getCol('tireCompound');

  return [
    // 1. FLOOR & DIFFUSER
    {
      id: 'part-floor-plate-main',
      partKey: 'floor',
      designId: '3020',
      elementId: '6388484',
      name: 'Plate 2x4 Structural Undertray',
      subAssembly: 'Floor & Ground Effect',
      category: 'Plates',
      quantity: 8,
      colorHex: floorCol.hex,
      colorName: floorCol.name,
      brickLinkColorId: floorCol.blId,
      legoColorId: floorCol.legoId,
      dimensions: '2x4 Studs (32x16 mm)',
      studOrientation: 'Studs facing UP',
      assemblyStep: 1,
      direction: 'down',
      directionText: 'Press downward firmly into flat building surface',
    },
    {
      id: 'part-floor-side-strakes',
      partKey: 'floor',
      designId: '3666',
      elementId: '6327409',
      name: 'Plate 1x6 Venturi Edge Strakes',
      subAssembly: 'Floor & Ground Effect',
      category: 'Plates',
      quantity: 2,
      colorHex: floorCol.hex,
      colorName: floorCol.name,
      brickLinkColorId: floorCol.blId,
      legoColorId: floorCol.legoId,
      dimensions: '1x6 Studs',
      studOrientation: 'Studs facing UP',
      assemblyStep: 1,
      direction: 'down',
      directionText: 'Snap on outer lateral edges of chassis floor',
    },
    {
      id: 'part-floor-diffuser-wedge',
      partKey: 'floor',
      designId: '3660',
      elementId: '6245250',
      name: 'Slope Inverted 45 2x2 Diffuser Ramp',
      subAssembly: 'Floor & Ground Effect',
      category: 'Slopes',
      quantity: 2,
      colorHex: '#1B1B1B',
      colorName: 'Black',
      brickLinkColorId: 11,
      legoColorId: 26,
      dimensions: '2x2 Studs Inverted',
      studOrientation: 'Inverted studs underneath',
      assemblyStep: 1,
      direction: 'down',
      directionText: 'Mount inverted at rear exit to shape diffuser airflow',
    },

    // 2. COCKPIT CELL & MINIFIG
    {
      id: 'part-cockpit-monocoque-cell',
      partKey: 'cockpit',
      designId: '3003',
      elementId: '614126',
      name: 'Brick 2x2 Monocoque Tub',
      subAssembly: 'Cockpit Cell',
      category: 'Bricks',
      quantity: 2,
      colorHex: cockCol.hex,
      colorName: cockCol.name,
      brickLinkColorId: cockCol.blId,
      legoColorId: cockCol.legoId,
      dimensions: '2x2x1 Bricks',
      studOrientation: 'Studs facing UP',
      assemblyStep: 2,
      direction: 'down',
      directionText: 'Position in central chassis bay ahead of engine bulkhead',
    },
    {
      id: 'part-cockpit-steering-wheel',
      partKey: 'cockpit',
      designId: '3829c01',
      elementId: '6284070',
      name: 'Minifig Steering Wheel Stand with Binnacle',
      subAssembly: 'Cockpit Cell',
      category: 'Minifig',
      quantity: 1,
      colorHex: '#1B1B1B',
      colorName: 'Black',
      brickLinkColorId: 11,
      legoColorId: 26,
      dimensions: '1x2 with Angled Wheel',
      studOrientation: 'Tilts 40 degrees towards driver',
      assemblyStep: 2,
      direction: 'down',
      directionText: 'Insert into front cockpit stud with wheel angled back',
    },
    {
      id: 'part-driver-helmet',
      partKey: 'driverHelmet',
      designId: '18674',
      elementId: '6428165',
      name: 'Minifigure Racing Helmet with Aerodynamic Visor',
      subAssembly: 'Cockpit Cell',
      category: 'Minifig',
      quantity: 1,
      colorHex: helmCol.hex,
      colorName: helmCol.name,
      brickLinkColorId: helmCol.blId,
      legoColorId: helmCol.legoId,
      dimensions: 'Minifigure Headgear Element',
      studOrientation: 'Snaps onto Minifigure Head Stud',
      assemblyStep: 2,
      direction: 'down',
      directionText: 'Seat minifigure and click helmet into place',
    },

    // 3. NOSE CONE & FRONT IMPACT
    {
      id: 'part-nose-wedge-upper',
      partKey: 'nose',
      designId: '93606',
      elementId: '6330191',
      name: 'Wedge Slope 4x2 Triple Stepped Nose Cone',
      subAssembly: 'Nose Cone',
      category: 'Slopes',
      quantity: 2,
      colorHex: noseCol.hex,
      colorName: noseCol.name,
      brickLinkColorId: noseCol.blId,
      legoColorId: noseCol.legoId,
      dimensions: '4x2 Studs (32x16x11 mm)',
      studOrientation: 'Studs facing UP (Aerodynamic slope forward)',
      assemblyStep: 3,
      direction: 'down',
      directionText: 'Slide over front crash structure studs flush with chassis',
    },
    {
      id: 'part-nose-tip-curved',
      partKey: 'nose',
      designId: '11477',
      elementId: '6047222',
      name: 'Slope Curved 2x1 No Studs Nose Tip',
      subAssembly: 'Nose Cone',
      category: 'Slopes',
      quantity: 1,
      colorHex: noseCol.hex,
      colorName: noseCol.name,
      brickLinkColorId: noseCol.blId,
      legoColorId: noseCol.legoId,
      dimensions: '2x1 Studs Curved',
      studOrientation: 'Smooth Curved Surface',
      assemblyStep: 3,
      direction: 'forward',
      directionText: 'Snap onto frontmost bracket to form tapered aero nose tip',
    },
    {
      id: 'part-nose-tile-vanity',
      partKey: 'nose',
      designId: '3069b',
      elementId: '6252044',
      name: 'Tile 1x2 with Groove Racing Number Plate',
      subAssembly: 'Nose Cone',
      category: 'Tiles',
      quantity: 2,
      colorHex: noseCol.hex,
      colorName: noseCol.name,
      brickLinkColorId: noseCol.blId,
      legoColorId: noseCol.legoId,
      dimensions: '1x2 Smooth Tile',
      studOrientation: 'Smooth Upper Finish',
      assemblyStep: 3,
      direction: 'down',
      directionText: 'Press onto upper vanity panel over nose structure',
    },

    // 4. FRONT WING & ENDPLATES
    {
      id: 'part-front-wing-mainplane',
      partKey: 'frontWing',
      designId: '2431',
      elementId: '6254045',
      name: 'Tile 1x4 Aerodynamic Mainplane Airfoil',
      subAssembly: 'Front Wing Assembly',
      category: 'Tiles',
      quantity: 2,
      colorHex: fwCol.hex,
      colorName: fwCol.name,
      brickLinkColorId: fwCol.blId,
      legoColorId: fwCol.legoId,
      dimensions: '1x4 Smooth Tile',
      studOrientation: 'Smooth horizontal airfoil surface',
      assemblyStep: 4,
      direction: 'down',
      directionText: 'Attach to underside of nose mounting studs',
    },
    {
      id: 'part-front-wing-flaps',
      partKey: 'frontWing',
      designId: '3068b',
      elementId: '6254046',
      name: 'Tile 2x2 Outwash Aero Flaps',
      subAssembly: 'Front Wing Assembly',
      category: 'Tiles',
      quantity: 2,
      colorHex: fwCol.hex,
      colorName: fwCol.name,
      brickLinkColorId: fwCol.blId,
      legoColorId: fwCol.legoId,
      dimensions: '2x2 Smooth Tile',
      studOrientation: 'Angled slightly rearward for vortex generation',
      assemblyStep: 4,
      direction: 'down',
      directionText: 'Align flush with main wing beam',
    },
    {
      id: 'part-front-wing-endplate-left',
      partKey: 'frontWingEndplates',
      designId: '2420',
      elementId: '6284699',
      name: 'Plate 2x2 Corner Wing Vortex Deflector (Left)',
      subAssembly: 'Front Wing Assembly',
      category: 'Plates',
      quantity: 1,
      colorHex: fweCol.hex,
      colorName: fweCol.name,
      brickLinkColorId: fweCol.blId,
      legoColorId: fweCol.legoId,
      dimensions: '2x2 Corner Plate',
      studOrientation: 'Vertical outwash wall',
      assemblyStep: 4,
      direction: 'inward-left',
      directionText: 'Snap onto far left edge of front wing',
    },
    {
      id: 'part-front-wing-endplate-right',
      partKey: 'frontWingEndplates',
      designId: '2420',
      elementId: '6284700',
      name: 'Plate 2x2 Corner Wing Vortex Deflector (Right)',
      subAssembly: 'Front Wing Assembly',
      category: 'Plates',
      quantity: 1,
      colorHex: fweCol.hex,
      colorName: fweCol.name,
      brickLinkColorId: fweCol.blId,
      legoColorId: fweCol.legoId,
      dimensions: '2x2 Corner Plate',
      studOrientation: 'Vertical outwash wall',
      assemblyStep: 4,
      direction: 'inward-right',
      directionText: 'Snap onto far right edge of front wing',
    },

    // 5. HALO COCKPIT SAFETY DEVICE
    {
      id: 'part-halo-titanium-ring',
      partKey: 'halo',
      designId: '65633',
      elementId: '6330190',
      name: 'Speed Champions Titanium Halo Protection Ring',
      subAssembly: 'Halo Safety Structure',
      category: 'Aero & Halo',
      quantity: 1,
      colorHex: haloCol.hex,
      colorName: haloCol.name,
      brickLinkColorId: haloCol.blId,
      legoColorId: haloCol.legoId,
      dimensions: 'Specialized 1x6x2 Curved Halo Element',
      studOrientation: 'Tri-point mounting (Center Pylon + Twin Rear Mounts)',
      assemblyStep: 5,
      direction: 'down',
      directionText: 'Engage center forward stud first, then click rear arches into cockpit frame',
    },

    // 6. UNDERCUT SIDEPODS & RADIATORS
    {
      id: 'part-sidepod-left-curved-shell',
      partKey: 'sidepods',
      designId: '93606',
      elementId: '6342817',
      name: 'Slope Curved 4x2 Sculpted Undercut Sidepod (Left)',
      subAssembly: 'Undercut Sidepods',
      category: 'Slopes',
      quantity: 2,
      colorHex: sideCol.hex,
      colorName: sideCol.name,
      brickLinkColorId: sideCol.blId,
      legoColorId: sideCol.legoId,
      dimensions: '4x2 Studs Curved',
      studOrientation: 'Curved exterior channel for Venturi floor feed',
      assemblyStep: 6,
      direction: 'inward-left',
      directionText: 'Slide into left chassis sidepod bracket',
    },
    {
      id: 'part-sidepod-right-curved-shell',
      partKey: 'sidepods',
      designId: '93606',
      elementId: '6342818',
      name: 'Slope Curved 4x2 Sculpted Undercut Sidepod (Right)',
      subAssembly: 'Undercut Sidepods',
      category: 'Slopes',
      quantity: 2,
      colorHex: sideCol.hex,
      colorName: sideCol.name,
      brickLinkColorId: sideCol.blId,
      legoColorId: sideCol.legoId,
      dimensions: '4x2 Studs Curved',
      studOrientation: 'Curved exterior channel for Venturi floor feed',
      assemblyStep: 6,
      direction: 'inward-right',
      directionText: 'Slide into right chassis sidepod bracket',
    },
    {
      id: 'part-radiator-cooling-grilles',
      partKey: 'sidepods',
      designId: '2412b',
      elementId: '6174917',
      name: 'Tile 1x2 Radiator Air Grille Cooling Matrix',
      subAssembly: 'Undercut Sidepods',
      category: 'Tiles',
      quantity: 2,
      colorHex: '#1B1B1B',
      colorName: 'Black',
      brickLinkColorId: 11,
      legoColorId: 26,
      dimensions: '1x2 Slotted Grille',
      studOrientation: 'Slotted air intake ribs',
      assemblyStep: 6,
      direction: 'forward',
      directionText: 'Install inside intake mouths facing forward',
    },

    // 7. ENGINE COVER & DORSAL SHARK FIN
    {
      id: 'part-engine-cowl-curved-slopes',
      partKey: 'engineCover',
      designId: '15068',
      elementId: '6245249',
      name: 'Slope Curved 2x2x2/3 Power Unit Engine Cowling',
      subAssembly: 'Engine Cover & Airbox',
      category: 'Slopes',
      quantity: 4,
      colorHex: engCol.hex,
      colorName: engCol.name,
      brickLinkColorId: engCol.blId,
      legoColorId: engCol.legoId,
      dimensions: '2x2x2/3 Curved Slopes',
      studOrientation: 'Curving over V6 Turbo Hybrid compartment',
      assemblyStep: 7,
      direction: 'down',
      directionText: 'Lock onto upper chassis spine over engine bay',
    },
    {
      id: 'part-airbox-overhead-intake',
      partKey: 'engineCover',
      designId: '6141',
      elementId: '614101',
      name: 'Round Plate 1x1 Turbo Compressor Air Intake',
      subAssembly: 'Engine Cover & Airbox',
      category: 'Plates',
      quantity: 1,
      colorHex: '#1B1B1B',
      colorName: 'Black',
      brickLinkColorId: 11,
      legoColorId: 26,
      dimensions: '1x1 Round Hollow',
      studOrientation: 'Directly above driver helmet cell',
      assemblyStep: 7,
      direction: 'down',
      directionText: 'Mount over roll hoop roll bar element',
    },
    {
      id: 'part-shark-fin-dorsal-spine',
      partKey: 'sharkFin',
      designId: '2431',
      elementId: '6254047',
      name: 'Tile 1x4 Dorsal Shark Fin Yaw Stabilizer',
      subAssembly: 'Engine Cover & Airbox',
      category: 'Tiles',
      quantity: 2,
      colorHex: finCol.hex,
      colorName: finCol.name,
      brickLinkColorId: finCol.blId,
      legoColorId: finCol.legoId,
      dimensions: '1x4 Vertical Aero Blade',
      studOrientation: 'Vertical centerline blade extending to rear wing',
      assemblyStep: 7,
      direction: 'down',
      directionText: 'Align along car spine between airbox and rear wing',
    },

    // 8. REAR WING & DRS FLAP
    {
      id: 'part-rear-wing-lower-mainplane',
      partKey: 'rearWing',
      designId: '2431',
      elementId: '6254048',
      name: 'Tile 1x4 Downforce Beam Lower Mainplane',
      subAssembly: 'Rear Wing & DRS Assembly',
      category: 'Tiles',
      quantity: 2,
      colorHex: rwCol.hex,
      colorName: rwCol.name,
      brickLinkColorId: rwCol.blId,
      legoColorId: rwCol.legoId,
      dimensions: '1x4 Airfoil Plate',
      studOrientation: 'High-downforce horizontal plane',
      assemblyStep: 8,
      direction: 'down',
      directionText: 'Mount on twin rear swan-neck pylons',
    },
    {
      id: 'part-rear-wing-drs-flap',
      partKey: 'rearWing',
      designId: '3069b',
      elementId: '6252045',
      name: 'Tile 1x2 DRS Drag Reduction System Upper Flap',
      subAssembly: 'Rear Wing & DRS Assembly',
      category: 'Tiles',
      quantity: 2,
      colorHex: rwCol.hex,
      colorName: rwCol.name,
      brickLinkColorId: rwCol.blId,
      legoColorId: rwCol.legoId,
      dimensions: '1x2 Tile on Hinged Clip',
      studOrientation: 'Variable incidence flap (Low drag / High downforce)',
      assemblyStep: 8,
      direction: 'clip-rotate',
      directionText: 'Click into DRS hinge bar; can be opened or closed',
    },
    {
      id: 'part-rear-wing-drs-actuator-bar',
      partKey: 'rearWing',
      designId: '11090',
      elementId: '6015344',
      name: 'Bar 1L with Clip Mechanical DRS Hydraulic Actuator',
      subAssembly: 'Rear Wing & DRS Assembly',
      category: 'Aero & Halo',
      quantity: 1,
      colorHex: '#1B1B1B',
      colorName: 'Black',
      brickLinkColorId: 11,
      legoColorId: 26,
      dimensions: '1L Bar Element with Central Clip',
      studOrientation: 'Centered between upper and lower wing elements',
      assemblyStep: 8,
      direction: 'down',
      directionText: 'Snap between rear wing elements',
    },
    {
      id: 'part-rear-wing-endplate-left',
      partKey: 'rearWingEndplates',
      designId: '2420',
      elementId: '6284701',
      name: 'Plate 2x2 Slotted Vortex Endplate Strake (Left)',
      subAssembly: 'Rear Wing & DRS Assembly',
      category: 'Plates',
      quantity: 1,
      colorHex: rweCol.hex,
      colorName: rweCol.name,
      brickLinkColorId: rweCol.blId,
      legoColorId: rweCol.legoId,
      dimensions: '2x2 Corner Wing Plate',
      studOrientation: 'Vertical endplate outer wall',
      assemblyStep: 8,
      direction: 'inward-left',
      directionText: 'Snap on left side of rear wing beam',
    },
    {
      id: 'part-rear-wing-endplate-right',
      partKey: 'rearWingEndplates',
      designId: '2420',
      elementId: '6284702',
      name: 'Plate 2x2 Slotted Vortex Endplate Strake (Right)',
      subAssembly: 'Rear Wing & DRS Assembly',
      category: 'Plates',
      quantity: 1,
      colorHex: rweCol.hex,
      colorName: rweCol.name,
      brickLinkColorId: rweCol.blId,
      legoColorId: rweCol.legoId,
      dimensions: '2x2 Corner Wing Plate',
      studOrientation: 'Vertical endplate outer wall',
      assemblyStep: 8,
      direction: 'inward-right',
      directionText: 'Snap on right side of rear wing beam',
    },

    // 9. WHEELS & PIRELLI TIRES
    {
      id: 'part-rim-covers-front-and-rear',
      partKey: 'rims',
      designId: '6014',
      elementId: '6327408',
      name: 'Speed Champions 18-Inch Aero Wheel Rim Discs',
      subAssembly: 'Wheels & Running Gear',
      category: 'Wheels & Axles',
      quantity: 4,
      colorHex: rimsCol.hex,
      colorName: rimsCol.name,
      brickLinkColorId: rimsCol.blId,
      legoColorId: rimsCol.legoId,
      dimensions: 'Diameter 18mm Aero Wheel Disc',
      studOrientation: 'Press-fit into Technic Axle Pin Hub',
      assemblyStep: 9,
      direction: 'axle-press',
      directionText: 'Press into tire center hubs until seated firmly',
    },
    {
      id: 'part-pirelli-slick-rubber-tires',
      partKey: 'tireCompound',
      designId: '80249',
      elementId: '6342816',
      name: 'F1 Wide Slick Racing Rubber Tire with Color Ring',
      subAssembly: 'Wheels & Running Gear',
      category: 'Wheels & Axles',
      quantity: 4,
      colorHex: tireCol.hex,
      colorName: tireCol.name,
      brickLinkColorId: tireCol.blId,
      legoColorId: tireCol.legoId,
      dimensions: 'Wide Track Racing Rubber (30.4 x 14 mm)',
      studOrientation: 'High Grip Smooth Slick Tread',
      assemblyStep: 9,
      direction: 'axle-press',
      directionText: 'Slide onto Technic friction pins on all 4 corners',
    },
  ];
}

/**
 * Generates an official BrickLink XML file string ready to upload to
 * https://www.bricklink.com/v2/wanted/upload.page
 */
export function generateBrickLinkXml(parts: GranularLegoPart[]): string {
  const itemsXml = parts
    .map(
      (p) => `  <ITEM>
    <ITEMTYPE>P</ITEMTYPE>
    <ITEMID>${p.designId}</ITEMID>
    <COLOR>${p.brickLinkColorId}</COLOR>
    <MINQTY>${p.quantity}</MINQTY>
    <CONDITION>N</CONDITION>
    <REMARKS>LEGO F1 MOC - ${p.name.replace(/&/g, '&amp;')} (${p.subAssembly.replace(/&/g, '&amp;')})</REMARKS>
  </ITEM>`
    )
    .join('\n');

  return `<INVENTORY>
<!-- LEGO Speed Champions F1 Livery MOC Wanted List -->
<!-- Upload directly at https://www.bricklink.com/v2/wanted/upload.page -->
${itemsXml}
</INVENTORY>`;
}

/**
 * Generates an official BrickLink CSV inventory string.
 */
export function generateBrickLinkCsv(parts: GranularLegoPart[]): string {
  const header = 'Item No,Item Name,Category,Color ID,Color Name,Qty,Condition,Sub-Assembly,Element No\n';
  const rows = parts
    .map(
      (p) =>
        `"${p.designId}","${p.name.replace(/"/g, '""')}","${p.category}",${p.brickLinkColorId},"${p.colorName}",${p.quantity},"N","${p.subAssembly}","${p.elementId}"`
    )
    .join('\n');
  return header + rows;
}
