/**
 * Master Blueprint Model Registry Pattern
 * 
 * Central registry for official LEGO instruction manual ingestion pipelines.
 * Calibrated against the Ferrari SF-24 (Set #77242 - Booklet 6566098.pdf)
 * and designed to ingest future models (e.g. McLaren MCL38 #77251, GT-sports, etc.)
 */

import { OFFICIAL_77242_LDR } from '../data/official77242Ldr';

export type VehicleType = 'f1-modern' | 'gt-sports' | 'classic';

export interface VehicleStage {
  stageNumber: number;
  name: string;
  stepRange: [number, number];
  bagNumbers: number[];
  description: string;
  keyElements: Array<{
    elementId: string;
    designId: string;
    name: string;
  }>;
}

export interface VehicleBOMItem {
  elementId: string;
  designId: string;
  count: number;
  name: string;
  category: string;
  colorName?: string;
  colorHex?: string;
}

export interface VehicleStepDefinition {
  stepNumber: number;
  stage: number;
  title: string;
  subAssembly: string;
  description: string;
  parts: Array<{
    designId: string;
    elementId: string;
    count: number;
    name: string;
    colorCode?: number;
    colorHex?: string;
  }>;
  snotOrientation?: 'vertical-left' | 'vertical-right' | 'upright' | 'horizontal-outward';
  anchorCoordinates?: { x: number; y: number; z: number };
}

export interface VehicleModelDefinition {
  setId: string;
  name: string;
  team: string;
  type: VehicleType;
  year: number;
  era: string;
  wheelbase: {
    frontAxleZ: number; // e.g. -140 LDU
    rearAxleZ: number;  // e.g. +140 LDU
    totalLdu: number;   // 280 LDU
  };
  trackWidth: {
    front: number;      // e.g. 60 LDU
    rear: number;       // e.g. 60 LDU
    rimFlushX: number;  // e.g. 65 LDU
  };
  groundPlaneY: number; // 0.0 LDU (base plate #30029 lowest surface rests strictly at Y = 0)
  stages: VehicleStage[];
  bom: VehicleBOMItem[];
  steps: VehicleStepDefinition[];
  rawLdr: string;
  manualPdfName?: string;
}

// =============================================================================
// FERRARI SF-24 (#77242) OFFICIAL CALIBRATION MODEL DEFINITION
// Extracted from Official Manual 6566098.pdf (Pages 1–104)
// =============================================================================

export const FERRARI_77242_STAGES: VehicleStage[] = [
  {
    stageNumber: 1,
    name: 'Stage 1: Vehicle Core Base & Bulkheads',
    stepRange: [1, 20],
    bagNumbers: [1, 2],
    description: 'Vehicle Core Base #30029 (Element #6472255), front bulkhead, rear axle blocks, and inner Technic anchors resting flush on Y = 0.',
    keyElements: [
      { elementId: '6472255', designId: '30029', name: 'Vehicle Base 4 x 12 Undertray Plate' },
      { elementId: '6057458', designId: '99781', name: 'Bracket 1 x 2 - 1 x 2 Down Yellow Chassis Brace' },
      { elementId: '6456644', designId: '4070', name: 'Brick 1 x 1 with Headlight / Stud on Side Red' },
      { elementId: '6129995', designId: '3705', name: 'Technic Axle 4L Black (Rear Axle Receiver)' },
    ],
  },
  {
    stageNumber: 2,
    name: 'Stage 2: Cockpit Module, Front Suspension & Halo Anchor',
    stepRange: [21, 38],
    bagNumbers: [1, 2],
    description: 'Cockpit cell, driver seating tub, Halo safety anchor (#6535158), steering console with telemetry tile, and front bulkhead cascade.',
    keyElements: [
      { elementId: '6535158', designId: '100745', name: 'Halo Cockpit Safety Ring 3-Point Structure' },
      { elementId: '6394948', designId: '3022', name: 'Plate 2 x 2 Reddish Brown Driver Seat Tub' },
      { elementId: '6535299', designId: '112033', name: 'Minifig Racing Helmet Rosso Corsa' },
      { elementId: '6516544', designId: '973', name: 'Torso Scuderia Ferrari HP Driver Suit' },
    ],
  },
  {
    stageNumber: 3,
    name: 'Stage 3: SNOT Lateral Sidepods & Downwash Aero Undercuts',
    stepRange: [39, 65],
    bagNumbers: [3, 4],
    description: 'SNOT lateral sidepods. Brackets (#99207 / #99780) anchored outward (±X), covered by smooth bottom tiles (#2431/#3069b) and curved slope aero covers (#11477/#93606/#5095) standing vertically.',
    keyElements: [
      { elementId: '6331723', designId: '99207', name: 'Bracket 1 x 2 - 2 x 2 Inverted (Sidepod SNOT Mount)' },
      { elementId: '6388352', designId: '99780', name: 'Bracket 1 x 2 - 1 x 2 Up (Sidepod Anchor)' },
      { elementId: '6539341', designId: '93606', name: 'Slope Curved 4 x 2 Triple Stepped Wedge Left' },
      { elementId: '6539342', designId: '93606', name: 'Slope Curved 4 x 2 Triple Stepped Wedge Right' },
      { elementId: '6539344', designId: '11477', name: 'Slope Curved 2 x 1 x 2/3 Sidepod Undercut Cowl' },
      { elementId: '243126', designId: '2431', name: 'Tile 1 x 4 Smooth Floor Trim' },
    ],
  },
  {
    stageNumber: 4,
    name: 'Stage 4: Engine Cover Spine, Shark Fin, Rear Wing & Wheels',
    stepRange: [66, 103],
    bagNumbers: [5, 6],
    description: 'Engine cover spine, dorsal shark fin (#2431), rear wing DRS assembly with smooth Tile 2 x 4 (#87079) vertical endplates, and 4-wheel mounting with aero dish discs (#6539343).',
    keyElements: [
      { elementId: '6284071', designId: '87079', name: 'Tile 2 x 4 Smooth (Rear Wing Vertical Endplates)' },
      { elementId: '6539343', designId: '112498', name: 'Dish 16mm Aero Wheel Cover Hubcaps' },
      { elementId: '6481568', designId: '107728', name: 'Wheel 24 x 13.4 Front with Pirelli Print' },
      { elementId: '6538245', designId: '112423', name: 'Wheel 24 x 14.9 Rear Wide with Pirelli Print' },
      { elementId: '6342816', designId: '80249', name: 'Speed Champions Slick Tire Rubber 30.4 x 14' },
    ],
  },
];

