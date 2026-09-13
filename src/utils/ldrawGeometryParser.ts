import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Cache for geometries and precomputed outline edges to maximize GPU reuse & achieve 60+ FPS
const partGeometryCache = new Map<string, THREE.BufferGeometry>();
const partEdgesCache = new Map<string, THREE.BufferGeometry | null>();

/**
 * Robust geometry merger that converts mixed indexed and non-indexed geometries
 * (e.g. ExtrudeGeometry which is non-indexed, vs BoxGeometry / CylinderGeometry which are indexed)
 * to a consistent non-indexed format before merging.
 * Also normalizes attributes so mergeGeometries never fails or returns null.
 */
function safeMergeGeometries(geometries: THREE.BufferGeometry[], useGroups = false): THREE.BufferGeometry {
  if (!geometries || geometries.length === 0) {
    return new THREE.BufferGeometry();
  }
  if (geometries.length === 1) {
    const single = geometries[0].clone();
    if (!single.attributes.normal) single.computeVertexNormals();
    return single;
  }

  // Convert all geometries to non-indexed representations to eliminate index attribute mismatch
  const normalizedGeometries = geometries.map((geo) => {
    // If indexed, convert to non-indexed
    const nonIdx = geo.index !== null ? geo.toNonIndexed() : geo.clone();

    // Ensure normal attribute is present
    if (!nonIdx.attributes.normal) {
      nonIdx.computeVertexNormals();
    }

    // Retain only position and normal to prevent attribute mismatch
    const clean = new THREE.BufferGeometry();
    clean.setAttribute('position', nonIdx.attributes.position);
    clean.setAttribute('normal', nonIdx.attributes.normal);
    return clean;
  });

  const merged = mergeGeometries(normalizedGeometries, useGroups);
  if (merged) {
    merged.computeVertexNormals();
    return merged;
  }

  // Fallback if mergeGeometries fails for any reason
  const fallback = geometries[0].clone();
  if (!fallback.attributes.normal) fallback.computeVertexNormals();
  return fallback;
}

/**
 * Standard LEGO Stud: Authentic cylinder with radius 5.8 LDU, height 4.0 LDU, 16 radial segments.
 * Placed on top surface pointing upward in LDraw coordinates (-Y is up).
 */
function createStud(x: number, y: number, z: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(5.8, 5.8, 4.0, 16);
  // Center cylinder so its base sits at y and top extends to y - 4
  g.translate(x, y - 2.0, z);
  return g;
}

/**
 * Standard LEGO Plate with authentic cylindrical studs and 0.4 LDU micro-bevel seam gaps
 */
function createPlate(width: number, length: number, studs: [number, number][]): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(width - 0.4, 8.0, length - 0.4);
  body.translate(0, 4.0, 0); // Y: 0 to 8
  const studGeos = studs.map(([x, z]) => createStud(x, 0, z));
  return safeMergeGeometries([body, ...studGeos], false);
}

/**
 * Standard LEGO Brick with authentic cylindrical studs and seam clearance
 */
function createBrick(width: number, length: number, studs: [number, number][]): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(width - 0.4, 24.0, length - 0.4);
  body.translate(0, 12.0, 0); // Y: 0 to 24
  const studGeos = studs.map(([x, z]) => createStud(x, 0, z));
  return safeMergeGeometries([body, ...studGeos], false);
}

/**
 * LEGO Smooth Tile with edge groove chamfer and zero studs
 */
function createTile(width: number, length: number): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(width - 0.4, 7.8, length - 0.4);
  body.translate(0, 3.9, 0);
  body.computeVertexNormals();
  return body;
}

/**
 * LEGO 2420: Plate 2 x 2 Corner with 3 authentic cylindrical studs
 */
function createCornerPlate2x2(): THREE.BufferGeometry {
  const b1 = new THREE.BoxGeometry(19.6, 8.0, 39.6);
  b1.translate(-10.0, 4.0, 0);
  const b2 = new THREE.BoxGeometry(19.6, 8.0, 19.6);
  b2.translate(10.0, 4.0, -10.0);

  const studs = [
    createStud(-10.0, 0, -10.0),
    createStud(10.0, 0, -10.0),
    createStud(-10.0, 0, 10.0),
  ];

  return safeMergeGeometries([b1, b2, ...studs], false);
}

