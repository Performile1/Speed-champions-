import { CarPartKey } from '../types';

export interface ModularPartOption {
  designId: string;
  elementId: string;
  name: string;
  category: string;
  description: string;
  downforceImpact?: string; // e.g. '+8% High Downforce', '-12% Monza Low Drag'
  dragImpact?: string;
  previewColor?: string;
}

export interface SnapAnchorZone {
  id: string;
  name: string;
  zone: 'ZONE_NOSE' | 'ZONE_HALO' | 'ZONE_SIDEPOD' | 'ZONE_REAR_WING' | 'ZONE_ENGINE';
  description: string;
  // Relative coordinates in LDraw units (scale 0.04 applied in Three.js)
  position: [number, number, number]; // [x, y, z] in LDraw space
  rotation: [number, number, number, number, number, number, number, number, number];
  compatiblePartKey: CarPartKey;
  defaultDesignId: string;
  defaultElementId: string;
  defaultPieceName: string;
}

/**
 * Predefined authentic snap point anchors on the Speed Champions F1 chassis
 */
export const SNAP_ANCHORS: SnapAnchorZone[] = [
  {
    id: 'snap-front-wing-left',
    name: 'Front Wing Left Cascade',
    zone: 'ZONE_NOSE',
    description: 'Add aerodynamic upper flap for extra front-end bite',
    position: [-50, -4, -215],
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    compatiblePartKey: 'frontWing',
    defaultDesignId: '11477',
    defaultElementId: '6047276',
    defaultPieceName: 'Slope Curved 2x1 Cascade Flap',
  },
  {
    id: 'snap-front-wing-right',
    name: 'Front Wing Right Cascade',
    zone: 'ZONE_NOSE',
    description: 'Add aerodynamic upper flap for extra front-end bite',
    position: [50, -4, -215],
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    compatiblePartKey: 'frontWing',
    defaultDesignId: '11477',
    defaultElementId: '6047276',
    defaultPieceName: 'Slope Curved 2x1 Cascade Flap',
  },
  {
    id: 'snap-sidepod-left',
    name: 'Left Sidepod Vortex Generator',
    zone: 'ZONE_SIDEPOD',
    description: 'Ground-effect edge strake directing airflow to floor',
    position: [-50, -16, 10],
    rotation: [0, 0, -1, 0, 1, 0, 1, 0, 0],
    compatiblePartKey: 'sidepods',
    defaultDesignId: '2412b',
    defaultElementId: '614126',
    defaultPieceName: 'Radiator Louvered Cooling Tile',
  },
  {
    id: 'snap-sidepod-right',
    name: 'Right Sidepod Vortex Generator',
    zone: 'ZONE_SIDEPOD',
    description: 'Ground-effect edge strake directing airflow to floor',
    position: [50, -16, 10],
    rotation: [0, 0, 1, 0, 1, 0, -1, 0, 0],
    compatiblePartKey: 'sidepods',
    defaultDesignId: '2412b',
    defaultElementId: '614126',
    defaultPieceName: 'Radiator Louvered Cooling Tile',
  },
  {
    id: 'snap-halo-aero',
    name: 'Halo Apex Tri-Winglet',
    zone: 'ZONE_HALO',
    description: 'FIA Cockpit Safety Arch aerodynamic boundary vane',
    position: [0, -42, -40],
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    compatiblePartKey: 'halo',
    defaultDesignId: '3024',
    defaultElementId: '6047222',
    defaultPieceName: 'Aero Deflector Plate 1x1',
  },
  {
    id: 'snap-rear-drs',
    name: 'Rear Wing DRS Gurney Flap',
    zone: 'ZONE_REAR_WING',
    description: 'High-downforce aerodynamic trailing edge lip',
    position: [0, -70, 200],
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    compatiblePartKey: 'rearWing',
    defaultDesignId: '2431',
    defaultElementId: '6051508',
    defaultPieceName: 'DRS Gurney Trailing Blade 1x4',
  },
  {
    id: 'snap-airbox-fin',
    name: 'Airbox Shark Fin Vortex Spike',
    zone: 'ZONE_ENGINE',
    description: 'Directs undisturbed air straight to the rear wing beam',
    position: [0, -56, 75],
    rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    compatiblePartKey: 'sharkFin',
    defaultDesignId: '3024',
    defaultElementId: '6047222',
    defaultPieceName: 'Shark Fin Vortex Stud 1x1',
  },
];

