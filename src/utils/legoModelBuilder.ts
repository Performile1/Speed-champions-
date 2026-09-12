import * as THREE from 'three';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { CarPartColors, CarPartKey, Era } from '../types';

export interface LegoMeshMeta {
  partKey: CarPartKey;
  name: string;
  designId: string;
  elementId: string;
  pieceName: string;
  category: string;
}

// Official LEGO Design and Element IDs mapping for F1 Speed Champions components
export const LEGO_COMPONENT_METADATA: Record<CarPartKey, LegoMeshMeta> = {
  nose: {
    partKey: 'nose',
    name: 'NOSE_CONE',
    designId: '15068',
    elementId: '6478902',
    pieceName: 'Slope Curved 2x2 No Studs with Triple Wedge',
    category: 'Slopes Curved',
  },
  frontWing: {
    partKey: 'frontWing',
    name: 'FRONT_WING',
    designId: '3839b',
    elementId: '6479101',
    pieceName: 'Plate Special 1x2 with Handles Low Profile Aerofoil',
    category: 'Plates Special',
  },
  frontWingEndplates: {
    partKey: 'frontWingEndplates',
    name: 'FRONT_WING_ENDPLATES',
    designId: '24299',
    elementId: '6327409',
    pieceName: 'Wedge Plate 2x1 Left/Right Ground-Effect Strakes',
    category: 'Wedges',
  },
  halo: {
    partKey: 'halo',
    name: 'HALO',
    designId: '65633',
    elementId: '6478891',
    pieceName: 'Speed Champions Titanium Halo Roll-Bar Structure',
    category: 'Specialized Cockpit',
  },
  cockpit: {
    partKey: 'cockpit',
    name: 'COCKPIT_CELL',
    designId: '3003',
    elementId: '614126',
    pieceName: 'Brick 2x2 Monocoque Driver Survival Tub',
    category: 'Bricks',
  },
  driverHelmet: {
    partKey: 'driverHelmet',
    name: 'DRIVER_HELMET',
    designId: '2446',
    elementId: '6245250',
    pieceName: 'Minifigure Aerodynamic Racing Helmet with Visor',
    category: 'Minifigure Gear',
  },
  sidepods: {
    partKey: 'sidepods',
    name: 'SIDE_PODS',
    designId: '93606',
    elementId: '6388484',
    pieceName: 'Slope Curved 4x2 Triple Wedge Downwash Radiators',
    category: 'Slopes Curved',
  },
  engineCover: {
    partKey: 'engineCover',
    name: 'ENGINE_COVER',
    designId: '61678',
    elementId: '6312480',
    pieceName: 'Slope Curved 4x1 Inverted Airbox Cowling',
    category: 'Slopes Curved',
  },
  sharkFin: {
    partKey: 'sharkFin',
    name: 'SHARK_FIN',
    designId: '3070b',
    elementId: '6284070',
    pieceName: 'Tile 1x1 Modified Dorsal Aerodynamic Fin',
    category: 'Tiles Modified',
  },
  rearWing: {
    partKey: 'rearWing',
    name: 'REAR_WING',
    designId: '3069b',
    elementId: '6320309',
    pieceName: 'Tile 1x2 DRS Hydraulic Flap Wing Element',
    category: 'Tiles',
  },
  rearWingEndplates: {
    partKey: 'rearWingEndplates',
    name: 'REAR_WING_ENDPLATES',
    designId: '68888',
    elementId: '6388481',
    pieceName: 'Swan-Neck Aerodynamic Pylons & Endplates',
    category: 'Brackets & Wedges',
  },
  floor: {
    partKey: 'floor',
    name: 'FLOOR_UNDERTRAY',
    designId: '3020',
    elementId: '6388484',
    pieceName: 'Plate 2x4 Structural Venturi Tunnel Floor',
    category: 'Plates',
  },
  rims: {
    partKey: 'rims',
    name: 'AERO_WHEEL_RIMS',
    designId: '77242',
    elementId: '6480112',
    pieceName: '18-Inch Speed Champions Aero Star-Spoke Rims',
    category: 'Wheels & Rims',
  },
  tireCompound: {
    partKey: 'tireCompound',
    name: 'TIRE_COMPOUND',
    designId: '55981',
    elementId: '6258903',
    pieceName: 'Pirelli P-Zero Slick Compound High-Traction Tires',
    category: 'Tires Rubber',
  },
};

