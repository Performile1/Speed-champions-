import { LDrawPartInstance, getLDrawColorCode, LDRAW_COLOR_CODES } from '../data/ldrawModels';
import { CarPartColors, CarPartKey } from '../types';

export interface LDrawParseDiagnostics {
  totalLinesParsed: number;
  validPartsCount: number;
  outOfBoundsStrippedCount: number;
  rearWingTilesFixedCount: number;
  fallbackWheelsMounted: boolean;
  warnings: string[];
}

export interface LDrawParseResult {
  instances: LDrawPartInstance[];
  diagnostics: LDrawParseDiagnostics;
  uniqueElementCount: number;
}

/**
 * Bounds for standard 8-stud wide Speed Champions Formula 1 car in LDraw coordinates
 * (1 LDU = 0.4mm, 20 LDU = 1 stud).
 * 
 * Strict Bounding Constraints:
 * - Z axis: Front wing nose ends at Z = -225 LDU, Rear wing DRS flap ends at Z = +210 LDU.
 *   Discard any plate with Z > 220 LDU or Z < -240 LDU. (Strips runaway debug spines up to Z=2200).
 * - X axis: Outer tire rims sit at X = ±61 LDU, aero dishes at ±72.5 LDU, front wing corners at ±76 LDU.
 *   Discard any element with Math.abs(X) > 90 LDU.
 * - Y axis: Base floor sits at Y = 0, shark fin top at Y = -50 LDU, camera T-bar at Y = -48 LDU.
 *   Discard any element with Y < -75 LDU or Y > 25 LDU.
 */
export const VEHICLE_BOUNDS = {
  MIN_Z: -240,
  MAX_Z: 220,
  MAX_ABS_X: 90,
  MIN_Y: -75,
  MAX_Y: 25,
};

/**
 * Categorizes a part into CarPartKey and subAssembly based on design ID and spatial position
 */
