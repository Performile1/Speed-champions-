import * as THREE from 'three';
import { LDrawPartInstance } from '../data/ldrawModels';

export interface KnollingTransform {
  x: number;
  y: number;
  z: number;
  zone: 'FRONT' | 'MID' | 'REAR';
  // Rotation quaternion in Three.js coordinates
  quaternion: THREE.Quaternion;
}

/**
 * Determine which functional zone an LDraw instance belongs to:
 * - Zone 1: FRONT (Left, x offset ~ -190 LDU): Nose, Front Wing, Splitters, Front Deflectors, Front Axle & Wheels
 * - Zone 2: MID (Center, x offset ~ 0 LDU): Floor, Cockpit, Halo, Driver Helmet, Steering Wheel, SNOT Sidepods
 * - Zone 3: REAR (Right, x offset ~ +190 LDU): Engine Cover, V6 Power Unit, Shark Fin, DRS Rear Wing, Diffuser, Rear Axle & Wheels
 */
export function getPartZone(inst: LDrawPartInstance): 'FRONT' | 'MID' | 'REAR' {
  if (
    inst.subAssembly === 'Front Wing' ||
    inst.subAssembly === 'Nose Cone' ||
    inst.designId === '3388' ||
    inst.designId === '3389' ||
    inst.designId === '112499' ||
    inst.designId === '6806'
  ) {
    return 'FRONT';
  }

  if (
    inst.subAssembly === 'Rear Wing' ||
    inst.subAssembly === 'Engine Cover' ||
    inst.subAssembly === 'Shark Fin'
  ) {
    return 'REAR';
  }

  if (inst.subAssembly === 'Wheels & Pirelli Tires') {
    return inst.z < 0 ? 'FRONT' : 'REAR';
  }

  // Position-based fallback
  if (inst.z < -60) {
    return 'FRONT';
  }
  if (inst.z > 60) {
    return 'REAR';
  }

  return 'MID';
}

/**
 * Priority sorting within each zone to create a visually satisfying,
 * organized Speed Champions knolling arrangement (matching official LEGO studio layout)
 */
function getZoneSortScore(inst: LDrawPartInstance): number {
  const isTire = inst.partKey === 'tireCompound' || inst.designId === '80249';
  const isRim = inst.partKey === 'rims' || inst.designId === '107728' || inst.designId === '112423';
  const isAeroCap = inst.designId === '112498';
  const isDeflector = inst.designId === '3388' || inst.designId === '3389';
  const isSteeringWheel = inst.designId === '106739';
  const isHelmet = inst.designId === '18674';
  const isHalo = inst.designId === '100745' || inst.partKey === 'halo';
  const isCurvedSlope = inst.designId === '11477' || inst.designId === '93606' || inst.designId === '15068';
  const isBracket = inst.designId === '99207' || inst.designId === '99781' || inst.designId === '36840';
  const isTile = inst.designId.startsWith('3069') || inst.designId.startsWith('2431') || inst.designId.startsWith('3068');
  const isLongPlate = inst.designId === '3020' || inst.designId === '3666' || inst.designId === '3710';
  const isSmallPlate = inst.designId === '3023' || inst.designId === '3024' || inst.designId === '2420';

  // Sort order:
  // 1. Large aero surfaces & curved slopes (top)
  if (isCurvedSlope) return 10;
  if (isTile) return 20;
  // 2. Cockpit / Steering / Helmet (special center pieces)
  if (isHelmet) return 25;
  if (isSteeringWheel) return 28;
  if (isHalo) return 30;
  if (isDeflector) return 35;
  // 3. Brackets & Structural Bricks
  if (isBracket) return 40;
  if (isLongPlate) return 50;
  if (isSmallPlate) return 60;
  // 4. Wheels, Rims, Hubcaps at the very bottom
  if (isAeroCap) return 90;
  if (isRim) return 92;
  if (isTire) return 95;

  return 70;
}

/**
 * Computes organized 3-zone knolling table coordinates for all 275 pieces
 * with generous clearance (colWidth = 42-45 LDU, rowHeight = 36-40 LDU)
 * and distinct FRONT / MID / REAR studio bays
 */
export function computeKnollingLayout(
  instances: LDrawPartInstance[]
): Map<string, KnollingTransform> {
  const map = new Map<string, KnollingTransform>();

  // 1. Group instances into 3 zones
  const frontParts: LDrawPartInstance[] = [];
  const midParts: LDrawPartInstance[] = [];
  const rearParts: LDrawPartInstance[] = [];

  instances.forEach((inst) => {
    const zone = getPartZone(inst);
    if (zone === 'FRONT') frontParts.push(inst);
    else if (zone === 'REAR') rearParts.push(inst);
    else midParts.push(inst);
  });

  // Sort each zone internally by aesthetic knolling order
  const sortZone = (arr: LDrawPartInstance[]) => {
    arr.sort((a, b) => {
      const sA = getZoneSortScore(a);
      const sB = getZoneSortScore(b);
      if (sA !== sB) return sA - sB;
      if (a.colorCode !== b.colorCode) return a.colorCode - b.colorCode;
      if (a.designId !== b.designId) return a.designId.localeCompare(b.designId);
      return a.id.localeCompare(b.id);
    });
  };

  sortZone(frontParts);
  sortZone(midParts);
  sortZone(rearParts);

  // Configuration for 3 distinct zones
  // Spacing: colWidth = 45 LDU, rowHeight = 40 LDU as required by LDU specification
  const COL_WIDTH = 45; // LDU horizontal spacing between studs
  const ROW_HEIGHT = 40; // LDU vertical spacing between rows

  // Layout a zone in a neat rectangular grid
  const layoutZoneGrid = (
    parts: LDrawPartInstance[],
    zoneName: 'FRONT' | 'MID' | 'REAR',
    centerX: number,
    numCols: number
  ) => {
    const totalRows = Math.ceil(parts.length / numCols);
    const startZ = -((totalRows - 1) * ROW_HEIGHT) / 2;
    const startX = centerX - ((numCols - 1) * COL_WIDTH) / 2;

    parts.forEach((inst, index) => {
      const col = index % numCols;
      const row = Math.floor(index / numCols);

      const x = startX + col * COL_WIDTH;
      const z = startZ + row * ROW_HEIGHT;
      const y = 2.0; // Rest gently on table plane

      const isTire = inst.partKey === 'tireCompound' || inst.designId === '80249';
      const isRim = inst.partKey === 'rims' || inst.designId === '107728' || inst.designId === '112423';
      const isAeroCap = inst.designId === '112498';

      const quat = new THREE.Quaternion();
      if (isTire || isRim || isAeroCap) {
        // Lay wheel/tire flat on table with hub facing up (+Y)
        quat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      } else {
        // Flat on table with studs pointing up (+Y in Three.js)
        quat.set(0, 0, 0, 1);
      }

      map.set(inst.id, {
        x,
        y,
        z,
        zone: zoneName,
        quaternion: quat,
      });
    });
  };

  // Zone 1: FRONT ASSEMBLY (Left side, X offset = -180 LDU, 4 columns)
  layoutZoneGrid(frontParts, 'FRONT', -180, 4);

  // Zone 2: MID CHASSIS & COCKPIT (Center, X offset = 0 LDU, 5 columns)
  layoutZoneGrid(midParts, 'MID', 0, 5);

  // Zone 3: REAR & DIFFUSER (Right side, X offset = +180 LDU, 4 columns)
  layoutZoneGrid(rearParts, 'REAR', 180, 4);

  return map;
}