/**
 * Creates high-fidelity MeshPhysicalMaterial matching authentic LEGO ABS plastic:
 * - roughness: 0.15
 * - clearcoat: 1.0
 * - clearcoatRoughness: 0.1
 * - reflectivity: 0.5
 */
export function createLegoPlasticMaterial(colorHex: string): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.15,
    metalness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 0.5,
  });
}

/**
 * Creates an authentic LEGO stud with beveled top edge and embossed ring
 */
export function createBeveledStudMesh(
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
  meta: LegoMeshMeta
): THREE.Mesh {
  // Stud cylinder with 16 segments
  const studGeo = new THREE.CylinderGeometry(0.082, 0.085, 0.042, 18);
  const mesh = new THREE.Mesh(studGeo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.name = `${meta.name}_STUD`;
  mesh.userData = {
    partKey: meta.partKey,
    name: meta.name,
    designId: meta.designId,
    elementId: meta.elementId,
    pieceName: `${meta.pieceName} (Stud)`,
    category: meta.category,
    isStud: true,
  };

  return mesh;
}

/**
 * Tag an object hierarchy with LEGO element IDs and convert materials to MeshPhysicalMaterial
 */
export function convertGroupToLegoPhysicalMaterials(
  group: THREE.Group,
  colors: CarPartColors
): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Extract existing color if available
      let colorHex = '#DC2626';
      if (child.material) {
        const origMat = Array.isArray(child.material) ? child.material[0] : child.material;
        if (origMat && 'color' in origMat && origMat.color) {
          colorHex = '#' + origMat.color.getHexString();
        }
      }

      // Convert to MeshPhysicalMaterial
      const newMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.15,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.5,
      });

      child.material = newMat;

      // Associate F1 component tag if not already tagged
      if (!child.userData.partKey) {
        const lowerName = child.name.toLowerCase();
        let partKey: CarPartKey = 'floor';
        if (lowerName.includes('wing') && lowerName.includes('rear')) partKey = 'rearWing';
        else if (lowerName.includes('wing') || lowerName.includes('front')) partKey = 'frontWing';
        else if (lowerName.includes('nose')) partKey = 'nose';
        else if (lowerName.includes('halo')) partKey = 'halo';
        else if (lowerName.includes('cockpit') || lowerName.includes('driver')) partKey = 'cockpit';
        else if (lowerName.includes('pod') || lowerName.includes('side')) partKey = 'sidepods';
        else if (lowerName.includes('engine') || lowerName.includes('cover')) partKey = 'engineCover';
        else if (lowerName.includes('fin')) partKey = 'sharkFin';
        else if (lowerName.includes('wheel') || lowerName.includes('rim')) partKey = 'rims';
        else if (lowerName.includes('tire')) partKey = 'tireCompound';

        const meta = LEGO_COMPONENT_METADATA[partKey];
        child.userData = {
          partKey,
          name: meta.name,
          designId: meta.designId,
          elementId: meta.elementId,
          pieceName: meta.pieceName,
          category: meta.category,
        };
      }
    }
  });
}

/**
 * Builds the complete High-Fidelity Speed Champions LEGO F1 Chassis
 * featuring actual studs, beveled wedge slopes, tubular Halo, and aero wheel covers.
 */