export function categorizePart(
  designId: string,
  x: number,
  y: number,
  z: number,
  colorCode: number
): { partKey: CarPartKey; subAssembly: string; stepNumber: number; pieceName: string } {
  const cleanId = designId.replace('.dat', '').toLowerCase();

  // Wheels, Tires, Aero Dishes
  if (cleanId === '80249' || cleanId === '55981') {
    return {
      partKey: 'tireCompound',
      subAssembly: 'Wheels & Pirelli Tires',
      stepNumber: 11,
      pieceName: 'Speed Champions Pirelli Slick Racing Tire',
    };
  }
  if (cleanId === '112498' || cleanId === '6539343') {
    return {
      partKey: 'rims',
      subAssembly: 'Wheels & Pirelli Tires',
      stepNumber: 11,
      pieceName: 'Dish 16mm Aero Wheel Cover Hubcap',
    };
  }
  if (cleanId === '107728' || cleanId === '112423' || cleanId === '6014') {
    return {
      partKey: 'rims',
      subAssembly: 'Wheels & Pirelli Tires',
      stepNumber: 11,
      pieceName: '18-Inch Speed Champions Aero Rim',
    };
  }
  if (cleanId === '3388' || cleanId === '3389') {
    return {
      partKey: 'frontWing',
      subAssembly: 'Wheels & Pirelli Tires',
      stepNumber: 11,
      pieceName: 'Front Wheel Aero Deflector / Winglet',
    };
  }

  // Driver Helmet & Minifig
  if (cleanId === '112033' || cleanId === '2446' || cleanId === '18674') {
    return {
      partKey: 'driverHelmet',
      subAssembly: 'Cockpit Cell',
      stepNumber: 3,
      pieceName: 'Minifigure Modern F1 Racing Helmet with Aero Winglet',
    };
  }
  if (cleanId === '62810') {
    return {
      partKey: 'driverHelmet',
      subAssembly: 'Cockpit Cell',
      stepNumber: 3,
      pieceName: 'Minifigure Swept-Back Paddock Hair',
    };
  }

  // Halo Structure
  if (cleanId === '100745' || cleanId === '6535158' || cleanId === '65633') {
    return {
      partKey: 'halo',
      subAssembly: 'Halo Structure',
      stepNumber: 6,
      pieceName: 'Halo Roll-Bar Titanium Protection Arch',
    };
  }

  // Rearview Mirrors
  if (cleanId === '80179' || cleanId === '6515221') {
    return {
      partKey: 'nose',
      subAssembly: 'Halo Structure',
      stepNumber: 6,
      pieceName: 'F1 Rearview Aero Mirror Pod (Spoon No. 1)',
    };
  }

  // Front Wing Elements (Z <= -180 LDU)
  if (z <= -185) {
    if (Math.abs(x) >= 70 || cleanId === '2420') {
      return {
        partKey: 'frontWingEndplates',
        subAssembly: 'Front Wing',
        stepNumber: 5,
        pieceName: 'Plate 2 x 2 Corner Outwash Endplate',
      };
    }
    return {
      partKey: 'frontWing',
      subAssembly: 'Front Wing',
      stepNumber: 5,
      pieceName: cleanId === '112499' ? 'Plate 1 x 4 x 2/3 Outside Bow Wing Splitter' : 'Front Wing Aerofoil Element',
    };
  }

  // Rear Wing Elements (Z >= 170 LDU and Y <= -28 LDU)
  if (z >= 170 && y <= -28) {
    if (Math.abs(x) >= 55 || cleanId === '87079' || cleanId === '3020') {
      return {
        partKey: 'rearWingEndplates',
        subAssembly: 'Rear Wing',
        stepNumber: 10,
        pieceName: 'Tile 2 x 4 Rear Wing Vertical Endplate (Smooth)',
      };
    }
    return {
      partKey: 'rearWing',
      subAssembly: 'Rear Wing',
      stepNumber: 10,
      pieceName: 'Rear Wing DRS Aerofoil Flap',
    };
  }

  // Shark Fin (X close to 0, Y <= -45, Z between 50 and 160)
  if (Math.abs(x) <= 6 && y <= -44 && z >= 50 && z <= 165) {
    return {
      partKey: 'sharkFin',
      subAssembly: 'Shark Fin',
      stepNumber: 9,
      pieceName: 'Tile 1 x 4 Dorsal Shark Fin Blade',
    };
  }

  // Engine Cover / Airbox (Y <= -30 and Z >= 25 and Z <= 150)
  if (y <= -28 && z >= 25 && z <= 150) {
    return {
      partKey: 'engineCover',
      subAssembly: 'Engine Cover',
      stepNumber: 8,
      pieceName: 'Slope Curved Engine Cover / Airbox',
    };
  }

  // Sidepods (Math.abs(X) >= 30, Z between -75 and 80)
  if (Math.abs(x) >= 30 && z >= -75 && z <= 80) {
    return {
      partKey: 'sidepods',
      subAssembly: 'Sidepods',
      stepNumber: 7,
      pieceName: cleanId === '93606' ? 'Slope Curved 4 x 2 Undercut Downwash Sidepod' : 'Sidepod Aero Bodywork',
    };
  }

  // Nose Cone (Z between -185 and -120, Y <= -12)
  if (z >= -185 && z <= -120 && y <= -12) {
    return {
      partKey: 'nose',
      subAssembly: 'Nose Cone',
      stepNumber: 4,
      pieceName: 'Slope Curved Stepped Nose Cowl',
    };
  }

  // Floor / Undertray (Y >= -8 or underbody plates)
  if (y >= -8 || cleanId === '30029') {
    return {
      partKey: 'floor',
      subAssembly: 'Floor & Undertray',
      stepNumber: 1,
      pieceName: cleanId === '30029' ? 'Vehicle Base Undertray Plate 4 x 12' : 'Floor Venturi Undertray Plate',
    };
  }

  // Default: Cockpit / Chassis Core
  return {
    partKey: 'cockpit',
    subAssembly: 'Cockpit Cell',
    stepNumber: 2,
    pieceName: 'Chassis Core Monocoque Element',
  };
}

/**
 * Standardized 4-wheel assembly to guarantee completeness even on truncated or incomplete LDR models
 */
