import { LegoColor } from '../types';

export const LEGO_COLORS: LegoColor[] = [
  { id: 21, name: 'Bright Red (Ferrari/Alfa)', hex: '#C91A09', category: 'Solid', isCommon: true },
  { id: 26, name: 'Black (Stealth/Carbon)', hex: '#1B1B1B', category: 'Solid', isCommon: true },
  { id: 1, name: 'White', hex: '#F2F3F2', category: 'Solid', isCommon: true },
  { id: 23, name: 'Bright Blue (Williams/Alpine)', hex: '#0055BF', category: 'Solid', isCommon: true },
  { id: 24, name: 'Bright Yellow (Renault/Jordan)', hex: '#FBE822', category: 'Solid', isCommon: true },
  { id: 106, name: 'Bright Orange (McLaren Papaya)', hex: '#FE8A18', category: 'Solid', isCommon: true },
  { id: 28, name: 'Dark Green (Aston Martin Racing)', hex: '#00573D', category: 'Solid', isCommon: true },
  { id: 119, name: 'Bright Yellowish Green (Kick Lime)', hex: '#58AB41', category: 'Solid', isCommon: true },
  { id: 222, name: 'Bright Pink (BWT Alpine)', hex: '#E4ADC8', category: 'Solid', isCommon: true },
  { id: 140, name: 'Earth Blue (Red Bull Dark Navy)', hex: '#19325A', category: 'Solid', isCommon: true },
  { id: 322, name: 'Medium Azure (Gulf Baby Blue)', hex: '#36AEBF', category: 'Solid', isCommon: true },
  { id: 194, name: 'Medium Stone Grey (Mercedes Silver)', hex: '#A0A5A9', category: 'Solid', isCommon: true },
  { id: 199, name: 'Dark Stone Grey (Titanium/Chassis)', hex: '#6C6E68', category: 'Solid', isCommon: true },
  { id: 297, name: 'Warm Gold / Pearl Gold', hex: '#AA7F2D', category: 'Metallic', isCommon: true },
  { id: 315, name: 'Flat Silver (Chrome Aero)', hex: '#898788', category: 'Metallic', isCommon: true },
  { id: 124, name: 'Bright Reddish Violet (Magenta)', hex: '#92397D', category: 'Solid', isCommon: false },
  { id: 38, name: 'Dark Orange', hex: '#A95500', category: 'Solid', isCommon: false },
  { id: 141, name: 'Earth Green', hex: '#184632', category: 'Solid', isCommon: false },
  { id: 37, name: 'Bright Green', hex: '#4B9F4A', category: 'Solid', isCommon: false },
  { id: 191, name: 'Bright Light Orange', hex: '#F8BB3D', category: 'Solid', isCommon: true },
];

export const TIRE_COMPOUNDS = [
  { name: 'Soft (C3/C4/C5)', color: '#DC2626', label: 'SOFT', desc: 'Maximum grip, higher degradation' },
  { name: 'Medium (C2/C3/C4)', color: '#EAB308', label: 'MEDIUM', desc: 'Balanced race compound' },
  { name: 'Hard (C1/C2)', color: '#F8FAFC', label: 'HARD', desc: 'Longest stint durability' },
  { name: 'Intermediate', color: '#16A34A', label: 'INTER', desc: 'Damp track with standing water' },
  { name: 'Wet', color: '#2563EB', label: 'WET', desc: 'Heavy tropical downpour' },
];

export function findLegoColorName(hex: string): string {
  const match = LEGO_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return match ? match.name : 'Custom Color';
}

export function getLegoColorByHex(hex: string): LegoColor | undefined {
  return LEGO_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
}
