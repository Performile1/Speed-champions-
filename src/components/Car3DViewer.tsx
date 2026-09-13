import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getLDrawPartGeometry, getLDrawPartEdges } from '../utils/ldrawGeometryParser';
import { CarPartColors, CarDecals, CarPartKey, Era, LegoF1Set, GranularLegoPart } from '../types';
import { PART_LABELS, LEGO_F1_SETS } from '../data/legoSets';
import {
  RotateCw,
  Eye,
  Camera,
  Check,
  RefreshCw,
  AlertTriangle,
  Layers,
  Crosshair,
  Sparkles,
  X,
  FileDown,
  Tag,
  Upload,
  Search,
  Palette,
  ArrowLeftRight,
  Boxes,
  Grid,
  Zap,
  Target,
  Maximize2,
  Minimize2,
  Database,
  Undo2,
  Redo2,
  RotateCcw,
  FileCode,
  Compass,
} from 'lucide-react';
import {
  generateLDrawMpd,
  LDrawPartInstance,
  getLDrawColorCode,
} from '../data/ldrawModels';
import { LegoMeshMeta, LEGO_COMPONENT_METADATA } from '../utils/legoModelBuilder';
import { LEGO_COLORS } from '../data/legoColors';
import { computeKnollingLayout } from '../utils/knollingLayout';
import { SNAP_ANCHORS, SnapAnchorZone } from '../data/modularPartOptions';
import { playLegoSnapSound, playDisassembleSlideSound } from '../utils/legoAudio';
import { ModularPartSwapModal } from './ModularPartSwapModal';
import { BricksetInventoryModal } from './BricksetInventoryModal';
import { LdrIngestionModal } from './LdrIngestionModal';
import { BlueprintPipelineModal } from './BlueprintPipelineModal';
import { parseLDrawDocument, LDrawParseDiagnostics } from '../utils/ldrawParser';
import { OFFICIAL_77242_LDR } from '../data/official77242Ldr';
import { getVehicleModel, FERRARI_SF24_MODEL } from '../models/registry';

/**
 * Procedural texture for 3-zone disassembled knolling layout table
 * Highlights ZONE 1: FRONT, ZONE 2: MID, ZONE 3: REAR
 */
function createKnollingTrayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Crisp off-white studio surface
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 2048, 2048);

    // Subtle alignment grid dots
    ctx.fillStyle = '#e2e8f0';
    for (let x = 60; x < 2048 - 60; x += 36) {
      for (let y = 60; y < 2048 - 60; y += 36) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Outer framing border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 2048 - 80, 2048 - 80);

    // Zone 1 divider line (between Zone 1 and Zone 2): X = 680
    // Zone 2 divider line (between Zone 2 and Zone 3): X = 1368
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(680, 60);
    ctx.lineTo(680, 2048 - 60);
    ctx.moveTo(1368, 60);
    ctx.lineTo(1368, 2048 - 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Typography & Badges
    // ZONE 1: FRONT
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ZONE 1: FRONT ASSEMBLY', 360, 110);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('NOSE • FRONT WING • DEFLECTORS • WHEELS', 360, 145);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('ZONE 1: FRONT ASSEMBLY', 360, 2048 - 90);

    // ZONE 2: MID
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('ZONE 2: MID CHASSIS & COCKPIT', 1024, 110);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('MONOCOQUE • DRIVER CELL • HALO • SIDEPODS', 1024, 145);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('ZONE 2: MID CHASSIS & COCKPIT', 1024, 2048 - 90);

    // ZONE 3: REAR
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('ZONE 3: REAR WING & DIFFUSER', 1688, 110);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('ENGINE COVER • SHARK FIN • DRS WING • REAR AXLE', 1688, 145);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('ZONE 3: REAR WING & DIFFUSER', 1688, 2048 - 90);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Strict Material Independence:
 * Ensures a brick mesh owns an isolated, dedicated material clone before any paint operation,
 * completely preventing global material sharing or accidental cross-car color changes.
 */
export function makeMaterialUnique(mesh: THREE.Mesh): void {
  if (!mesh.userData.isMaterialUnique) {
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => m.clone());
    } else if (mesh.material) {
      mesh.material = mesh.material.clone();
    }
    mesh.userData.isMaterialUnique = true;
  }
}

interface Car3DViewerProps {
  colors: CarPartColors;
  decals: CarDecals;
  era?: Era;
  selectedPart: CarPartKey;
  onSelectPart: (part: CarPartKey) => void;
  onCaptureSnapshot?: (frontDataUrl: string, sideDataUrl?: string) => void;
  hiddenParts?: Set<string>;
  isolatedPartId?: string | null;
  currentSet?: LegoF1Set;
  onSelectInstance?: (instance: LDrawPartInstance) => void;
  selectedInstanceId?: string | null;
  onSelectInstanceId?: (id: string | null) => void;
  customBrickColors?: Record<string, string>;
  onUpdateIndividualBrickColor?: (instanceId: string, hex: string) => void;
  onAddCustomPart?: (part: GranularLegoPart) => void;
  onSwapPartElement?: (
    instanceId: string,
    newDesignId: string,
    newElementId: string,
    newPieceName: string,
    category: string
  ) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetHistory?: () => void;
}