export function createStandardWheelAssembly(
  articleNumber: string,
  colors: CarPartColors
): LDrawPartInstance[] {
  const cTire = 256; // Rubber Black
  const cRims = getLDrawColorCode(colors.rims || '#1B1B1B');
  const cFW = getLDrawColorCode(colors.frontWing);

  const rotY90: [number, number, number, number, number, number, number, number, number] = [0, 0, 1, 0, 1, 0, -1, 0, 0];
  const rotYMinus90: [number, number, number, number, number, number, number, number, number] = [0, 0, -1, 0, 1, 0, 1, 0, 0];

  const wheelCorners = [
    { corner: 'FL', x: 60, z: -140, isRear: false, wheelDesign: '107728', wheelElem: '6481568', wheelName: 'Wheel 24 x 13.4 Front' },
    { corner: 'FR', x: -60, z: -140, isRear: false, wheelDesign: '107728', wheelElem: '6481568', wheelName: 'Wheel 24 x 13.4 Front' },
    { corner: 'RL', x: 60, z: 140, isRear: true, wheelDesign: '112423', wheelElem: '6538245', wheelName: 'Wheel 24 x 14.9 Rear Wide' },
    { corner: 'RR', x: -60, z: 140, isRear: true, wheelDesign: '112423', wheelElem: '6538245', wheelName: 'Wheel 24 x 14.9 Rear Wide' },
  ];

  const wheelInstances: LDrawPartInstance[] = [];

  // Front Wheel Aero Deflectors / Winglets
  wheelInstances.push({
    id: `ldr-${articleNumber}-deflector-L`,
    designId: '3388',
    elementId: '6515219',
    pieceName: 'Front Wheel Aero Deflector / Winglet (Left)',
    subAssembly: 'Wheels & Pirelli Tires',
    partKey: 'frontWing',
    colorCode: cFW,
    colorHex: colors.frontWing,
    stepNumber: 11,
    x: 60,
    y: -38,
    z: -140,
    rot: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  });

  wheelInstances.push({
    id: `ldr-${articleNumber}-deflector-R`,
    designId: '3389',
    elementId: '6515220',
    pieceName: 'Front Wheel Aero Deflector / Winglet (Right)',
    subAssembly: 'Wheels & Pirelli Tires',
    partKey: 'frontWing',
    colorCode: cFW,
    colorHex: colors.frontWing,
    stepNumber: 11,
    x: -60,
    y: -38,
    z: -140,
    rot: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  });

  wheelCorners.forEach((c) => {
    const wheelRot = c.x > 0 ? rotY90 : rotYMinus90;
    const dishX = c.x > 0 ? c.x + 12.5 : c.x - 12.5;

    // Slick Tire
    wheelInstances.push({
      id: `ldr-${articleNumber}-tire-${c.corner}`,
      designId: '80249',
      elementId: '6342816',
      pieceName: `Speed Champions Pirelli ${c.isRear ? 'Rear' : 'Front'} Slick Tire (${c.corner})`,
      subAssembly: 'Wheels & Pirelli Tires',
      partKey: 'tireCompound',
      colorCode: cTire,
      colorHex: '#1B2A34',
      stepNumber: 11,
      stageNumber: 4,
      x: c.x,
      y: -14,
      z: c.z,
      rot: wheelRot,
    });

    // Rim
    wheelInstances.push({
      id: `ldr-${articleNumber}-rim-${c.corner}`,
      designId: c.wheelDesign,
      elementId: c.wheelElem,
      pieceName: `${c.wheelName} (${c.corner})`,
      subAssembly: 'Wheels & Pirelli Tires',
      partKey: 'rims',
      colorCode: cRims,
      colorHex: colors.rims,
      stepNumber: 11,
      stageNumber: 4,
      x: c.x > 0 ? c.x + 1 : c.x - 1,
      y: -14,
      z: c.z,
      rot: wheelRot,
    });

    // Aero Dish
    wheelInstances.push({
      id: `ldr-${articleNumber}-dish-${c.corner}`,
      designId: '112498',
      elementId: '6539343',
      pieceName: `Dish 16mm Aero Wheel Cover Hubcap (${c.corner})`,
      subAssembly: 'Wheels & Pirelli Tires',
      partKey: 'rims',
      colorCode: cRims,
      colorHex: colors.rims || '#C91A09',
      stepNumber: 11,
      stageNumber: 4,
      x: dishX,
      y: -14,
      z: c.z,
      rot: wheelRot,
    });
  });

  return wheelInstances;
}

