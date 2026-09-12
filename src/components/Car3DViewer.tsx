import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CarPartColors, CarDecals, CarPartKey, Era } from '../types';
import { PART_LABELS } from '../data/legoSets';
import {
  RotateCw,
  Eye,
  Camera,
  Check,
  RefreshCw,
  AlertTriangle,
  Layers,
  Sliders,
  Crosshair,
  Sparkles,
  X,
  FileCode,
  Tag,
  Upload,
} from 'lucide-react';
import {
  buildHighFidelityLegoChassis,
  convertGroupToLegoPhysicalMaterials,
  setupLDrawLoader,
  LEGO_COMPONENT_METADATA,
  LegoMeshMeta,
} from '../utils/legoModelBuilder';

interface Car3DViewerProps {
  colors: CarPartColors;
  decals: CarDecals;
  era: Era;
  selectedPart: CarPartKey;
  onSelectPart: (part: CarPartKey) => void;
  onCaptureSnapshot?: (dataUrl: string) => void;
  hiddenParts?: Set<string>;
  isolatedPartId?: string | null;
}

export const Car3DViewer: React.FC<Car3DViewerProps> = ({
  colors,
  decals,
  era,
  selectedPart,
  onSelectPart,
  onCaptureSnapshot,
  hiddenParts,
  isolatedPartId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<Map<CarPartKey, THREE.Mesh[]>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const decalMeshesRef = useRef<THREE.Mesh[]>([]);
  const carGroupRef = useRef<THREE.Group | null>(null);

  const [isTurntable, setIsTurntable] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<CarPartKey | null>(null);
  const [selectedPieceInfo, setSelectedPieceInfo] = useState<LegoMeshMeta>(
    LEGO_COMPONENT_METADATA[selectedPart] || LEGO_COMPONENT_METADATA.nose
  );
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [webGlError, setWebGlError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [showViewerPill, setShowViewerPill] = useState(true);
  const [buildProgress] = useState(94);
  const [isLDrawMode, setIsLDrawMode] = useState(false);
  const [ldrawStatus, setLdrawStatus] = useState<string | null>(null);

  // Sync selected piece info when external selectedPart changes
  useEffect(() => {
    if (LEGO_COMPONENT_METADATA[selectedPart]) {
      setSelectedPieceInfo(LEGO_COMPONENT_METADATA[selectedPart]);
    }
  }, [selectedPart]);

  // Helper to construct decal canvas textures
  const buildDecalTexture = useCallback(
    (
      text: string,
      subText?: string,
      textColor = '#ffffff',
      bgColor?: string,
      logoUrl?: string,
      fontFamily = 'sans-serif'
    ): Promise<THREE.CanvasTexture> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(new THREE.CanvasTexture(canvas));
          return;
        }

        const renderCanvas = (logoImg?: HTMLImageElement) => {
          ctx.clearRect(0, 0, 512, 160);

          if (bgColor && bgColor !== 'transparent') {
            ctx.fillStyle = bgColor;
            ctx.beginPath();
            ctx.roundRect(8, 8, 496, 144, 16);
            ctx.fill();
            ctx.strokeStyle = textColor;
            ctx.lineWidth = 4;
            ctx.stroke();
          }

          let textStartX = 256;
          ctx.textAlign = 'center';

          if (logoImg) {
            ctx.drawImage(logoImg, 24, 20, 120, 120);
            textStartX = 320;
          }

          // Main text
          ctx.fillStyle = textColor;
          ctx.font = `bold italic 60px ${fontFamily}`;
          ctx.fillText(text, textStartX, subText ? 76 : 104);

          // Sub text (Driver name or Engine)
          if (subText) {
            ctx.font = `bold 32px ${fontFamily}`;
            ctx.fillStyle = textColor;
            ctx.fillText(subText, textStartX, 128);
          }

          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          resolve(texture);
        };

        if (logoUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => renderCanvas(img);
          img.onerror = () => renderCanvas();
          img.src = logoUrl;
        } else {
          renderCanvas();
        }
      });
    },
    []
  );

  // Initialize Three.js scene directly on native canvas ref
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    setWebGlError(null);

    let renderer: THREE.WebGLRenderer;
    try {
      const width = Math.max(container.clientWidth || canvas.clientWidth || 600, 400);
      const height = Math.max(container.clientHeight || canvas.clientHeight || 500, 420);

      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color('#f1f5f9'); // Clean studio light background

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(6, 4, 8);
      camera.lookAt(0, 0.25, 0);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.02;
      controls.minDistance = 2.5;
      controls.maxDistance = 16;
      controls.target.set(0, 0.25, 0);
      controls.update();
      controlsRef.current = controls;

      // Studio Lighting for High-Fidelity LEGO ABS Plastic
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
      keyLight.position.set(10, 12, 6);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.bias = -0.0001;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.9);
      fillLight.position.set(-8, 6, -6);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xfde047, 0.35);
      rimLight.position.set(0, -4, 8);
      scene.add(rimLight);

      // Studio circular podium disc & ground contact shadows
      const podiumGeo = new THREE.CylinderGeometry(4.4, 4.6, 0.1, 64);
      const podiumMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.02,
      });
      const podium = new THREE.Mesh(podiumGeo, podiumMat);
      podium.position.y = -0.05;
      podium.receiveShadow = true;
      scene.add(podium);

      const ringGeo = new THREE.RingGeometry(4.3, 4.45, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.002;
      scene.add(ringMesh);

      const grid = new THREE.GridHelper(16, 32, 0xcbd5e1, 0xe2e8f0);
      grid.position.y = -0.001;
      scene.add(grid);

      // Dynamic Resize Observer
      const updateDimensions = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      };

      const resizeObserver = new ResizeObserver(() => updateDimensions());
      resizeObserver.observe(container);
      requestAnimationFrame(updateDimensions);

      // Raycasting for Clicking & Hovering on actual LEGO brick meshes
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const getIntersectedLegoObject = (event: MouseEvent): {
        partKey: CarPartKey;
        meta?: LegoMeshMeta;
        mesh?: THREE.Mesh;
      } | null => {
        if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

        for (const hit of intersects) {
          let cur: THREE.Object3D | null = hit.object;
          while (cur && cur !== sceneRef.current) {
            if (cur.userData && cur.userData.partKey) {
              const pKey = cur.userData.partKey as CarPartKey;
              const meta: LegoMeshMeta = {
                partKey: pKey,
                name: cur.userData.name || cur.name || LEGO_COMPONENT_METADATA[pKey]?.name || 'LEGO_PART',
                designId: cur.userData.designId || LEGO_COMPONENT_METADATA[pKey]?.designId || '3003',
                elementId: cur.userData.elementId || LEGO_COMPONENT_METADATA[pKey]?.elementId || '614126',
                pieceName: cur.userData.pieceName || LEGO_COMPONENT_METADATA[pKey]?.pieceName || 'Official LEGO Element',
                category: cur.userData.category || LEGO_COMPONENT_METADATA[pKey]?.category || 'Plates',
              };
              return { partKey: pKey, meta, mesh: hit.object instanceof THREE.Mesh ? hit.object : undefined };
            }
            cur = cur.parent;
          }
        }
        return null;
      };

      const handlePointerDown = (event: MouseEvent) => {
        const hit = getIntersectedLegoObject(event);
        if (hit) {
          onSelectPart(hit.partKey);
          if (hit.meta) {
            setSelectedPieceInfo(hit.meta);
          }
        }
      };

      const handlePointerMove = (event: MouseEvent) => {
        const hit = getIntersectedLegoObject(event);
        setHoveredPart(hit ? hit.partKey : null);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = hit ? 'pointer' : 'grab';
        }
      };

      canvas.addEventListener('click', handlePointerDown);
      canvas.addEventListener('mousemove', handlePointerMove);

      // Animation Loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        if (controlsRef.current) {
          controlsRef.current.autoRotate = isTurntable;
          controlsRef.current.autoRotateSpeed = 2.0;
          controlsRef.current.update();
        }
        rendererRef.current?.render(scene, camera);
      };
      animate();

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        resizeObserver.disconnect();
        canvas.removeEventListener('click', handlePointerDown);
        canvas.removeEventListener('mousemove', handlePointerMove);
        renderer.dispose();
      };
    } catch (err: any) {
      console.error('Failed to initialize WebGL context:', err);
      setWebGlError('WebGL initialization error. Click Reset 3D View to recover.');
    }
  }, [resetKey]);

  // Build the High-Fidelity Speed Champions Studded & Beveled LEGO Model
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (carGroupRef.current) {
      scene.remove(carGroupRef.current);
      carGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    meshesRef.current.clear();
    decalMeshesRef.current = [];

    const registerMesh = (part: CarPartKey, mesh: THREE.Mesh) => {
      if (!meshesRef.current.has(part)) {
        meshesRef.current.set(part, []);
      }
      meshesRef.current.get(part)!.push(mesh);
    };

    // Construct high-fidelity beveled and studded chassis
    const carGroup = buildHighFidelityLegoChassis(colors, era, registerMesh);
    carGroupRef.current = carGroup;
    scene.add(carGroup);

    // ==========================================
    // MULTI-TILE LIVERY DECALS & CUSTOM LOGOS
    // ==========================================
    const widthFactor = era === 'classic-6-wide' ? 0.82 : era === 'polybag-mini' ? 0.68 : 1.0;
    const lengthFactor = era === 'polybag-mini' ? 0.72 : 1.0;

    const targetPlacement = decals.uploadedLogoPlacement || 'sidepod';
    const dScale = decals.decalScale ?? 1.0;
    const dRot = ((decals.decalRotation ?? 0) * Math.PI) / 180;
    const dOffX = decals.decalOffsetX ?? 0;
    const dOffY = decals.decalOffsetY ?? 0;
    const mirrorSides = decals.decalMirrorSides !== false;

    // 1. SIDEPOD LIVERY DECAL
    const sidepodW = 1.6 * (targetPlacement === 'sidepod' ? dScale : 1.0);
    const sidepodH = 0.28 * (targetPlacement === 'sidepod' ? dScale : 1.0);
    const sidepodGeo = new THREE.PlaneGeometry(sidepodW, sidepodH);

    const isSidepodTarget = targetPlacement === 'sidepod';
    const sidepodLogoUrl = isSidepodTarget ? decals.uploadedLogoUrl : undefined;
    const sidepodText = isSidepodTarget && decals.uploadedLogoUrl
      ? decals.customDriverName || decals.sponsorPrimary
      : decals.sponsorPrimary;

    buildDecalTexture(
      sidepodText,
      decals.customDriverName,
      decals.customTextColor || '#ffffff',
      decals.customBadgeColor || 'transparent',
      sidepodLogoUrl
    ).then((tex) => {
      const decalMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
      });

      // Left Sidepod
      const sidepodMeshL = new THREE.Mesh(sidepodGeo, decalMat);
      sidepodMeshL.position.set(0.89 * widthFactor, 0.38 + (isSidepodTarget ? dOffY : 0), 0.15 * lengthFactor + (isSidepodTarget ? dOffX : 0));
      sidepodMeshL.rotation.set(0, Math.PI / 2, isSidepodTarget ? dRot : 0);
      carGroup.add(sidepodMeshL);
      decalMeshesRef.current.push(sidepodMeshL);

      // Right Sidepod (if mirrored)
      if (mirrorSides || !isSidepodTarget) {
        const sidepodMeshR = new THREE.Mesh(sidepodGeo, decalMat);
        sidepodMeshR.position.set(-0.89 * widthFactor, 0.38 + (isSidepodTarget ? dOffY : 0), 0.15 * lengthFactor + (isSidepodTarget ? dOffX : 0));
        sidepodMeshR.rotation.set(0, -Math.PI / 2, isSidepodTarget ? -dRot : 0);
        carGroup.add(sidepodMeshR);
        decalMeshesRef.current.push(sidepodMeshR);
      }
    });

    // 2. NOSE CONE DECAL
    const isNoseTarget = targetPlacement === 'nose';
    const noseW = 0.36 * (isNoseTarget ? dScale : 1.0);
    const noseH = 0.22 * (isNoseTarget ? dScale : 1.0);
    const noseDecalGeo = new THREE.PlaneGeometry(noseW, noseH);
    const noseLogoUrl = isNoseTarget ? decals.uploadedLogoUrl : undefined;

    buildDecalTexture(
      `#${decals.racingNumber}`,
      decals.sponsorSecondary,
      decals.numberColor || '#ffffff',
      decals.accentStripeColor || 'transparent',
      noseLogoUrl
    ).then((tex) => {
      const noseDecalMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const noseDecalMesh = new THREE.Mesh(noseDecalGeo, noseDecalMat);
      noseDecalMesh.position.set(0 + (isNoseTarget ? dOffX : 0), 0.49 + (isNoseTarget ? dOffY : 0), 1.7 * lengthFactor);
      noseDecalMesh.rotation.set(-Math.PI / 2 + 0.08, 0, isNoseTarget ? dRot : 0);
      carGroup.add(noseDecalMesh);
      decalMeshesRef.current.push(noseDecalMesh);
    });

    // 3. REAR WING DRS BLADE DECAL
    const isRwTarget = targetPlacement === 'rearWing';
    const rwW = 1.4 * (isRwTarget ? dScale : 1.0);
    const rwH = 0.14 * (isRwTarget ? dScale : 1.0);
    const rwDecalGeo = new THREE.PlaneGeometry(rwW, rwH);
    const rwText = decals.customTagline || decals.sponsorSecondary || 'DRS';
    const rwLogoUrl = isRwTarget ? decals.uploadedLogoUrl : undefined;

    buildDecalTexture(rwText, undefined, '#ffffff', '#0f172a', rwLogoUrl).then((tex) => {
      const rwDecalMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const rwDecalMesh = new THREE.Mesh(rwDecalGeo, rwDecalMat);
      rwDecalMesh.position.set(0 + (isRwTarget ? dOffX : 0), 1.09 + (isRwTarget ? dOffY : 0), -2.06 * lengthFactor);
      rwDecalMesh.rotation.set(-0.25, 0, isRwTarget ? dRot : 0);
      carGroup.add(rwDecalMesh);
      decalMeshesRef.current.push(rwDecalMesh);
    });
  }, [
    era,
    decals.liveryStyle,
    decals.accentStripeColor,
    decals.racingNumber,
    decals.numberColor,
    decals.sponsorPrimary,
    decals.sponsorSecondary,
    decals.uploadedLogoUrl,
    decals.uploadedLogoPlacement,
    decals.decalScale,
    decals.decalRotation,
    decals.decalOffsetX,
    decals.decalOffsetY,
    decals.decalMirrorSides,
    decals.selectedLiveryTemplate,
    decals.liveryColorPrimary,
    decals.liveryColorSecondary,
    decals.liveryColorAccent,
    decals.customDriverName,
    decals.customTagline,
    decals.customTextColor,
    decals.customBadgeColor,
    buildDecalTexture,
  ]);

  // Real-time Material Color Updates (MeshPhysicalMaterial)
  useEffect(() => {
    meshesRef.current.forEach((meshList, partKey) => {
      const hex = colors[partKey];
      meshList.forEach((mesh) => {
        if (
          mesh.material instanceof THREE.MeshPhysicalMaterial ||
          mesh.material instanceof THREE.MeshStandardMaterial
        ) {
          mesh.material.color.set(hex);
          mesh.material.needsUpdate = true;
        }
      });
    });
  }, [colors]);

  // Selection Highlight Feedback: Pulse emissive glow on selected LEGO piece
  useEffect(() => {
    meshesRef.current.forEach((meshList, partKey) => {
      const isSelected = partKey === selectedPart;
      meshList.forEach((mesh) => {
        if (
          mesh.material instanceof THREE.MeshPhysicalMaterial ||
          mesh.material instanceof THREE.MeshStandardMaterial
        ) {
          if (isSelected) {
            mesh.material.emissive = new THREE.Color(0xf59e0b);
            mesh.material.emissiveIntensity = 0.25;
          } else {
            mesh.material.emissive = new THREE.Color(0x000000);
            mesh.material.emissiveIntensity = 0;
          }
          mesh.material.needsUpdate = true;
        }
      });
    });
  }, [selectedPart]);

  // Handle Granular Part Hiding & Isolation
  useEffect(() => {
    meshesRef.current.forEach((meshList, partKey) => {
      const isHidden = hiddenParts?.has(partKey);

      meshList.forEach((mesh) => {
        if (isHidden) {
          mesh.visible = false;
        } else if (isolatedPartId) {
          const isTarget = isolatedPartId === partKey;
          mesh.visible = true;
          if (mesh.material instanceof THREE.Material) {
            mesh.material.transparent = !isTarget;
            mesh.material.opacity = isTarget ? 1.0 : 0.15;
            mesh.material.needsUpdate = true;
          }
        } else {
          mesh.visible = true;
          if (mesh.material instanceof THREE.Material) {
            mesh.material.transparent = false;
            mesh.material.opacity = 1.0;
            mesh.material.needsUpdate = true;
          }
        }
      });
    });

    decalMeshesRef.current.forEach((mesh) => {
      if (isolatedPartId) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
      }
    });
  }, [hiddenParts, isolatedPartId]);

  // LDraw Loader Handler
  const handleLoadCustomLDraw = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLdrawStatus(`Laddar LDraw-fil: ${file.name}...`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const loader = setupLDrawLoader();
        loader.parse(
          text,
          (group) => {
            const scene = sceneRef.current;
            if (!scene) return;

            if (carGroupRef.current) {
              scene.remove(carGroupRef.current);
            }

            // Convert materials to high-fidelity MeshPhysicalMaterial
            convertGroupToLegoPhysicalMaterials(group, colors);

            // Center and scale model
            const bbox = new THREE.Box3().setFromObject(group);
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = 4.5 / (maxDim || 1);
            group.scale.set(scaleFactor, scaleFactor, scaleFactor);
            group.position.set(0, 0.2, 0);

            carGroupRef.current = group;
            scene.add(group);
            setIsLDrawMode(true);
            setLdrawStatus(`Laddade ${file.name} framgångsrikt!`);
            setTimeout(() => setLdrawStatus(null), 3000);
          },
          (error) => {
            console.error('LDraw load error:', error);
            setLdrawStatus('Kunde inte parsa LDraw-filen. Använder Speed Champions standard-chassi.');
            setTimeout(() => setLdrawStatus(null), 3500);
          }
        );
      } catch (err: any) {
        console.error('LDraw error:', err);
        setLdrawStatus('LDrawLoader fel.');
      }
    };
    reader.readAsText(file);
  };

  // Camera preset positions
  const setCameraView = (view: 'isometric' | 'side' | 'top' | 'cockpit' | 'rear') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    controls.autoRotate = false;
    setIsTurntable(false);

    switch (view) {
      case 'isometric':
        cameraRef.current.position.set(6, 4, 8);
        controls.target.set(0, 0.25, 0);
        break;
      case 'side':
        cameraRef.current.position.set(6.5, 0.8, 0);
        controls.target.set(0, 0.25, 0);
        break;
      case 'top':
        cameraRef.current.position.set(0, 8.5, 0.1);
        controls.target.set(0, 0.25, 0);
        break;
      case 'cockpit':
        cameraRef.current.position.set(0, 1.3, 2.0);
        controls.target.set(0, 0.6, -0.4);
        break;
      case 'rear':
        cameraRef.current.position.set(0, 1.5, -5.6);
        controls.target.set(0, 0.45, 0);
        break;
    }
    controls.update();
  };

  const captureSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    if (onCaptureSnapshot) {
      onCaptureSnapshot(dataUrl);
    }
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2200);
  };

  return (
    <div
      ref={containerRef}
      id="car-3d-viewer-container"
      className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 flex flex-col select-none"
      style={{ width: '100%', height: '520px', minHeight: '400px', display: 'block' }}
    >
      {/* Native HTML5 Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* WebGL Error Fallback Card */}
      {webGlError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-2xl max-w-sm text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">3D Viewport Notice</h3>
            <p className="text-xs text-slate-600 mb-4">{webGlError}</p>
            <button
              onClick={() => setResetKey((k) => k + 1)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset 3D View</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Left Floating Badges: 360 Status & Official Element ID HUD Card */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto z-10">
        {/* Floating 360 Viewer Badge with Studs Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black tracking-wide text-white">
            {isLDrawMode ? 'LDRAW PIPELINE' : 'HIGH-FIDELITY LEGO'}
          </span>
          <span className="text-slate-500 text-xs">•</span>
          <span className="text-xs font-mono text-amber-300 font-bold">PHYSICAL ABS CLEARCOAT</span>
        </div>

        {/* Selected LEGO Piece Official Article Info HUD */}
        <div className="flex flex-col gap-1 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-md pointer-events-none max-w-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border border-slate-400 shadow-2xs shrink-0"
                style={{ backgroundColor: colors[selectedPart] }}
              />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                {selectedPieceInfo.name}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              {selectedPieceInfo.category}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5 font-mono">
            <div>
              <span className="text-slate-400 block text-[9px]">DESIGN ID:</span>
              <span className="font-bold text-slate-800">#{selectedPieceInfo.designId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">OFFICIAL ELEMENT ID:</span>
              <span className="font-bold text-emerald-700">#{selectedPieceInfo.elementId}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 truncate pt-0.5 font-sans">
            {selectedPieceInfo.pieceName}
          </div>
        </div>

        {hoveredPart && hoveredPart !== selectedPart && (
          <div className="bg-amber-500/90 text-slate-950 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm pointer-events-none flex items-center gap-1.5">
            <Tag className="w-3 h-3" />
            <span>Klicka för att måla: {PART_LABELS[hoveredPart]?.label}</span>
          </div>
        )}

        {ldrawStatus && (
          <div className="bg-indigo-900/90 text-white px-3 py-1.5 rounded-xl text-xs font-mono shadow-md flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{ldrawStatus}</span>
          </div>
        )}
      </div>

      {/* Left Floating Vertical Toolbar */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md z-10">
        <button
          onClick={() => setIsTurntable(!isTurntable)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isTurntable ? 'bg-amber-400 text-slate-950' : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Toggle 360° Turntable"
        >
          <RotateCw className={`w-4 h-4 ${isTurntable ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setCameraView('isometric')}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Reset Camera (Isometric)"
        >
          <Crosshair className="w-4 h-4 text-amber-500" />
        </button>

        <button
          onClick={() => setCameraView('cockpit')}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Cockpit Minifig POV"
        >
          <Eye className="w-4 h-4 text-blue-500" />
        </button>

        <button
          onClick={captureSnapshot}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Capture Snapshot for Box & Manual"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
        </button>

        {/* LDraw Importer Upload Button */}
        <label
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
          title="Importera .LDR Modellfil"
        >
          <input
            type="file"
            accept=".ldr,.dat,.mpd"
            className="hidden"
            onChange={handleLoadCustomLDraw}
          />
          <Upload className="w-4 h-4 text-indigo-600" />
        </label>
      </div>

      {/* Top Right Floating Badge: Active Decal & Custom Logo Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-xs pointer-events-none z-10">
        <div className="text-xs font-black italic px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 shadow-2xs">
          #{decals.racingNumber}
        </div>
        <div className="text-xs text-slate-800 font-bold tracking-wide">
          {decals.sponsorPrimary}
        </div>
        {decals.uploadedLogoUrl && (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
            Logo Active
          </span>
        )}
      </div>

      {/* Floating Bottom Panel: 360 Viewer & Editable Livery */}
      {showViewerPill && (
        <div className="absolute bottom-4 left-16 right-4 sm:left-auto sm:right-6 sm:w-96 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg pointer-events-auto z-10 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              High-Fidelity LEGO F1 Studio
            </span>
            <button
              onClick={() => setShowViewerPill(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dölj panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTurntable(!isTurntable)}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isTurntable
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isTurntable ? 'animate-spin' : ''}`} />
              360° View
            </button>

            <button
              onClick={() => setCameraView('isometric')}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Editable Livery
            </button>
          </div>

          {/* Build Completion Progress Bar */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${buildProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600 shrink-0">
              {buildProgress}% Klossar
            </span>
          </div>
        </div>
      )}

      {/* Camera View Angle Quick Pills (Bottom Left) */}
      <div className="absolute bottom-4 left-16 hidden md:flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xs pointer-events-auto z-10">
        <button
          onClick={() => setCameraView('isometric')}
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          3/4 Iso
        </button>
        <button
          onClick={() => setCameraView('side')}
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          Side
        </button>
        <button
          onClick={() => setCameraView('top')}
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          Top
        </button>
        <button
          onClick={() => setCameraView('rear')}
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          Rear DRS
        </button>
      </div>

      {/* Floating 360 Drag Helper Tip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden sm:block">
        <span className="text-[11px] font-medium tracking-wide text-slate-500 bg-white/90 backdrop-blur-sm px-3 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
          Click any LEGO brick to select & paint • Drag 360° • Scroll to zoom
        </span>
      </div>
    </div>
  );
};