export const Car3DViewer: React.FC<Car3DViewerProps> = ({
  colors,
  decals,
  era = 'modern-ground-effect',
  selectedPart,
  onSelectPart,
  onCaptureSnapshot,
  hiddenParts,
  isolatedPartId,
  currentSet = LEGO_F1_SETS[0], // Ferrari SF-24 #77242 default
  onSelectInstance,
  selectedInstanceId,
  onSelectInstanceId,
  customBrickColors,
  onUpdateIndividualBrickColor,
  onAddCustomPart,
  onSwapPartElement,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetHistory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<Map<CarPartKey, THREE.Mesh[]>>(new Map());
  const meshByIdRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedBrickMeshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const decalMeshesRef = useRef<THREE.Mesh[]>([]);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const partMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial>>(new Map());
  const snapPointsGroupRef = useRef<THREE.Group | null>(null);

  // Scene element refs for transparent cutout captures & knolling animations
  const podiumRef = useRef<THREE.Mesh | null>(null);
  const ringMeshRef = useRef<THREE.Mesh | null>(null);
  const contactPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const knollingTrayRef = useRef<THREE.Mesh | null>(null);

  const [isTurntable, setIsTurntable] = useState(false);
  const [isDisassembled, setIsDisassembled] = useState(false);
  const [isSnapMode, setIsSnapMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isBricksetModalOpen, setIsBricksetModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [hoveredSnapAnchor, setHoveredSnapAnchor] = useState<SnapAnchorZone | null>(null);
  const [snapSuccessToast, setSnapSuccessToast] = useState<string | null>(null);
  const [inspectorFilterTab, setInspectorFilterTab] = useState<'Plates' | 'Special' | 'Aero'>('Plates');

  const [hoveredPart, setHoveredPart] = useState<CarPartKey | null>(null);
  const [activeInstance, setActiveInstance] = useState<LDrawPartInstance | null>(null);
  const [currentInstances, setCurrentInstances] = useState<LDrawPartInstance[]>([]);
  const [selectedPieceInfo, setSelectedPieceInfo] = useState<LegoMeshMeta>(
    LEGO_COMPONENT_METADATA[selectedPart] || LEGO_COMPONENT_METADATA.nose
  );
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [webGlError, setWebGlError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [showViewerPill, setShowViewerPill] = useState(true);
  const [totalLDrawPieces, setTotalLDrawPieces] = useState(275);
  const [uniqueElementCount, setUniqueElementCount] = useState(64);
  const [activeMpdContent, setActiveMpdContent] = useState<string>('');
  const [isLoadingLDraw, setIsLoadingLDraw] = useState(false);
  const [customLdrContent, setCustomLdrContent] = useState<string | null>(null);
  const [isLdrModalOpen, setIsLdrModalOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [ldrDiagnostics, setLdrDiagnostics] = useState<LDrawParseDiagnostics | null>(null);

  // Animation progress refs for Disassemble/Assemble lerp
  const animProgressRef = useRef(0.0);
  const targetAnimProgressRef = useRef(0.0);
  const handleSnapPointClickRef = useRef<((anchor: SnapAnchorZone) => void) | null>(null);

  // Sync selected piece info when external selectedPart changes
  useEffect(() => {
    if (LEGO_COMPONENT_METADATA[selectedPart]) {
      setSelectedPieceInfo(LEGO_COMPONENT_METADATA[selectedPart]);
    }
  }, [selectedPart]);

  // Decal texture helper
  const buildDecalTexture = useCallback(
    (
      text: string,
      subText?: string,
      textColor = '#ffffff',
      bgColor?: string,
      logoUrl?: string,
    ): Promise<THREE.CanvasTexture> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const fallbackTex = new THREE.CanvasTexture(canvas);
          fallbackTex.flipY = false;
          fallbackTex.premultiplyAlpha = false;
          resolve(fallbackTex);
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
            ctx.textAlign = 'left';
          }

          if (text) {
            ctx.fillStyle = textColor;
            ctx.font = '900 48px sans-serif';
            ctx.fillText(text.toUpperCase(), textStartX, subText ? 72 : 96);
          }

          if (subText) {
            ctx.fillStyle = textColor;
            ctx.font = '700 24px monospace';
            ctx.fillText(subText, textStartX, 124);
          }

          const texture = new THREE.CanvasTexture(canvas);
          texture.flipY = false;
          texture.premultiplyAlpha = false;
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

  // Initialize Three.js WebGL Scene, OrbitControls, and Lighting
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
      scene.background = new THREE.Color('#f8fafc'); // Refined clean studio light background

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(7.0, 4.2, 8.2);
      camera.lookAt(0, 1.0, 0);
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
      renderer.shadowMap.type = THREE.PCFShadowMap;
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = true;
      controls.screenSpacePanning = true;
      controls.panSpeed = 1.0;
      controls.maxPolarAngle = Math.PI / 2 + 0.02;
      controls.minDistance = 1.5;
      controls.maxDistance = 60.0;
      controls.target.set(0, 0.8, 0);
      controls.update();
      controlsRef.current = controls;

      // Dramatic 3-Point Studio Lighting for High-Gloss LEGO ABS Plastic
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
      scene.add(ambientLight);

      // Key Light: High-angle directional light casting defined LEGO brick shadows
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(8, 15, 10);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 40;
      keyLight.shadow.camera.left = -6;
      keyLight.shadow.camera.right = 6;
      keyLight.shadow.camera.top = 6;
      keyLight.shadow.camera.bottom = -6;
      keyLight.shadow.bias = -0.0001;
      scene.add(keyLight);

      // Rim/Contour Light: Cool sky blue edge glints highlighting aerodynamic curves & studs
      const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.0);
      rimLight.position.set(-8, 8, -10);
      scene.add(rimLight);

      // Fill Light: Soft warm fill light balancing contrast under wings
      const fillLight = new THREE.DirectionalLight(0xfff7ed, 0.45);
      fillLight.position.set(6, 4, -6);
      scene.add(fillLight);

      // Studio circular podium disc
      const podiumGeo = new THREE.CylinderGeometry(5.6, 5.8, 0.12, 64);
      const podiumMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.28,
        metalness: 0.04,
      });
      const podium = new THREE.Mesh(podiumGeo, podiumMat);
      podium.position.y = -0.06;
      podium.receiveShadow = true;
      scene.add(podium);
      podiumRef.current = podium;

      const ringGeo = new THREE.RingGeometry(5.5, 5.65, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.002;
      scene.add(ringMesh);
      ringMeshRef.current = ringMesh;

      // Soft ground contact shadow plane directly grounding the 4 tires & chassis
      const contactCanvas = document.createElement('canvas');
      contactCanvas.width = 512;
      contactCanvas.height = 512;
      const ctx = contactCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 512, 512);
        // Central floor & diffuser ambient occlusion blur
        const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 200);
        grad.addColorStop(0, 'rgba(15, 23, 42, 0.72)');
        grad.addColorStop(0.45, 'rgba(15, 23, 42, 0.36)');
        grad.addColorStop(0.8, 'rgba(15, 23, 42, 0.08)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad;
        ctx.save();
        ctx.translate(256, 256);
        ctx.scale(0.8, 1.6);
        ctx.beginPath();
        ctx.arc(0, 0, 130, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4 Tire contact footprint patches
        const drawTireShadow = (cx: number, cy: number) => {
          const tGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 34);
          tGrad.addColorStop(0, 'rgba(15, 23, 42, 0.90)');
          tGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.55)');
          tGrad.addColorStop(0.85, 'rgba(15, 23, 42, 0.12)');
          tGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = tGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 34, 0, Math.PI * 2);
          ctx.fill();
        };
        drawTireShadow(140, 120);
        drawTireShadow(372, 120);
        drawTireShadow(136, 392);
        drawTireShadow(376, 392);
      }
      const contactTex = new THREE.CanvasTexture(contactCanvas);
      contactTex.flipY = false;
      contactTex.premultiplyAlpha = false;
      const contactMat = new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      });
      const contactPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 9.0), contactMat);
      contactPlane.rotation.x = -Math.PI / 2;
      contactPlane.position.y = 0.003;
      scene.add(contactPlane);
      contactPlaneRef.current = contactPlane;

      const grid = new THREE.GridHelper(24, 48, 0xcbd5e1, 0xf1f5f9);
      grid.position.y = -0.001;
      scene.add(grid);
      gridRef.current = grid;

      // Knolling tray surface on floor for 3-zone layout (Zone 1, Zone 2, Zone 3)
      const trayTex = createKnollingTrayTexture();
      const trayGeo = new THREE.PlaneGeometry(24, 28);
      const trayMat = new THREE.MeshBasicMaterial({
        map: trayTex,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      });
      const trayMesh = new THREE.Mesh(trayGeo, trayMat);
      trayMesh.rotation.x = -Math.PI / 2;
      trayMesh.position.y = 0.0038;
      trayMesh.visible = false;
      scene.add(trayMesh);
      knollingTrayRef.current = trayMesh;

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

      // Raycasting for Clicking & Hovering on actual individual LDraw LEGO brick meshes
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const getIntersectedLegoObject = (event: MouseEvent): {
        partKey?: CarPartKey;
        meta?: LegoMeshMeta;
        instance?: LDrawPartInstance;
        mesh?: THREE.Mesh;
        snapAnchor?: SnapAnchorZone;
      } | null => {
        if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

        for (const hit of intersects) {
          const obj = hit.object;
          if (obj.name && (obj.name.includes('Helper') || obj.name.includes('Podium') || obj.name.includes('Contact'))) {
            continue;
          }

          let cur: THREE.Object3D | null = obj;
          while (cur && cur !== sceneRef.current) {
            if (cur.userData && cur.userData.isSnapAnchor) {
              return {
                snapAnchor: cur.userData.anchor as SnapAnchorZone,
              };
            }
            if (cur.userData && cur.userData.isLegoPart) {
              const pKey = cur.userData.partKey as CarPartKey;
              const meta: LegoMeshMeta = {
                partKey: pKey,
                name: cur.userData.pieceName || LEGO_COMPONENT_METADATA[pKey]?.name || 'LEGO_PART',
                designId: cur.userData.designId || LEGO_COMPONENT_METADATA[pKey]?.designId || '3003',
                elementId: cur.userData.elementId || LEGO_COMPONENT_METADATA[pKey]?.elementId || '614126',
                pieceName: cur.userData.pieceName || LEGO_COMPONENT_METADATA[pKey]?.pieceName || 'Official LEGO Element',
                category: cur.userData.subAssembly || LEGO_COMPONENT_METADATA[pKey]?.category || 'Chassis',
              };
              const instance = cur.userData.instance as LDrawPartInstance | undefined;
              const discreteMesh = (cur instanceof THREE.Mesh) ? cur : (obj instanceof THREE.Mesh ? obj : undefined);
              return {
                partKey: pKey,
                meta,
                instance,
                mesh: discreteMesh,
              };
            }
            cur = cur.parent;
          }
        }
        return null;
      };

      const handlePointerDown = (event: MouseEvent) => {
        const hit = getIntersectedLegoObject(event);
        if (hit?.snapAnchor) {
          if (handleSnapPointClickRef.current) {
            handleSnapPointClickRef.current(hit.snapAnchor);
          }
          return;
        }
        if (hit?.mesh) {
          makeMaterialUnique(hit.mesh);
          selectedBrickMeshRef.current = hit.mesh;

          // Visually confirm selection with a brief emissive pulse
          const m = Array.isArray(hit.mesh.material) ? hit.mesh.material[0] : hit.mesh.material;
          if (
            m instanceof THREE.MeshStandardMaterial ||
            m instanceof THREE.MeshPhysicalMaterial ||
            m instanceof THREE.MeshLambertMaterial
          ) {
            m.emissive.set(0xf59e0b);
            m.emissiveIntensity = 0.85;
            m.needsUpdate = true;
          }
        }
        if (hit?.partKey) {
          onSelectPart(hit.partKey);
          if (hit.meta) {
            setSelectedPieceInfo(hit.meta);
          }
          if (hit.instance) {
            setActiveInstance(hit.instance);
            if (onSelectInstance) {
              onSelectInstance(hit.instance);
            }
            if (onSelectInstanceId) {
              onSelectInstanceId(hit.instance.id);
            }
          }
        }
      };

      const handlePointerMove = (event: MouseEvent) => {
        const hit = getIntersectedLegoObject(event);
        setHoveredSnapAnchor(hit?.snapAnchor || null);
        setHoveredPart(hit?.partKey || null);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = (hit?.partKey || hit?.snapAnchor) ? 'pointer' : 'grab';
        }
      };

      canvas.addEventListener('click', handlePointerDown);
      canvas.addEventListener('mousemove', handlePointerMove);

      const easeInOutCubic = (x: number): number => {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      };

      // Animation Loop with Knolling matrix tweening
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // Smooth Knolling Disassemble / Assemble Tweening
        if (Math.abs(animProgressRef.current - targetAnimProgressRef.current) > 0.001) {
          const step = 0.038;
          if (animProgressRef.current < targetAnimProgressRef.current) {
            animProgressRef.current = Math.min(targetAnimProgressRef.current, animProgressRef.current + step);
          } else {
            animProgressRef.current = Math.max(targetAnimProgressRef.current, animProgressRef.current - step);
          }
          const t = easeInOutCubic(animProgressRef.current);
          const arc = Math.sin(t * Math.PI) * 45;

          meshByIdRef.current.forEach((mesh) => {
            if (mesh.userData.assembledPos && mesh.userData.knollingPos) {
              mesh.position.lerpVectors(mesh.userData.assembledPos, mesh.userData.knollingPos, t);
              mesh.position.y += arc;
              mesh.quaternion.slerpQuaternions(mesh.userData.assembledQuat, mesh.userData.knollingQuat, t);
              mesh.updateMatrix();
            }
          });

          // Decal visibility during knolling
          decalMeshesRef.current.forEach((dMesh) => {
            if (dMesh.material) {
              (dMesh.material as THREE.Material).opacity = Math.max(0, 1.0 - t * 1.5);
              (dMesh.material as THREE.Material).transparent = true;
            }
          });

          // Knolling 3D studio tray surface vs podium transitions
          if (knollingTrayRef.current) {
            knollingTrayRef.current.visible = t > 0.005;
            (knollingTrayRef.current.material as THREE.MeshBasicMaterial).opacity = t;
          }
          if (podiumRef.current) {
            (podiumRef.current.material as THREE.MeshStandardMaterial).opacity = 1.0 - t * 0.95;
            (podiumRef.current.material as THREE.MeshStandardMaterial).transparent = t > 0.005;
          }
          if (ringMeshRef.current) {
            (ringMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 1.0 - t;
            (ringMeshRef.current.material as THREE.MeshBasicMaterial).transparent = true;
          }
          if (contactPlaneRef.current) {
            (contactPlaneRef.current.material as THREE.MeshBasicMaterial).opacity = 0.82 * (1.0 - t);
          }

          // Smooth camera target shift towards 3-zone center (0, 0, 0)
          if (controlsRef.current) {
            const vCar = new THREE.Vector3(0, 0.35, 0);
            const vKnollCenter = new THREE.Vector3(0, 0, 0);
            controlsRef.current.target.lerpVectors(vCar, vKnollCenter, t);
          }
        }

        // Pulse Snap Point Anchors with gentle emerald glow
        if (snapPointsGroupRef.current && snapPointsGroupRef.current.visible) {
          const pulse = (Math.sin(Date.now() * 0.006) + 1) * 0.5;
          snapPointsGroupRef.current.children.forEach((anchorObj) => {
            if (anchorObj instanceof THREE.Group && anchorObj.children[1]) {
              const fill = anchorObj.children[1] as THREE.Mesh;
              if (fill && fill.material) {
                (fill.material as THREE.MeshBasicMaterial).opacity = 0.18 + pulse * 0.28;
              }
            }
          });
        }

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
  }, [resetKey, onSelectPart, onSelectInstance, onSelectInstanceId]);

  // Snap Mode visibility synchronization
  useEffect(() => {
    if (snapPointsGroupRef.current) {
      snapPointsGroupRef.current.visible = isSnapMode;
    }
  }, [isSnapMode]);

  // Handle snap anchor addition
  const handleSnapPointClick = useCallback(
    (anchor: SnapAnchorZone) => {
      playLegoSnapSound();

      const newId = `ldr-custom-${Date.now()}`;
      const newInst: LDrawPartInstance = {
        id: newId,
        designId: anchor.defaultDesignId,
        elementId: anchor.defaultElementId,
        pieceName: anchor.defaultPieceName,
        subAssembly: anchor.zone,
        partKey: anchor.compatiblePartKey,
        colorCode: getLDrawColorCode(colors[anchor.compatiblePartKey] || '#C91A09'),
        colorHex: colors[anchor.compatiblePartKey] || '#C91A09',
        stepNumber: 11,
        x: anchor.position[0],
        y: anchor.position[1],
        z: anchor.position[2],
        rot: anchor.rotation,
      };

      if (carGroupRef.current) {
        const geo = getLDrawPartGeometry(newInst.designId);
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(newInst.colorHex),
          roughness: 0.18,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 0.8,
        });
        const partMesh = new THREE.Mesh(geo, mat);
        partMesh.castShadow = true;
        partMesh.receiveShadow = true;

        const edgesGeo = getLDrawPartEdges(newInst.designId);
        if (edgesGeo) {
          const edgeLines = new THREE.LineSegments(
            edgesGeo,
            new THREE.LineBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.4 })
          );
          partMesh.add(edgeLines);
        }

        const [a, b, c, d, e, f, g, h, i] = newInst.rot;
        const m = new THREE.Matrix4();
        m.set(
          a,  b,  c,  newInst.x,
         -d, -e, -f, -newInst.y,
          g,  h,  i,  newInst.z,
          0,  0,  0,  1
        );
        partMesh.position.set(0, 0, 0);
        partMesh.quaternion.set(0, 0, 0, 1);
        partMesh.scale.set(1, 1, 1);
        partMesh.applyMatrix4(m);
        partMesh.matrixAutoUpdate = true;
        partMesh.updateMatrixWorld(true);

        partMesh.userData = {
          isLegoPart: true,
          id: newInst.id,
          partKey: newInst.partKey,
          designId: newInst.designId,
          elementId: newInst.elementId,
          pieceName: newInst.pieceName,
          subAssembly: newInst.subAssembly,
          colorCode: newInst.colorCode,
          colorHex: newInst.colorHex,
          stepNumber: newInst.stepNumber,
          isTire: false,
          isRim: false,
          instance: newInst,
          assembledPos: partMesh.position.clone(),
          assembledQuat: partMesh.quaternion.clone(),
          knollingPos: new THREE.Vector3(
            -430 + (currentInstances.length % 15) * 26,
            3,
            -250 + Math.floor(currentInstances.length / 15) * 28
          ),
          knollingQuat: new THREE.Quaternion(0, 0, 0, 1),
        };

        carGroupRef.current.add(partMesh);
        meshByIdRef.current.set(newInst.id, partMesh);
      }

      setCurrentInstances((prev) => [...prev, newInst]);
      setTotalLDrawPieces((prev) => prev + 1);

      if (onAddCustomPart) {
        onAddCustomPart({
          id: newId,
          elementId: anchor.defaultElementId,
          designId: anchor.defaultDesignId,
          name: anchor.defaultPieceName,
          category: anchor.zone,
          partKey: anchor.compatiblePartKey,
          colorHex: colors[anchor.compatiblePartKey] || '#C91A09',
          colorName: 'Official Spec Red',
          quantity: 1,
          step: 11,
        });
      }

      setSnapSuccessToast(`Monterade ${anchor.defaultPieceName} på ${anchor.name}!`);
      setTimeout(() => setSnapSuccessToast(null), 3000);
    },
    [colors, currentInstances.length, onAddCustomPart]
  );

  useEffect(() => {
    handleSnapPointClickRef.current = handleSnapPointClick;
  }, [handleSnapPointClick]);

  const handleExecutePartSwap = (
    instanceId: string,
    newDesignId: string,
    newElementId: string,
    newPieceName: string,
    category: string
  ) => {
    playLegoSnapSound();
    const mesh = meshByIdRef.current.get(instanceId);
    if (mesh) {
      mesh.geometry.dispose();
      mesh.geometry = getLDrawPartGeometry(newDesignId);

      const oldEdges = mesh.children.filter((c) => c instanceof THREE.LineSegments);
      oldEdges.forEach((c) => mesh.remove(c));

      const edgesGeo = getLDrawPartEdges(newDesignId);
      if (edgesGeo) {
        const edgeLines = new THREE.LineSegments(
          edgesGeo,
          new THREE.LineBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.4 })
        );
        mesh.add(edgeLines);
      }

      mesh.userData.designId = newDesignId;
      mesh.userData.elementId = newElementId;
      mesh.userData.pieceName = newPieceName;
      mesh.userData.subAssembly = category;
    }

    setCurrentInstances((prev) =>
      prev.map((inst) =>
        inst.id === instanceId
          ? {
              ...inst,
              designId: newDesignId,
              elementId: newElementId,
              pieceName: newPieceName,
              subAssembly: category,
            }
          : inst
      )
    );

    if (activeInstance && activeInstance.id === instanceId) {
      setActiveInstance({
        ...activeInstance,
        designId: newDesignId,
        elementId: newElementId,
        pieceName: newPieceName,
        subAssembly: category,
      });
    }

    if (onSwapPartElement) {
      onSwapPartElement(instanceId, newDesignId, newElementId, newPieceName, category);
    }
  };

  const handleDisassemble = () => {
    setIsDisassembled(true);
    targetAnimProgressRef.current = 1.0;
    playDisassembleSlideSound();
    setIsTurntable(false);
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 22, 28);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleAssemble = () => {
    setIsDisassembled(false);
    targetAnimProgressRef.current = 0.0;
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(6, 4, 8);
      controlsRef.current.target.set(0, 0.35, 0);
      controlsRef.current.update();
    }
    setTimeout(() => {
      playLegoSnapSound();
    }, 600);
  };

  // =========================================================================
  // SINGLE SOURCE OF TRUTH: Load & Render 275-piece LDraw Speed Champions Set
  // Zero fallback geometry. Pure LDrawLoader parse with ABS and Rubber materials.
  // =========================================================================
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoadingLDraw(true);

    // Determine raw LDR text: custom user-provided LDR, registry-backed model (e.g. 77242/77251), or compiled MPD
    let rawLdrContent: string;
    if (customLdrContent) {
      rawLdrContent = customLdrContent;
    } else {
      const registryModel = getVehicleModel(currentSet.articleNumber);
      if (registryModel && registryModel.rawLdr) {
        rawLdrContent = registryModel.rawLdr;
      } else if (currentSet.articleNumber === '77242') {
        rawLdrContent = FERRARI_SF24_MODEL.rawLdr || OFFICIAL_77242_LDR;
      } else {
        const mpdResult = generateLDrawMpd(currentSet, colors, decals);
        rawLdrContent = mpdResult.mpdContent;
      }
    }

    // Direct LDR Ingestion via sanitized parser:
    // 1. Enforces vehicle bounds (strips runaway Z spines up to 2200 LDU)
    // 2. Replaces 3020 Plate with 87079 Tile on rear wing endplates
    // 3. Fallback 4-wheel assembly guarantee for truncated sets
    // 4. Applies standard Y-axis coordinate inversion (position.y = -ldraw_y)
    const parsed = parseLDrawDocument(rawLdrContent, currentSet.articleNumber, colors);
    setLdrDiagnostics(parsed.diagnostics);
    setActiveMpdContent(rawLdrContent);
    setTotalLDrawPieces(parsed.instances.length);
    setUniqueElementCount(parsed.uniqueElementCount);
    setCurrentInstances(parsed.instances);

    const knollingLayoutMap = computeKnollingLayout(parsed.instances);

    // Cleanup previous car model
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

    // Master container for the car
    const rootCarGroup = new THREE.Group();
    const carGroup = new THREE.Group();
    rootCarGroup.add(carGroup);

    // Material Optimization: Shared materials per partKey/type with High-Gloss ABS Plastic Shader
    const sharedMaterials = new Map<string, THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial>();

    const getSharedMaterial = (partKey: CarPartKey, isTire: boolean, isRim: boolean, hexColor: string) => {
      const cacheKey = isTire ? 'tire' : isRim ? 'rim' : partKey;
      if (sharedMaterials.has(cacheKey)) return sharedMaterials.get(cacheKey)!;

      let mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
      if (isTire) {
        // Authentic Rubber Black (#1B2A34)
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#1B2A34'),
          roughness: 0.90,
          metalness: 0.02,
        });
      } else if (isRim) {
        // Metallic Wheel Rim with lacquer coat
        mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(colors.rims || '#646464'),
          roughness: 0.28,
          metalness: 0.45,
          clearcoat: 0.8,
          clearcoatRoughness: 0.15,
        });
      } else {
        // Authentic High-Gloss LEGO ABS Plastic: clearcoat lacquer & high reflectivity
        mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(hexColor),
          roughness: 0.18,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 0.8,
        });
      }
      sharedMaterials.set(cacheKey, mat);
      return mat;
    };

    partMaterialsRef.current = sharedMaterials;

    // Shared edge material for crisp LDraw brick separation outlines
    const sharedEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.40,
      depthTest: true,
    });

    meshByIdRef.current.clear();

    // Build all authentic sanitized LDraw piece instances
    parsed.instances.forEach((inst, index) => {
      if (!inst || (!inst.designId && !inst.elementId)) {
        console.warn('[Geometry Engine] Skipping invalid part config:', inst);
        return; // prevent silent failure / broken mesh instantiation
      }

      const isTire = inst.partKey === 'tireCompound' || inst.designId === '80249';
      const isRim = inst.partKey === 'rims' || inst.designId === '6014';
      const customHex = customBrickColors?.[inst.id];
      const baseHex = customHex || colors[inst.partKey] || inst.colorHex;

      const geo = getLDrawPartGeometry(inst.designId, inst.pieceName);
      
      // Each mesh receives its own independent material instance.
      // This enables true individual per-brick color editing without any cross-part color bleeding!
      let mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
      if (isTire) {
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#1B2A34'),
          roughness: 0.90,
          metalness: 0.02,
        });
      } else if (isRim) {
        mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(customHex || colors.rims || '#646464'),
          roughness: 0.28,
          metalness: 0.45,
          clearcoat: 0.8,
          clearcoatRoughness: 0.15,
        });
      } else {
        mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(baseHex),
          roughness: 0.18,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 0.8,
        });
      }

      const partMesh = new THREE.Mesh(geo, mat);
      partMesh.castShadow = true;
      partMesh.receiveShadow = true;

      // Add authentic LDraw conditional edge lines so individual bricks separate cleanly
      const edgesGeo = getLDrawPartEdges(inst.designId);
      if (edgesGeo) {
        const edgeLines = new THREE.LineSegments(edgesGeo, sharedEdgeMaterial);
        partMesh.add(edgeLines);
      }

      // 1. Apply authentic 3x3 LDraw transform matrix with Y-inversion for Three.js coordinates
      const [a, b, c, d, e, f, g, h, i] = inst.rot;
      const { x, y, z } = inst;

      const m = new THREE.Matrix4();
      m.set(
        a,  b,  c,  x,
       -d, -e, -f, -y,
        g,  h,  i,  z,
        0,  0,  0,  1
      );

      partMesh.position.set(0, 0, 0);
      partMesh.quaternion.set(0, 0, 0, 1);
      partMesh.scale.set(1, 1, 1);
      partMesh.applyMatrix4(m);
      partMesh.matrixAutoUpdate = true;
      partMesh.updateMatrixWorld(true);

      const knoll = knollingLayoutMap.get(inst.id);

      partMesh.userData = {
        isLegoPart: true,
        isMaterialUnique: true,
        partIndex: index,
        id: inst.id,
        partKey: inst.partKey,
        designId: inst.designId,
        elementId: inst.elementId,
        pieceName: inst.pieceName,
        subAssembly: inst.subAssembly,
        colorCode: inst.colorCode,
        colorHex: baseHex,
        stepNumber: inst.stepNumber,
        stageNumber: inst.stageNumber || 1,
        isTire,
        isRim,
        instance: inst,
        assembledPos: partMesh.position.clone(),
        assembledQuat: partMesh.quaternion.clone(),
        knollingPos: knoll
          ? new THREE.Vector3(knoll.x, knoll.y, knoll.z)
          : partMesh.position.clone(),
        knollingQuat: knoll ? knoll.quaternion.clone() : partMesh.quaternion.clone(),
      };

      carGroup.add(partMesh);
      meshByIdRef.current.set(inst.id, partMesh);

      // Register mesh for selection tracking
      if (!meshesRef.current.has(inst.partKey)) {
        meshesRef.current.set(inst.partKey, []);
      }
      meshesRef.current.get(inst.partKey)!.push(partMesh);
    });

    // 2. Add Snap Point Anchors for modular expansion
    const snapPointsGroup = new THREE.Group();
    snapPointsGroup.visible = isSnapMode;
    snapPointsGroupRef.current = snapPointsGroup;

    SNAP_ANCHORS.forEach((anchor) => {
      const anchorGroup = new THREE.Group();
      anchorGroup.position.set(anchor.position[0], anchor.position[1], anchor.position[2]);

      const snapBoxGeo = new THREE.BoxGeometry(26, 14, 26);
      const snapWireGeo = new THREE.WireframeGeometry(snapBoxGeo);
      const snapWireMat = new THREE.LineBasicMaterial({
        color: 0x10b981,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
      });
      const wire = new THREE.LineSegments(snapWireGeo, snapWireMat);

      const snapFillMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      const fill = new THREE.Mesh(snapBoxGeo, snapFillMat);

      anchorGroup.add(wire);
      anchorGroup.add(fill);

      anchorGroup.userData = {
        isSnapAnchor: true,
        anchor,
      };
      snapPointsGroup.add(anchorGroup);
    });
    carGroup.add(snapPointsGroup);

    // 3. Normalize Scales & Global Dimensions
    carGroup.scale.setScalar(0.04);
    carGroup.updateMatrixWorld(true);

    // 4. Center & Place on Ground with exact 4-Tire Contact at Y = 0
    const initialBox = new THREE.Box3().setFromObject(carGroup);
    const modelCenter = initialBox.getCenter(new THREE.Vector3());
    carGroup.position.x = -modelCenter.x;
    carGroup.position.z = -modelCenter.z;

    const tireMeshes: THREE.Mesh[] = [];
    carGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child.userData?.isTire || child.userData?.designId === '80249')) {
        tireMeshes.push(child as THREE.Mesh);
      }
    });

    let lowestTireY = Infinity;
    tireMeshes.forEach((t) => {
      const tBox = new THREE.Box3().setFromObject(t);
      if (tBox.min.y < lowestTireY) {
        lowestTireY = tBox.min.y;
      }
    });

    if (lowestTireY !== Infinity && isFinite(lowestTireY)) {
      carGroup.position.y += -lowestTireY;
    } else {
      carGroup.position.y = -initialBox.min.y;
    }
    carGroup.rotation.y = 0; // LDraw-to-Three scale(1,-1,-1) maps LDraw -Z to Three +Z (front towards camera)
    carGroup.updateMatrixWorld(true);

    // Global Invariant Clamp Sanity Pass:
    // Clamp any non-tire underbody part so no brick ever penetrates below Y = 0 ground plane
    carGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !child.userData?.isTire) {
        const box = new THREE.Box3().setFromObject(child);
        if (box.min.y < -0.005) {
          const penetration = -box.min.y;
          child.position.y += penetration / carGroup.scale.y;
          child.updateMatrixWorld(true);
        }
      }
    });

    // ==========================================
    // MULTI-TILE LIVERY DECALS & SPONSOR LOGOS
    // ==========================================
        const targetPlacement = decals.uploadedLogoPlacement || 'sidepod';
        const dScale = decals.decalScale ?? 1.0;
        const dRot = ((decals.decalRotation ?? 0) * Math.PI) / 180;
        const dOffX = decals.decalOffsetX ?? 0;
        const dOffY = decals.decalOffsetY ?? 0;
        const mirrorSides = decals.decalMirrorSides !== false;

        // 1. SIDEPOD LIVERY DECAL
        const sidepodW = 1.8 * (targetPlacement === 'sidepod' ? dScale : 1.0);
        const sidepodH = 0.36 * (targetPlacement === 'sidepod' ? dScale : 1.0);
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

          // Left Sidepod (at X = -1.98)
          const sidepodMeshL = new THREE.Mesh(sidepodGeo, decalMat);
          sidepodMeshL.position.set(-1.98, 0.88 + (isSidepodTarget ? dOffY : 0), 0.0 + (isSidepodTarget ? dOffX : 0));
          sidepodMeshL.rotation.set(0, -Math.PI / 2, isSidepodTarget ? -dRot : 0);
          rootCarGroup.add(sidepodMeshL);
          decalMeshesRef.current.push(sidepodMeshL);

          // Right Sidepod (at X = 1.98)
          if (mirrorSides || !isSidepodTarget) {
            const sidepodMeshR = new THREE.Mesh(sidepodGeo, decalMat);
            sidepodMeshR.position.set(1.98, 0.88 + (isSidepodTarget ? dOffY : 0), 0.0 + (isSidepodTarget ? dOffX : 0));
            sidepodMeshR.rotation.set(0, Math.PI / 2, isSidepodTarget ? dRot : 0);
            rootCarGroup.add(sidepodMeshR);
            decalMeshesRef.current.push(sidepodMeshR);
          }
        });

        // 2. NOSE CONE DECAL
        const isNoseTarget = targetPlacement === 'nose';
        const noseW = 0.58 * (isNoseTarget ? dScale : 1.0);
        const noseH = 0.34 * (isNoseTarget ? dScale : 1.0);
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
          noseDecalMesh.position.set(0 + (isNoseTarget ? dOffX : 0), 1.05 + (isNoseTarget ? dOffY : 0), 2.45);
          noseDecalMesh.rotation.set(-Math.PI / 2 + 0.15, 0, isNoseTarget ? dRot : 0);
          rootCarGroup.add(noseDecalMesh);
          decalMeshesRef.current.push(noseDecalMesh);
        });

        // 3. REAR WING DRS BLADE DECAL
        const isRwTarget = targetPlacement === 'rearWing';
        const rwW = 1.6 * (isRwTarget ? dScale : 1.0);
        const rwH = 0.22 * (isRwTarget ? dScale : 1.0);
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
          rwDecalMesh.position.set(0 + (isRwTarget ? dOffX : 0), 2.12 + (isRwTarget ? dOffY : 0), -3.76);
          rwDecalMesh.rotation.set(-0.14, 0, isRwTarget ? dRot : 0);
          rootCarGroup.add(rwDecalMesh);
          decalMeshesRef.current.push(rwDecalMesh);
        });

        // 4. DRIVER COCKPIT RIM DECAL (Driver Name & Flag)
        if (decals.projectDriverCockpit !== false && (decals.customDriverName || decals.driverFlag)) {
          const cockpitDecalGeo = new THREE.PlaneGeometry(0.9, 0.2);
          const flagEmoji = decals.driverFlag || '';
          const driverLabel = `${flagEmoji} ${decals.customDriverName || 'DRIVER'}`.trim();
          buildDecalTexture(driverLabel, `#${decals.racingNumber}`, '#ffffff', '#0f172a').then((tex) => {
            const driverMat = new THREE.MeshBasicMaterial({
              map: tex,
              transparent: true,
              side: THREE.DoubleSide,
            });
            // Left cockpit rim
            const driverMeshL = new THREE.Mesh(cockpitDecalGeo, driverMat);
            driverMeshL.position.set(-0.76, 1.25, 0.4);
            driverMeshL.rotation.set(0, -Math.PI / 2, 0);
            rootCarGroup.add(driverMeshL);
            decalMeshesRef.current.push(driverMeshL);

            // Right cockpit rim
            const driverMeshR = new THREE.Mesh(cockpitDecalGeo, driverMat);
            driverMeshR.position.set(0.76, 1.25, 0.4);
            driverMeshR.rotation.set(0, Math.PI / 2, 0);
            rootCarGroup.add(driverMeshR);
            decalMeshesRef.current.push(driverMeshR);
          });
        }

        carGroupRef.current = rootCarGroup;
        scene.add(rootCarGroup);
        setIsLoadingLDraw(false);
  }, [
    currentSet,
    colors,
    customLdrContent,
    resetKey,
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
    decals.customDriverName,
    decals.customTagline,
    decals.customTextColor,
    decals.customBadgeColor,
    decals.driverFlag,
    decals.driverHeadgear,
    decals.driverAccessory,
    decals.projectDriverCockpit,
    decals.projectDriverNose,
    buildDecalTexture,
  ]);

  // Blueprint Sub-Assembly Stage Filtering (Stages 1–4 vs All)
  // Isolates or highlights the selected construction stage with subtle ghosting for context
  useEffect(() => {
    if (!carGroupRef.current) return;
    carGroupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.userData?.isLegoPart) {
        const mesh = child as THREE.Mesh;
        const partStage = mesh.userData?.stageNumber ?? mesh.userData?.instance?.stageNumber ?? 1;
        const isMatched = selectedStage === 'all' || partStage === selectedStage;

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m && 'opacity' in m) {
            if (isMatched) {
              m.transparent = false;
              m.opacity = 1.0;
            } else {
              m.transparent = true;
              m.opacity = 0.12;
            }
            m.needsUpdate = true;
          }
        });
      }
    });
  }, [selectedStage, currentInstances]);

  // Real-time Material Color Updates (Per-brick overrides + global category colors)
  useEffect(() => {
    meshByIdRef.current.forEach((mesh, id) => {
      if (mesh.userData.isTire) return;
      const partKey = mesh.userData.partKey as CarPartKey;
      const customHex = customBrickColors?.[id];
      const targetHex = customHex || (mesh.userData.isRim ? (colors.rims || '#646464') : colors[partKey]);

      if (targetHex && mesh.material) {
        makeMaterialUnique(mesh);
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (mat && 'color' in mat) {
          mat.color.set(targetHex);
          mat.needsUpdate = true;
        }
      }
    });
  }, [colors, customBrickColors]);

  // Zen Mode Keyboard Shortcut: Toggle on 'F' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        setIsZenMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Per-Brick Paint Handler with strict material isolation and instantaneous 3D mesh feedback
  const handlePaintIndividualBrick = useCallback(
    (instanceId: string, hex: string) => {
      const targetMesh =
        (selectedBrickMeshRef.current && selectedBrickMeshRef.current.userData?.id === instanceId)
          ? selectedBrickMeshRef.current
          : meshByIdRef.current.get(instanceId);

      if (targetMesh) {
        makeMaterialUnique(targetMesh);
        const mat = Array.isArray(targetMesh.material) ? targetMesh.material[0] : targetMesh.material;
        if (mat && 'color' in mat) {
          mat.color.set(hex);
          mat.needsUpdate = true;
        }
        targetMesh.userData.customColor = hex;
        targetMesh.userData.colorHex = hex;
      }

      if (onUpdateIndividualBrickColor) {
        onUpdateIndividualBrickColor(instanceId, hex);
      }
    },
    [onUpdateIndividualBrickColor]
  );

  // Selection Highlight Feedback: Pulse emissive glow on selected LEGO piece (individual or category)
  useEffect(() => {
    meshByIdRef.current.forEach((mesh, id) => {
      if (!(mesh.material instanceof THREE.MeshPhysicalMaterial || mesh.material instanceof THREE.MeshStandardMaterial)) return;

      const isIndividualSelected = selectedInstanceId === id;
      const isCategorySelected = !selectedInstanceId && mesh.userData.partKey === selectedPart;

      if (isIndividualSelected) {
        mesh.material.emissive.set(0xf59e0b); // Brilliant gold highlight
        mesh.material.emissiveIntensity = 0.65;
        mesh.material.needsUpdate = true;
      } else if (isCategorySelected) {
        mesh.material.emissive.set(0xf59e0b);
        mesh.material.emissiveIntensity = 0.22;
        mesh.material.needsUpdate = true;
      } else {
        mesh.material.emissive.set(0x000000);
        mesh.material.emissiveIntensity = 0;
        mesh.material.needsUpdate = true;
      }
    });
  }, [selectedPart, selectedInstanceId]);

  // Handle Granular Part Hiding & Isolation
  useEffect(() => {
    meshesRef.current.forEach((meshList, partKey) => {
      const isHidden = hiddenParts?.has(partKey);

      meshList.forEach((mesh) => {
        if (isHidden) {
          mesh.visible = false;
        } else if (isolatedPartId) {
          const isTarget = isolatedPartId === partKey;
          mesh.visible = isTarget;
          if (
            !isTarget &&
            (mesh.material instanceof THREE.MeshPhysicalMaterial ||
              mesh.material instanceof THREE.MeshStandardMaterial)
          ) {
            mesh.material.opacity = 0.15;
            mesh.material.transparent = true;
          }
        } else {
          mesh.visible = true;
          if (
            mesh.material instanceof THREE.MeshPhysicalMaterial ||
            mesh.material instanceof THREE.MeshStandardMaterial
          ) {
            mesh.material.opacity = 1.0;
            mesh.material.transparent = false;
          }
        }
      });
    });
  }, [hiddenParts, isolatedPartId]);

  // Camera preset positions
  const setCameraView = (view: 'isometric' | 'side' | 'top' | 'cockpit' | 'rear') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    controls.autoRotate = false;
    setIsTurntable(false);

    switch (view) {
      case 'isometric':
        cameraRef.current.position.set(6, 4, 8);
        controls.target.set(0, 0.35, 0);
        break;
      case 'side':
        cameraRef.current.position.set(6.5, 0.8, 0);
        controls.target.set(0, 0.35, 0);
        break;
      case 'top':
        cameraRef.current.position.set(0, 8.5, 0.1);
        controls.target.set(0, 0.35, 0);
        break;
      case 'cockpit':
        cameraRef.current.position.set(0, 1.4, 2.0);
        controls.target.set(0, 0.6, -0.4);
        break;
      case 'rear':
        cameraRef.current.position.set(0, 1.5, -5.6);
        controls.target.set(0, 0.45, 0);
        break;
    }
    controls.update();
  };

  // Generate Dual Transparent Snapshots (Front 3/4 hero view & Side Profile) with zero background
  const captureDualTransparentSnapshots = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!renderer || !scene || !camera) return;

    // 1. Store original visual state
    const prevClearColor = new THREE.Color();
    renderer.getClearColor(prevClearColor);
    const prevClearAlpha = renderer.getClearAlpha();
    const prevCamPos = camera.position.clone();
    const prevTarget = controls ? controls.target.clone() : new THREE.Vector3(0, 0.35, 0);

    // 2. Hide studio environment floor, disc, ring, grid for pure transparent alpha cutout
    if (podiumRef.current) podiumRef.current.visible = false;
    if (ringMeshRef.current) ringMeshRef.current.visible = false;
    if (contactPlaneRef.current) contactPlaneRef.current.visible = false;
    if (gridRef.current) gridRef.current.visible = false;
    if (knollingTrayRef.current) knollingTrayRef.current.visible = false;

    // 3. Set transparent clear color
    renderer.setClearColor(0x000000, 0);

    // 4. Capture Front 3/4 hero view (Box Art hero angle)
    camera.position.set(5.5, 3.2, 6.8);
    camera.lookAt(0, 0.35, 0);
    renderer.render(scene, camera);
    const frontDataUrl = renderer.domElement.toDataURL('image/png');

    // 5. Capture Side Profile view (Box Art technical profile angle)
    camera.position.set(7.2, 0.45, 0);
    camera.lookAt(0, 0.35, 0);
    renderer.render(scene, camera);
    const sideDataUrl = renderer.domElement.toDataURL('image/png');

    // 6. Restore original scene elements & camera
    if (podiumRef.current) podiumRef.current.visible = true;
    if (ringMeshRef.current) ringMeshRef.current.visible = true;
    if (contactPlaneRef.current) contactPlaneRef.current.visible = true;
    if (gridRef.current) gridRef.current.visible = true;
    if (knollingTrayRef.current) knollingTrayRef.current.visible = isDisassembled;

    renderer.setClearColor(prevClearColor, prevClearAlpha);
    camera.position.copy(prevCamPos);
    if (controls) {
      controls.target.copy(prevTarget);
      controls.update();
    }
    renderer.render(scene, camera);

    // 7. Dispatch both transparent captures to onCaptureSnapshot
    if (onCaptureSnapshot) {
      onCaptureSnapshot(frontDataUrl, sideDataUrl);
    }
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2400);
  };

  // Download official LDraw .mpd / .ldr file directly
  const handleDownloadLDrawFile = () => {
    if (!activeMpdContent) return;
    const blob = new Blob([activeMpdContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSet.articleNumber}_Speed_Champions_275pcs.mpd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      id="car-3d-viewer-container"
      className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 flex flex-col select-none"
      style={{ width: '100%', height: '540px', minHeight: '420px', display: 'block' }}
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

      {/* Top Left Floating Badges: LDraw Source-of-Truth Status & HUD Card */}
      {!isZenMode && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto z-10">
          {/* Floating 360 Viewer Badge with Studs Indicator */}
          <div className="flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black tracking-wide text-white">
              LDRAW SOURCE-OF-TRUTH
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-mono text-amber-300 font-bold">
              {totalLDrawPieces} / {currentSet.pieceCount || 275} BITAR
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-[10px] font-mono text-slate-300">
              {uniqueElementCount} UNIKA IDs
            </span>
          </div>

          {/* Selected LEGO Piece Official Article Info HUD & Individual Color Swapper */}
          <div className="flex flex-col gap-2 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md pointer-events-auto max-w-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-slate-400 shadow-2xs shrink-0"
                  style={{
                    backgroundColor:
                      (activeInstance && customBrickColors?.[activeInstance.id]) ||
                      colors[selectedPart],
                  }}
                />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 truncate max-w-[140px]">
                  {activeInstance?.pieceName || selectedPieceInfo.name}
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                {activeInstance?.subAssembly || selectedPieceInfo.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5 font-mono">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">LDraw Design ID:</span>
                <span className="font-bold text-slate-800">
                  #{activeInstance?.designId || selectedPieceInfo.designId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Element ID (Article):</span>
                <span className="font-bold text-emerald-700">
                  #{activeInstance?.elementId || selectedPieceInfo.elementId}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 truncate pt-0.5 font-sans flex items-center justify-between">
              <span>{activeInstance?.pieceName || selectedPieceInfo.pieceName}</span>
              {activeInstance?.stepNumber && (
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                  Steg {activeInstance.stepNumber}
                </span>
              )}
            </div>

            {/* Quick Per-Brick Swatch Recolor Strip */}
            {activeInstance && (
              <div className="mt-1 pt-1.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-amber-500" />
                    Måla denna kloss:
                  </span>
                  {customBrickColors?.[activeInstance.id] && (
                    <button
                      onClick={() => handlePaintIndividualBrick(activeInstance.id, colors[activeInstance.partKey])}
                      className="text-[9px] text-amber-700 hover:underline cursor-pointer"
                    >
                      Återställ
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {LEGO_COLORS.slice(0, 10).map((col) => (
                    <button
                      key={col.id}
                      onClick={() => handlePaintIndividualBrick(activeInstance.id, col.hex)}
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: col.hex }}
                      title={`Måla denna kloss ${col.name}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {hoveredPart && hoveredPart !== selectedPart && (
            <div className="bg-amber-500/95 text-slate-950 backdrop-blur-sm px-3 py-1 rounded-xl text-[11px] font-black shadow-sm pointer-events-none flex items-center gap-1.5 w-fit">
              <Tag className="w-3 h-3" />
              <span>Klicka för att välja: {PART_LABELS[hoveredPart]?.label}</span>
            </div>
          )}
        </div>
      )}

      {/* Top Right Floating Blueprint & Sub-Assembly Stage Bar */}
      {!isZenMode && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-auto z-10">
          <div className="flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-md">
            <button
              onClick={() => setIsBlueprintModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Öppna Master Blueprint Ingestion Pipeline (PDF 6566098)"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Blueprint Engine</span>
            </button>

            <span className="w-px h-4 bg-slate-700 mx-0.5" />

            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setSelectedStage('all')}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  selectedStage === 'all'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visa hela bilen monterad"
              >
                Alla
              </button>
              <button
                onClick={() => setSelectedStage(1)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  selectedStage === 1
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Stage 1: Core Base #30029, front bulkhead, rear axle (Steg 1–20)"
              >
                Stage 1
              </button>
              <button
                onClick={() => setSelectedStage(2)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  selectedStage === 2
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Stage 2: Cockpit, Halo #6535158, framvinge (Steg 21–38)"
              >
                Stage 2
              </button>
              <button
                onClick={() => setSelectedStage(3)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  selectedStage === 3
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Stage 3: SNOT sidopoddar med beslag #99207/#99780 och kurvade slopes (Steg 39–65)"
              >
                Stage 3
              </button>
              <button
                onClick={() => setSelectedStage(4)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  selectedStage === 4
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Stage 4: Motorhuv, hajfen, bakvinge #87079 & 4 hjul (Steg 66–103)"
              >
                Stage 4
              </button>
            </div>
          </div>

          {/* LDU Calibration Geometric Standards Telemetry Strip */}
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-slate-700/60 text-[10px] font-mono text-slate-300 shadow-sm">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Y=0 Flush
            </span>
            <span className="text-slate-600">•</span>
            <span>Hjulbas 280 LDU</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">SNOT Matris Aktiv</span>
          </div>
        </div>
      )}

      {/* Left Floating Vertical Toolbar */}
      {!isZenMode && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md z-10">
          <button
            onClick={() => setIsTurntable(!isTurntable)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isTurntable ? 'bg-amber-400 text-slate-950' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Växla 360° Automatisk Rotation"
          >
            <RotateCw className={`w-4 h-4 ${isTurntable ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setCameraView('isometric')}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Återställ Kamera (Isometrisk vy)"
          >
            <Crosshair className="w-4 h-4 text-amber-500" />
          </button>

          <button
            onClick={() => setCameraView('cockpit')}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Förarperspektiv (Cockpit POV)"
          >
            <Eye className="w-4 h-4 text-blue-500" />
          </button>

          <button
            onClick={captureDualTransparentSnapshots}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
            title="Generera transparenta 3D-snapshots (Front 3/4 + Sidoprofil) för förpackning"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isZenMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
            }`}
            title={isZenMode ? 'Avsluta Zen Mode (F)' : 'Zen Mode (Dölj gränssnitt för ren 3D-rendering - Tryck F)'}
          >
            {isZenMode ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => setIsBricksetModalOpen(true)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-amber-600 transition-colors cursor-pointer"
            title="Officiell Brickset Inventarielista & CSV Export"
          >
            <Database className="w-4 h-4 text-amber-600" />
          </button>

          <button
            onClick={handleDownloadLDrawFile}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Ladda ner LDraw (.mpd / .ldr) Fil"
          >
            <FileDown className="w-4 h-4 text-indigo-600" />
          </button>

          <button
            onClick={() => setIsLdrModalOpen(true)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer relative"
            title="LDraw Parser & Ingestion Engine (Officiell 77242.ldr)"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            {ldrDiagnostics && ldrDiagnostics.outOfBoundsStrippedCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setIsBlueprintModalOpen(true)}
            className="p-2 rounded-xl text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer relative"
            title="Master Blueprint Ingestion Pipeline (PDF 6566098 • Ferrari SF-24 & McLaren)"
          >
            <Compass className="w-4 h-4 text-red-600" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {/* History Engine Toolbar: Undo, Redo, Reset */}
          {(onUndo || onRedo || onResetHistory) && (
            <>
              <div className="w-full h-px bg-slate-200 my-0.5" />
              {onUndo && (
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Ångra färg-/delsändring (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              )}
              {onRedo && (
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Gör om färg-/delsändring (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              )}
              {onResetHistory && (
                <button
                  onClick={onResetHistory}
                  className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-red-600 transition-colors cursor-pointer"
                  title="Återställ alla klossfärger till fabriksstandard"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Top Right Floating Badge: Active Decal & Custom Logo Badge */}
      {!isZenMode && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-xs pointer-events-none z-10">
          <div className="text-xs font-black italic px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 shadow-2xs">
            #{decals.racingNumber}
          </div>
          <div className="text-xs text-slate-800 font-bold tracking-wide">
            {decals.sponsorPrimary}
          </div>
          {decals.uploadedLogoUrl && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
              Dekal Aktiv
            </span>
          )}
        </div>
      )}

      {/* Zen Mode Exit Floating Trigger */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="absolute top-4 right-4 z-30 bg-slate-900/90 hover:bg-slate-950 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xl transition-all cursor-pointer border border-slate-700 hover:scale-105"
        >
          <Minimize2 className="w-4 h-4 text-amber-400" />
          <span>Avsluta Zen Mode</span>
        </button>
      )}

      {/* Snapshot copied toast */}
      {copiedNotification && (
        <div className="absolute top-16 right-4 z-30 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce">
          <Check className="w-3.5 h-3.5" />
          <span>Snapshot sparad till Box och Manual!</span>
        </div>
      )}

      {/* Snap Point Success Toast */}
      {snapSuccessToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{snapSuccessToast}</span>
        </div>
      )}

      {/* Hovered Snap Anchor Tooltip */}
      {hoveredSnapAnchor && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 text-emerald-400 text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl border border-emerald-500/50 shadow-lg pointer-events-none flex items-center gap-2 backdrop-blur-sm">
          <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Snap Point: {hoveredSnapAnchor.name} (Klicka för att montera {hoveredSnapAnchor.defaultPieceName})</span>
        </div>
      )}

      {/* Center Floating Controls: ASSEMBLE / DISASSEMBLE & Camera Views */}
      {!isZenMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto">
          {/* Main Assemble / Disassemble Action Bar */}
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-xl">
            <button
              onClick={handleAssemble}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                !isDisassembled
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-300" />
              <span>Assemble</span>
            </button>

            <button
              onClick={handleDisassemble}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                isDisassembled
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Grid className="w-4 h-4 text-amber-400" />
              <span>Disassemble</span>
            </button>
          </div>

          {/* Camera Views & Snap Mode Bar */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-md">
            <button
              onClick={() => setCameraView('isometric')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Iso
            </button>
            <button
              onClick={() => setCameraView('side')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Sida
            </button>
            <button
              onClick={() => setCameraView('top')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Ovan
            </button>
            <button
              onClick={() => setCameraView('cockpit')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Cockpit
            </button>
            <button
              onClick={() => setCameraView('rear')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Bakdel
            </button>

            <span className="w-px h-4 bg-slate-200 mx-0.5" />

            <button
              onClick={() => setIsSnapMode(!isSnapMode)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                isSnapMode
                  ? 'bg-emerald-100 text-emerald-800 font-black ring-1 ring-emerald-500 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
              title="Visa gröna monteringspunkter (Snap Points) för nya bitar"
            >
              <Target className={`w-3.5 h-3.5 ${isSnapMode ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} />
              <span>Snap Points</span>
            </button>

            <button
              onClick={handleDownloadLDrawFile}
              className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
              title="Ladda ner 275-bitars LDraw MPD-modell"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exportera .LDR</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating PART INSPECTOR Card on the Bottom Right (matching image.png) */}
      {!isZenMode && showViewerPill && (
        <div className="absolute bottom-4 right-4 w-72 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl pointer-events-auto z-20 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-amber-500" />
              Part Inspector
            </span>
            <button
              onClick={() => setShowViewerPill(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Minimera Inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Tabs matching image.png */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold text-slate-600">
            {(['Plates', 'Special', 'Aero'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setInspectorFilterTab(tab)}
                className={`py-1 rounded-lg text-center cursor-pointer transition-colors ${
                  inspectorFilterTab === tab ? 'bg-white text-slate-900 shadow-2xs font-black' : 'hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Piece Specific Identifiers */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold">LDraw ID:</span>
              <span className="font-bold text-slate-900">
                #{activeInstance?.designId || selectedPieceInfo.designId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Element / Art.Nr:</span>
              <span className="font-bold text-emerald-700">
                #{activeInstance?.elementId || selectedPieceInfo.elementId}
              </span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Namn:</span>
              <span className="font-sans font-bold text-slate-800 text-[11px] truncate max-w-[150px]">
                {activeInstance?.pieceName || selectedPieceInfo.name}
              </span>
            </div>
          </div>

          {/* Part Swap Action Button */}
          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Part Swap</span>
          </button>

          {/* Color Swatches */}
          {activeInstance && (
            <div className="pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1.5">
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3 text-amber-500" />
                  Klossfärg:
                </span>
                {customBrickColors?.[activeInstance.id] && (
                  <button
                    onClick={() => handlePaintIndividualBrick(activeInstance.id, colors[activeInstance.partKey])}
                    className="text-[9px] text-amber-700 hover:underline cursor-pointer"
                  >
                    Återställ
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {LEGO_COLORS.slice(0, 10).map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handlePaintIndividualBrick(activeInstance.id, col.hex)}
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                    style={{ backgroundColor: col.hex }}
                    title={`Måla denna kloss ${col.name}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Part Swap Modal */}
      {isSwapModalOpen && activeInstance && (
        <ModularPartSwapModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          instance={activeInstance}
          onSelectPartSwap={handleExecutePartSwap}
          currentColorHex={customBrickColors?.[activeInstance.id] || activeInstance.colorHex}
          onUpdateColor={(hex) => handlePaintIndividualBrick(activeInstance.id, hex)}
        />
      )}

      {/* Official Brickset CSV Inventory Modal */}
      {isBricksetModalOpen && (
        <BricksetInventoryModal
          isOpen={isBricksetModalOpen}
          onClose={() => setIsBricksetModalOpen(false)}
          currentSet={currentSet}
        />
      )}

      {/* LDraw Parser & Official LDR Ingestion Modal */}
      {isLdrModalOpen && (
        <LdrIngestionModal
          isOpen={isLdrModalOpen}
          onClose={() => setIsLdrModalOpen(false)}
          currentSet={currentSet}
          colors={colors}
          activeLdrContent={activeMpdContent || (currentSet.articleNumber === '77242' ? OFFICIAL_77242_LDR : '')}
          onApplyLdrContent={(newContent) => {
            setCustomLdrContent(newContent);
            setResetKey((k) => k + 1);
          }}
          diagnostics={ldrDiagnostics}
        />
      )}

      {/* Master Blueprint Ingestion Pipeline Modal */}
      {isBlueprintModalOpen && (
        <BlueprintPipelineModal
          isOpen={isBlueprintModalOpen}
          onClose={() => setIsBlueprintModalOpen(false)}
          currentSet={currentSet}
          colors={colors}
          selectedStage={selectedStage}
          onSelectStage={(stage) => setSelectedStage(stage)}
          onLoadModelLdr={(ldr) => {
            setCustomLdrContent(ldr);
            setResetKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};