/**
 * Robust LDraw text parser with automatic sanitization pipeline:
 * 1. Strips runaway out-of-bounds debug plate spines (Z > 220 or Z < -240, |X| > 90).
 * 2. Fixes rear wing endplate tile definition (replaces studded 3020.dat with smooth 87079.dat).
 * 3. Fallback 4-wheel assembly guarantee for truncated or incomplete files.
 * 4. Inverts LDraw Y axis cleanly so -Y is upwards and +Y is downwards.
 */
/**
 * Maps granular manual step numbers to the 4 official construction stages:
 * Stage 1 (Steps 1–20): Core Base #30029, front bulkhead, rear axle blocks, Technic anchors
 * Stage 2 (Steps 21–38): Cockpit module, driver seat, Halo anchor #6535158, steering, front wing cascade
 * Stage 3 (Steps 39–65): SNOT lateral sidepods with brackets (#99207/#99780) and vertical slopes (#11477/#93606)
 * Stage 4 (Steps 66–103): Engine cover spine, shark fin #2431, rear wing endplates #87079/DRS, 4-wheel mounting
 */
export function mapStepToStage(stepNumber: number): 1 | 2 | 3 | 4 {
  if (stepNumber <= 11) {
    if (stepNumber <= 2) return 1;
    if (stepNumber <= 6) return 2;
    if (stepNumber === 7) return 3;
    return 4;
  }
  if (stepNumber <= 20) return 1;
  if (stepNumber <= 38) return 2;
  if (stepNumber <= 65) return 3;
  return 4;
}

