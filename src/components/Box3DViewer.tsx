import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, Eye, Camera, Check } from 'lucide-react';

interface Box3DViewerProps {
  frontCanvas: HTMLCanvasElement | null;
  backCanvas: HTMLCanvasElement | null;
  topCanvas: HTMLCanvasElement | null;
  bottomCanvas: HTMLCanvasElement | null;
  leftCanvas: HTMLCanvasElement | null; // side flap / driver
  rightCanvas: HTMLCanvasElement | null; // spine / ribbon
  modelName: string;
  setNumber: string;
}

export const Box3DViewer: React.FC<Box3DViewerProps> = ({
  frontCanvas,
  backCanvas,
  topCanvas,
  bottomCanvas,
  leftCanvas,
  rightCanvas,
  modelName,
  setNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [copied, setCopied] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boxMeshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Setup Three.js scene for 3D Box
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0f172a'); // studio dark gradient tone

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.2, 2.6, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Studio Lighting for glossy retail packaging
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(6, 8, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 1.0);
    dirLight2.position.set(-6, -2, -5);
    scene.add(dirLight2);

    // Rim highlight light for box edges
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.6);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // Ground plane with shadow receiver
    const shadowPlaneGeo = new THREE.PlaneGeometry(14, 14);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.35;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Reflective pedestal ring
    const ringGeo = new THREE.RingGeometry(2.6, 2.8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.34;
    scene.add(ring);

    // Box Geometry: Standard Speed Champions box proportions
    // width: 3.6, height: 2.3, depth: 0.9
    const boxGeo = new THREE.BoxGeometry(3.6, 2.3, 0.9);

    // Default glossy cardboard material template
    const createMaterial = (texture?: THREE.Texture | null) => {
      return new THREE.MeshPhysicalMaterial({
        map: texture || null,
        color: texture ? 0xffffff : 0x1e293b,
        roughness: 0.18,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.5,
      });
    };

    // Six materials for BoxGeometry:
    // 0: Right (+X) -> Spine
    // 1: Left (-X) -> Side Flap (Driver)
    // 2: Top (+Y) -> Top Flap
    // 3: Bottom (-Y) -> Bottom Flap (Barcode)
    // 4: Front (+Z) -> Front Panel
    // 5: Back (-Z) -> Back Panel
    const materials = [
      createMaterial(), // Right (+X)
      createMaterial(), // Left (-X)
      createMaterial(), // Top (+Y)
      createMaterial(), // Bottom (-Y)
      createMaterial(), // Front (+Z)
      createMaterial(), // Back (-Z)
    ];

    const boxMesh = new THREE.Mesh(boxGeo, materials);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);
    boxMeshRef.current = boxMesh;

    // Animation Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (isAutoRotate && boxMeshRef.current) {
        boxMeshRef.current.rotation.y += 0.006;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 700;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
    };
  }, []);

  // Update box face textures when canvases change
  useEffect(() => {
    const boxMesh = boxMeshRef.current;
    if (!boxMesh) return;

    const updateFace = (index: number, sourceCanvas: HTMLCanvasElement | null) => {
      if (!sourceCanvas) return;
      const texture = new THREE.CanvasTexture(sourceCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;

      const mat = (boxMesh.material as THREE.MeshPhysicalMaterial[])[index];
      if (mat) {
        if (mat.map) mat.map.dispose();
        mat.map = texture;
        mat.needsUpdate = true;
      }
    };

    // 0: Right (Spine)
    updateFace(0, rightCanvas);
    // 1: Left (Side Flap)
    updateFace(1, leftCanvas);
    // 2: Top (Top Flap)
    updateFace(2, topCanvas);
    // 3: Bottom (Bottom Flap)
    updateFace(3, bottomCanvas);
    // 4: Front (Front Panel)
    updateFace(4, frontCanvas);
    // 5: Back (Back Panel)
    updateFace(5, backCanvas);
  }, [frontCanvas, backCanvas, topCanvas, bottomCanvas, leftCanvas, rightCanvas]);

  const handleResetCamera = (view: 'iso' | 'front' | 'back' | 'top') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const box = boxMeshRef.current;
    if (!camera || !controls) return;

    setIsAutoRotate(false);
    if (box) box.rotation.set(0, 0, 0);

    if (view === 'iso') {
      camera.position.set(4.2, 2.6, 5.2);
    } else if (view === 'front') {
      camera.position.set(0, 0, 5.5);
    } else if (view === 'back') {
      camera.position.set(0, 0, -5.5);
    } else if (view === 'top') {
      camera.position.set(0, 5.5, 0.01);
    }
    controls.target.set(0, 0, 0);
    controls.update();
  };

  const handleSnap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const link = document.createElement('a');
    link.download = `lego-box-3d-${setNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950" ref={containerRef}>
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Left Status Badge */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            3D FOLDED BOX • CLEARCOAT
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-xs font-mono text-slate-300">SET {setNumber}</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium px-1">
          Drag to rotate 360° • High-gloss retail packaging with cardboard thickness
        </span>
      </div>

      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
            isAutoRotate
              ? 'bg-amber-400 text-slate-950 shadow-amber-500/20'
              : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700'
          }`}
          title="Toggle Auto Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
          <span>{isAutoRotate ? 'Rotating' : 'Spin 360°'}</span>
        </button>

        <button
          onClick={handleSnap}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          title="Snap 3D Box Render"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Captured!</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Snap Box</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Camera View Angle Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl z-10">
        <button
          onClick={() => handleResetCamera('iso')}
          className="px-3 py-1 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          3/4 Isometric
        </button>
        <button
          onClick={() => handleResetCamera('front')}
          className="px-3 py-1 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          Front Face
        </button>
        <button
          onClick={() => handleResetCamera('back')}
          className="px-3 py-1 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          Back Features
        </button>
        <button
          onClick={() => handleResetCamera('top')}
          className="px-3 py-1 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          Top Flap
        </button>
      </div>
    </div>
  );
};
