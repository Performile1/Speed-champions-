import fs from 'fs';
import path from 'path';

// Läs in datafiler
const dataDir = path.resolve('src/data');
const targetFiles = ['official77242Ldr.ts', 'ldrawModels.ts'];

function extractLdrModels(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const models = [];
  
  // Fånga export const NAME(: type)? = `...` eller 'key': `...`
  const regex = /(?:export\s+const\s+([A-Za-z0-9_]+)(?:\s*:\s*[^=]+)?\s*=\s*`([\s\S]*?)`|['"]?([0-9]{5}|[a-zA-Z0-9_-]+)['"]?\s*:\s*`([\s\S]*?)`)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1] || match[3];
    const ldr = match[2] || match[4];
    if (ldr && ldr.includes('1 ')) {
      models.push({ name, ldr });
    }
  }
  return models;
}

function parseParts(ldrText) {
  const parts = [];
  const lines = ldrText.split(/\r?\n/);
  
  lines.forEach((line, idx) => {
    const t = line.trim();
    if (t.startsWith('1 ')) {
      const tokens = t.split(/\s+/);
      if (tokens.length >= 15) {
        parts.push({
          line: idx + 1,
          color: parseInt(tokens[1], 10),
          x: parseFloat(tokens[2]),
          y: parseFloat(tokens[3]),
          z: parseFloat(tokens[4]),
          id: tokens.slice(14).join(' ').toLowerCase().replace('.dat', '').trim(),
        });
      }
    }
  });
  return parts;
}

function runDiagnostics(modelName, parts) {
  console.log('\n' + '='.repeat(70));
  console.log(`DIAGNOS: ${modelName} (${parts.length} bitar)`);
  console.log('='.repeat(70));

  if (parts.length === 0) {
    console.log('Inga bitar hittades.');
    return;
  }

  // 1. Totala dimensioner
  const minX = Math.min(...parts.map(p => p.x));
  const maxX = Math.max(...parts.map(p => p.x));
  const minY = Math.min(...parts.map(p => p.y));
  const maxY = Math.max(...parts.map(p => p.y));
  const minZ = Math.min(...parts.map(p => p.z));
  const maxZ = Math.max(...parts.map(p => p.z));

  console.log(`Dimensioner (LDU):`);
  console.log(`  Bredd  (X): ${minX.toFixed(1)} till ${maxX.toFixed(1)} (Total: ${(maxX - minX).toFixed(1)})`);
  console.log(`  Höjd   (Y): ${minY.toFixed(1)} till ${maxY.toFixed(1)} (Total: ${(maxY - minY).toFixed(1)}) [0=Mark, -50=Topp]`);
  console.log(`  Längd  (Z): ${minZ.toFixed(1)} till ${maxZ.toFixed(1)} (Total: ${(maxZ - minZ).toFixed(1)}) [-200=Fram, +200=Bak]`);

  // 2. Visuell densitet längs Z-axeln (ASCII-karta)
  console.log(`\nFördelning längs bilens längd (Z-axel från nos till bakvinge):`);
  const buckets = 10;
  const step = (maxZ - minZ) / buckets;
  for (let i = 0; i < buckets; i++) {
    const startZ = minZ + i * step;
    const endZ = startZ + step;
    const count = parts.filter(p => p.z >= startZ && p.z < endZ).length;
    const bar = '#'.repeat(Math.round((count / parts.length) * 40));
    console.log(`  Z [${String(startZ.toFixed(0)).padStart(5)} till ${String(endZ.toFixed(0)).padStart(5)}]: ${String(count).padStart(3)} bitar | ${bar}`);
  }

  // 3. Detektera krockar / Identiska koordinater (negativt glapp)
  console.log(`\nKontroll av kollisioner & exakta dubbletter (< 0.5 LDU avstånd):`);
  let collisions = 0;
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i];
      const b = parts[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (dist < 0.5 && a.id !== 'stud' && b.id !== 'stud') {
        collisions++;
        if (collisions <= 5) {
          console.log(`  [KROCK] ID '${a.id}' och ID '${b.id}' delar samma punkt: X=${a.x} Y=${a.y} Z=${a.z}`);
        }
      }
    }
  }
  if (collisions === 0) {
    console.log(`  Inga krockar hittades.`);
  } else if (collisions > 5) {
    console.log(`  ... och ytterligare ${collisions - 5} krockande positioner.`);
  }

  // 4. Analys av klossar som återkommer i flera zoner (t.ex. 15068)
  console.log(`\nPotentiellt problematiska klossar spridda över flera zoner:`);
  const multiZoneParts = ['15068', '11477', '2431', '3020', '3023'];
  multiZoneParts.forEach(id => {
    const instances = parts.filter(p => p.id === id);
    if (instances.length > 1) {
      const zCoords = instances.map(p => p.z.toFixed(0)).join(', ');
      console.log(`  - ID '${id}' (totalt ${instances.length} st): Sitter vid Z = [${zCoords}]`);
    }
  });
}

// Kör skanning
let totalFound = 0;
targetFiles.forEach(file => {
  const models = extractLdrModels(path.join(dataDir, file));
  models.forEach(m => {
    totalFound++;
    const parts = parseParts(m.ldr);
    runDiagnostics(m.name, parts);
  });
});

if (totalFound === 0) {
  console.log('Inga LDraw-modeller hittades i src/data.');
}