export function parseLDrawDocument(
  ldrText: string,
  articleNumber = '77242',
  defaultColors: CarPartColors = {
    nose: '#C91A09',
    frontWing: '#1B1B1B',
    frontWingEndplates: '#C91A09',
    halo: '#1B1B1B',
    cockpit: '#1B1B1B',
    driverHelmet: '#C91A09',
    sidepods: '#C91A09',
    engineCover: '#C91A09',
    sharkFin: '#1B1B1B',
    rearWing: '#1B1B1B',
    rearWingEndplates: '#C91A09',
    floor: '#1B1B1B',
    rims: '#1B1B1B',
    tireCompound: '#DC2626',
  }
): LDrawParseResult {
  const lines = ldrText.split(/\r?\n/);
  const instances: LDrawPartInstance[] = [];
  const warnings: string[] = [];

  let currentStep = 1;
  let outOfBoundsStrippedCount = 0;
  let rearWingTilesFixedCount = 0;
  let partIndex = 1;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    if (!rawLine) continue;

    // STEP command detection
    if (/^0\s+STEP/i.test(rawLine)) {
      currentStep++;
      continue;
    }

    // Line type 1: 1 <colour> <x> <y> <z> <a> <b> <c> <d> <e> <f> <g> <h> <i> <file>
    if (rawLine.startsWith('1 ')) {
      const tokens = rawLine.split(/\s+/);
      if (tokens.length < 15) {
        continue;
      }

      const colorCode = parseInt(tokens[1], 10) || 0;
      const x = parseFloat(tokens[2]);
      const y = parseFloat(tokens[3]);
      const z = parseFloat(tokens[4]);

      const a = parseFloat(tokens[5]);
      const b = parseFloat(tokens[6]);
      const c = parseFloat(tokens[7]);
      const d = parseFloat(tokens[8]);
      const e = parseFloat(tokens[9]);
      const f = parseFloat(tokens[10]);
      const g = parseFloat(tokens[11]);
      const h = parseFloat(tokens[12]);
      const i = parseFloat(tokens[13]);

      let designFile = tokens.slice(14).join(' ').toLowerCase();
      let cleanDesignId = designFile.replace('.dat', '').trim();

      // =========================================================================
      // SANITIZER 1: Strip Artificial / Out-of-Bounds Plate Spines (Runaway Z)
      // Discard any plate where Z > 220 LDU or Z < -240 LDU
      // Discard any plate where |X| > 90 LDU
      // Discard any plate where Y < -75 LDU or Y > 25 LDU
      // =========================================================================
      if (
        z > VEHICLE_BOUNDS.MAX_Z ||
        z < VEHICLE_BOUNDS.MIN_Z ||
        Math.abs(x) > VEHICLE_BOUNDS.MAX_ABS_X ||
        y < VEHICLE_BOUNDS.MIN_Y ||
        y > VEHICLE_BOUNDS.MAX_Y
      ) {
        outOfBoundsStrippedCount++;
        continue; // Strip runaway debug plates immediately
      }

      // =========================================================================
      // SANITIZER 2: Fix Rear Wing Endplate Tile Definition
      // In Step 10 across all models: Replace outer studded plate 3020.dat with
      // Tile 2 x 4 (Design #87079). Outer vertical faces at X = ±60 LDU must be smooth.
      // =========================================================================
      if (cleanDesignId === '3020' && Math.abs(x) >= 55 && z >= 170 && y <= -35) {
        cleanDesignId = '87079';
        rearWingTilesFixedCount++;
      }

      // Categorize part
      const cat = categorizePart(cleanDesignId, x, y, z, colorCode);

      // Color lookup
      let colorHex = defaultColors[cat.partKey];
      for (const item of Object.values(LDRAW_COLOR_CODES)) {
        if (item.code === colorCode) {
          colorHex = item.hex;
          break;
        }
      }

      instances.push({
        id: `ldr-${articleNumber}-parsed-${partIndex++}`,
        designId: cleanDesignId,
        elementId: `elem-${cleanDesignId}`,
        pieceName: cat.pieceName,
        subAssembly: cat.subAssembly,
        partKey: cat.partKey,
        colorCode,
        colorHex,
        stepNumber: cat.stepNumber || currentStep,
        stageNumber: mapStepToStage(cat.stepNumber || currentStep),
        x,
        y,
        z,
        rot: [a, b, c, d, e, f, g, h, i],
      });
    }
  }

  if (outOfBoundsStrippedCount > 0) {
    warnings.push(
      `Sanitizer stripped ${outOfBoundsStrippedCount} out-of-bounds / runaway plate spines outside vehicle bounds.`
    );
  }

  if (rearWingTilesFixedCount > 0) {
    warnings.push(
      `Sanitizer upgraded ${rearWingTilesFixedCount} rear wing endplate(s) to smooth Tile 2 x 4 (#87079) with zero exposed studs.`
    );
  }

  // =========================================================================
  // SANITIZER 3: Fallback Wheel Assembly for Truncated Files
  // If fewer than 4 tires (#80249), mount standardized 4-wheel assembly
  // =========================================================================
  const tiresFound = instances.filter((inst) => inst.designId === '80249' || inst.partKey === 'tireCompound');
  let fallbackWheelsMounted = false;

  if (tiresFound.length < 4) {
    fallbackWheelsMounted = true;
    warnings.push(
      `Model had ${tiresFound.length} wheel(s). Automatically mounted official 4-wheel Speed Champions assembly with aero dishes.`
    );
    const standardWheels = createStandardWheelAssembly(articleNumber, defaultColors);
    instances.push(...standardWheels);
  }

  const uniqueElements = new Set(instances.map((inst) => inst.designId));

  return {
    instances,
    diagnostics: {
      totalLinesParsed: lines.length,
      validPartsCount: instances.length,
      outOfBoundsStrippedCount,
      rearWingTilesFixedCount,
      fallbackWheelsMounted,
      warnings,
    },
    uniqueElementCount: uniqueElements.size,
  };
}