/**
 * LEGO 2412b: Radiator Cooling Matrix Tile Grille 1 x 2
 */
function createGrille1x2(): THREE.BufferGeometry {
  const base = new THREE.BoxGeometry(19.6, 7.2, 39.6);
  base.translate(0, 4.4, 0);

  const slats: THREE.BufferGeometry[] = [];
  for (let z of [-16, -8, 0, 8, 16]) {
    const slat = new THREE.BoxGeometry(18.6, 1.2, 4.0);
    slat.translate(0, 0.6, z);
    slats.push(slat);
  }

  return safeMergeGeometries([base, ...slats], false);
}

/**
 * LEGO 15068: Slope Curved 2 x 2 x 2/3 (Aerodynamic smooth curved surface)
 */
function createSlopeCurved2x2(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-20, 8); // bottom-back
  shape.lineTo(20, 8);  // bottom-front
  shape.lineTo(20, 4);  // front-lip
  shape.quadraticCurveTo(0, -8, -20, -8); // curved top aerofoil
  shape.lineTo(-20, 8); // back down

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 39.6,
    bevelEnabled: false,
    curveSegments: 16,
  });
  geom.translate(0, 0, -19.8);
  geom.rotateY(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * LEGO 93606: Slope Curved 4 x 2 Triple Stepped Wedge (Undercut sidepod aero cowl)
 */
function createSlopeCurved4x2(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-40, 12);
  shape.lineTo(40, 12);
  shape.lineTo(40, 6);
  shape.quadraticCurveTo(0, -12, -40, -12);
  shape.lineTo(-40, 12);

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 39.6,
    bevelEnabled: false,
    curveSegments: 16,
  });
  geom.translate(0, 0, -19.8);
  geom.rotateY(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * LEGO 11477: Slope Curved 2 x 1 x 2/3 No Studs (Undercut sidepod aero downwash ramp)
 */
function createSlopeCurved2x1(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-20, 8); // bottom-back
  shape.lineTo(20, 8);  // bottom-front
  shape.lineTo(20, 4);  // front-lip
  shape.quadraticCurveTo(0, -8, -20, -8); // curved top aerofoil
  shape.lineTo(-20, 8); // back down

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 19.6,
    bevelEnabled: false,
    curveSegments: 16,
  });
  geom.translate(0, 0, -9.8);
  geom.rotateY(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * LEGO 65633 / 100745 / 6535158: Speed Champions Titanium Halo Protection Arch
 * Forward apex & mounting pillar oriented along negative Z (-34 LDU to anchor)
 */
function createHaloArch(): THREE.BufferGeometry {
  // Elliptical safety hoop wrapping around driver cockpit
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-15, 6, 26),
    new THREE.Vector3(-16, -6, 14),
    new THREE.Vector3(-15, -9, -4),
    new THREE.Vector3(0, -9, -16),
    new THREE.Vector3(15, -9, -4),
    new THREE.Vector3(16, -6, 14),
    new THREE.Vector3(15, 6, 26),
  ]);

  const haloTube = new THREE.TubeGeometry(curve, 40, 2.8, 14, false);

  // Central titanium forward pillar anchoring to front chassis bulkhead
  const pillarCurve = new THREE.LineCurve3(
    new THREE.Vector3(0, -9, -15),
    new THREE.Vector3(0, 6, -34)
  );
  const pillarTube = new THREE.TubeGeometry(pillarCurve, 12, 2.5, 12, false);

  // Aerodynamic fairing deflection winglet on top of apex
  const fairing = new THREE.BoxGeometry(4.5, 2.0, 10.0);
  fairing.translate(0, -11.0, -12.0);

  return safeMergeGeometries([haloTube, pillarTube, fairing], false);
}

/**
 * LEGO 18674: Minifigure F1 Racing Helmet with Visor
 * Visor facing forward along negative Z
 */
function createHelmet(): THREE.BufferGeometry {
  const dome = new THREE.SphereGeometry(11.5, 24, 16);
  dome.translate(0, -10.0, 0);

  const visor = new THREE.CylinderGeometry(11.7, 11.7, 5.0, 24, 1, false, (2 * Math.PI) / 3, (2 * Math.PI) / 3);
  visor.translate(0, -10.0, 0);

  return safeMergeGeometries([dome, visor], false);
}

