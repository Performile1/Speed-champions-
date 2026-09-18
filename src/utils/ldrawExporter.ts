// src/utils/ldrawExporter.ts
import { LDrawPartInstance } from '../data/ldrawModels';

/**
 * Konverterar aktiva instanser tillbaka till standardiserat LDraw-format med bevarade byggsteg
 */
export function exportInstancesToLdr(
  instances: LDrawPartInstance[],
  modelTitle = 'Custom Speed Champions F1'
): string {
  const lines: string[] = [
    `0 ${modelTitle}`,
    `0 !LDRAW_ORG Model`,
    `0 BFC CERTIFY CCW`,
    `0 // Exporterad från Speed Champions 3D Builder`,
  ];

  // Gruppera instanser per stepNumber
  const maxStep = Math.max(...instances.map((i) => i.stepNumber || 1), 1);

  for (let step = 1; step <= maxStep; step++) {
    const stepPieces = instances.filter((i) => (i.stepNumber || 1) === step);
    if (stepPieces.length === 0) continue;

    lines.push(`0 STEP`);
    lines.push(`0 // STEP ${step}`);

    stepPieces.forEach((p) => {
      const rotArray = p.rot && p.rot.length === 9 ? p.rot : [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const rotStr = rotArray.map((n) => Number(n).toFixed(4).replace(/\.?0+$/, '')).join(' ');
      const designIdWithExt = p.designId.endsWith('.dat') ? p.designId : `${p.designId}.dat`;
      lines.push(
        `1 ${p.colorCode} ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)} ${rotStr} ${designIdWithExt}`
      );
    });
  }

  return lines.join('\n');
}

/**
 * Sparar modifieringar till LocalStorage per modell-ID / artikelnummer
 */
export function saveModelLocally(articleNumber: string, instances: LDrawPartInstance[]): void {
  const key = `speed_champions_saved_${articleNumber}`;
  try {
    localStorage.setItem(key, JSON.stringify(instances));
  } catch (err) {
    console.error('Kunde inte spara modell till LocalStorage', err);
  }
}

export function loadModelLocally(articleNumber: string): LDrawPartInstance[] | null {
  const key = `speed_champions_saved_${articleNumber}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Kunde inte läsa modell från LocalStorage', err);
    return null;
  }
}

export function clearSavedModelLocally(articleNumber: string): void {
  const key = `speed_champions_saved_${articleNumber}`;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Kunde inte rensa modell från LocalStorage', err);
  }
}