/**
 * Compatible replacement shapes by LDraw design ID or subassembly category
 */
export const MODULAR_PART_ALTERNATIVES: Record<string, ModularPartOption[]> = {
  // Front Wing & Splitters
  frontWing: [
    {
      designId: '3020',
      elementId: '6388484',
      name: 'Plate 2x4 Multi-Element Splitter (Standard)',
      category: 'Front Wing',
      description: 'Balanced aerodynamic downforce suitable for medium downforce tracks.',
      downforceImpact: 'Standard (Medium)',
      dragImpact: 'Neutral',
    },
    {
      designId: '3710',
      elementId: '6051508',
      name: 'Plate 1x4 Monza Low-Drag Wing Flap',
      category: 'Front Wing',
      description: 'Streamlined thin profile reducing drag for maximum top speed on straights.',
      downforceImpact: '-14% Downforce',
      dragImpact: '-18% Drag (Top Speed +6 km/h)',
    },
    {
      designId: '11477',
      elementId: '6047276',
      name: 'Slope Curved 2x1 High-Downforce Vortex Flap',
      category: 'Front Wing',
      description: 'Aggressive curvature producing maximum front-axle bite for street circuits.',
      downforceImpact: '+22% Downforce (Monaco Spec)',
      dragImpact: '+9% Drag',
    },
    {
      designId: '93606',
      elementId: '6275844',
      name: 'Curved 4x2 Triple Stepped Aero Wing',
      category: 'Front Wing',
      description: 'Complex 3-tier stepped aerodynamic cascade channeling air around tires.',
      downforceImpact: '+18% Downforce',
      dragImpact: '+5% Drag',
    },
  ],

  // Rims & Wheels
  rims: [
    {
      designId: '6014',
      elementId: '6270103',
      name: '18-Inch Multi-Spoke BBS Racing Rim',
      category: 'Wheels & Rims',
      description: 'Official Speed Champions Ferrari 18" forged multi-spoke rim.',
      downforceImpact: 'Standard',
      dragImpact: 'Neutral',
    },
    {
      designId: '3068b',
      elementId: '6317208',
      name: 'Aero-Dish Carbon Disc Wheel Cover',
      category: 'Wheels & Rims',
      description: 'Smooth aerodynamic disc covering rim turbulence to prevent dirty air.',
      downforceImpact: '+4% Efficiency',
      dragImpact: '-8% Wheel Drag',
    },
    {
      designId: '2412b',
      elementId: '614126',
      name: 'Turbine Vane Cooling Spoke Rim',
      category: 'Wheels & Rims',
      description: 'Directional cooling vents extracting carbon ceramic brake heat.',
      downforceImpact: '+6% Brake Cooling',
      dragImpact: '+2% Drag',
    },
  ],

  // Sidepods & Downwash
  sidepods: [
    {
      designId: '15068',
      elementId: '6047220',
      name: 'Slope Curved 2x2 Downwash Ramp',
      category: 'Sidepods',
      description: 'Ferrari SF-24 style sculpted aerodynamic downwash water-slide sidepod.',
      downforceImpact: '+15% Downforce',
      dragImpact: '-4% Induced Drag',
    },
    {
      designId: '11477',
      elementId: '6047276',
      name: 'Slope Curved 2x1 Slender Undercut Pod',
      category: 'Sidepods',
      description: 'Tight packaging providing expansive floor undercut for ground-effect tunnels.',
      downforceImpact: '+12% Underfloor Airflow',
      dragImpact: '-6% Frontal Area',
    },
    {
      designId: '2412b',
      elementId: '614126',
      name: 'Louvered Shark Gill Cooling Matrix',
      category: 'Sidepods',
      description: 'Authentic engine cooling louvers for hot high-altitude circuits (Mexico GP).',
      downforceImpact: 'Thermal Cooling Spec',
      dragImpact: '+3% Drag',
    },
    {
      designId: '3020',
      elementId: '6388484',
      name: 'Plate 2x4 Flat Ingot Sidepod',
      category: 'Sidepods',
      description: 'Classic horizontal sidepod design with robust mounting area.',
      downforceImpact: 'Sturdy Chassis Spec',
      dragImpact: 'Neutral',
    },
  ],

  // Rear Wing & DRS
  rearWing: [
    {
      designId: '3710',
      elementId: '6051508',
      name: 'Plate 1x4 High-Downforce Triple-Beam DRS',
      category: 'Rear Wing',
      description: 'Standard championship rear wing with wide DRS drag reduction flap.',
      downforceImpact: 'Standard High Downforce',
      dragImpact: 'Neutral',
    },
    {
      designId: '3666',
      elementId: '6217875',
      name: 'Plate 1x6 Ultra-Wide DRS Wing Blade',
      category: 'Rear Wing',
      description: 'Extra wide 6-stud blade providing immense cornering stability.',
      downforceImpact: '+20% Rear Stability',
      dragImpact: '+8% Drag',
    },
    {
      designId: '2431',
      elementId: '6051508',
      name: 'Tile 1x4 Smooth Monza Low-Drag Wing',
      category: 'Rear Wing',
      description: 'Minimal angle-of-attack blade engineered specifically for Monza & Spa.',
      downforceImpact: '-22% Downforce',
      dragImpact: '-25% Drag (Speed Trap Beast)',
    },
  ],

  // General Plates & Tiles (For any 1x1, 1x2, 1x4, or 2x4 plate)
  plates: [
    {
      designId: '3024',
      elementId: '6047222',
      name: 'Plate 1x1 with Round Stud',
      category: 'Plates',
      description: 'Standard building element with authentic LEGO cylindrical stud.',
    },
    {
      designId: '3070b',
      elementId: '6284699',
      name: 'Tile 1x1 Smooth with Edge Groove',
      category: 'Tiles',
      description: 'Studless polished surface providing clean aerodynamic finish.',
    },
    {
      designId: '3023',
      elementId: '6047276',
      name: 'Plate 1x2 with 2 Studs',
      category: 'Plates',
      description: 'Universal connector plate with dual cylindrical studs.',
    },
    {
      designId: '3069b',
      elementId: '6051511',
      name: 'Tile 1x2 Smooth with Groove',
      category: 'Tiles',
      description: 'Studless smooth tile with 0.4 LDU seam clearance.',
    },
    {
      designId: '2412b',
      elementId: '614126',
      name: 'Radiator Grille 1x2 Cooling Slats',
      category: 'Special',
      description: 'Engine cooling matrix tile with authentic embossed air louvers.',
    },
  ],
};