/**
 * LEGO 80249: Speed Champions Pirelli Slick Racing Tire
 * Circular cylinder with smooth rounded shoulders and hollow rim seat (revolved LatheGeometry)
 */
function createPirelliSlickTire(): THREE.BufferGeometry {
  const points = [
    new THREE.Vector2(15.5, -14.0), // Inner rim lip
    new THREE.Vector2(16.5, -13.8), // Sidewall lower
    new THREE.Vector2(21.0, -13.0), // Sidewall flare
    new THREE.Vector2(23.5, -11.0), // Shoulder radius fillet
    new THREE.Vector2(24.0, -8.0),  // Slick tread contact surface
    new THREE.Vector2(24.0, 0),     // Crown center
    new THREE.Vector2(24.0, 8.0),   // Slick tread contact surface
    new THREE.Vector2(23.5, 11.0),  // Shoulder radius fillet
    new THREE.Vector2(21.0, 13.0),  // Inner sidewall
    new THREE.Vector2(16.5, 13.8),  // Sidewall lower
    new THREE.Vector2(15.5, 14.0),  // Inner rim lip
    new THREE.Vector2(14.0, 10.0),  // Hollow inner barrel
    new THREE.Vector2(14.0, -10.0), // Hollow inner barrel
    new THREE.Vector2(15.5, -14.0), // Close path
  ];

  const lathe = new THREE.LatheGeometry(points, 32);
  // Revolve so wheel axle is oriented along Z
  lathe.rotateX(Math.PI / 2);
  lathe.computeVertexNormals();
  return lathe;
}

/**
 * LEGO 6014: 18-Inch Aero Wheel Rim Disc Cover
 * Revolved circular dish with center lock hub and outer aero lip
 */
function createAeroRimDisc(): THREE.BufferGeometry {
  const rimPoints = [
    new THREE.Vector2(0, -10.0),    // Center wheel nut tip
    new THREE.Vector2(3.5, -10.0),  // Center nut flange
    new THREE.Vector2(4.5, -11.5),  // Hub step down
    new THREE.Vector2(14.5, -12.5), // Aero dish face
    new THREE.Vector2(16.0, -13.5), // Outer rim lip
    new THREE.Vector2(16.5, -14.0), // Wheel flange
    new THREE.Vector2(15.5, 12.0),  // Back rim barrel
    new THREE.Vector2(12.0, 12.0),
    new THREE.Vector2(0, -8.0),     // Inner back cap
  ];

  const rimLathe = new THREE.LatheGeometry(rimPoints, 32);
  rimLathe.rotateX(Math.PI / 2);
  rimLathe.computeVertexNormals();
  return rimLathe;
}

/**
 * LEGO 3388 / 3389: Front Wheel Deflector / Winglet (1 x 5 x 1 1/3)
 * Aerodynamic curved wake-control fender arch wrapping over the front 18-inch wheels
 */
function createWheelDeflector(isRight: boolean): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Profile along Z and Y
  const innerR = 25.0;
  const outerR = 28.0;
  // Arc covering the top crown of the tire (-Y in LDraw is up)
  // Crown is at -Math.PI / 2 (-90 deg). We arch from -0.85 * PI to -0.15 * PI
  const startAngle = -Math.PI * 0.85;
  const endAngle = -Math.PI * 0.15;

  shape.absarc(0, 0, outerR, startAngle, endAngle, false);
  shape.absarc(0, 0, innerR, endAngle, startAngle, true);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 14.0,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.6,
    bevelThickness: 0.5,
  });

  geom.translate(0, 0, -7.0);
  // Revolve so arc is in Z-Y plane and thickness is in X
  geom.rotateY(Math.PI / 2);
  if (isRight) {
    geom.scale(-1, 1, 1);
  }

  // Mounting bracket tab connecting to upright inboard
  const bracket = new THREE.BoxGeometry(8.0, 4.0, 12.0);
  bracket.translate(isRight ? 6.0 : -6.0, -18.0, 0);

  return safeMergeGeometries([geom, bracket], false);
}

/**
 * LEGO SNOT Brackets: 99207, 99781, 99780, 36840, 36841
 * Multi-directional angle bracket with horizontal base plate and vertical side-stud face
 */
