// src/data/partCatalog.ts
export interface SwapCandidate {
  designId: string;
  name: string;
  category: string;
  description: string;
}

export const PART_SWAP_CATALOG: Record<string, SwapCandidate[]> = {
  engineCover: [
    { designId: '15068', name: 'Slope Curved 2 x 2', category: 'Engine Cover', description: 'Standard SF-24 mjuk kåpa' },
    { designId: '11477', name: 'Slope Curved 2 x 1', category: 'Engine Cover', description: 'Kompakt avsmalnande kåpa' },
    { designId: '93606', name: 'Slope Curved 4 x 2', category: 'Engine Cover', description: 'Långsträckt downwash-kåpa' },
    { designId: '6081', name: 'Brick Modified 2 x 4 x 1 1/3', category: 'Engine Cover', description: 'Klassisk hög airbox-kam' },
  ],
  sideMirrors: [
    { designId: '80179', name: 'Minifig Utensil Spatula / Mirror', category: 'Mirrors', description: 'Officiell SF-24 spegel' },
    { designId: '4592c02', name: 'Lever Small Base with Black Lever', category: 'Mirrors', description: 'Stjälk-monterad aerobackspegel' },
    { designId: '3069b', name: 'Tile 1 x 2 Smooth', category: 'Mirrors', description: 'Modern bred rektangulär spegelyta' },
    { designId: '11477', name: 'Slope Curved 2 x 1 No Studs', category: 'Mirrors', description: 'Integrerad aerodynamisk spegelkåpa' },
  ],
  rearWing: [
    { designId: '87079', name: 'Tile 2 x 4 Smooth', category: 'Rear Wing', description: 'Slät modern DRS-klaff' },
    { designId: '2431', name: 'Tile 1 x 4 Smooth', category: 'Rear Wing', description: 'Tunn dubbeldäckad vingklaff' },
    { designId: '3020', name: 'Plate 2 x 4 with Studs', category: 'Rear Wing', description: 'Vinge med exponerade studs' },
    { designId: '3023', name: 'Plate 1 x 2 Central Beam', category: 'Rear Wing', description: 'Monteringsbalk för bakvinge' },
  ],
  frontWing: [
    { designId: '2431', name: 'Tile 1 x 4 Smooth', category: 'Front Wing', description: 'Slät vinge / klaff' },
    { designId: '3024', name: 'Plate 1 x 1', category: 'Front Wing', description: 'Endplate hörnplatta' },
    { designId: '11477', name: 'Slope Curved 2 x 1', category: 'Front Wing', description: 'Aerodynamisk vingnos' },
    { designId: '3023', name: 'Plate 1 x 2', category: 'Front Wing', description: 'Vingbalk' },
  ],
  nose: [
    { designId: '15068', name: 'Slope Curved 2 x 2', category: 'Nose Cone', description: 'Avrundad nosspets' },
    { designId: '11477', name: 'Slope Curved 2 x 1', category: 'Nose Cone', description: 'Smal aeronos' },
    { designId: '87079', name: 'Tile 2 x 4 Smooth', category: 'Nose Cone', description: 'Övre nosplatta' },
  ],
  sidepods: [
    { designId: '15068', name: 'Slope Curved 2 x 2', category: 'Sidepods', description: 'Downwash-ramp' },
    { designId: '2431', name: 'Tile 1 x 4 Smooth', category: 'Sidepods', description: 'Sidokjol / splitter' },
    { designId: '3020', name: 'Plate 2 x 4', category: 'Sidepods', description: 'Undre golvplatta' },
  ],
  cockpit: [
    { designId: '3069b', name: 'Tile 1 x 2 Smooth', category: 'Cockpit', description: 'Rattdisplay / panel' },
    { designId: '80179', name: 'Minifig Utensil Mirror', category: 'Cockpit', description: 'Aerospegel fäste' },
    { designId: '3024', name: 'Plate 1 x 1', category: 'Cockpit', description: 'Knapp & indikator' },
  ],
  technicHardware: [
    { designId: '2780', name: 'Technic Pin with Friction', category: 'Technic', description: 'Svart standard chassipin' },
    { designId: '3673', name: 'Technic Pin without Friction', category: 'Technic', description: 'Grå roterbar axelpin' },
    { designId: '32054', name: 'Technic Beam 3M with 2 Pins', category: 'Technic', description: 'Hjulupphängningsbalk' },
    { designId: '6558', name: 'Technic Pin Long with Friction', category: 'Technic', description: '3L Blå förstärkt pin' },
  ],
};

export function getLegoPartImageUrl(designId: string): string {
  const cleanId = designId.replace('.dat', '').replace(/^[a-z_]+/i, '').trim().toLowerCase() || designId.replace('.dat', '').toLowerCase();
  return `https://img.bricklink.com/ItemImage/PN/0/${cleanId}.png`;
}

export function getBrickLinkItemUrl(designId: string): string {
  const cleanId = designId.replace('.dat', '').replace(/^[a-z_]+/i, '').trim().toLowerCase() || designId.replace('.dat', '').toLowerCase();
  return `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${cleanId}`;
}

export function getRebrickablePartUrl(designId: string): string {
  const cleanId = designId.replace('.dat', '').replace(/^[a-z_]+/i, '').trim().toLowerCase() || designId.replace('.dat', '').toLowerCase();
  return `https://rebrickable.com/parts/${cleanId}/`;
}

