// src/components/LDrawDebugBounds.tsx
import React from 'react';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface ZoneBoxProps {
  minZ: number;
  maxZ: number;
  minX?: number;
  maxX?: number;
  color: string;
  name: string;
}

const ZoneBox: React.FC<ZoneBoxProps> = ({ minZ, maxZ, minX = -40, maxX = 40, color, name }) => {
  const sizeX = maxX - minX;
  const sizeY = 46; // Modellens totalhöjd
  const sizeZ = maxZ - minZ;
  const posX = (minX + maxX) / 2;
  const posY = -31; // Modellens mitt i Y-led (-54 till -8)
  const posZ = (minZ + maxZ) / 2;

  return (
    <group position={[posX, posY, posZ]} name={name}>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(sizeX, sizeY, sizeZ)]} />
        <lineBasicMaterial color={color} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
};

export const LDrawDebugBounds: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <group name="debug-zones">
      {/* Framvinge: Z [-215 till -155] */}
      <ZoneBox minZ={-215} maxZ={-155} minX={-76} maxX={76} color="#00ffcc" name="Front Wing" />

      {/* Noskon: Z [-155 till -30] */}
      <ZoneBox minZ={-155} maxZ={-30} minX={-25} maxX={25} color="#ffff00" name="Nose Cone" />

      {/* Cockpit: Z [-30 till 20] */}
      <ZoneBox minZ={-30} maxZ={20} minX={-30} maxX={30} color="#3399ff" name="Cockpit" />

      {/* Sidopoddar: Z [-30 till 130] */}
      <ZoneBox minZ={-30} maxZ={130} minX={25} maxX={65} color="#ff00ff" name="Sidepod Left" />
      <ZoneBox minZ={-30} maxZ={130} minX={-65} maxX={-25} color="#ff00ff" name="Sidepod Right" />

      {/* Motorkåpa: Z [20 till 165] */}
      <ZoneBox minZ={20} maxZ={165} minX={-25} maxX={25} color="#ff6600" name="Engine Cover" />

      {/* Bakvinge: Z [165 till 205] */}
      <ZoneBox minZ={165} maxZ={205} minX={-60} maxX={60} color="#ff0033" name="Rear Wing" />
    </group>
  );
};

/**
 * Three.js imperative helper for vanilla Three.js scenes (such as Car3DViewer)
 */
export function createLDrawDebugBoundsThreeGroup(): THREE.Group {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ldraw-debug-zones';

  const zones: { name: string; minZ: number; maxZ: number; minX: number; maxX: number; color: number }[] = [
    { name: 'Front Wing', minZ: -215, maxZ: -155, minX: -76, maxX: 76, color: 0x00ffcc },
    { name: 'Nose Cone', minZ: -155, maxZ: -30, minX: -25, maxX: 25, color: 0xffff00 },
    { name: 'Cockpit', minZ: -30, maxZ: 20, minX: -30, maxX: 30, color: 0x3399ff },
    { name: 'Sidepod Left', minZ: -30, maxZ: 130, minX: 25, maxX: 65, color: 0xff00ff },
    { name: 'Sidepod Right', minZ: -30, maxZ: 130, minX: -65, maxX: -25, color: 0xff00ff },
    { name: 'Engine Cover', minZ: 20, maxZ: 165, minX: -25, maxX: 25, color: 0xff6600 },
    { name: 'Rear Wing', minZ: 165, maxZ: 205, minX: -60, maxX: 60, color: 0xff0033 },
  ];

  zones.forEach((zone) => {
    const sizeX = zone.maxX - zone.minX;
    const sizeY = 46;
    const sizeZ = zone.maxZ - zone.minZ;
    const posX = (zone.minX + zone.maxX) / 2;
    const posY = -31;
    const posZ = (zone.minZ + zone.maxZ) / 2;

    const geom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
    const edges = new THREE.EdgesGeometry(geom);
    const lineMat = new THREE.LineBasicMaterial({ color: zone.color, transparent: true, opacity: 0.65 });
    const line = new THREE.LineSegments(edges, lineMat);
    line.position.set(posX, posY, posZ);
    line.name = `zone-${zone.name}`;
    rootGroup.add(line);
  });

  return rootGroup;
}