function createBracketPart(designId: string): THREE.BufferGeometry {
  const baseBox = new THREE.BoxGeometry(20.0, 8.0, designId.includes('1x1') || designId === '36840' || designId === '36841' ? 20.0 : 40.0);
  baseBox.translate(0, -4.0, 0);

  const verticalBox = new THREE.BoxGeometry(4.0, 16.0, designId.includes('1x1') || designId === '36840' || designId === '36841' ? 20.0 : 40.0);
  verticalBox.translate(8.0, -8.0, 0);

  // Side stud pointing along +X
  const sideStud = new THREE.CylinderGeometry(4.8, 4.8, 3.5, 16);
  sideStud.rotateZ(Math.PI / 2);
  sideStud.translate(11.5, -8.0, 0);

  return safeMergeGeometries([baseBox, verticalBox, sideStud], false);
}

/**
 * LEGO 80179: F1 Rearview Mirror ("Spoon, No. 1")
 * Aerodynamic teardrop mirror pod with slender mounting pylon
 */
function createRearviewMirror(isRight: boolean): THREE.BufferGeometry {
  // Mirror pod housing
  const pod = new THREE.BoxGeometry(8.0, 6.0, 14.0);
  pod.translate(0, 0, 0);

  // Aerodynamic nose cone on front of mirror
  const nose = new THREE.ConeGeometry(3.5, 6.0, 12);
  nose.rotateX(Math.PI / 2);
  nose.translate(0, 0, -8.0);

  // Mounting stalk pylon
  const stemCurve = new THREE.LineCurve3(
    new THREE.Vector3(isRight ? -8.0 : 8.0, 8.0, 2.0),
    new THREE.Vector3(0, 0, 0)
  );
  const stem = new THREE.TubeGeometry(stemCurve, 6, 1.2, 8, false);

  return safeMergeGeometries([pod, nose, stem], false);
}

/**
 * LEGO 30029 / 6508987: Vehicle Base Undertray Plate (4 x 12 x 1/3)
 * Exact 8.0 LDU plate thickness (1/3 brick height).
 * Bottom face sits flush at Y = 0 (aligned with tire contact patch).
 */
function createUndertrayPlate30029(): THREE.BufferGeometry {
  const mainFloor = new THREE.BoxGeometry(79.6, 8.0, 239.6);
  mainFloor.translate(0, 4.0, 0); // Y: 0 to 8.0 LDU

  // Stud platforms along central spine
  const studs: THREE.BufferGeometry[] = [];
  for (let z = -100; z <= 100; z += 40) {
    studs.push(createStud(-20, 0, z));
    studs.push(createStud(20, 0, z));
  }

  return safeMergeGeometries([mainFloor, ...studs], false);
}

/**
 * LEGO 5095 / 5093: Slope Curved 3 x 1 No Studs / Wedge (Left / Right)
 * Smooth aerodynamic downwash ramp (60 x 20 LDU, curved slope)
 */
function createCurvedSlope3x1Wedge(isRight: boolean): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-30, 16); // bottom-back
  shape.lineTo(30, 16);  // bottom-front
  shape.lineTo(30, 4);   // front-lip
  shape.quadraticCurveTo(-10, -8, -30, -8); // curved top aerofoil
  shape.lineTo(-30, 16); // back down

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 19.6,
    bevelEnabled: false,
    curveSegments: 16,
  });
  geom.translate(0, 0, -9.8);
  geom.rotateY(Math.PI / 2);
  if (isRight) {
    geom.scale(-1, 1, 1);
  }
  geom.computeVertexNormals();
  return geom;
}

/**
 * LEGO 62810: Minifigure Swept-Back Paddock Hair
 */
function createMinifigHair62810(): THREE.BufferGeometry {
  const crown = new THREE.SphereGeometry(10.5, 20, 16);
  crown.scale(1.0, 0.9, 1.1);
  crown.translate(0, -9.0, -1.0);

  const sweptStrand1 = new THREE.CylinderGeometry(2.0, 4.0, 10.0, 8);
  sweptStrand1.rotateX(-Math.PI / 4);
  sweptStrand1.translate(4.0, -12.0, 4.0);

  const sweptStrand2 = new THREE.CylinderGeometry(2.0, 4.0, 10.0, 8);
  sweptStrand2.rotateX(-Math.PI / 4);
  sweptStrand2.translate(-4.0, -12.0, 4.0);

  return safeMergeGeometries([crown, sweptStrand1, sweptStrand2], false);
}

