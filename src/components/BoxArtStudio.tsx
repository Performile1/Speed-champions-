import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LegoF1Set, CarPartColors, CarDecals } from '../types';
import { Download, Sparkles, Box, Check, Printer, Layers, Scissors, ShieldAlert, Sliders, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateUnfoldedBoxPdf } from '../utils/pdfGenerator';
import { Box3DViewer } from './Box3DViewer';

// 9 Comprehensive Packaging Background Themes across Road, Carbon, and Speed Gradients
export interface BoxBackground {
  id: string;
  name: string;
  category: 'road' | 'carbon' | 'gradient';
  categoryLabel: string;
  previewBg: string;
  panelClass: string;
}

export const BOX_BACKGROUNDS: Record<string, BoxBackground> = {
  // 1. RACING ASFALT & VÄG-MÖNSTER (ROAD & TRACK)
  ASPHALT_SKID: {
    id: 'asphalt-skid',
    name: 'Circuit Asphalt & Skid Marks',
    category: 'road',
    categoryLabel: 'Road & Track',
    previewBg: 'bg-stone-900 border-b-4 border-red-600',
    panelClass: 'bg-stone-950 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px]',
  },
  CURBS_APEX: {
    id: 'curbs-apex',
    name: 'Apex Curbs (Red & White)',
    category: 'road',
    categoryLabel: 'Road & Track',
    previewBg: 'bg-neutral-900 border-b-4 border-dashed border-red-600',
    panelClass: 'bg-neutral-950',
  },
  FINISH_LINE: {
    id: 'finish-line',
    name: 'Chequered Flag Finish',
    category: 'road',
    categoryLabel: 'Road & Track',
    previewBg: 'bg-zinc-900 border-b-4 border-amber-400',
    panelClass: 'bg-zinc-950',
  },

  // 2. CARBON FIBER & TECHNICAL COMPOSITES
  CARBON_TWILL: {
    id: 'carbon-twill',
    name: 'Twill Carbon Fiber 3D',
    category: 'carbon',
    categoryLabel: 'Carbon & Tech',
    previewBg: 'bg-slate-900 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:8px_8px]',
    panelClass: 'bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:10px_10px]',
  },
  CARBON_FORGED: {
    id: 'carbon-forged',
    name: 'Forged Carbon Composite',
    category: 'carbon',
    categoryLabel: 'Carbon & Tech',
    previewBg: 'bg-zinc-900 bg-[radial-gradient(#3f3f46_1.5px,transparent_1.5px)] [background-size:14px_14px]',
    panelClass: 'bg-zinc-950 bg-[radial-gradient(#27272a_1.5px,transparent_1.5px)] [background-size:14px_14px]',
  },
  CARBON_HONEYCOMB: {
    id: 'carbon-honeycomb',
    name: 'Honeycomb Composite Mesh',
    category: 'carbon',
    categoryLabel: 'Carbon & Tech',
    previewBg: 'bg-slate-950 border border-slate-700',
    panelClass: 'bg-slate-950 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px]',
  },

  // 3. FART- & PRESTATIONS-GRADIENTER (SPEED GRADIENTS)
  SPEED_NEON: {
    id: 'speed-neon',
    name: 'Speed Lines & Neon Gradient',
    category: 'gradient',
    categoryLabel: 'Speed Gradients',
    previewBg: 'bg-gradient-to-r from-red-600 via-indigo-900 to-sky-600',
    panelClass: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950',
  },
  SUNSET_CIRCUIT: {
    id: 'sunset-circuit',
    name: 'F1 Sunset Circuit Gradient',
    category: 'gradient',
    categoryLabel: 'Speed Gradients',
    previewBg: 'bg-gradient-to-r from-orange-600 via-red-700 to-slate-950',
    panelClass: 'bg-gradient-to-r from-orange-950/60 via-red-950/70 to-slate-950',
  },
  MONOCHROME_RACING: {
    id: 'monochrome-racing',
    name: 'Monochrome Graphite Racing',
    category: 'gradient',
    categoryLabel: 'Speed Gradients',
    previewBg: 'bg-gradient-to-r from-zinc-800 via-zinc-900 to-black',
    panelClass: 'bg-gradient-to-r from-zinc-900 via-zinc-950 to-black',
  },
};

interface BoxArtStudioProps {
  set: LegoF1Set;
  colors: CarPartColors;
  decals: CarDecals;
  snapshotUrl?: string;
  sideSnapshotUrl?: string;
  customBoxTitle?: string;
  customBoxSubtitle?: string;
  onRefreshSnapshot?: () => void;
  totalPieceCount?: number;
}

