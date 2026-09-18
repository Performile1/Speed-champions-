import { LDrawPartInstance, getLDrawColorCode, LDRAW_COLOR_CODES } from '../data/ldrawModels';
import { CarPartColors, CarPartKey } from '../types';

export interface ModelIntegrityReport {
  isCoherent: boolean;
  floatingAssemblies: string[];
  asymmetryWarnings: string[];
  gaps: { from: string; to: string; gapDistanceLDU: number }[];
}

export interface CollisionReport {
  duplicatePositions: { id1: string; id2: string; pos: [number, number, number] }[];
  categoryMismatches: { id: string; designId: string; assignedPart: string; z: number; expectedPart: string }[];
  assemblyIntersections: { assemblyA: string; assemblyB: string; overlapZ: number }[];
}

export interface LDrawParseDiagnostics {
  totalLinesParsed: number;
  validPartsCount: number;
  outOfBoundsStrippedCount: number;
  rearWingTilesFixedCount: number;
  fallbackWheelsMounted: boolean;
  warnings: string[];
  integrityReport?: ModelIntegrityReport;
  collisionReport?: CollisionReport;
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
 * Categorizes a part into CarPartKey and subAssembly based on design ID and spatial position.
 * Uses exact Z boundaries and coordinate-precedence so versatile parts (like #15068) never
 * get misclassified into opposite ends of the vehicle.
 */
export function categorizePart(
  designId: string,
  x: number,
  y: number,
  z: number,
  colorCode: number
): { partKey: CarPartKey; subAssembly: string; stepNumber: number; pieceName: string } {
  const cleanId = designId.replace('.dat', '').toLowerCase();

  // 1. Hjul, Däck & Fälgar
  if (cleanId === '80249' || cleanId === '55981') {
    return {
      partKey: 'tireCompound',
      subAssembly: 'Wheels & Pirelli Tires',
      stepNumber: 11,
      pieceName: 'Speed Champions Pirelli Slick Racing Tire',
    };
  }
  if (cleanId === '112498' || cleanId === '6539343' || cleanId === '107728' || cleanId === '112423' || cleanId === '6014') {
    return {
      partKey: 'rims',
      subAssembly: 'Wheels & Pirelli Tires',
      stepNumber: 11,
      pieceName: '18-Inch Speed Champions Aero Rim & Hubcap',
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

  // 2. Förarutrustning & Hjälm
  if (cleanId === '112033' || cleanId === '2446' || cleanId === '18674' || cleanId === '62810') {
    return {
      partKey: 'driverHelmet',
      subAssembly: 'Cockpit Cell',
      stepNumber: 3,
      pieceName: 'Minifigure Modern F1 Racing Helmet',
    };
  }

  // 3. Halo & Backspeglar (Side Mirrors)
  if (cleanId === '100745' || cleanId === '65633' || cleanId === '6535158') {
    return {
      partKey: 'halo',
      subAssembly: 'Halo Structure',
      stepNumber: 6,
      pieceName: 'Halo Roll-Bar Titanium Protection Arch',
    };
  }
  if (cleanId === '80179' || cleanId === '6515221' || cleanId === '4592c02' || cleanId === '4592') {
    return {
      partKey: 'cockpit',
      subAssembly: 'Side Mirrors',
      stepNumber: 6,
      pieceName: 'F1 Rearview Aero Mirror Pod (#80179)',
    };
  }

  // 3b. Technic-delar (Pinnar, axlar och vinkelbalkar för chassi/upphängning)
  // Isoleras så de inte misstas för karosspaneler/motorkåpa
  if (
    cleanId === '2780' ||
    cleanId === '3673' ||
    cleanId === '32054' ||
    cleanId === '6558' ||
    cleanId === '3705' ||
    cleanId === '3706' ||
    cleanId === '32062' ||
    cleanId === '43093' ||
    cleanId === '6536'
  ) {
    return {
      partKey: 'floor',
      subAssembly: 'Chassis Structure & Technic Hardware',
      stepNumber: 2,
      pieceName: cleanId === '2780' ? 'Technic Pin with Friction' : cleanId === '3673' ? 'Technic Pin Frictionless' : 'Technic Chassis Hardware Element',
    };
  }

  // 4. Framvinge & Endplates (Slutar strikt vid Z = -155)
  if (z <= -155 || cleanId === '112499') {
    if (Math.abs(x) >= 60 || cleanId === '2420') {
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
      pieceName: 'Front Wing Aerofoil & Splitter Element',
    };
  }

  // 5. Noskon (Från Z = -155 till Z = -30)
  if (z > -155 && z <= -30 && y <= -8) {
    return {
      partKey: 'nose',
      subAssembly: 'Nose Cone',
      stepNumber: 4,
      pieceName: cleanId === '15068' ? 'Slope Curved 2 x 2 Nose Cowl' : 'Nose Cone Aerodynamic Element',
    };
  }

  // 6. Bakvinge & DRS Flap (Z >= 165)
  if (z >= 165 || cleanId === '87079' || (cleanId === '3023' && z > 160)) {
    if (Math.abs(x) >= 45) {
      return {
        partKey: 'rearWingEndplates',
        subAssembly: 'Rear Wing',
        stepNumber: 10,
        pieceName: 'Tile 2 x 4 Rear Wing Vertical Endplate',
      };
    }
    return {
      partKey: 'rearWing',
      subAssembly: 'Rear Wing',
      stepNumber: 10,
      pieceName: 'Rear Wing DRS Aerofoil Flap',
    };
  }

  // 7. Shark Fin (Dorsal finne längs mitten bakom cockpit)
  if (cleanId === '2431' && Math.abs(x) <= 6 && z >= 25 && z <= 165) {
    return {
      partKey: 'sharkFin',
      subAssembly: 'Shark Fin',
      stepNumber: 9,
      pieceName: 'Tile 1 x 4 Dorsal Shark Fin Blade',
    };
  }

  // 8. Sidopoddar (Utåt sidorna mellan hjulaxlarna)
  if (Math.abs(x) >= 20 && z >= -30 && z <= 130 && y <= -6) {
    return {
      partKey: 'sidepods',
      subAssembly: 'Sidepods',
      stepNumber: 7,
      pieceName: 'Slope Curved Downwash Sidepod',
    };
  }

  // 9. Motorkåpa / Airbox (Mittenpartiet bakom cockpit vid Z > 20)
  if (z > 20 && z < 165 && y <= -12) {
    return {
      partKey: 'engineCover',
      subAssembly: 'Engine Cover',
      stepNumber: 8,
      pieceName: cleanId === '15068' ? 'Slope Curved 2 x 2 Engine Cover' : 'Engine Cover / Airbox Fairing',
    };
  }

  // 10. Golv & Undertray
  if (cleanId === '30029' || y >= -6) {
    return {
      partKey: 'floor',
      subAssembly: 'Floor & Undertray',
      stepNumber: 1,
      pieceName: 'Vehicle Base Undertray Plate',
    };
  }

  // 11. Cockpit & Förarcell (Standard för övriga klossar kring mitten)
  return {
    partKey: 'cockpit',
    subAssembly: 'Cockpit Cell',
    stepNumber: 2,
    pieceName: 'Chassis Core Monocoque Element',
  };
}

/**
 * Validates structural continuity along the Z axis, detects floating assemblies, and reports asymmetries
 */
export function checkModelIntegrity(instances: LDrawPartInstance[]): ModelIntegrityReport {
  const subAssemblies = ['Front Wing', 'Nose Cone', 'Cockpit Cell', 'Sidepods', 'Engine Cover', 'Rear Wing'];
  const bounds: Record<string, { minZ: number; maxZ: number }> = {};

  subAssemblies.forEach((name) => {
    const parts = instances.filter((p) => p.subAssembly === name);
    if (parts.length > 0) {
      bounds[name] = {
        minZ: Math.min(...parts.map((p) => p.z)),
        maxZ: Math.max(...parts.map((p) => p.z)),
      };
    }
  });

  const gaps: { from: string; to: string; gapDistanceLDU: number }[] = [];
  const sequence = [
    ['Front Wing', 'Nose Cone'],
    ['Nose Cone', 'Cockpit Cell'],
    ['Cockpit Cell', 'Engine Cover'],
    ['Engine Cover', 'Rear Wing'],
  ];

  sequence.forEach(([a, b]) => {
    if (bounds[a] && bounds[b]) {
      // Glapp uppstår om det inte finns något överlapp mellan sektionernas Z-gränser
      const distance = bounds[b].minZ - bounds[a].maxZ;
      if (distance > 10) {
        gaps.push({ from: a, to: b, gapDistanceLDU: distance });
      }
    }
  });

  // Kontrollera asymmetri för sidepods
  const sidepods = instances.filter((p) => p.partKey === 'sidepods');
  const leftSide = sidepods.filter((p) => p.x > 10).length;
  const rightSide = sidepods.filter((p) => p.x < -10).length;
  const asymmetryWarnings: string[] = [];

  if (Math.abs(leftSide - rightSide) > 2) {
    asymmetryWarnings.push(`Obalans i sidopoddarna: ${leftSide} st på vänster sida, ${rightSide} st på höger.`);
  }

  return {
    isCoherent: gaps.length === 0 && asymmetryWarnings.length === 0,
    floatingAssemblies: gaps.map((g) => `${g.to} svävar (glapp på ${g.gapDistanceLDU.toFixed(1)} LDU bakom ${g.from})`),
    asymmetryWarnings,
    gaps,
  };
}

/**
 * Detects negative gaps, exact overlapping duplicate coordinates, and spatial category mismatches
 */
export function detectCollisionsAndOverlaps(instances: LDrawPartInstance[]): CollisionReport {
  const duplicates: CollisionReport['duplicatePositions'] = [];
  const mismatches: CollisionReport['categoryMismatches'] = [];

  // 1. Kontrollera om två delar delar samma koordinat (fysisk krock)
  for (let i = 0; i < instances.length; i++) {
    for (let j = i + 1; j < instances.length; j++) {
      const a = instances[i];
      const b = instances[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

      if (dist < 1.0 && a.designId !== 'stud' && b.designId !== 'stud') {
        duplicates.push({ id1: a.id, id2: b.id, pos: [a.x, a.y, a.z] });
      }
    }
  }

  // 2. Kontrollera felplacerade delar (t.ex. nos i bakdelen)
  instances.forEach((inst) => {
    if (inst.partKey === 'nose' && inst.z > -30) {
      mismatches.push({
        id: inst.id,
        designId: inst.designId,
        assignedPart: 'nose',
        z: inst.z,
        expectedPart: inst.z > 140 ? 'rearWing' : 'engineCover / sidepods',
      });
    }
    if (inst.partKey === 'rearWing' && inst.z < 150) {
      mismatches.push({
        id: inst.id,
        designId: inst.designId,
        assignedPart: 'rearWing',
        z: inst.z,
        expectedPart: 'engineCover / cockpit',
      });
    }
  });

  return {
    duplicatePositions: duplicates,
    categoryMismatches: mismatches,
    assemblyIntersections: [],
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

  // Run integrity and collision analysis
  const integrityReport = checkModelIntegrity(instances);
  const collisionReport = detectCollisionsAndOverlaps(instances);

  if (collisionReport.duplicatePositions.length > 0) {
    warnings.push(
      `Upptäckte ${collisionReport.duplicatePositions.length} potentiella fysiska krockar (delar med identisk position).`
    );
  }

  if (collisionReport.categoryMismatches.length > 0) {
    warnings.push(
      `Upptäckte ${collisionReport.categoryMismatches.length} delar med rumslig kategoriseringsavvikelse.`
    );
  }

  if (!integrityReport.isCoherent) {
    if (integrityReport.floatingAssemblies.length > 0) {
      warnings.push(...integrityReport.floatingAssemblies);
    }
    if (integrityReport.asymmetryWarnings.length > 0) {
      warnings.push(...integrityReport.asymmetryWarnings);
    }
  }

  return {
    instances,
    diagnostics: {
      totalLinesParsed: lines.length,
      validPartsCount: instances.length,
      outOfBoundsStrippedCount,
      rearWingTilesFixedCount,
      fallbackWheelsMounted,
      warnings,
      integrityReport,
      collisionReport,
    },
    uniqueElementCount: uniqueElements.size,
  };
}