/**
 * LEGO 112033 / 2446 / 18674: Minifigure Modern F1 Racing Helmet (Studless Aero Dome)
 * Completely smooth aerodynamic dome with front visor opening. No top stud or crown duct!
 */
function createMinifigHelmet112033(): THREE.BufferGeometry {
  const dome = new THREE.SphereGeometry(11.8, 28, 20);
  dome.translate(0, -10.0, 0);

  const visor = new THREE.CylinderGeometry(12.0, 12.0, 4.8, 28, 1, false, (2 * Math.PI) / 3, (2 * Math.PI) / 3);
  visor.translate(0, -10.0, 0);

  // Strictly studless & smooth crown - Minifigure racing helmets NEVER have a stud on the crown!
  return safeMergeGeometries([dome, visor], false);
}

/**
 * LEGO 27150: Paddock Grid Umbrella / Sun Parasol
 */
function createGridUmbrella27150(): THREE.BufferGeometry {
  // Conical / curved parasol canopy
  const canopy = new THREE.ConeGeometry(22.0, 8.0, 24, 1, true);
  canopy.translate(0, -32.0, 0);

  // Center shaft pole
  const shaft = new THREE.CylinderGeometry(1.6, 1.6, 36.0, 12);
  shaft.translate(0, -18.0, 0);

  // Ergonomic J-hook grip handle at base
  const handle = new THREE.TorusGeometry(3.0, 1.4, 8, 16, Math.PI);
  handle.rotateZ(Math.PI / 2);
  handle.translate(0, 0, 0);

  return safeMergeGeometries([canopy, shaft, handle], false);
}

/**
 * LEGO 28664: Driver Hydration Water Bottle / Flask
 */
function createWaterBottle28664(): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(3.6, 3.6, 12.0, 16);
  body.translate(0, -6.0, 0);

  const shoulder = new THREE.CylinderGeometry(2.0, 3.6, 3.0, 16);
  shoulder.translate(0, -13.5, 0);

  const spout = new THREE.CylinderGeometry(1.2, 1.2, 4.0, 12);
  spout.translate(0, -16.0, 0);

  return safeMergeGeometries([body, shoulder, spout], false);
}

/**
 * LEGO 1126: F1 Championship Winners Trophy Cup
 */
function createGoldTrophy1126(): THREE.BufferGeometry {
  const points = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(6.0, 0),
    new THREE.Vector2(6.0, 3.0),
    new THREE.Vector2(2.5, 5.0),
    new THREE.Vector2(2.0, 9.0),
    new THREE.Vector2(6.5, 16.0),
    new THREE.Vector2(7.0, 20.0),
    new THREE.Vector2(6.2, 20.0),
    new THREE.Vector2(5.5, 16.0),
    new THREE.Vector2(0, 10.0),
  ];
  const cup = new THREE.LatheGeometry(points, 24);
  cup.translate(0, -20.0, 0);

  const handleL = new THREE.TorusGeometry(4.0, 1.0, 8, 16, Math.PI * 1.2);
  handleL.rotateZ(Math.PI / 2);
  handleL.translate(-6.5, -12.0, 0);

  const handleR = new THREE.TorusGeometry(4.0, 1.0, 8, 16, Math.PI * 1.2);
  handleR.rotateZ(-Math.PI / 2);
  handleR.translate(6.5, -12.0, 0);

  return safeMergeGeometries([cup, handleL, handleR], false);
}

/**
 * LEGO 106739 / 6472255: F1 Steering Wheel ("Game Controller No. 3")
 * Racing yoke wheel with dual ergonomic grips, rotary dials, and telemetry screen
 */
function createF1SteeringWheel(): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(16.0, 10.0, 3.2);
  const leftGrip = new THREE.CylinderGeometry(2.2, 2.2, 12.0, 12);
  leftGrip.translate(-8.0, 0, 0);
  const rightGrip = new THREE.CylinderGeometry(2.2, 2.2, 12.0, 12);
  rightGrip.translate(8.0, 0, 0);

  // Center display HUD screen
  const screen = new THREE.BoxGeometry(7.0, 4.5, 0.8);
  screen.translate(0, 1.5, -1.8);

  return safeMergeGeometries([body, leftGrip, rightGrip, screen], false);
}

