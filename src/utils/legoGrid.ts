// src/utils/legoGrid.ts
export const LEGO_GRID = {
  STUD_XZ: 20,       // 1 stud i X- och Z-led (20 LDU)
  HALF_STUD: 10,     // För jumper plates (0.5 stud)
  PLATE_Y: 8,        // 1 platthöjd i Y-led (8 LDU)
  BRICK_Y: 24,       // 1 klosshöjd i Y-led (24 LDU = 3 plates)
};

/**
 * Snappar en koordinat till närmaste legoknopp/platthöjd
 */
export function snapToLegoGrid(x: number, y: number, z: number) {
  return {
    x: Math.round(x / LEGO_GRID.STUD_XZ) * LEGO_GRID.STUD_XZ,
    y: Math.round(y / LEGO_GRID.PLATE_Y) * LEGO_GRID.PLATE_Y,
    z: Math.round(z / LEGO_GRID.STUD_XZ) * LEGO_GRID.STUD_XZ,
  };
}
