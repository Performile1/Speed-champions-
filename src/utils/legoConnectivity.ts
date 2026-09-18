// src/utils/legoConnectivity.ts
import { LDrawPartInstance } from '../data/ldrawModels';
import { LEGO_GRID } from './legoGrid';

export interface ConnectorSuggestion {
  designId: string;
  name: string;
  reason: string;
  suggestedPos: { x: number; y: number; z: number };
}

export interface ConnectionCheckResult {
  isConnected: boolean;
  contactWithId: string | null;
  gapY: number; // Höjdglapp till närmaste kloss under
  gapDistance: number;
  suggestions: ConnectorSuggestion[];
}

export function checkPieceConnection(
  targetPiece: LDrawPartInstance,
  allPieces: LDrawPartInstance[]
): ConnectionCheckResult {
  let isConnected = false;
  let contactWithId: string | null = null;
  let minGapY = Infinity;
  let closestPartBelow: LDrawPartInstance | null = null;

  const otherPieces = allPieces.filter((p) => p.id !== targetPiece.id);

  for (const other of otherPieces) {
    const dx = Math.abs(targetPiece.x - other.x);
    const dz = Math.abs(targetPiece.z - other.z);
    const dy = targetPiece.y - other.y; // I Three/LDraw är -Y uppåt

    // Kontrollera om klossarna överlappar horisontellt (upp till 2-4 knoppar för plattor/vingar)
    const isHorizontallyAligned = dx <= LEGO_GRID.STUD_XZ * 2.5 && dz <= LEGO_GRID.STUD_XZ * 3.8;

    if (isHorizontallyAligned) {
      // Direkt kontakt (platta mot platta = 8 LDU distans, eller kloss på 24 LDU, eller direkt intilliggande)
      if (
        Math.abs(Math.abs(dy) - LEGO_GRID.PLATE_Y) <= 3.0 ||
        Math.abs(Math.abs(dy) - LEGO_GRID.BRICK_Y) <= 3.0 ||
        (Math.abs(dy) <= 3.0 && (dx <= LEGO_GRID.STUD_XZ * 2.2 || dz <= LEGO_GRID.STUD_XZ * 3.0))
      ) {
        isConnected = true;
        contactWithId = other.id;
        break;
      }

      // Kloss underifrån med glapp (targetPiece svävar ovanför other)
      // I LDraw-koordinater är mindre Y = högre upp, så target.y < other.y betyder att den är ovanför
      if (targetPiece.y < other.y) {
        const gap = other.y - targetPiece.y;
        if (gap < minGapY) {
          minGapY = gap;
          closestPartBelow = other;
        }
      }
    }

    // Specialhantering för hjul och fälgar (axellinje och fälg-i-däck)
    if (
      (targetPiece.partKey === 'tireCompound' || targetPiece.partKey === 'rims') &&
      (other.partKey === 'tireCompound' || other.partKey === 'rims' || other.subAssembly?.includes('Chassis')) &&
      dx <= 35 && Math.abs(dy) <= 15 && dz <= 25
    ) {
      isConnected = true;
      contactWithId = other.id;
      break;
    }
  }

  const suggestions: ConnectorSuggestion[] = [];

  // Om delen svävar, räkna ut vilken adapter som behövs för att bygga ihop dem
  if (!isConnected && closestPartBelow) {
    const gapPlates = Math.round(minGapY / LEGO_GRID.PLATE_Y);
    const fillY = targetPiece.y + LEGO_GRID.PLATE_Y;

    if (gapPlates === 2) {
      // Glapp på 16 LDU = 2 plattor
      suggestions.push({
        designId: '3020',
        name: 'Plate 2 x 4',
        reason: 'Fyller 2-plattors glapp under delen',
        suggestedPos: { x: targetPiece.x, y: fillY, z: targetPiece.z },
      });
      suggestions.push({
        designId: '3023',
        name: 'Plate 1 x 2',
        reason: 'Smal 2-plattors brygga',
        suggestedPos: { x: targetPiece.x, y: fillY, z: targetPiece.z },
      });
    } else if (gapPlates === 3 || minGapY === LEGO_GRID.BRICK_Y) {
      // Glapp på 24 LDU = 1 kloss
      suggestions.push({
        designId: '3004',
        name: 'Brick 1 x 2',
        reason: 'Passar exakt i standard 1-klosshöjd',
        suggestedPos: { x: targetPiece.x, y: fillY, z: targetPiece.z },
      });
    } else if (gapPlates > 3) {
      // Stort glapp: föreslå Technic-pin eller pelare
      suggestions.push({
        designId: '99207',
        name: 'Bracket 1 x 2 - 2 x 2 Upwards',
        reason: 'Skapar SNOT-vinkelfäste från sidan',
        suggestedPos: { x: targetPiece.x, y: targetPiece.y + 8, z: targetPiece.z },
      });
    }
  }

  return {
    isConnected,
    contactWithId,
    gapY: minGapY === Infinity ? 0 : minGapY,
    gapDistance: minGapY,
    suggestions,
  };
}