/**
 * LEGO 112499 / 6539344: Plate 1 x 4 x 2/3 Outside Bow
 * Curved aerodynamic leading edge splitter element
 */
function createOutsideBow1x4(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-10, 0);
  shape.lineTo(10, 0);
  shape.lineTo(10, 5.3);
  shape.quadraticCurveTo(0, 5.3, -10, 2.0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 79.6,
    bevelEnabled: false,
  });
  geom.translate(0, 0, -39.8);
  geom.rotateY(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * LEGO 6806 / 5205 / 6508988: Brick 2 x 6 x 1 Inverted Venturi Arch
 * True inverted aerodynamic arch tunnel underneath (height 24 LDU, width 39.6 LDU, length 119.6 LDU)
 * Features an arched venturi airflow tunnel cutout underneath bridging the two end pillars,
 * fully contained within the chassis envelope without protruding downwards into negative Y ground space.
 */
function createInvertedArch2x6(): THREE.BufferGeometry {
  // 2x6 Inverted Arch (Design 5205 / 6806 / 6508988)
  // Length along Z is 119.6 LDU (from -59.8 to +59.8)
  // Height along Y is 24.0 LDU (from Y = 0 to Y = 24.0)
  // Arched venturi tunnel rises from Y = 0 to Y = 16.0 between Z = -39.8 and +39.8
  const shape = new THREE.Shape();
  // Top flat roof (Y = 24.0 in local coordinates)
  shape.moveTo(-59.8, 24.0);
  shape.lineTo(59.8, 24.0);
  // Rear pillar (Z = 59.8 down to Z = 39.8 at Y = 0)
  shape.lineTo(59.8, 0.0);
  shape.lineTo(39.8, 0.0);
  // Curved aerodynamic venturi arch cutout tunnel rising up to Y = 16.0
  shape.quadraticCurveTo(0.0, 16.0, -39.8, 0.0);
  // Front pillar (Z = -39.8 to -59.8 at Y = 0)
  shape.lineTo(-59.8, 0.0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 39.6, // 2 studs width (39.6 LDU)
    bevelEnabled: false,
    curveSegments: 24,
  });
  // Center along X
  geom.translate(0, 0, -19.8);
  geom.rotateY(Math.PI / 2); // Rotate so X is width and Z is length
  geom.computeVertexNormals();
  return geom;
}

/**
 * LEGO 112498 / 6539343: Dish 16mm Aero Wheel Cover
 * Authentic Speed Champions convex circular aerodynamic disc hubcap with center lock nut
 */
function createDish16mm(): THREE.BufferGeometry {
  const points = [
    new THREE.Vector2(0, 0),        // Center hub tip
    new THREE.Vector2(2.5, 0.6),    // Center lock nut
    new THREE.Vector2(3.6, 0.6),    // Nut flange
    new THREE.Vector2(4.2, 0.0),    // Shoulder
    new THREE.Vector2(11.0, -1.2),  // Smooth aerodynamic dish surface
    new THREE.Vector2(13.6, -2.0),  // Aerodynamic boundary ring
    new THREE.Vector2(14.8, -1.8),  // Outer rim flange
    new THREE.Vector2(15.2, -0.6),  // Outer rim lip
    new THREE.Vector2(14.8, 1.0),   // Back lip
    new THREE.Vector2(2.0, 0.4),    // Back plate
    new THREE.Vector2(0, 0),
  ];

  const lathe = new THREE.LatheGeometry(points, 32);
  lathe.rotateX(Math.PI / 2);
  lathe.computeVertexNormals();
  return lathe;
}

/**
 * Builds the authentic, high-precision geometry for a given LEGO LDraw part
 */