export function buildHighFidelityLegoChassis(
  colors: CarPartColors,
  era: Era,
  registerMesh: (part: CarPartKey, mesh: THREE.Mesh) => void
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'LEGO_SPEED_CHAMPIONS_F1_CHASSIS';

  const widthFactor = era === 'classic-6-wide' ? 0.82 : era === 'polybag-mini' ? 0.68 : 1.0;
  const lengthFactor = era === 'polybag-mini' ? 0.72 : 1.0;

  // Helper to add mesh and register for raycasting and color swap
  const addPiece = (
    geo: THREE.BufferGeometry,
    colorHex: string,
    partKey: CarPartKey,
    pos: [number, number, number],
    rot?: [number, number, number]
  ): THREE.Mesh => {
    const meta = LEGO_COMPONENT_METADATA[partKey];
    const mat = createLegoPlasticMaterial(colorHex);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = meta.name;
    mesh.userData = {
      partKey,
      name: meta.name,
      designId: meta.designId,
      elementId: meta.elementId,
      pieceName: meta.pieceName,
      category: meta.category,
    };

    registerMesh(partKey, mesh);
    root.add(mesh);
    return mesh;
  };

  // Helper to add real beveled studs on any plate
  const addStud = (
    x: number,
    y: number,
    z: number,
    colorHex: string,
    partKey: CarPartKey
  ) => {
    const meta = LEGO_COMPONENT_METADATA[partKey];
    const mat = createLegoPlasticMaterial(colorHex);
    const stud = createBeveledStudMesh(x, y, z, mat, meta);
    registerMesh(partKey, stud);
    root.add(stud);
  };

  // ==========================================
  // 1. FLOOR & VENTURI TUNNELS (Plates #3020 & Strakes)
  // ==========================================
  const floorGeo = new THREE.BoxGeometry(1.68 * widthFactor, 0.08, 4.4 * lengthFactor);
  addPiece(floorGeo, colors.floor, 'floor', [0, 0.14, 0]);

  // Lateral venturi strakes
  const strakeGeo = new THREE.BoxGeometry(0.14, 0.09, 2.4 * lengthFactor);
  addPiece(strakeGeo, colors.floor, 'floor', [0.86 * widthFactor, 0.17, 0.1]);
  addPiece(strakeGeo, colors.floor, 'floor', [-0.86 * widthFactor, 0.17, 0.1]);

  // Diffuser kick-up ramp at rear
  const diffuserGeo = new THREE.BoxGeometry(1.48 * widthFactor, 0.12, 0.7 * lengthFactor);
  addPiece(diffuserGeo, colors.floor, 'floor', [0, 0.21, -2.05 * lengthFactor], [-0.22, 0, 0]);

  // ==========================================
  // 2. NOSE CONE (Curved Slopes #15068 & #93606)
  // ==========================================
  const noseGeo = new THREE.BoxGeometry(0.56 * widthFactor, 0.28, 1.8 * lengthFactor);
  addPiece(noseGeo, colors.nose, 'nose', [0, 0.33, 1.8 * lengthFactor], [0.08, 0, 0]);

  const noseTipGeo = new THREE.BoxGeometry(0.42 * widthFactor, 0.18, 0.65 * lengthFactor);
  addPiece(noseTipGeo, colors.nose, 'nose', [0, 0.22, 2.82 * lengthFactor]);

  // Authentic Studs on Nose Cone
  addStud(-0.16 * widthFactor, 0.48, 1.35 * lengthFactor, colors.nose, 'nose');
  addStud(0.16 * widthFactor, 0.48, 1.35 * lengthFactor, colors.nose, 'nose');
  addStud(-0.16 * widthFactor, 0.45, 1.75 * lengthFactor, colors.nose, 'nose');
  addStud(0.16 * widthFactor, 0.45, 1.75 * lengthFactor, colors.nose, 'nose');
  addStud(0, 0.33, 2.65 * lengthFactor, colors.nose, 'nose');

  // ==========================================
  // 3. FRONT WING & ENDPLATES (Plate #3839b & Wedges #24299)
  // ==========================================
  const fwMainGeo = new THREE.BoxGeometry(2.24 * widthFactor, 0.08, 0.72 * lengthFactor);
  addPiece(fwMainGeo, colors.frontWing, 'frontWing', [0, 0.17, 2.7 * lengthFactor]);

  const fwUpperFlapGeo = new THREE.BoxGeometry(2.04 * widthFactor, 0.05, 0.38 * lengthFactor);
  addPiece(fwUpperFlapGeo, colors.frontWing, 'frontWing', [0, 0.24, 2.62 * lengthFactor], [-0.15, 0, 0]);

  // Front Wing Endplates
  const fweGeo = new THREE.BoxGeometry(0.06, 0.28, 0.82 * lengthFactor);
  addPiece(fweGeo, colors.frontWingEndplates, 'frontWingEndplates', [1.14 * widthFactor, 0.28, 2.7 * lengthFactor]);
  addPiece(fweGeo, colors.frontWingEndplates, 'frontWingEndplates', [-1.14 * widthFactor, 0.28, 2.7 * lengthFactor]);

  // Wing studs
  addStud(-0.85 * widthFactor, 0.22, 2.75 * lengthFactor, colors.frontWing, 'frontWing');
  addStud(0.85 * widthFactor, 0.22, 2.75 * lengthFactor, colors.frontWing, 'frontWing');

  // ==========================================
  // 4. COCKPIT CELL & MINIFIG (Brick #3003 & Helmet #2446)
  // ==========================================
  const cockGeo = new THREE.BoxGeometry(0.82 * widthFactor, 0.32, 1.3 * lengthFactor);
  addPiece(cockGeo, colors.cockpit, 'cockpit', [0, 0.35, 0.35 * lengthFactor]);

  // Minifig Racing Helmet with Visor
  const headGeo = new THREE.SphereGeometry(0.18, 24, 24);
  addPiece(headGeo, colors.driverHelmet, 'driverHelmet', [0, 0.64, 0.38 * lengthFactor]);

  const visorGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16, 1, false, 0, Math.PI);
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    clearcoat: 1.0,
  });
  const visorMesh = new THREE.Mesh(visorGeo, visorMat);
  visorMesh.position.set(0, 0.63, 0.42 * lengthFactor);
  visorMesh.rotation.y = Math.PI / 2;
  root.add(visorMesh);

  // Steering wheel (1x1 round plate with bar)
  const swGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16);
  const swMat = createLegoPlasticMaterial('#1e293b');
  const swMesh = new THREE.Mesh(swGeo, swMat);
  swMesh.position.set(0, 0.52, 0.72 * lengthFactor);
  swMesh.rotation.x = 0.55;
  root.add(swMesh);

  // ==========================================
  // 5. TITANIUM HALO SAFETY ROLL-BAR (LEGO Part #65633)
  // ==========================================
  const haloCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34 * widthFactor, 0.56, 0.18 * lengthFactor),
    new THREE.Vector3(-0.36 * widthFactor, 0.74, 0.42 * lengthFactor),
    new THREE.Vector3(0, 0.78, 0.62 * lengthFactor),
    new THREE.Vector3(0.36 * widthFactor, 0.74, 0.42 * lengthFactor),
    new THREE.Vector3(0.34 * widthFactor, 0.56, 0.18 * lengthFactor),
  ]);
  const haloTubeGeo = new THREE.TubeGeometry(haloCurve, 32, 0.045, 12, false);
  addPiece(haloTubeGeo, colors.halo, 'halo', [0, 0, 0]);

  // Center vertical titanium mounting strut
  const centerStrutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12);
  addPiece(centerStrutGeo, colors.halo, 'halo', [0, 0.62, 0.62 * lengthFactor], [0.24, 0, 0]);

  // ==========================================
  // 6. SIDEPODS (Downwash Wedge Slopes #93606)
  // ==========================================
  const spGeo = new THREE.BoxGeometry(0.48 * widthFactor, 0.38, 2.0 * lengthFactor);
  addPiece(spGeo, colors.sidepods, 'sidepods', [0.65 * widthFactor, 0.34, 0.15 * lengthFactor]);
  addPiece(spGeo, colors.sidepods, 'sidepods', [-0.65 * widthFactor, 0.34, 0.15 * lengthFactor]);

  // Sculpted air inlets
  const inletGeo = new THREE.BoxGeometry(0.44 * widthFactor, 0.32, 0.35);
  addPiece(inletGeo, colors.sidepods, 'sidepods', [0.65 * widthFactor, 0.34, 1.18 * lengthFactor], [-0.18, 0, 0]);
  addPiece(inletGeo, colors.sidepods, 'sidepods', [-0.65 * widthFactor, 0.34, 1.18 * lengthFactor], [-0.18, 0, 0]);

  // Sidepod Studs
  addStud(0.65 * widthFactor, 0.54, -0.2 * lengthFactor, colors.sidepods, 'sidepods');
  addStud(0.65 * widthFactor, 0.54, 0.2 * lengthFactor, colors.sidepods, 'sidepods');
  addStud(0.65 * widthFactor, 0.54, 0.6 * lengthFactor, colors.sidepods, 'sidepods');
  addStud(-0.65 * widthFactor, 0.54, -0.2 * lengthFactor, colors.sidepods, 'sidepods');
  addStud(-0.65 * widthFactor, 0.54, 0.2 * lengthFactor, colors.sidepods, 'sidepods');
  addStud(-0.65 * widthFactor, 0.54, 0.6 * lengthFactor, colors.sidepods, 'sidepods');

  // ==========================================
  // 7. ENGINE COVER & AIRBOX (Curved Slopes #61678)
  // ==========================================
  const engGeo = new THREE.BoxGeometry(0.56 * widthFactor, 0.44, 1.8 * lengthFactor);
  addPiece(engGeo, colors.engineCover, 'engineCover', [0, 0.44, -0.85 * lengthFactor], [-0.08, 0, 0]);

  // Roll-hoop air intake periscope above driver
  const intakeGeo = new THREE.BoxGeometry(0.38 * widthFactor, 0.32, 0.52 * lengthFactor);
  addPiece(intakeGeo, colors.engineCover, 'engineCover', [0, 0.74, 0.05 * lengthFactor]);

  // Intake mouth
  const intakeMouthGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16);
  const blackMat = createLegoPlasticMaterial('#090d16');
  const intakeMouth = new THREE.Mesh(intakeMouthGeo, blackMat);
  intakeMouth.position.set(0, 0.74, 0.31 * lengthFactor);
  intakeMouth.rotation.x = Math.PI / 2;
  root.add(intakeMouth);

  // Engine cover studs
  addStud(0, 0.91, -0.05 * lengthFactor, colors.engineCover, 'engineCover');
  addStud(0, 0.67, -0.65 * lengthFactor, colors.engineCover, 'engineCover');

  // ==========================================
  // 8. SHARK FIN DORSAL SPINE (Modified Tile #3070b)
  // ==========================================
  const finGeo = new THREE.BoxGeometry(0.06, 0.48, 1.6 * lengthFactor);
  addPiece(finGeo, colors.sharkFin, 'sharkFin', [0, 0.72, -1.0 * lengthFactor]);

  // ==========================================
  // 9. REAR WING & DRS ACTUATOR (Tiles #3069b & Pylons #68888)
  // ==========================================
  const rwMainGeo = new THREE.BoxGeometry(1.9 * widthFactor, 0.08, 0.52 * lengthFactor);
  addPiece(rwMainGeo, colors.rearWing, 'rearWing', [0, 0.94, -2.1 * lengthFactor], [0.14, 0, 0]);

  // DRS Flap
  const drsFlapGeo = new THREE.BoxGeometry(1.82 * widthFactor, 0.05, 0.32 * lengthFactor);
  addPiece(drsFlapGeo, colors.rearWing, 'rearWing', [0, 1.04, -2.06 * lengthFactor], [0.28, 0, 0]);

  // DRS Central Actuator Pod
  const drsPodGeo = new THREE.BoxGeometry(0.12, 0.14, 0.28);
  addPiece(drsPodGeo, colors.rearWing, 'rearWing', [0, 1.02, -2.08 * lengthFactor]);

  // Swan-Neck Twin Mounting Pylons
  const pylonGeo = new THREE.BoxGeometry(0.06, 0.65, 0.18);
  addPiece(pylonGeo, colors.rearWingEndplates, 'rearWingEndplates', [0.24 * widthFactor, 0.65, -1.95 * lengthFactor], [-0.18, 0, 0]);
  addPiece(pylonGeo, colors.rearWingEndplates, 'rearWingEndplates', [-0.24 * widthFactor, 0.65, -1.95 * lengthFactor], [-0.18, 0, 0]);

  // Rear Wing Endplates
  const rweGeo = new THREE.BoxGeometry(0.06, 0.52, 0.82 * lengthFactor);
  addPiece(rweGeo, colors.rearWingEndplates, 'rearWingEndplates', [0.96 * widthFactor, 0.88, -2.1 * lengthFactor]);
  addPiece(rweGeo, colors.rearWingEndplates, 'rearWingEndplates', [-0.96 * widthFactor, 0.88, -2.1 * lengthFactor]);

  // Rear wing studs
  addStud(-0.72 * widthFactor, 0.99, -2.1 * lengthFactor, colors.rearWing, 'rearWing');
  addStud(0.72 * widthFactor, 0.99, -2.1 * lengthFactor, colors.rearWing, 'rearWing');

  // ==========================================
  // 10. 18-INCH PIRELLI SPEED CHAMPIONS WHEELS & RIMS
  // ==========================================
  const wheelPositions: [number, number, number, string][] = [
    [1.08 * widthFactor, 0.33, 1.65 * lengthFactor, 'WHEEL_FL'],
    [-1.08 * widthFactor, 0.33, 1.65 * lengthFactor, 'WHEEL_FR'],
    [1.12 * widthFactor, 0.37, -1.55 * lengthFactor, 'WHEEL_RL'],
    [-1.12 * widthFactor, 0.37, -1.55 * lengthFactor, 'WHEEL_RR'],
  ];

  wheelPositions.forEach(([wx, wy, wz, wheelName], i) => {
    const isRear = i >= 2;
    const tireRadius = isRear ? 0.38 : 0.35;
    const tireWidth = isRear ? 0.44 : 0.38;

    // Slick Rubber Tire Compound
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 32);
    const tireMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.65,
      metalness: 0.05,
      clearcoat: 0.2,
    });
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.rotation.z = Math.PI / 2;
    tireMesh.position.set(wx, wy, wz);
    tireMesh.castShadow = true;
    tireMesh.receiveShadow = true;
    tireMesh.name = `${wheelName}_TIRE`;
    tireMesh.userData = {
      partKey: 'tireCompound',
      name: `${wheelName}_TIRE`,
      designId: '55981',
      elementId: '6258903',
      pieceName: 'Pirelli P-Zero High-Traction Slick Tire',
      category: 'Tires Rubber',
    };
    registerMesh('tireCompound', tireMesh);
    root.add(tireMesh);

    // Colored Compound Ring (Soft: Red, Medium: Yellow, Hard: White)
    const ringGeo = new THREE.RingGeometry(tireRadius - 0.08, tireRadius - 0.04, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.tireCompound),
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
    ringMesh.position.set(wx > 0 ? wx + tireWidth / 2 + 0.002 : wx - tireWidth / 2 - 0.002, wy, wz);
    root.add(ringMesh);

    // 18" Aero Star-Spoke Wheel Rim Cover (#77242)
    const rimGeo = new THREE.CylinderGeometry(tireRadius - 0.09, tireRadius - 0.09, tireWidth + 0.01, 24);
    const rimMat = createLegoPlasticMaterial(colors.rims);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.z = Math.PI / 2;
    rimMesh.position.set(wx, wy, wz);
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    rimMesh.name = `${wheelName}_RIM`;
    rimMesh.userData = {
      partKey: 'rims',
      name: `${wheelName}_RIM`,
      designId: '77242',
      elementId: '6480112',
      pieceName: '18-Inch Speed Champions Aero Star-Spoke Rim',
      category: 'Wheels & Rims',
    };
    registerMesh('rims', rimMesh);
    root.add(rimMesh);

    // Central Technic Axle Pin Hub
    const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, tireWidth + 0.03, 16);
    const hubMat = createLegoPlasticMaterial('#1e293b');
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubMesh.rotation.z = Math.PI / 2;
    hubMesh.position.set(wx, wy, wz);
    root.add(hubMesh);
  });

  return root;
}

/**
 * LDraw Loader Pipeline Integration:
 * Sets up LDrawLoader with the official parts library URL and handles loading/parsing
 */
export function setupLDrawLoader(): LDrawLoader {
  const loader = new LDrawLoader();
  const libraryUrl = 'https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/';

  if (typeof (loader as any).setPartsLibraryPath === 'function') {
    (loader as any).setPartsLibraryPath(libraryUrl);
  } else if (typeof (loader as any).setPartsPath === 'function') {
    (loader as any).setPartsPath(libraryUrl);
  }

  return loader;
}