export const BoxArtStudio: React.FC<BoxArtStudioProps> = ({
  set,
  colors,
  decals,
  snapshotUrl,
  sideSnapshotUrl,
  customBoxTitle,
  customBoxSubtitle,
  totalPieceCount,
}) => {
  const [boxDisplayMode, setBoxDisplayMode] = useState<'unfolded-box' | '3d-box' | 'flat-cover'>('unfolded-box');
  const [selectedBgKey, setSelectedBgKey] = useState<string>('ASPHALT_SKID');
  const [showSkarlinjer, setShowSkarlinjer] = useState<boolean>(true);
  const [driverNumber, setDriverNumber] = useState<string>(decals.racingNumber || '16');
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [customTitle, setCustomTitle] = useState(customBoxTitle || set.name);
  const [customSubtitle, setCustomSubtitle] = useState(customBoxSubtitle || set.team);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'road' | 'carbon' | 'gradient'>('all');

  const selectedBg = BOX_BACKGROUNDS[selectedBgKey] || BOX_BACKGROUNDS.ASPHALT_SKID;

  // Set Specs
  const setNumberDisplay = set.articleNumber.startsWith('#') ? set.articleNumber : `#${set.articleNumber}`;
  const pieceCountDisplay = `${totalPieceCount || set.pieceCount} pcs/pzs`;
  const ageDisplay = set.era === 'classic-6-wide' ? '8+' : '10+';

  // 3D Texture Canvases for the 6 faces of the 3D Box in Three.js
  const [frontCanvas, setFrontCanvas] = useState<HTMLCanvasElement | null>(null);
  const [backCanvas, setBackCanvas] = useState<HTMLCanvasElement | null>(null);
  const [topCanvas, setTopCanvas] = useState<HTMLCanvasElement | null>(null);
  const [bottomCanvas, setBottomCanvas] = useState<HTMLCanvasElement | null>(null);
  const [leftCanvas, setLeftCanvas] = useState<HTMLCanvasElement | null>(null);
  const [rightCanvas, setRightCanvas] = useState<HTMLCanvasElement | null>(null);

  // Generate 2D Canvases for Three.js 3D Box Texture Mapping
  useEffect(() => {
    // 1. Front Canvas (800x500)
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 800;
    fCanvas.height = 500;
    const fCtx = fCanvas.getContext('2d');
    if (fCtx) {
      // Background
      fCtx.fillStyle = '#090d16';
      fCtx.fillRect(0, 0, 800, 500);

      // Speed Trails
      const gradL = fCtx.createLinearGradient(0, 250, 800, 250);
      gradL.addColorStop(0, '#dc2626');
      gradL.addColorStop(0.5, '#4f46e5');
      gradL.addColorStop(1, '#0284c7');
      fCtx.strokeStyle = gradL;
      fCtx.lineWidth = 14;
      fCtx.beginPath();
      fCtx.moveTo(0, 310);
      fCtx.bezierCurveTo(240, 290, 520, 270, 800, 240);
      fCtx.stroke();

      // LEGO Red Box
      fCtx.fillStyle = '#dc2626';
      fCtx.fillRect(36, 32, 70, 70);
      fCtx.strokeStyle = '#ffffff';
      fCtx.lineWidth = 4;
      fCtx.strokeRect(36, 32, 70, 70);
      fCtx.fillStyle = '#fde047';
      fCtx.font = 'bold 36px sans-serif';
      fCtx.textAlign = 'center';
      fCtx.fillText('LEGO', 71, 80);

      // Speed Champions
      fCtx.fillStyle = '#facc15';
      fCtx.font = 'italic 900 32px sans-serif';
      fCtx.textAlign = 'left';
      fCtx.fillText('SPEED CHAMPIONS', 120, 64);
      fCtx.fillStyle = '#cbd5e1';
      fCtx.font = 'bold 16px sans-serif';
      fCtx.fillText('FORMULA 1®', 122, 90);

      // Set # & Pieces
      fCtx.fillStyle = '#fbbf24';
      fCtx.font = 'bold 28px monospace';
      fCtx.textAlign = 'right';
      fCtx.fillText(setNumberDisplay, 764, 60);
      fCtx.fillStyle = '#94a3b8';
      fCtx.font = '16px sans-serif';
      fCtx.fillText(pieceCountDisplay, 764, 88);

      // Model Name & Age
      fCtx.fillStyle = '#ffffff';
      fCtx.font = 'bold 22px sans-serif';
      fCtx.textAlign = 'left';
      fCtx.fillText(customTitle, 40, 460);

      fCtx.fillStyle = '#dc2626';
      fCtx.fillRect(720, 436, 44, 28);
      fCtx.fillStyle = '#ffffff';
      fCtx.font = 'bold 16px sans-serif';
      fCtx.textAlign = 'center';
      fCtx.fillText(ageDisplay, 742, 456);

      // If Snapshot is available, draw on front
      if (snapshotUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          fCtx.drawImage(img, 120, 110, 560, 320);
          setFrontCanvas(fCanvas);
        };
        img.src = snapshotUrl;
      } else {
        setFrontCanvas(fCanvas);
      }
    }

    // 2. Back Canvas (800x500)
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 800;
    bCanvas.height = 500;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#0a0a0f';
      bCtx.fillRect(0, 0, 800, 500);

      // Carbon pattern
      bCtx.fillStyle = '#171722';
      for (let x = 0; x < 800; x += 16) {
        for (let y = 0; y < 500; y += 16) {
          bCtx.fillRect(x, y, 8, 8);
        }
      }

      bCtx.fillStyle = '#fbbf24';
      bCtx.font = 'bold 24px sans-serif';
      bCtx.textAlign = 'left';
      bCtx.fillText('ACTION & LEKFUNKTIONER', 40, 50);

      bCtx.fillStyle = '#94a3b8';
      bCtx.font = 'bold 18px monospace';
      bCtx.textAlign = 'right';
      bCtx.fillText(setNumberDisplay, 760, 50);

      // Feature boxes
      const features = [
        ['Avtagbar Halo-Båge', 'Enkel åtkomst för minifigurförare'],
        ['Justerbar DRS Bakvinge', 'Vinklingsbar för lågt luftmotstånd'],
        ['18-Tums Aeronavkapslar', 'Snabbt däckbyte med Technic-axlar'],
        ['Venturi Markeffektsgolv', 'Skulpterade aerodynamiska tunnlar'],
      ];

      features.forEach((feat, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = 40 + col * 370;
        const by = 80 + row * 160;
        bCtx.fillStyle = 'rgba(255,255,255,0.06)';
        bCtx.fillRect(bx, by, 350, 130);
        bCtx.strokeStyle = 'rgba(255,255,255,0.12)';
        bCtx.lineWidth = 2;
        bCtx.strokeRect(bx, by, 350, 130);

        bCtx.fillStyle = '#ffffff';
        bCtx.font = 'bold 20px sans-serif';
        bCtx.textAlign = 'left';
        bCtx.fillText(feat[0], bx + 20, by + 45);

        bCtx.fillStyle = '#94a3b8';
        bCtx.font = '16px sans-serif';
        bCtx.fillText(feat[1], bx + 20, by + 85);
      });

      bCtx.fillStyle = '#64748b';
      bCtx.font = '12px monospace';
      bCtx.fillText('©2025 THE LEGO GROUP • OFFICIAL LICENSED F1 PRODUCT', 40, 465);
      setBackCanvas(bCanvas);
    }

    // 3. Top Canvas (800x200)
    const tCanvas = document.createElement('canvas');
    tCanvas.width = 800;
    tCanvas.height = 200;
    const tCtx = tCanvas.getContext('2d');
    if (tCtx) {
      tCtx.fillStyle = '#0f172a';
      tCtx.fillRect(0, 0, 800, 200);

      tCtx.fillStyle = '#dc2626';
      tCtx.fillRect(40, 40, 50, 50);
      tCtx.fillStyle = '#fde047';
      tCtx.font = 'bold 26px sans-serif';
      tCtx.textAlign = 'center';
      tCtx.fillText('LEGO', 65, 75);

      tCtx.fillStyle = '#ffffff';
      tCtx.font = 'italic bold 28px sans-serif';
      tCtx.textAlign = 'left';
      tCtx.fillText('SPEED CHAMPIONS', 105, 75);

      tCtx.strokeStyle = 'rgba(255,255,255,0.25)';
      tCtx.strokeRect(580, 35, 180, 50);
      tCtx.fillStyle = '#cbd5e1';
      tCtx.font = 'bold 13px monospace';
      tCtx.textAlign = 'center';
      tCtx.fillText('1:1 ACTUAL SIZE', 670, 58);
      tCtx.font = '10px monospace';
      tCtx.fillStyle = '#94a3b8';
      tCtx.fillText('20 cm / 8 in • SKALA', 670, 74);

      if (sideSnapshotUrl) {
        const sideImg = new Image();
        sideImg.crossOrigin = 'anonymous';
        sideImg.onload = () => {
          tCtx.drawImage(sideImg, 320, 25, 230, 150);
          setTopCanvas(tCanvas);
        };
        sideImg.src = sideSnapshotUrl;
      } else {
        setTopCanvas(tCanvas);
      }
    }

    // 4. Bottom Canvas (800x200)
    const botCanvas = document.createElement('canvas');
    botCanvas.width = 800;
    botCanvas.height = 200;
    const botCtx = botCanvas.getContext('2d');
    if (botCtx) {
      botCtx.fillStyle = '#f1f5f9';
      botCtx.fillRect(0, 0, 800, 200);

      botCtx.strokeStyle = '#dc2626';
      botCtx.lineWidth = 4;
      botCtx.beginPath();
      botCtx.arc(70, 100, 30, 0, Math.PI * 2);
      botCtx.stroke();
      botCtx.fillStyle = '#dc2626';
      botCtx.font = 'bold 24px sans-serif';
      botCtx.textAlign = 'center';
      botCtx.fillText('0-3', 70, 108);

      botCtx.fillStyle = '#334155';
      botCtx.font = 'bold 16px sans-serif';
      botCtx.textAlign = 'left';
      botCtx.fillText('VARNING: KVÄVNINGSRISK - Små delar.', 120, 95);
      botCtx.font = '12px monospace';
      botCtx.fillStyle = '#64748b';
      botCtx.fillText('Tillverkad av LEGO Koncernen, Billund, Danmark.', 120, 120);

      // Barcode
      botCtx.fillStyle = '#0f172a';
      botCtx.fillRect(600, 60, 150, 70);
      botCtx.fillStyle = '#ffffff';
      botCtx.font = 'bold 14px monospace';
      botCtx.textAlign = 'center';
      botCtx.fillText('5702017772421', 675, 100);

      setBottomCanvas(botCanvas);
    }

    // 5. Left Canvas (Side Flap: 200x500)
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 200;
    lCanvas.height = 500;
    const lCtx = lCanvas.getContext('2d');
    if (lCtx) {
      lCtx.fillStyle = '#090d16';
      lCtx.fillRect(0, 0, 200, 500);

      lCtx.fillStyle = '#fbbf24';
      lCtx.font = 'bold 22px monospace';
      lCtx.textAlign = 'center';
      lCtx.fillText(setNumberDisplay, 100, 60);

      lCtx.fillStyle = '#cbd5e1';
      lCtx.font = 'bold 16px sans-serif';
      lCtx.fillText(customSubtitle, 100, 90);

      // Driver circle
      lCtx.strokeStyle = '#facc15';
      lCtx.lineWidth = 4;
      lCtx.beginPath();
      lCtx.arc(100, 240, 50, 0, Math.PI * 2);
      lCtx.stroke();
      lCtx.fillStyle = '#facc15';
      lCtx.font = 'bold 36px sans-serif';
      lCtx.fillText(`#${driverNumber}`, 100, 252);

      lCtx.fillStyle = '#94a3b8';
      lCtx.font = '14px sans-serif';
      lCtx.fillText('Förare Minifigur', 100, 320);

      lCtx.font = 'bold 12px monospace';
      lCtx.fillText('8-STUDS BREDD', 100, 440);
      setLeftCanvas(lCanvas);
    }

    // 6. Right Canvas (Spine / Ribbon: 200x500)
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 200;
    rCanvas.height = 500;
    const rCtx = rCanvas.getContext('2d');
    if (rCtx) {
      rCtx.fillStyle = '#0f172a';
      rCtx.fillRect(0, 0, 200, 500);

      rCtx.fillStyle = '#dc2626';
      rCtx.font = 'italic 900 36px sans-serif';
      rCtx.textAlign = 'center';
      rCtx.fillText('F1®', 100, 70);

      rCtx.fillStyle = '#94a3b8';
      rCtx.font = 'bold 12px monospace';
      rCtx.fillText('OFFICIAL PRODUCT', 100, 100);

      // 360 wireframe text
      rCtx.save();
      rCtx.translate(100, 250);
      rCtx.rotate(Math.PI / 2);
      rCtx.fillStyle = '#cbd5e1';
      rCtx.font = 'bold 16px monospace';
      rCtx.fillText('SPEED CHAMPIONS™ 2025', 0, 0);
      rCtx.restore();

      rCtx.fillStyle = '#64748b';
      rCtx.font = 'bold 12px monospace';
      rCtx.fillText('V6 TURBO-HYBRID', 100, 440);
      setRightCanvas(rCanvas);
    }
  }, [set, colors, decals, snapshotUrl, customTitle, customSubtitle, driverNumber, setNumberDisplay, pieceCountDisplay, ageDisplay]);

  const handleCelebrate = () => {
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const handlePrint = () => {
    handleCelebrate();
    window.print();
  };

  const handleDownloadUnfoldedBoxPdf = () => {
    handleCelebrate();
    setDownloadingPdf(true);
    try {
      generateUnfoldedBoxPdf(
        set,
        colors,
        decals,
        customTitle,
        customSubtitle,
        snapshotUrl
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 1200);
    }
  };

  // High-Resolution 300 DPI Box Art Download
  const handleDownloadBoxArt = () => {
    handleCelebrate();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient matching selected theme
    const grad = ctx.createLinearGradient(0, 0, 1920, 1200);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.3, '#1e293b');
    grad.addColorStop(0.7, '#090d16');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1200);

    // Neon Speed Flare
    const speedGrad = ctx.createLinearGradient(0, 600, 1920, 600);
    speedGrad.addColorStop(0, 'rgba(220, 38, 38, 0.8)');
    speedGrad.addColorStop(0.5, 'rgba(79, 70, 229, 0.6)');
    speedGrad.addColorStop(1, 'rgba(2, 132, 199, 0.8)');
    ctx.strokeStyle = speedGrad;
    ctx.lineWidth = 32;
    ctx.beginPath();
    ctx.moveTo(0, 780);
    ctx.bezierCurveTo(600, 740, 1200, 680, 1920, 620);
    ctx.stroke();

    // Official LEGO Logo
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(80, 70, 160, 160);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(80, 70, 160, 160);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 78px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LEGO', 160, 180);

    // SPEED CHAMPIONS Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic black 74px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPEED CHAMPIONS', 960, 140);

    // Official F1 Logo
    ctx.fillStyle = '#dc2626';
    ctx.font = 'italic 900 80px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('F1®', 1840, 150);

    // Left Details
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 84px sans-serif';
    ctx.fillText(ageDisplay, 90, 420);
    ctx.font = 'bold 84px sans-serif';
    ctx.fillText(setNumberDisplay, 90, 520);
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(customTitle, 90, 600);
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText(pieceCountDisplay, 90, 680);

    const finishDownload = () => {
      const link = document.createElement('a');
      link.download = `lego-${set.articleNumber}-speed-champions-box.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    if (snapshotUrl) {
      const carImg = new Image();
      carImg.crossOrigin = 'anonymous';
      carImg.onload = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(1150, 820, 520, 120, -0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(carImg, 560, 320, 1180, 680);
        finishDownload();
      };
      carImg.onerror = finishDownload;
      carImg.src = snapshotUrl;
    } else {
      finishDownload();
    }
  };

  const filteredThemes = useMemo(() => {
    const list = Object.entries(BOX_BACKGROUNDS);
    if (categoryFilter === 'all') return list;
    return list.filter(([_, bg]) => bg.category === categoryFilter);
  }, [categoryFilter]);

  return (
    <div className="flex flex-col gap-6 bg-white border border-slate-200 rounded-3xl p-5 lg:p-7 shadow-xs">
      {/* 1. Header & Packaging Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 border border-amber-500 flex items-center justify-center text-slate-950 font-black shadow-xs">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <span>LEGO SPEED CHAMPIONS PACKAGING STUDIO</span>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                  F1® 2025 DIE-CUT
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Design your official LEGO retail box with authentic carbon composites, race track asphalt, curbs, and speed gradients.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Tabs: Unfolded Box (Die-Cut) vs 3D Box vs Flat Cover */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setBoxDisplayMode('unfolded-box')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                boxDisplayMode === 'unfolded-box'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Utvikt Stansmönster (Die-Cut)</span>
            </button>
            <button
              onClick={() => setBoxDisplayMode('3d-box')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                boxDisplayMode === '3d-box'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Roterbar Box (Three.js)</span>
            </button>
            <button
              onClick={() => setBoxDisplayMode('flat-cover')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                boxDisplayMode === 'flat-cover'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Framsida Butik</span>
            </button>
          </div>

          <button
            onClick={handleDownloadUnfoldedBoxPdf}
            disabled={downloadingPdf}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Ladda ner tryckklar PDF med skärmärken"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{downloadingPdf ? 'Skapar PDF...' : 'Ladda ner PDF'}</span>
          </button>

          <button
            onClick={handleDownloadBoxArt}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Exportera 300 DPI PNG Box Art"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-800" />
                <span>Exporterad!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spara PNG</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Skriv ut box"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. THEME & PACKAGING CUSTOMIZATION CONTROLS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Välj Box Bakgrundstema:
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {(['all', 'road', 'carbon', 'gradient'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat === 'all'
                  ? 'Alla teman (9)'
                  : cat === 'road'
                  ? 'Asfalt & Väg (3)'
                  : cat === 'carbon'
                  ? 'Kolfiber (3)'
                  : 'Fartlinjer (3)'}
              </button>
            ))}
          </div>

          {/* Skärlinjer Checkbox */}
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={showSkarlinjer}
              onChange={(e) => setShowSkarlinjer(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-red-600" />
              Visa Skärlinjer (Die-Cut Template)
            </span>
          </label>
        </div>

        {/* Background Grid Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {filteredThemes.map(([key, bg]) => (
            <button
              key={key}
              onClick={() => setSelectedBgKey(key)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedBgKey === key
                  ? 'border-red-600 ring-2 ring-red-500/30 bg-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              <div className={`h-8 rounded-lg mb-2 ${bg.previewBg} shadow-inner`} />
              <div className="text-xs font-bold text-slate-900 leading-tight truncate">{bg.name}</div>
              <div className="text-[10px] text-slate-400 font-medium">{bg.categoryLabel}</div>
            </button>
          ))}
        </div>

        {/* Set & Driver Tuning Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Set Titel / Modellnamn</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Team / Undertitel</label>
            <input
              type="text"
              value={customSubtitle}
              onChange={(e) => setCustomSubtitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Förare Minifigur Startnummer</label>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-500 text-sm">#</span>
              <input
                type="text"
                maxLength={3}
                value={driverNumber}
                onChange={(e) => setDriverNumber(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Visas på sidoflik & nos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DISPLAY VIEWPORT */}
      {boxDisplayMode === '3d-box' ? (
        /* 3D INTERACTIVE THREE.JS BOX VIEWER */
        <div className="space-y-2">
          <Box3DViewer
            frontCanvas={frontCanvas}
            backCanvas={backCanvas}
            topCanvas={topCanvas}
            bottomCanvas={bottomCanvas}
            leftCanvas={leftCanvas}
            rightCanvas={rightCanvas}
            modelName={customTitle}
            setNumber={setNumberDisplay}
          />
          <div className="text-center text-xs text-slate-500 font-medium">
            💡 Klicka på <span className="font-bold text-slate-700">"Utvikt Stansmönster (Die-Cut)"</span> ovan för att se de officiella skärlinjerna och alla utvikta kartongflikar!
          </div>
        </div>
      ) : boxDisplayMode === 'unfolded-box' ? (
        /* UTVIKT KARTONG-TEMPLATE (DIE-CUT VIEW) MATCHING EXACT USER SCREENSHOT */
        <div className="overflow-x-auto p-4 sm:p-6 bg-slate-200/90 rounded-2xl border border-slate-300 shadow-inner">
          <div className={`relative min-w-[960px] max-w-[1040px] mx-auto transition-all ${showSkarlinjer ? 'p-2' : ''}`}>
            
            {/* ======================================================== */}
            {/* 1. TOP FLAP */}
            {/* ======================================================== */}
            <div
              className={`w-[460px] ml-[150px] h-24 mb-1 rounded-t-xl relative text-white p-3.5 flex justify-between items-center ${selectedBg.panelClass} ${
                showSkarlinjer ? 'border-2 border-dashed border-red-500/80' : 'border border-slate-800'
              } shadow-md overflow-hidden`}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white font-black px-2 py-0.5 text-xs rounded tracking-wider shadow-xs">
                    LEGO
                  </span>
                  <span className="font-extrabold italic text-xs tracking-widest text-yellow-400">
                    SPEED CHAMPIONS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">SET {setNumberDisplay}</p>
              </div>

              {/* Center Car Wireframe Silhouette / 1:1 Side Elevation */}
              {sideSnapshotUrl ? (
                <div className="flex flex-col items-center">
                  <div className="text-[9px] font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1 mb-0.5">
                    <span>|◄</span>
                    <span className="border-b border-amber-400/60 px-3">1:1 ACTUAL SIZE • 20 cm</span>
                    <span>►|</span>
                  </div>
                  <img
                    src={sideSnapshotUrl}
                    alt="1:1 Actual Size Side Profile"
                    className="h-14 object-contain filter drop-shadow-md"
                  />
                </div>
              ) : (
                <div className="hidden sm:flex flex-col items-center opacity-60">
                  <svg className="w-24 h-12 stroke-white fill-none" viewBox="0 0 100 40">
                    <path d="M 5 25 L 20 25 L 30 15 L 60 15 L 75 25 L 95 25 L 90 28 L 10 28 Z" strokeWidth="1.5" />
                    <circle cx="22" cy="28" r="6" strokeWidth="1.5" />
                    <circle cx="78" cy="28" r="6" strokeWidth="1.5" />
                  </svg>
                </div>
              )}

              <div className="text-right">
                <span className="border border-white/30 px-2 py-1 text-[10px] font-mono rounded bg-black/40 backdrop-blur-xs text-amber-300 font-bold">
                  1:1 SKALA • ACTUAL SIZE
                </span>
                <p className="text-xs font-bold mt-1 text-slate-300">{customSubtitle}</p>
              </div>

              {showSkarlinjer && (
                <span className="absolute top-1 left-2 text-[9px] text-red-400 font-mono font-bold">
                  SKÄRLINJE (TOP FLAP)
                </span>
              )}
            </div>

            {/* ======================================================== */}
            {/* 2. MAIN MIDDLE ROW (Side Flap, Front Panel, Spine, Back Panel, Glue Tab) */}
            {/* ======================================================== */}
            <div className="flex gap-1 h-72 shadow-lg">
              
              {/* A. SIDE FLAP (Driver Info & 8-Studs Width) */}
              <div
                className={`w-38 rounded-l-xl p-3.5 text-white flex flex-col justify-between relative overflow-hidden ${selectedBg.panelClass} ${
                  showSkarlinjer ? 'border-2 border-dashed border-red-500/80' : 'border border-slate-800'
                }`}
              >
                {/* Tire Skid Marks Background overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />

                <div>
                  <p className="text-amber-400 text-xs font-mono font-bold">{setNumberDisplay}</p>
                  <p className="text-[11px] font-semibold text-slate-200 leading-tight mt-0.5">{customSubtitle}</p>
                </div>

                {/* Driver Minifig Badge (Matching image.png) */}
                <div className="text-center my-auto z-10">
                  <div className="w-14 h-14 rounded-full border-2 border-yellow-400 flex items-center justify-center mx-auto mb-1.5 bg-black/60 shadow-md">
                    <span className="text-yellow-400 font-black text-base">#{driverNumber}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium">Förare Minifigur</p>
                </div>

                <div className="text-center z-10 border-t border-white/10 pt-1">
                  <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">8-STUDS BREDD</p>
                </div>

                {showSkarlinjer && (
                  <span className="absolute top-1 left-2 text-[8px] text-red-400 font-mono">
                    SKÄRLINJE (VÄNSTER FLIK)
                  </span>
                )}
              </div>

              {/* B. FRONT PANEL (Main Box Art with 3D Car Render & Dynamic Speed Flare) */}
              <div
                className={`w-[460px] p-4 text-white flex flex-col justify-between relative overflow-hidden ${selectedBg.panelClass} ${
                  showSkarlinjer ? 'border-2 border-dashed border-blue-500/90' : 'border border-slate-800'
                }`}
              >
                {/* Dynamic Speed Blur / Neon Flare Behind Car (Matching image.png) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/2 left-0 right-0 h-16 bg-gradient-to-r from-red-600/70 via-indigo-600/40 to-sky-400/60 blur-xl transform -rotate-6" />
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />
                </div>

                {/* Front Top Header */}
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white font-black px-2.5 py-1 text-sm rounded shadow-md">
                      LEGO
                    </span>
                    <div>
                      <h3 className="font-black italic text-sm tracking-wider text-yellow-400 leading-tight">
                        SPEED CHAMPIONS
                      </h3>
                      <p className="text-[9px] text-slate-300 tracking-widest font-semibold uppercase">
                        FORMULA 1®
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400 block">{setNumberDisplay}</span>
                    <span className="text-[10px] text-slate-300 font-medium">{pieceCountDisplay}</span>
                  </div>
                </div>

                {/* 3D Car Cutout Render Preview (Center) */}
                <div className="my-auto flex justify-center items-center z-10 relative">
                  {snapshotUrl ? (
                    <img
                      src={snapshotUrl}
                      alt={customTitle}
                      className="max-h-40 object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.95)] transform hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-72 h-32 border-2 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs p-3 text-center">
                      <Sparkles className="w-5 h-5 text-amber-400 mb-1 animate-pulse" />
                      <span className="text-xs font-bold text-white">3D Car Render Cutout</span>
                      <span className="text-[10px] text-slate-400">Klicka "Snap 3D" i 3D-visaren för att föra över din unika livery hit!</span>
                    </div>
                  )}
                </div>

                {/* Front Bottom Footer */}
                <div className="flex justify-between items-end z-10 border-t border-white/10 pt-2">
                  <span className="text-xs font-bold text-white tracking-wide">{customTitle}</span>
                  <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
                    {ageDisplay}
                  </span>
                </div>

                {showSkarlinjer && (
                  <span className="absolute bottom-1 left-2 text-[8px] text-blue-400 font-mono">
                    VIKLINJE (FRAMSIDA)
                  </span>
                )}
              </div>

              {/* C. SPINE (Box Side Ribbon with 360 Wireframe Icon) */}
              <div
                className={`w-20 p-2 text-white flex flex-col justify-between items-center text-center relative overflow-hidden ${selectedBg.panelClass} ${
                  showSkarlinjer ? 'border-2 border-dashed border-blue-500/90' : 'border border-slate-800'
                }`}
              >
                <div>
                  <span className="text-red-500 font-black italic text-sm">F1®</span>
                  <p className="text-[7px] text-slate-400 font-mono uppercase">OFFICIAL</p>
                </div>

                {/* 360 Wireframe Graphic (Matching image.png) */}
                <div className="flex flex-col items-center my-auto">
                  <div className="w-10 h-10 rounded-full border border-slate-600 flex items-center justify-center bg-black/40 mb-1">
                    <svg className="w-6 h-6 stroke-amber-400 fill-none" viewBox="0 0 24 24">
                      <path d="M 4 12 A 8 8 0 1 1 20 12" strokeWidth="1.5" strokeDasharray="2 2" />
                      <path d="M 2 12 L 4 14 L 6 12" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="2" fill="#facc15" />
                    </svg>
                  </div>
                  <span className="text-[8px] font-black text-white uppercase tracking-wider">360° VIEW</span>
                </div>

                <div className="rotate-90 whitespace-nowrap text-[8px] font-mono tracking-widest text-slate-400 mb-6">
                  SPEED CHAMPIONS™
                </div>

                {showSkarlinjer && (
                  <span className="absolute top-1 left-1 text-[7px] text-blue-400 font-mono">
                    RYGG
                  </span>
                )}
              </div>

              {/* D. BACK PANEL (Action & Lekfunktioner) */}
              <div
                className={`w-[360px] p-4 text-white flex flex-col justify-between relative overflow-hidden bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:10px_10px] ${
                  showSkarlinjer ? 'border-2 border-dashed border-blue-500/90' : 'border border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <span>ACTION & LEKFUNKTIONER</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">{setNumberDisplay}</span>
                </div>

                {/* 4 Iconic Feature Cards (Matching image.png) */}
                <div className="grid grid-cols-2 gap-2 text-[10px] my-auto">
                  <div className="bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-xs">
                    <p className="font-bold text-white text-[11px]">Avtagbar Halo-Båge</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Enkel åtkomst för minifigurförare</p>
                  </div>
                  <div className="bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-xs">
                    <p className="font-bold text-white text-[11px]">Justerbar DRS Bakvinge</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Vinklingsbar för lågt luftmotstånd</p>
                  </div>
                  <div className="bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-xs">
                    <p className="font-bold text-white text-[11px]">18-Tums Aeronavkapslar</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Snabbt däckbyte med Technic-axlar</p>
                  </div>
                  <div className="bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-xs">
                    <p className="font-bold text-white text-[11px]">Venturi Markeffektsgolv</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Skulpterade aerodynamiska tunnlar</p>
                  </div>
                </div>

                {/* Back Panel Footer Copyright */}
                <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-white/10 pt-2 font-mono">
                  <span>©2025 THE LEGO GROUP.</span>
                  <span>OFFICIAL LICENSED PRODUCT</span>
                </div>

                {showSkarlinjer && (
                  <span className="absolute bottom-1 left-2 text-[8px] text-blue-400 font-mono">
                    VIKLINJE (BAKSIDA)
                  </span>
                )}
              </div>

              {/* E. GLUE TAB (LIMFLIK) */}
              <div
                className={`w-9 bg-slate-300 text-slate-600 flex items-center justify-center relative ${
                  showSkarlinjer ? 'border-2 border-dashed border-red-500/80' : 'border border-slate-400'
                }`}
              >
                <span className="rotate-90 text-[8px] font-mono font-bold whitespace-nowrap uppercase tracking-widest text-slate-700">
                  LIMFLIK (GLUE TAB)
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 3. BOTTOM FLAP */}
            {/* ======================================================== */}
            <div
              className={`w-[460px] ml-[150px] h-18 mt-1 rounded-b-xl relative bg-slate-100 text-slate-800 p-3 flex justify-between items-center text-[9px] font-mono border ${
                showSkarlinjer ? 'border-2 border-dashed border-red-500/80' : 'border-slate-300'
              } shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 border-red-600 flex items-center justify-center text-red-600 font-bold text-xs bg-white shrink-0">
                  0-3
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">VARNING: KVÄVNINGSRISK. Små delar.</span>
                  <span className="text-[8px] text-slate-500">Tillverkad av LEGO Koncernen, Billund, Danmark. Formel 1 licensierad produkt.</span>
                </div>
              </div>

              {/* Barcode (Matching image.png) */}
              <div className="bg-black text-white px-3 py-1.5 rounded font-mono font-bold text-[10px] tracking-wider shrink-0 shadow-xs">
                5702017772421
              </div>

              {showSkarlinjer && (
                <span className="absolute bottom-1 left-2 text-[8px] text-red-400 font-mono font-bold">
                  SKÄRLINJE (BOTTOM FLAP)
                </span>
              )}
            </div>

            {/* Dieline Legend */}
            {showSkarlinjer && (
              <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-3 border-t border-slate-300 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 border-t-2 border-red-500 border-dashed" />
                  <span className="text-red-600 font-mono">RÖD STRECKAD: Yttre Skärlinje (Die-cut blade)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 border-t-2 border-blue-500 border-dashed" />
                  <span className="text-blue-600 font-mono">BLÅ STRECKAD: Viklinje / Falslinje (Crease line)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-300 border border-slate-400" />
                  <span className="text-slate-600 font-mono">GRÅ FLIK: Limningsyta (Glue Tab)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FLATMÄRKES BUTIKSFÖRPACKNING (FRONT RETAIL COVER) */
        <div className="flex justify-center items-center py-6 px-2 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden">
          <div className={`relative w-full max-w-3xl aspect-[16/10] overflow-hidden border-4 border-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col justify-between select-none shadow-2xl ${selectedBg.panelClass}`}>
            
            {/* Speed Trails */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute top-1/2 left-0 right-0 h-24 bg-gradient-to-r from-red-600 via-indigo-600 to-sky-400 blur-2xl transform -rotate-6" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-3">
                <span className="bg-red-600 text-white font-black px-3 py-1.5 text-lg rounded shadow-md">
                  LEGO
                </span>
                <div>
                  <h3 className="font-black italic text-lg sm:text-xl tracking-wider text-yellow-400 leading-tight">
                    SPEED CHAMPIONS
                  </h3>
                  <p className="text-xs text-slate-300 tracking-widest font-semibold uppercase">
                    FORMULA 1®
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-mono font-bold text-amber-400 block">{setNumberDisplay}</span>
                <span className="text-xs text-slate-300 font-medium">{pieceCountDisplay}</span>
              </div>
            </div>

            {/* Center Cutout */}
            <div className="my-auto flex justify-center items-center z-10">
              {snapshotUrl ? (
                <img
                  src={snapshotUrl}
                  alt={customTitle}
                  className="max-h-56 object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,0.9)]"
                />
              ) : (
                <div className="w-80 h-36 border-2 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs p-4 text-center text-white">
                  <Sparkles className="w-6 h-6 text-amber-400 mb-1 animate-pulse" />
                  <span className="text-sm font-bold">3D Car Render Snapshot</span>
                  <span className="text-xs text-slate-400">Klicka "Snap 3D" i 3D-visaren för att exportera bilden</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end z-10 border-t border-white/10 pt-3">
              <div>
                <div className="text-sm sm:text-base font-bold text-white">{customTitle}</div>
                <div className="text-xs text-slate-300">{customSubtitle}</div>
              </div>
              <span className="bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded shadow-xs">
                {ageDisplay}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
