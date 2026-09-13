import { GranularLegoPart, CarPartColors, LegoF1Set, BomPart } from '../types';
import { findLegoColorName, getLegoColorByHex } from './legoColors';
import { buildLDrawSetInstances } from './ldrawModels';
import { LEGO_F1_SETS } from './legoSets';

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
  '#1B2A34': 11, // Solid Black
  '#646464': 85, // Dark Bluish Gray
};

export function getBrickLinkColorId(hex: string): number {
  const cleanHex = hex.toUpperCase();
  if (BRICKLINK_COLOR_MAP[cleanHex]) return BRICKLINK_COLOR_MAP[cleanHex];
  // Fallback match nearest
  return 11; // default to black if unspecified
}

/**
 * Returns all 275 individual parsed LEGO bricks for the F1 car
 * generated dynamically from the authentic LDraw assembly instances.
 */
export function getGranularLegoParts(
  colors: CarPartColors,
  set: LegoF1Set = LEGO_F1_SETS[0]
): GranularLegoPart[] {
  const { instances } = buildLDrawSetInstances(set, colors);

  return instances.map((inst) => {
    const hex = inst.partKey === 'tireCompound' ? '#1B2A34' : colors[inst.partKey] || inst.colorHex;
    const name = findLegoColorName(hex);
    const blId = getBrickLinkColorId(hex);
    const legoCol = getLegoColorByHex(hex);

    let category: GranularLegoPart['category'] = 'Plates';
    if (inst.pieceName.includes('Slope')) category = 'Slopes';
    else if (inst.pieceName.includes('Tile')) category = 'Tiles';
    else if (inst.pieceName.includes('Brick')) category = 'Bricks';
    else if (
      inst.pieceName.includes('Tire') ||
      inst.pieceName.includes('Rim') ||
      inst.pieceName.includes('Wheel')
    ) {
      category = 'Wheels & Axles';
    } else if (inst.pieceName.includes('Helmet') || inst.pieceName.includes('Minifigure')) {
      category = 'Minifig';
    } else if (
      inst.pieceName.includes('Halo') ||
      inst.pieceName.includes('Wing') ||
      inst.pieceName.includes('Shark Fin') ||
      inst.pieceName.includes('Endplate') ||
      inst.pieceName.includes('Deflector') ||
      inst.pieceName.includes('Mirror') ||
      inst.pieceName.includes('Arch')
    ) {
      category = 'Aero & Halo';
    }

    let studOrientation = 'Studs facing UP';
    if (inst.subAssembly === 'Sidepods' && (inst.pieceName.includes('Bracket') || inst.pieceName.includes('SNOT'))) {
      studOrientation = 'Studs / curves facing OUTWARD (SNOT 90°)';
    } else if (inst.subAssembly === 'Front Wing' || inst.subAssembly === 'Rear Wing') {
      studOrientation = 'Aerodynamic aerofoil plane';
    } else if (inst.subAssembly === 'Wheels & Pirelli Tires') {
      studOrientation = 'Axle center spindle mount';
    }

    return {
      id: inst.id,
      partKey: inst.partKey,
      designId: inst.designId,
      elementId: inst.elementId,
      name: inst.pieceName,
      subAssembly: inst.subAssembly,
      category,
      quantity: 1,
      colorHex: hex,
      colorName: name,
      brickLinkColorId: blId,
      legoColorId: legoCol?.id || 1,
      dimensions: inst.pieceName.match(/\d\s*x\s*\d/)?.[0] || 'Standard Element',
      studOrientation,
      assemblyStep: inst.stepNumber,
      direction: 'down',
      directionText: `Assembly step ${inst.stepNumber} in ${inst.subAssembly}`,
    };
  });
}

/**
 * Groups all individual parts into a unique Bill of Materials (BOM)
 * with consolidated quantities for factory ordering & inventory checking.
 */
export function groupPartsToBom(parts: GranularLegoPart[]): BomPart[] {
  const map = new Map<string, BomPart>();

  for (const p of parts) {
    const key = `${p.designId}_${p.brickLinkColorId}_${p.colorHex}`;
    if (!map.has(key)) {
      map.set(key, {
        elementId: p.elementId,
        designId: p.designId,
        name: p.name.replace(/\s+(Front|Rear|Mid|Left|Right|Cowl|Lock|Bulkhead|Pad|1|2|3|4|5|6|7|8|9).*/i, '').trim() || p.name,
        category: p.category,
        quantity: 0,
        partKey: p.partKey,
        colorName: p.colorName,
        colorHex: p.colorHex,
        brickLinkColorId: p.brickLinkColorId,
      });
    }
    map.get(key)!.quantity += p.quantity;
  }

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

/**
 * Generates an official BrickLink XML file string ready to upload to
 * https://www.bricklink.com/v2/wanted/upload.page
 * Consolidates all 275 pieces into unique BOM items with accurate quantities.
 */
export function generateBrickLinkXml(parts: GranularLegoPart[]): string {
  const bom = groupPartsToBom(parts);
  const itemsXml = bom
    .map(
      (p) => `  <ITEM>
    <ITEMTYPE>P</ITEMTYPE>
    <ITEMID>${p.designId}</ITEMID>
    <COLOR>${p.brickLinkColorId}</COLOR>
    <MINQTY>${p.quantity}</MINQTY>
    <CONDITION>N</CONDITION>
    <REMARKS>LEGO Speed Champions F1 - ${p.name.replace(/&/g, '&amp;')}</REMARKS>
  </ITEM>`
    )
    .join('\n');

  return `<INVENTORY>
<!-- LEGO Speed Champions F1 Livery MOC Wanted List (Total ${parts.length} Bricks, ${bom.length} Unique Elements) -->
<!-- Upload directly at https://www.bricklink.com/v2/wanted/upload.page -->
${itemsXml}
</INVENTORY>`;
}

/**
 * Generates an official BrickLink CSV inventory string.
 */
export function generateBrickLinkCsv(parts: GranularLegoPart[]): string {
  const bom = groupPartsToBom(parts);
  const header = 'Item No,Item Name,Category,Color ID,Color Name,Qty,Condition,Element No\n';
  const rows = bom
    .map(
      (p) =>
        `"${p.designId}","${p.name.replace(/"/g, '""')}","${p.category}",${p.brickLinkColorId},"${p.colorName}",${p.quantity},"N","${p.elementId}"`
    )
    .join('\n');
  return header + rows;
}