/**
 * Returns compatible swap alternatives for any given LDraw instance
 */
export function getCompatibleAlternatives(
  designId: string,
  partKey: CarPartKey
): ModularPartOption[] {
  const cleanId = designId.replace('.dat', '');

  // 1. Check direct subassembly category
  if (MODULAR_PART_ALTERNATIVES[partKey]) {
    return MODULAR_PART_ALTERNATIVES[partKey];
  }

  // 2. Check general plates/tiles
  if (['3024', '3070b', '3023', '3069b', '3710', '2431', '3020', '3068b'].includes(cleanId)) {
    return MODULAR_PART_ALTERNATIVES.plates;
  }

  // 3. Fallback to generic compatible options
  return [
    {
      designId: '3024',
      elementId: '6047222',
      name: 'Plate 1x1 with Stud',
      category: 'Plates',
      description: 'Classic LEGO 1x1 plate with central stud.',
    },
    {
      designId: '3070b',
      elementId: '6284699',
      name: 'Tile 1x1 Smooth Groove',
      category: 'Tiles',
      description: 'Smooth aerodynamic finish tile without studs.',
    },
    {
      designId: '11477',
      elementId: '6047276',
      name: 'Slope Curved 2x1x2/3 No Studs',
      category: 'Slopes',
      description: 'Curved aerodynamic surface channeling air stream.',
    },
  ];
}
