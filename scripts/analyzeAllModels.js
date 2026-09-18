/**
 * scripts/analyzeAllModels.js
 * Analyzes Speed Champions LDraw models to determine coordinate origins,
 * bounding boxes, Z-extents, and spatial distribution of shared parts (like #15068).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test set definitions or sample models
const modelsToAnalyze = [
  { articleNumber: '77242', name: 'Ferrari SF-24 F1' },
  { articleNumber: '77243', name: 'Red Bull RB20 F1' },
  { articleNumber: '77244', name: 'Mercedes W15 F1' },
  { articleNumber: '77245', name: 'McLaren MCL38 F1' },
  { articleNumber: '77246', name: 'Aston Martin AMR24 F1' },
  { articleNumber: '77247', name: 'Alpine A524 F1' },
  { articleNumber: '77248', name: 'Williams FW46 F1' },
  { articleNumber: '77249', name: 'VCARB 01 F1' },
  { articleNumber: '77250', name: 'Kick Sauber C44 F1' },
  { articleNumber: '77251', name: 'Haas VF-24 F1' },
];

function parseLdrLines(content) {
  const lines = content.split(/\r?\n/);
  const parts = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('1 ')) continue;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length >= 15) {
      const colorCode = parseInt(tokens[1], 10);
      const x = parseFloat(tokens[2]);
      const y = parseFloat(tokens[3]);
      const z = parseFloat(tokens[4]);
      const designId = tokens[14].replace('.dat', '').toLowerCase();

      parts.push({ designId, colorCode, x, y, z });
    }
  }
  return parts;
}

function analyzeParts(parts, modelName) {
  if (!parts || parts.length === 0) {
    return { error: 'Inga delar hittades i modellen' };
  }

  const xs = parts.map(p => p.x);
  const ys = parts.map(p => p.y);
  const zs = parts.map(p => p.z);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  const totalLength = maxZ - minZ;
  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;

  // Track key parts
  const slopes15068 = parts.filter(p => p.designId === '15068');
  const tires80249 = parts.filter(p => p.designId === '80249');
  const frontSpur = parts.filter(p => p.designId === '112499');
  const rearTiles = parts.filter(p => p.designId === '87079');

  return {
    modelName,
    partCount: parts.length,
    bounds: {
      x: [minX, maxX],
      y: [minY, maxY],
      z: [minZ, maxZ],
    },
    dimensions: {
      lengthLDU: totalLength,
      widthLDU: totalWidth,
      heightLDU: totalHeight,
    },
    wheelbase: {
      frontAxleZ: tires80249.filter(t => t.z < 0).map(t => t.z),
      rearAxleZ: tires80249.filter(t => t.z > 0).map(t => t.z),
    },
    slopes15068Positions: slopes15068.map(p => ({
      x: p.x,
      y: p.y,
      z: p.z,
      relZ: ((p.z - minZ) / totalLength).toFixed(3),
      suggestedSection: p.z < 0 ? 'Nose Cone' : 'Engine Cover',
    })),
    frontWings: frontSpur.map(p => ({ x: p.x, y: p.y, z: p.z })),
    rearWings: rearTiles.map(p => ({ x: p.x, y: p.y, z: p.z })),
  };
}

console.log('='.repeat(70));
console.log('LEGO SPEED CHAMPIONS F1 - COORDINATE ORIGIN & INTEGRITY ANALYSIS');
console.log('='.repeat(70));

// Check /public/models/ or local data
const publicModelsDir = path.join(__dirname, '../public/models');
let foundModelsCount = 0;

if (fs.existsSync(publicModelsDir)) {
  const files = fs.readdirSync(publicModelsDir).filter(f => f.endsWith('.ldr') || f.endsWith('.mpd'));
  for (const file of files) {
    foundModelsCount++;
    const content = fs.readFileSync(path.join(publicModelsDir, file), 'utf8');
    const parts = parseLdrLines(content);
    const analysis = analyzeParts(parts, file);
    console.log(`\nModell: ${file} (${analysis.partCount} delar)`);
    console.log(`  Z-intervall: [${analysis.bounds?.z[0]}, ${analysis.bounds?.z[1]}] (Längd: ${analysis.dimensions?.lengthLDU} LDU)`);
    console.log(`  15068 Förekomster:`, analysis.slopes15068Positions);
  }
}

if (foundModelsCount === 0) {
  console.log('Inga .ldr-filer i public/models/. Skapar syntetisk validering av 77242 med standardkoordinater...');
  const sample77242Parts = [
    { designId: '112499', colorCode: 4, x: 0, y: -12, z: -215 },
    { designId: '2420', colorCode: 4, x: 76, y: -12, z: -210 },
    { designId: '2420', colorCode: 4, x: -76, y: -12, z: -210 },
    { designId: '15068', colorCode: 4, x: 0, y: -16, z: -150 }, // Nose
    { designId: '80249', colorCode: 256, x: 60, y: -14, z: -140 }, // Front Left Wheel
    { designId: '80249', colorCode: 256, x: -60, y: -14, z: -140 }, // Front Right Wheel
    { designId: '30029', colorCode: 72, x: 0, y: 0, z: 0 }, // Floor center
    { designId: '93606', colorCode: 4, x: 48, y: -16, z: 10 }, // Sidepod
    { designId: '15068', colorCode: 4, x: 0, y: -30, z: 105 }, // Engine cover
    { designId: '80249', colorCode: 256, x: 60, y: -14, z: 140 }, // Rear Left Wheel
    { designId: '80249', colorCode: 256, x: -60, y: -14, z: 140 }, // Rear Right Wheel
    { designId: '87079', colorCode: 0, x: 60, y: -46, z: 195 }, // Rear Wing Endplate Left
    { designId: '87079', colorCode: 0, x: -60, y: -46, z: 195 }, // Rear Wing Endplate Right
  ];
  const analysis = analyzeParts(sample77242Parts, 'Set 77242 Reference Coordinate Geometry');
  console.log(JSON.stringify(analysis, null, 2));
}

console.log('\nAnalys klar.');
