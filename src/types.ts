export type Era = 'modern-8-wide' | 'classic-6-wide' | 'polybag-mini';

export interface LegoF1Set {
  articleNumber: string;
  name: string;
  team: string;
  year: number;
  era: Era;
  pieceCount: number;
  minifigures?: number;
  description: string;
  officialLegoUrl: string;
  brickLinkUrl: string;
  brickEconomyUrl: string;
  rebrickableUrl: string;
  defaultColors: CarPartColors;
  defaultDecals: CarDecals;
  tags?: string[];
  isBundle?: boolean;
  notes?: string;
}

export interface CarPartColors {
  nose: string;
  frontWing: string;
  frontWingEndplates: string;
  halo: string;
  cockpit: string;
  driverHelmet: string;
  sidepods: string;
  engineCover: string;
  sharkFin: string;
  rearWing: string;
  rearWingEndplates: string;
  floor: string;
  rims: string;
  tireCompound: string; // Red (Soft), Yellow (Medium), White (Hard), Green (Inter), Blue (Wet)
}

export type CarPartKey = keyof CarPartColors;

/**
 * Instance-based color override mapping for individual bricks.
 * Key: unique instance ID (e.g. 'ldr-77242-15068-1')
 * Value: hexadecimal color code (e.g. '#FFFF00')
 */
export type CustomPieceOverrides = Record<string, string>;

export type DecalPlacementKey = 'sidepod' | 'nose' | 'frontWing' | 'rearWing' | 'sharkFin' | 'halo' | 'rims';

export type LiveryTemplateKey = 'downwash-slash' | 'classic-wedge' | 'flowlines-petronas' | 'heritage-twin' | 'carbon-stealth' | 'custom';

export interface CarDecals {
  racingNumber: string;
  numberStyle: 'modern-italic' | 'classic-bold' | 'retro-outlined' | 'digital';
  numberColor: string;
  sponsorPrimary: string;
  sponsorSecondary: string;
  sponsorEngine: string;
  technicalPartner: string;
  liveryStyle: 'center-stripe' | 'two-tone' | 'chevron-aero' | 'gradient-fade' | 'minimalist' | 'camo-geometric';
  accentStripeColor: string;
  tireLetteringColor: string;
  showHaloSticker: boolean;
  // Custom decal & logo studio extensions:
  uploadedLogoUrl?: string;
  uploadedLogoName?: string;
  uploadedLogoPlacement?: DecalPlacementKey;
  decalScale?: number; // 0.2 to 3.0 (default 1.0)
  decalScaleX?: number; // 0.2 to 3.0
  decalScaleY?: number; // 0.2 to 3.0
  lockAspectRatio?: boolean;
  decalRotation?: number; // -180 to 180 deg
  decalOffsetX?: number; // -1.0 to 1.0
  decalOffsetY?: number; // -1.0 to 1.0
  decalMirrorSides?: boolean; // mirror to right side
  decalSpanStuds?: number; // span in studs (1 to 6 studs)
  selectedLiveryTemplate?: LiveryTemplateKey;
  liveryColorPrimary?: string;
  liveryColorSecondary?: string;
  liveryColorAccent?: string;
  activeStickerSheetId?: string;
  customDriverName?: string;
  customDriverFont?: 'f1-italic' | 'script-signature' | 'grotesk-bold' | 'telemetry-mono' | 'vintage-stencil';
  customTagline?: string;
  customTaglineFont?: 'f1-italic' | 'script-signature' | 'grotesk-bold' | 'telemetry-mono' | 'vintage-stencil';
  customTextColor?: string;
  customBadgeColor?: string;
  customText?: string;
  // KÖRNING 2: Driver & Minifigure Customization
  driverName?: string;
  driverNumber?: string;
  driverFlag?: string;
  driverHeadgear?: 'helmet' | 'hair';
  driverSuitColor?: string;
  driverAccessory?: 'none' | 'umbrella' | 'bottle' | 'steeringWheel' | 'trophy';
  // KÖRNING 2: Interactive 3D Decal Transform Controls
  interactiveDecalActive?: boolean;
  decal3DPosition?: { x: number; y: number; z: number };
  decal3DRotation?: { x: number; y: number; z: number };
  decal3DScale?: { x: number; y: number; z: number };
}

export interface OfficialStickerItem {
  id: string;
  number: number;
  name: string;
  targetComponent: string;
  targetDesignId: string;
  dimensionsMm: { width: number; height: number };
  studWidth: number; // e.g. 2 for 2 studs (16mm)
  category: 'sponsor' | 'livery' | 'number' | 'tech';
  customLogoUrl?: string;
  customText?: string;
  color: string;
  bgColor: string;
  description: string;
}

export interface OfficialStickerSheet {
  id: string;
  name: string;
  setNumber: string;
  team: string;
  year: number;
  dimensionsMm: { width: number; height: number };
  stickers: OfficialStickerItem[];
}

export interface LegoColor {
  id: number;
  brickLinkId?: number;
  name: string;
  hex: string;
  category: 'Solid' | 'Metallic' | 'Transparent';
  isCommon: boolean;
}

export type AssemblyDirection = 'down' | 'forward' | 'backward' | 'inward-left' | 'inward-right' | 'clip-rotate' | 'axle-press';

export interface GranularLegoPart {
  id: string;
  partKey: CarPartKey;
  designId: string; // e.g. 3069b, 93606, 65633
  elementId: string; // official 7-digit element number
  name: string;
  subAssembly: string;
  category: 'Tiles' | 'Slopes' | 'Plates' | 'Bricks' | 'Aero & Halo' | 'Wheels & Axles' | 'Minifig';
  quantity: number;
  colorHex: string;
  colorName: string;
  brickLinkColorId: number;
  legoColorId: number;
  dimensions: string; // e.g. "1x2", "4x2 curved"
  studOrientation: string; // e.g. "Studs facing UP", "Studs facing OUTWARD (SNOT)"
  assemblyStep: number;
  direction: AssemblyDirection;
  directionText: string;
  hidden?: boolean;
}

export interface BomPart {
  elementId: string;
  designId: string;
  name: string;
  category: string;
  quantity: number;
  partKey: CarPartKey;
  colorName: string;
  colorHex: string;
  brickLinkColorId: number;
}

export interface ManualStep {
  stepNumber: number;
  title: string;
  description: string;
  subAssembly: string;
  assemblyDirection: AssemblyDirection;
  directionLabel: string;
  partsRequired: {
    piece: string;
    designId: string;
    elementId: string;
    quantity: number;
    colorHex: string;
    colorName: string;
    dimensions: string;
  }[];
  arrowDirection: {
    type: 'down' | 'horizontal-in' | 'front-slide' | 'tilt-down' | 'wheel-mount';
    label: string;
    rotationDeg: number;
  };
  studAlignment: string;
  tip?: string;
}