function buildGeometryForPart(designId: string): THREE.BufferGeometry {
  if (!designId) {
    console.warn('[Geometry Engine] buildGeometryForPart called with empty designId');
    return createPlate(20, 20, [[0, 0]]);
  }

  const cleanId = String(designId).replace('.dat', '');

  switch (cleanId) {
    case 'stud':
      return createStud(0, 0, 0);

    // ================= OFFICIAL 77242 SPECIAL AERODYNAMIC ELEMENTS =================
    case '3388': // Left Front Wheel Deflector / Fender 1x5x1 1/3
      return createWheelDeflector(false);

    case '3389': // Right Front Wheel Deflector / Fender 1x5x1 1/3
      return createWheelDeflector(true);

    case '80179': // F1 Rearview Mirror ("Spoon, No. 1")
    case '6515221':
      return createRearviewMirror(false);

    case '106739': // F1 Steering Wheel ("Game Controller No. 3")
    case '6472255':
      return createF1SteeringWheel();

    case '100745': // Halo Roll-Bar Outer Cable 56mm
    case '6535158':
    case '65633':
      return createHaloArch();

    case '112499': // Plate 1 x 4 x 2/3 Outside Bow
    case '6539344':
      return createOutsideBow1x4();

    case '5205':
    case '6806': // Brick 2 x 6 x 1 Inverted Arch
    case '6508988':
      return createInvertedArch2x6();

    case '112498': // Dish 16mm Aero Wheel Cover
    case '6539343':
      return createDish16mm();

    case '107728': // Front Wheel 24 x 13.4
    case '6481568':
    case '112423': // Rear Wheel 24 x 14.9
    case '6538245':
      return createAeroRimDisc();

    // ================= PLATES WITH ROUND STUDS =================
    case '3024': // Plate 1 x 1
      return createPlate(20, 20, [[0, 0]]);

    case '3023': // Plate 1 x 2
    case '3839': // Plate 1 x 2 with handles / endplate
      return createPlate(20, 40, [[0, -10], [0, 10]]);

    case '3710': // Plate 1 x 4
      return createPlate(20, 80, [[0, -30], [0, -10], [0, 10], [0, 30]]);

    case '3666': // Plate 1 x 6
      return createPlate(20, 120, [[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]]);

    case '3020': // Plate 2 x 4
      return createPlate(40, 80, [
        [-10, -30], [10, -30],
        [-10, -10], [10, -10],
        [-10, 10],  [10, 10],
        [-10, 30],  [10, 30],
      ]);

    case '30029': // Vehicle Base Undertray Plate 4 x 12 (8 LDU plate height, flush at Y=0)
      return createUndertrayPlate30029();

    case '2420': // Plate 2 x 2 Corner
      return createCornerPlate2x2();

    // ================= BRICKS WITH ROUND STUDS =================
    case '3005': // Brick 1 x 1
      return createBrick(20, 20, [[0, 0]]);

    case '3004': // Brick 1 x 2
      return createBrick(20, 40, [[0, -10], [0, 10]]);

    case '3003': // Brick 2 x 2
      return createBrick(40, 40, [
        [-10, -10], [10, -10],
        [-10, 10],  [10, 10],
      ]);

    // ================= SNOT ANGLE BRACKETS =================
    case '99207': // Bracket 1 x 2 - 2 x 2 Inverted
    case '99781': // Bracket 1 x 2 - 1 x 2 Up
    case '99780': // Bracket 1 x 2 - 1 x 2 Down
    case '36840': // Bracket 1 x 1 - 1 x 1 Down
    case '36841': // Bracket 1 x 1 - 1 x 1 Up
      return createBracketPart(cleanId);

    // ================= SMOOTH TILES (100% STUDLESS FLAT SURFACES) =================
    case '3070':
    case '3070b': // Tile 1 x 1 with Groove
    case '98138': // Tile 1 x 1 Round
      return createTile(20, 20);

    case '3069':
    case '3069b': // Tile 1 x 2 with Groove
      return createTile(20, 40);

    case '63864': // Tile 1 x 3 with Groove
      return createTile(20, 60);

    case '3068':
    case '3068b': // Tile 2 x 2 with Groove
      return createTile(40, 40);

    case '2431': // Tile 1 x 4
      return createTile(20, 80);

    case '87079': // Tile 2 x 4
      return createTile(40, 80);

    case '6636': // Tile 1 x 6
    case '1750':
      return createTile(20, 120);

    case '2412':
    case '2412b': // Radiator Tile Grille 1 x 2
      return createGrille1x2();

    // ================= CURVED SLOPES & AERODYNAMICS =================
    case '11477': // Slope Curved 2 x 1 x 2/3 No Studs
      return createSlopeCurved2x1();

    case '5095': // Slope Curved 3 x 1 No Studs (Left)
      return createCurvedSlope3x1Wedge(false);

    case '5093': // Slope Curved 3 x 1 No Studs (Right)
      return createCurvedSlope3x1Wedge(true);

    case '15068': // Slope Curved 2 x 2 x 2/3
      return createSlopeCurved2x2();

    case '93606': // Slope Curved 4 x 2 Triple Stepped Wedge
      return createSlopeCurved4x2();

    case '65633': // Titanium Halo Roll-Bar Arch
      return createHaloArch();

    case '18674': // Driver Helmet with Visor
    case '2446': // Minifig Standard Racing Helmet
    case '112033': // Driver F1 Racing Helmet (Studless Aero Dome)
      return createMinifigHelmet112033();

    case '62810': // Minifigure Hair Swept Back
      return createMinifigHair62810();

    case '27150': // Grid Umbrella
      return createGridUmbrella27150();

    case '28664': // Hydration Bottle
      return createWaterBottle28664();

    case '1126': // Championship Trophy Cup
      return createGoldTrophy1126();

    // ================= WHEELS & TIRES =================
    case '80249': // Speed Champions Pirelli Slick Racing Tire (Round)
      return createPirelliSlickTire();

    case '6014': // 18-Inch Aero Wheel Rim Disc
      return createAeroRimDisc();

    default:
      // High-quality fallback for custom parts
      return createPlate(20, 20, [[0, 0]]);
  }
}