export const FERRARI_77242_BOM: VehicleBOMItem[] = [
  // Page 102
  { elementId: '6472255', designId: '30029', count: 1, name: 'Vehicle Base 4 x 12 Undertray Chassis Plate', category: 'Chassis', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6535158', designId: '100745', count: 1, name: 'Halo Cockpit Safety Ring 3-Point Structure', category: 'Aero & Halo', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6539343', designId: '112498', count: 4, name: 'Dish 16mm Aero Wheel Cover Hubcap', category: 'Wheels & Axles', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6481568', designId: '107728', count: 2, name: 'Wheel 24 x 13.4 Front with Pirelli Rim Print', category: 'Wheels & Axles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6538245', designId: '112423', count: 2, name: 'Wheel 24 x 14.9 Rear Wide with Pirelli Rim Print', category: 'Wheels & Axles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6342816', designId: '80249', count: 4, name: 'Speed Champions Slick Tire Rubber 30.4 x 14', category: 'Wheels & Axles', colorName: 'Rubber Black', colorHex: '#1B2A34' },
  { elementId: '6513907', designId: '15068', count: 1, name: 'Slope Curved 2 x 2 Stepped Nose Cone', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6560649', designId: '11477', count: 1, name: 'Slope Curved 2 x 1 x 2/3 Nose Tip', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6539341', designId: '93606', count: 1, name: 'Slope Curved 4 x 2 Triple Stepped Wedge Left', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6539342', designId: '93606', count: 1, name: 'Slope Curved 4 x 2 Triple Stepped Wedge Right', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6539344', designId: '11477', count: 2, name: 'Slope Curved 2 x 1 x 2/3 Sidepod Undercut Cowl', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6539345', designId: '5095', count: 2, name: 'Slope Curved 3 x 1 No Studs Sidepod Downwash', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6515219', designId: '3388', count: 1, name: 'Front Wheel Aero Deflector / Winglet Left', category: 'Aero & Halo', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6515220', designId: '3389', count: 1, name: 'Front Wheel Aero Deflector / Winglet Right', category: 'Aero & Halo', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6331723', designId: '99207', count: 4, name: 'Bracket 1 x 2 - 2 x 2 Inverted (Sidepod SNOT Mount)', category: 'Brackets', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6388352', designId: '99780', count: 3, name: 'Bracket 1 x 2 - 1 x 2 Up (Sidepod Anchor)', category: 'Brackets', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6057458', designId: '99781', count: 3, name: 'Bracket 1 x 2 - 1 x 2 Down (Yellow Chassis Brace)', category: 'Brackets', colorName: 'Bright Light Yellow', colorHex: '#F2CD37' },
  { elementId: '6271752', designId: '99207', count: 3, name: 'Bracket 1 x 2 - 2 x 2 Inverted Dark Grey', category: 'Brackets', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '6510125', designId: '99781', count: 2, name: 'Bracket 1 x 2 - 1 x 2 Dark Grey', category: 'Brackets', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '4666579', designId: '99207', count: 2, name: 'Bracket 1 x 2 - 2 x 2 Inverted White', category: 'Brackets', colorName: 'White', colorHex: '#FFFFFF' },
  { elementId: '6102138', designId: '99780', count: 1, name: 'Bracket 1 x 2 - 1 x 2 Red', category: 'Brackets', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6284071', designId: '87079', count: 2, name: 'Tile 2 x 4 Smooth (Rear Wing Vertical Endplates)', category: 'Tiles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '243126', designId: '2431', count: 2, name: 'Tile 1 x 4 Smooth Shark Fin / Floor Trim Black', category: 'Tiles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6378132', designId: '2431', count: 1, name: 'Tile 1 x 4 Smooth Rear Wing Flap Red', category: 'Tiles', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6016172', designId: '2412b', count: 6, name: 'Tile 1 x 2 Radiator Grille Black', category: 'Tiles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6510139', designId: '3069b', count: 2, name: 'Tile 1 x 2 Smooth Black', category: 'Tiles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '307026', designId: '3070b', count: 2, name: 'Tile 1 x 1 Smooth Black', category: 'Tiles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '307001', designId: '3070b', count: 1, name: 'Tile 1 x 1 Smooth White', category: 'Tiles', colorName: 'White', colorHex: '#FFFFFF' },
  { elementId: '307021', designId: '3070b', count: 2, name: 'Tile 1 x 1 Smooth Red', category: 'Tiles', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6348058', designId: '14769', count: 2, name: 'Tile 2 x 2 Round Red', category: 'Tiles', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6299338', designId: '98138', count: 2, name: 'Tile 1 x 1 Round Black', category: 'Tiles', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '614126', designId: '4073', count: 2, name: 'Plate 1 x 1 Round Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6424674', designId: '4073', count: 4, name: 'Plate 1 x 1 Round Yellow', category: 'Plates', colorName: 'Yellow', colorHex: '#F2CD37' },
  { elementId: '6004990', designId: '4073', count: 4, name: 'Plate 1 x 1 Round Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '6141554', designId: '4073', count: 1, name: 'Plate 1 x 1 Round Pearl Gold', category: 'Plates', colorName: 'Pearl Gold', colorHex: '#AA7F2E' },
  { elementId: '6141556', designId: '4073', count: 1, name: 'Plate 1 x 1 Round Trans-Yellow', category: 'Plates', colorName: 'Trans-Yellow', colorHex: '#D5C319' },
  { elementId: '6168620', designId: '3020', count: 2, name: 'Plate 2 x 4 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6029948', designId: '3020', count: 2, name: 'Plate 2 x 4 Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '6284577', designId: '3020', count: 1, name: 'Plate 2 x 4 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6508988', designId: '3020', count: 1, name: 'Plate 2 x 4 Black Undertray Rear', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6168644', designId: '3021', count: 2, name: 'Plate 2 x 3 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '302126', designId: '3021', count: 1, name: 'Plate 2 x 3 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6210270', designId: '3021', count: 2, name: 'Plate 2 x 3 Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '302221', designId: '3022', count: 4, name: 'Plate 2 x 2 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6394948', designId: '3022', count: 1, name: 'Plate 2 x 2 Reddish Brown Cockpit Floor', category: 'Plates', colorName: 'Reddish Brown', colorHex: '#582A12' },
  { elementId: '4225201', designId: '2420', count: 1, name: 'Plate 2 x 2 Corner Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6156991', designId: '3023', count: 10, name: 'Plate 1 x 2 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6372478', designId: '3023', count: 6, name: 'Plate 1 x 2 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '302321', designId: '3023', count: 5, name: 'Plate 1 x 2 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '4210719', designId: '3023', count: 6, name: 'Plate 1 x 2 Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '4211525', designId: '3023', count: 3, name: 'Plate 1 x 2 Light Grey', category: 'Plates', colorName: 'Light Stone Grey', colorHex: '#969696' },
  { elementId: '302324', designId: '3023', count: 2, name: 'Plate 1 x 2 Yellow Rear Brace', category: 'Plates', colorName: 'Yellow', colorHex: '#F2CD37' },
  { elementId: '6289797', designId: '3023', count: 2, name: 'Plate 1 x 2 White', category: 'Plates', colorName: 'White', colorHex: '#FFFFFF' },
  { elementId: '302421', designId: '3024', count: 6, name: 'Plate 1 x 1 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6510061', designId: '3024', count: 3, name: 'Plate 1 x 1 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6166106', designId: '3024', count: 2, name: 'Plate 1 x 1 Reddish Brown', category: 'Plates', colorName: 'Reddish Brown', colorHex: '#582A12' },
  { elementId: '6178922', designId: '3710', count: 1, name: 'Plate 1 x 4 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '371026', designId: '3710', count: 1, name: 'Plate 1 x 4 Black Front Wing', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6210269', designId: '3710', count: 3, name: 'Plate 1 x 4 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '371001', designId: '3710', count: 3, name: 'Plate 1 x 4 White', category: 'Plates', colorName: 'White', colorHex: '#FFFFFF' },
  { elementId: '6225494', designId: '3710', count: 2, name: 'Plate 1 x 4 Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '4548180', designId: '3623', count: 2, name: 'Plate 1 x 3 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6196548', designId: '3623', count: 1, name: 'Plate 1 x 3 Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '6092585', designId: '3666', count: 4, name: 'Plate 1 x 6 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6092565', designId: '3666', count: 2, name: 'Plate 1 x 6 Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '4211056', designId: '3666', count: 2, name: 'Plate 1 x 6 Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '4160869', designId: '3460', count: 1, name: 'Plate 1 x 8 Black Longitudinal Spine', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '4161332', designId: '3795', count: 1, name: 'Plate 2 x 6 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6181713', designId: '3034', count: 1, name: 'Plate 2 x 8 Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '4656764', designId: '2445', count: 1, name: 'Plate 2 x 12 Black Main Keel', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6000650', designId: '35480', count: 6, name: 'Plate 1 x 2 Rounded Ends with Open Studs Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6248890', designId: '35480', count: 6, name: 'Plate 1 x 2 Rounded Ends with Open Studs Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '4190219', designId: '35480', count: 2, name: 'Plate 1 x 2 Rounded Ends with Open Studs Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '403226', designId: '4032', count: 2, name: 'Plate 2 x 2 Round with Axle Hole Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6395635', designId: '4032', count: 2, name: 'Plate 2 x 2 Round with Axle Hole Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '6166859', designId: '26601', count: 4, name: 'Wedge Plate 2 x 2 Cut Corner Black', category: 'Wedges', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6508991', designId: '65429', count: 2, name: 'Wedge Plate 3 x 2 Left Black Front Wing Cascade', category: 'Wedges', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6328095', designId: '65426', count: 2, name: 'Wedge Plate 3 x 2 Right Black Front Wing Cascade', category: 'Wedges', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6530673', designId: '41769', count: 1, name: 'Wedge Plate 2 x 4 Left Red Nose Flank', category: 'Wedges', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '4188189', designId: '41770', count: 1, name: 'Wedge Plate 2 x 4 Right Red Nose Flank', category: 'Wedges', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6439175', designId: '43722', count: 2, name: 'Wedge 4 x 2 Left Black Floor Strakes', category: 'Wedges', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6438520', designId: '43723', count: 1, name: 'Wedge 4 x 2 Right Black Floor Strakes', category: 'Wedges', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6536991', designId: '15068', count: 2, name: 'Slope Curved 2 x 2 Red', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6534944', designId: '15068', count: 2, name: 'Slope Curved 2 x 2 Red Airbox', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6510071', designId: '15068', count: 1, name: 'Slope Curved 2 x 2 Black', category: 'Slopes', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6517676', designId: '30165', count: 2, name: 'Slope Curved 3 x 2 Black Sidepod Underside', category: 'Slopes', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6494496', designId: '54200', count: 4, name: 'Slope 30 1 x 1 x 2/3 Red', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '4537986', designId: '54200', count: 1, name: 'Slope 30 1 x 1 x 2/3 Red', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6330903', designId: '54200', count: 1, name: 'Slope 30 1 x 1 x 2/3 White', category: 'Slopes', colorName: 'White', colorHex: '#FFFFFF' },
  { elementId: '6172383', designId: '54200', count: 2, name: 'Slope 30 1 x 1 x 2/3 Black', category: 'Slopes', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6347308', designId: '3040', count: 2, name: 'Slope 45 2 x 1 Red', category: 'Slopes', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6456644', designId: '4070', count: 2, name: 'Brick 1 x 1 with Headlight Red', category: 'Bricks', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '300521', designId: '3005', count: 2, name: 'Brick 1 x 1 Red', category: 'Bricks', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '300321', designId: '3003', count: 1, name: 'Brick 2 x 2 Red', category: 'Bricks', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6129995', designId: '3705', count: 1, name: 'Technic Axle 4L Black', category: 'Technic', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '370526', designId: '3705', count: 1, name: 'Technic Axle 4L Black', category: 'Technic', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6181720', designId: '3705', count: 1, name: 'Technic Axle 4L Red', category: 'Technic', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '4273590', designId: '2780', count: 4, name: 'Technic Friction Pin with Ridge Black', category: 'Technic', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6167576', designId: '11214', count: 1, name: 'Technic Pin Axle 1L with Pin Hole Dark Grey', category: 'Technic', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '6420198', designId: '32523', count: 1, name: 'Technic Liftarm 1 x 3 Thick Black', category: 'Technic', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '4504382', designId: '3176', count: 2, name: 'Plate 3 x 2 with Hole Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '4526110', designId: '32064', count: 1, name: 'Technic Brick 1 x 2 with Axle Hole Black', category: 'Technic', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6089698', designId: '4085d', count: 2, name: 'Plate 1 x 1 with Vertical Clip Red', category: 'Plates', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6020193', designId: '4085d', count: 5, name: 'Plate 1 x 1 with Vertical Clip Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6146220', designId: '60476', count: 2, name: 'Plate 1 x 1 with Horizontal Clip Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6192346', designId: '60475', count: 2, name: 'Plate 1 x 2 with Vertical Clip Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6335388', designId: '60475', count: 2, name: 'Plate 1 x 2 with 2 Vertical Clips Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6335317', designId: '48336', count: 1, name: 'Plate 1 x 2 with Bar Handle Black', category: 'Plates', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6382577', designId: '48336', count: 2, name: 'Plate 1 x 2 with Bar Handle Dark Grey', category: 'Plates', colorName: 'Dark Stone Grey', colorHex: '#646464' },
  { elementId: '6515221', designId: '4697b', count: 2, name: 'Pneumatic T-Piece / Bar with Clip Red', category: 'Technic', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '80179', designId: '80179', count: 2, name: 'Aerodynamic Rearview Mirror Cockpit Stalk Red', category: 'Aero & Halo', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6516544', designId: '973', count: 1, name: 'Minifigure Torso Scuderia Ferrari F1 Race Suit', category: 'Minifig', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6507845', designId: '970', count: 1, name: 'Minifigure Legs Red Race Suit', category: 'Minifig', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6539340', designId: '3626', count: 1, name: 'Minifigure Head Dual Sided Charles Leclerc', category: 'Minifig', colorName: 'Yellow', colorHex: '#F2CD37' },
  { elementId: '6535299', designId: '112033', count: 1, name: 'Minifigure Racing Helmet Rosso Corsa', category: 'Minifig', colorName: 'Rosso Corsa', colorHex: '#C91A09' },
  { elementId: '6539339', designId: '2447', count: 1, name: 'Minifigure Helmet Visor Black', category: 'Minifig', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '6507846', designId: '88283', count: 1, name: 'Minifigure Hair Tousled Side Part Black', category: 'Minifig', colorName: 'Black', colorHex: '#1B2A34' },
  { elementId: '9342', designId: '9342', count: 1, name: 'Mechanic Wrench Tool Light Pearl Grey', category: 'Minifig', colorName: 'Light Pearl Grey', colorHex: '#9CA3AF' },
];

export const FERRARI_77242_STEPS: VehicleStepDefinition[] = [
  // Stage 1 (Steps 1–20)
  {
    stepNumber: 1,
    stage: 1,
    title: 'Vehicle Base Undertray Grounding',
    subAssembly: 'Vehicle Core Base',
    description: 'Place Vehicle Base 4 x 12 #30029 directly flush at Y = 0 floor plane with rear yellow 1x2 plates (#3023).',
    parts: [
      { designId: '30029', elementId: '6472255', count: 1, name: 'Vehicle Base 4 x 12 Undertray Plate' },
      { designId: '3023', elementId: '302324', count: 2, name: 'Plate 1 x 2 Yellow' },
    ],
    anchorCoordinates: { x: 0, y: -8, z: 0 },
  },
  {
    stepNumber: 2,
    stage: 1,
    title: 'Rear Bulkhead Headlight Bricks',
    subAssembly: 'Chassis Bulkhead',
    description: 'Mount dual 1x1 red headlight bricks (#4070) and 1x2 grey support plate.',
    parts: [
      { designId: '4070', elementId: '6456644', count: 2, name: 'Brick 1 x 1 with Headlight Red' },
      { designId: '3023', elementId: '4210719', count: 1, name: 'Plate 1 x 2 Dark Grey' },
    ],
    anchorCoordinates: { x: 0, y: -16, z: 120 },
  },
  {
    stepNumber: 4,
    stage: 1,
    title: 'Chassis Reinforcement Plates',
    subAssembly: 'Chassis Monocoque',
    description: 'Install longitudinal 1x4 dark grey plates and inner bracket mounts.',
    parts: [
      { designId: '3710', elementId: '6225494', count: 2, name: 'Plate 1 x 4 Dark Grey' },
    ],
    anchorCoordinates: { x: 0, y: -16, z: 40 },
  },
  {
    stepNumber: 8,
    stage: 1,
    title: 'SNOT Chassis Bracket Anchors',
    subAssembly: 'SNOT Brackets',
    description: 'Install lateral inverted brackets (#99207) at X = ±38 facing outward to receive sidepods.',
    parts: [
      { designId: '99207', elementId: '6331723', count: 2, name: 'Bracket 1 x 2 - 2 x 2 Inverted Black' },
    ],
    snotOrientation: 'horizontal-outward',
    anchorCoordinates: { x: 38, y: -8, z: 0 },
  },
  {
    stepNumber: 13,
    stage: 1,
    title: 'Cockpit Sub-Base & Driver Floor',
    subAssembly: 'Cockpit Cell',
    description: 'Seat tub reddish brown 2x2 plate (#3022) and yellow bracket assembly.',
    parts: [
      { designId: '3022', elementId: '6394948', count: 1, name: 'Plate 2 x 2 Reddish Brown' },
      { designId: '99781', elementId: '6057458', count: 1, name: 'Bracket 1 x 2 - 1 x 2 Down Yellow' },
    ],
    anchorCoordinates: { x: 0, y: -16, z: 0 },
  },
  {
    stepNumber: 20,
    stage: 1,
    title: 'Cockpit Steering Console & Headrest',
    subAssembly: 'Cockpit Cell',
    description: 'Mount digital telemetry console tile and driver headrest structure.',
    parts: [
      { designId: '3069b', elementId: '6510139', count: 1, name: 'Tile 1 x 2 Telemetry Screen' },
      { designId: '99780', elementId: '6388352', count: 1, name: 'Bracket 1 x 2 - 1 x 2 Up Black' },
    ],
    anchorCoordinates: { x: 0, y: -24, z: -35 },
  },

  // Stage 2 (Steps 21–38)
  {
    stepNumber: 21,
    stage: 2,
    title: 'Front Suspension Keel & Axle Block',
    subAssembly: 'Front Axle Block',
    description: 'Lock front suspension blocks and Technic pin receivers at Z = -140 LDU.',
    parts: [
      { designId: '35480', elementId: '6000650', count: 2, name: 'Plate 1 x 2 Rounded Ends Black' },
    ],
    anchorCoordinates: { x: 0, y: -8, z: -140 },
  },
  {
    stepNumber: 26,
    stage: 2,
    title: 'Front Wing Cascade Tongue Anchor',
    subAssembly: 'Front Bulkhead',
    description: 'Front nose tongue and Ferrari Scuderia shield emblems (#26) at front keel.',
    parts: [
      { designId: '54200', elementId: '6494496', count: 2, name: 'Slope 30 1 x 1 x 2/3 Red' },
    ],
    anchorCoordinates: { x: 0, y: -16, z: -115 },
  },
  {
    stepNumber: 31,
    stage: 2,
    title: 'Rear Axle Technic Lock Pin',
    subAssembly: 'Rear Axle Block',
    description: 'Insert 4L Technic axle (#6129995) through rear axle block at Z = +140 LDU.',
    parts: [
      { designId: '3705', elementId: '6129995', count: 1, name: 'Technic Axle 4L Black' },
    ],
    anchorCoordinates: { x: 0, y: -14, z: 140 },
  },
  {
    stepNumber: 38,
    stage: 2,
    title: 'Halo Titanium Safety Ring Anchor',
    subAssembly: 'Halo Anchor',
    description: 'Lock central Halo structural anchor (#6535158) above cockpit cell.',
    parts: [
      { designId: '100745', elementId: '6535158', count: 1, name: 'Halo Cockpit Safety Ring 3-Point Structure' },
    ],
    anchorCoordinates: { x: 0, y: -24, z: -10 },
  },

  // Stage 3 (Steps 39–65)
  {
    stepNumber: 43,
    stage: 3,
    title: 'Left SNOT Sidepod Sub-Assembly Base',
    subAssembly: 'Sidepods',
    description: 'Build left SNOT mounting bar using dual inverted brackets (#99207) and bottom smooth tile #2431.',
    parts: [
      { designId: '2431', elementId: '243126', count: 1, name: 'Tile 1 x 4 Smooth Floor Trim' },
      { designId: '99207', elementId: '6331723', count: 2, name: 'Bracket 1 x 2 - 2 x 2 Inverted Black' },
    ],
    snotOrientation: 'vertical-left',
    anchorCoordinates: { x: -38, y: -8, z: 0 },
  },
  {
    stepNumber: 47,
    stage: 3,
    title: 'Left Sidepod Downwash Undercut Aero Cowls',
    subAssembly: 'Sidepods',
    description: 'Attach upright curved slopes #93606 and #11477 vertically at X = -48 with Ray-Ban & Shell decals.',
    parts: [
      { designId: '93606', elementId: '6539341', count: 1, name: 'Slope Curved 4 x 2 Triple Stepped Wedge Left' },
      { designId: '11477', elementId: '6539344', count: 1, name: 'Slope Curved 2 x 1 x 2/3 Sidepod Undercut Cowl' },
    ],
    snotOrientation: 'vertical-left',
    anchorCoordinates: { x: -48, y: -16, z: 0 },
  },
  {
    stepNumber: 50,
    stage: 3,
    title: 'Right SNOT Sidepod Sub-Assembly Base',
    subAssembly: 'Sidepods',
    description: 'Build right SNOT mounting bar using dual inverted brackets (#99207) and bottom smooth tile #2431.',
    parts: [
      { designId: '2431', elementId: '243126', count: 1, name: 'Tile 1 x 4 Smooth Floor Trim' },
      { designId: '99207', elementId: '6331723', count: 2, name: 'Bracket 1 x 2 - 2 x 2 Inverted Black' },
    ],
    snotOrientation: 'vertical-right',
    anchorCoordinates: { x: 38, y: -8, z: 0 },
  },
  {
    stepNumber: 55,
    stage: 3,
    title: 'Right Sidepod Downwash Undercut Aero Cowls',
    subAssembly: 'Sidepods',
    description: 'Attach upright curved slopes #93606 and #11477 vertically at X = +48 with Ray-Ban & Shell decals.',
    parts: [
      { designId: '93606', elementId: '6539342', count: 1, name: 'Slope Curved 4 x 2 Triple Stepped Wedge Right' },
      { designId: '11477', elementId: '6539344', count: 1, name: 'Slope Curved 2 x 1 x 2/3 Sidepod Undercut Cowl' },
    ],
    snotOrientation: 'vertical-right',
    anchorCoordinates: { x: 48, y: -16, z: 0 },
  },

  // Stage 4 (Steps 66–103)
  {
    stepNumber: 67,
    stage: 4,
    title: 'Rear Wing Diffuser & Lower Beam Support',
    subAssembly: 'Rear Wing',
    description: 'Connect rear diffuser crash structure and dual vertical pylons.',
    parts: [
      { designId: '3020', elementId: '6168620', count: 1, name: 'Plate 2 x 4 Black' },
    ],
    anchorCoordinates: { x: 0, y: -16, z: 175 },
  },
  {
    stepNumber: 71,
    stage: 4,
    title: 'Rear Wing Mainplane & Tile 2 x 4 Endplates',
    subAssembly: 'Rear Wing',
    description: 'Install smooth Tile 2 x 4 (#87079) vertical endplates at X = ±60 and upper DRS aerofoil flap (#2431).',
    parts: [
      { designId: '87079', elementId: '6284071', count: 2, name: 'Tile 2 x 4 Smooth (Rear Wing Vertical Endplates)' },
      { designId: '2431', elementId: '6378132', count: 1, name: 'Tile 1 x 4 Smooth Rear Wing Flap Red' },
    ],
    snotOrientation: 'vertical-left',
    anchorCoordinates: { x: 60, y: -46, z: 195 },
  },
  {
    stepNumber: 74,
    stage: 4,
    title: 'Front Nose Cone & Outwash Wing Cascade',
    subAssembly: 'Front Wing',
    description: 'Build stepped nose cone #15068/#11477 and attach front wing cascade with outwash corners (#2420) at X = ±76.',
    parts: [
      { designId: '15068', elementId: '6513907', count: 1, name: 'Slope Curved 2 x 2 Stepped Nose Cone' },
      { designId: '2420', elementId: '4225201', count: 2, name: 'Plate 2 x 2 Corner Black' },
    ],
    anchorCoordinates: { x: 0, y: -16, z: -185 },
  },
  {
    stepNumber: 89,
    stage: 4,
    title: 'Mount Front Wing Assembly to Chassis',
    subAssembly: 'Front Wing',
    description: 'Slide complete front wing and nose cone sub-assembly into front chassis tongue at Z = -140 to -215 LDU.',
    parts: [
      { designId: '3710', elementId: '371026', count: 1, name: 'Plate 1 x 4 Black Front Wing' },
    ],
    anchorCoordinates: { x: 0, y: -12, z: -210 },
  },
  {
    stepNumber: 94,
    stage: 4,
    title: 'Lock Halo Titanium Safety Ring & Airbox Scoop',
    subAssembly: 'Aero & Halo',
    description: 'Pivot and latch Halo structure into front cockpit stud and install top airbox camera scoop.',
    parts: [
      { designId: '100745', elementId: '6535158', count: 1, name: 'Halo Cockpit Safety Ring 3-Point Structure' },
    ],
    anchorCoordinates: { x: 0, y: -24, z: -10 },
  },
  {
    stepNumber: 101,
    stage: 4,
    title: 'Mount Rear Wheels with Pirelli Rims & Aero Dishes',
    subAssembly: 'Wheels & Pirelli Tires',
    description: 'Mount rear wide 24x14.9 wheels (#6538245) at Z = +140 with slick tires and red aero dish covers (#6539343).',
    parts: [
      { designId: '112423', elementId: '6538245', count: 2, name: 'Wheel 24 x 14.9 Rear Wide with Pirelli Print' },
      { designId: '80249', elementId: '6342816', count: 2, name: 'Speed Champions Slick Tire Rubber 30.4 x 14' },
      { designId: '112498', elementId: '6539343', count: 2, name: 'Dish 16mm Aero Wheel Cover Hubcap' },
    ],
    anchorCoordinates: { x: 60, y: -14, z: 140 },
  },
  {
    stepNumber: 102,
    stage: 4,
    title: 'Mount Front Wheels with Pirelli Rims & Aero Dishes',
    subAssembly: 'Wheels & Pirelli Tires',
    description: 'Mount front 24x13.4 wheels (#6481568) at Z = -140 with slick tires and red aero dish covers (#6539343).',
    parts: [
      { designId: '107728', elementId: '6481568', count: 2, name: 'Wheel 24 x 13.4 Front with Pirelli Print' },
      { designId: '80249', elementId: '6342816', count: 2, name: 'Speed Champions Slick Tire Rubber 30.4 x 14' },
      { designId: '112498', elementId: '6539343', count: 2, name: 'Dish 16mm Aero Wheel Cover Hubcap' },
    ],
    anchorCoordinates: { x: 60, y: -14, z: -140 },
  },
  {
    stepNumber: 103,
    stage: 4,
    title: 'Seat Minifigure Driver in Cockpit',
    subAssembly: 'Minifig',
    description: 'Place Charles Leclerc / Carlos Sainz driver in race suit and helmet into cockpit seat.',
    parts: [
      { designId: '973', elementId: '6516544', count: 1, name: 'Minifigure Torso Scuderia Ferrari HP' },
      { designId: '112033', elementId: '6535299', count: 1, name: 'Minifigure Racing Helmet Rosso Corsa' },
    ],
    anchorCoordinates: { x: 0, y: -24, z: 0 },
  },
];

// Reference calibrated model: Ferrari SF-24 (#77242)
export const FERRARI_SF24_MODEL: VehicleModelDefinition = {
  setId: '77242',
  name: 'Ferrari SF-24 F1 Race Car',
  team: 'Scuderia Ferrari HP',
  type: 'f1-modern',
  year: 2025,
  era: 'modern-8-wide',
  wheelbase: {
    frontAxleZ: -140.0,
    rearAxleZ: 140.0,
    totalLdu: 280.0,
  },
  trackWidth: {
    front: 60.0,
    rear: 60.0,
    rimFlushX: 65.0,
  },
  groundPlaneY: 0.0, // Lowest surface rests strictly at Y = 0
  stages: FERRARI_77242_STAGES,
  bom: FERRARI_77242_BOM,
  steps: FERRARI_77242_STEPS,
  rawLdr: OFFICIAL_77242_LDR,
  manualPdfName: '6566098.pdf',
};

// =============================================================================
// GLOBAL MULTI-MODEL REGISTRY PATTERN
// =============================================================================

const modelRegistry = new Map<string, VehicleModelDefinition>();

// Register reference calibration model #77242
modelRegistry.set('77242', FERRARI_SF24_MODEL);

/**
 * Register a new vehicle model into the multi-model pipeline.
 * Designed for immediate ingestion of McLaren MCL38 (#77251), Mercedes W15, etc.
 */
export function registerVehicleModel(model: VehicleModelDefinition): void {
  modelRegistry.set(model.setId, model);
}

/**
 * Look up a registered vehicle model by its LEGO set ID.
 */
export function getVehicleModel(setId: string): VehicleModelDefinition | undefined {
  return modelRegistry.get(setId);
}

/**
 * Retrieve all registered vehicle models.
 */
export function getAllVehicleModels(): VehicleModelDefinition[] {
  return Array.from(modelRegistry.values());
}

/**
 * Ingests a new model blueprint (e.g. from uploaded PDF manual) into the pipeline.
 * Extensible for McLaren MCL38 #77251 and other Speed Champions sets.
 */
export function ingestManualBlueprint(spec: {
  setId: string;
  name: string;
  team: string;
  type: VehicleType;
  year?: number;
  bom?: VehicleBOMItem[];
  stages?: VehicleStage[];
  steps?: VehicleStepDefinition[];
  rawLdr?: string;
  manualPdfName?: string;
}): VehicleModelDefinition {
  const model: VehicleModelDefinition = {
    setId: spec.setId,
    name: spec.name,
    team: spec.team,
    type: spec.type,
    year: spec.year || 2025,
    era: spec.type === 'f1-modern' ? 'modern-8-wide' : 'classic-6-wide',
    wheelbase: {
      frontAxleZ: -140.0,
      rearAxleZ: 140.0,
      totalLdu: 280.0,
    },
    trackWidth: {
      front: 60.0,
      rear: 60.0,
      rimFlushX: 65.0,
    },
    groundPlaneY: 0.0,
    stages: spec.stages || FERRARI_77242_STAGES,
    bom: spec.bom || [],
    steps: spec.steps || [],
    rawLdr: spec.rawLdr || '',
    manualPdfName: spec.manualPdfName,
  };

  registerVehicleModel(model);
  return model;
}