/**
 * Global Tile vs Plate Classifier:
 * Confirms if a part is designated as a "TILE" and must render with 100% flat, studless surface.
 */
export function isLegoTilePart(designId: string, pieceName?: string): boolean {
  const cleanId = String(designId).replace('.dat', '').toLowerCase();
  const tileIds = new Set([
    '3070', '3070b', '3069', '3069b', '3068', '3068b',
    '2431', '2412', '2412b', '63864', '87079', '6636',
    '1750', '98138'
  ]);
  if (tileIds.has(cleanId)) return true;
  if (pieceName && /\btile\b|\bgrille\b/i.test(pieceName)) return true;
  return false;
}

/**
 * Returns a cached, high-precision geometry instance for an LDraw design ID.
 */
export function getLDrawPartGeometry(designId: string, pieceName?: string): THREE.BufferGeometry {
  if (!designId) {
    console.warn('[Geometry Engine] getLDrawPartGeometry called without designId');
    return createPlate(20, 20, [[0, 0]]);
  }

  const cleanId = String(designId).replace('.dat', '');
  const cacheKey = pieceName && isLegoTilePart(cleanId, pieceName) ? `${cleanId}-tile` : cleanId;
  if (partGeometryCache.has(cacheKey)) {
    return partGeometryCache.get(cacheKey)!;
  }

  let geometry: THREE.BufferGeometry;
  if (isLegoTilePart(cleanId, pieceName) && !partGeometryCache.has(cleanId)) {
    // Determine dimension for generic tile fallback
    if (cleanId === '2431') geometry = createTile(20, 80);
    else if (cleanId === '3069' || cleanId === '3069b') geometry = createTile(20, 40);
    else if (cleanId === '3068' || cleanId === '3068b') geometry = createTile(40, 40);
    else if (cleanId === '2412' || cleanId === '2412b') geometry = createGrille1x2();
    else geometry = buildGeometryForPart(cleanId);
  } else {
    geometry = buildGeometryForPart(cleanId);
  }

  partGeometryCache.set(cacheKey, geometry);
  return geometry;
}

/**
 * Returns precomputed EdgesGeometry for crisp, authentic LDraw brick outline lines.
 * Tires are intentionally excluded from brick seams to keep rubber smooth.
 */
export function getLDrawPartEdges(designId: string): THREE.BufferGeometry | null {
  if (!designId) return null;

  const cleanId = String(designId).replace('.dat', '');
  if (partEdgesCache.has(cleanId)) {
    return partEdgesCache.get(cleanId)!;
  }

  // Pirelli slick tires, rims and aero dishes maintain smooth circular contours without brick seam lines
  if (
    cleanId === '80249' ||
    cleanId === '6014' ||
    cleanId === '112498' ||
    cleanId === '6539343' ||
    cleanId === '107728' ||
    cleanId === '112423'
  ) {
    partEdgesCache.set(cleanId, null);
    return null;
  }

  const geom = getLDrawPartGeometry(cleanId);
  const edges = new THREE.EdgesGeometry(geom, 25);
  partEdgesCache.set(cleanId, edges);
  return edges;
}
