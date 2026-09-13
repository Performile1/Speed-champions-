import React, { useState, useEffect } from 'react';
import { LEGO_F1_SETS } from './data/legoSets';
import { LegoF1Set, CarPartColors, CarDecals, CarPartKey, GranularLegoPart } from './types';
import { Car3DViewer } from './components/Car3DViewer';
import { SetSelector } from './components/SetSelector';
import { ColorCustomizer } from './components/ColorCustomizer';
import { DecalCustomizer } from './components/DecalCustomizer';
import { GranularPartsManager } from './components/GranularPartsManager';
import { AiLiveryModal } from './components/AiLiveryModal';
import { LegoConnectModal } from './components/LegoConnectModal';
import { BoxArtStudio } from './components/BoxArtStudio';
import { InstructionManual } from './components/InstructionManual';
import { getGranularLegoParts, getBrickLinkColorId } from './data/legoPartsDatabase';
import { findLegoColorName } from './data/legoColors';
import {
  Sparkles,
  Palette,
  Tag,
  Box,
  BookOpen,
  Layers,
  ExternalLink,
  Zap,
  Grid,
  Undo2,
  Redo2,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  // Current active LEGO F1 Set (default to #77242 Ferrari SF-24)
  const [currentSet, setCurrentSet] = useState<LegoF1Set>(LEGO_F1_SETS[0]);

  // Current custom colors & decals state
  const [colors, setColors] = useState<CarPartColors>(currentSet.defaultColors);
  const [decals, setDecals] = useState<CarDecals>(currentSet.defaultDecals);
  const [selectedPart, setSelectedPart] = useState<CarPartKey>('nose');

  // Granular LEGO parts state (for hide/isolate, add/remove, BrickLink)
  const [granularParts, setGranularParts] = useState<GranularLegoPart[]>(() =>
    getGranularLegoParts(currentSet.defaultColors, currentSet)
  );
  const [hiddenPartKeys, setHiddenPartKeys] = useState<Set<string>>(new Set());
  const [isolatedPartId, setIsolatedPartId] = useState<string | null>(null);

  // Individual Brick Custom Colors & 3D Selected Instance ID
  const [customBrickColors, setCustomBrickColors] = useState<Record<string, string>>({});
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // Custom AI Box title/subtitles
  const [customBoxTitle, setCustomBoxTitle] = useState<string | undefined>();
  const [customBoxSubtitle, setCustomBoxSubtitle] = useState<string | undefined>();

  // Snapshot data URL captured from 3D viewer for the Box and Manual (Hero Front 3/4 + Side Profile)
  const [snapshotUrl, setSnapshotUrl] = useState<string | undefined>();
  const [sideSnapshotUrl, setSideSnapshotUrl] = useState<string | undefined>();

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'customize' | 'granular' | 'models' | 'box' | 'manual'>('customize');
  // Sub-tab inside customize: 'colors' vs 'decals' vs 'granular'
  const [customizerSubTab, setCustomizerSubTab] = useState<'colors' | 'decals' | 'granular'>('colors');

  // Switch Model Handler
  const handleSelectSet = (newSet: LegoF1Set) => {
    setCurrentSet(newSet);
    setColors(newSet.defaultColors);
    setDecals(newSet.defaultDecals);
    setGranularParts(getGranularLegoParts(newSet.defaultColors, newSet));
    setCustomBrickColors({});
    setSelectedInstanceId(null);
    setHiddenPartKeys(new Set());
    setIsolatedPartId(null);
    setCustomBoxTitle(undefined);
    setCustomBoxSubtitle(undefined);
    setActiveTab('customize');
  };

  // History State for Undo / Redo / Reset
  interface HistorySnapshot {
    colors: CarPartColors;
    customBrickColors: Record<string, string>;
    granularParts: GranularLegoPart[];
  }

  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);

  const pushHistorySnapshot = () => {
    setUndoStack((prev) => [
      ...prev.slice(-30),
      {
        colors: { ...colors },
        customBrickColors: { ...customBrickColors },
        granularParts: [...granularParts],
      },
    ]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);

    setRedoStack((prev) => [
      ...prev,
      {
        colors: { ...colors },
        customBrickColors: { ...customBrickColors },
        granularParts: [...granularParts],
      },
    ]);
    setUndoStack(newUndo);

    setColors(previous.colors);
    setCustomBrickColors(previous.customBrickColors);
    setGranularParts(previous.granularParts);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    setUndoStack((prev) => [
      ...prev,
      {
        colors: { ...colors },
        customBrickColors: { ...customBrickColors },
        granularParts: [...granularParts],
      },
    ]);
    setRedoStack(newRedo);

    setColors(next.colors);
    setCustomBrickColors(next.customBrickColors);
    setGranularParts(next.granularParts);
  };

  const handleResetAll = () => {
    pushHistorySnapshot();
    setColors(currentSet.defaultColors);
    setDecals(currentSet.defaultDecals);
    setGranularParts(getGranularLegoParts(currentSet.defaultColors, currentSet));
    setCustomBrickColors({});
    setSelectedInstanceId(null);
    setHiddenPartKeys(new Set());
    setIsolatedPartId(null);
  };

  // Keyboard Shortcuts: Ctrl+Z (Undo), Ctrl+Y or Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, colors, customBrickColors, granularParts]);

  // Color modification
  const handleUpdateColor = (part: CarPartKey, hex: string) => {
    pushHistorySnapshot();
    setColors((prev) => ({ ...prev, [part]: hex }));
    setGranularParts((prev) =>
      prev.map((p) =>
        p.partKey === part
          ? {
              ...p,
              colorHex: hex,
              colorName: findLegoColorName(hex),
              brickLinkColorId: getBrickLinkColorId(hex),
            }
          : p
      )
    );
  };

  // Update a single granular part's color (individual per-brick color override!)
  const handleUpdateGranularPartColor = (partId: string, hex: string) => {
    pushHistorySnapshot();
    setCustomBrickColors((prev) => ({ ...prev, [partId]: hex }));
    setGranularParts((prev) =>
      prev.map((p) => {
        if (p.id === partId) {
          return {
            ...p,
            colorHex: hex,
            colorName: findLegoColorName(hex),
            brickLinkColorId: getBrickLinkColorId(hex),
          };
        }
        return p;
      })
    );
  };

  // Toggle Hide Part (or its assembly)
  const handleToggleHidePart = (partId: string) => {
    const targetPart = granularParts.find((p) => p.id === partId);
    if (!targetPart) return;

    setHiddenPartKeys((prev) => {
      const next = new Set(prev);
      if (next.has(targetPart.partKey)) {
        next.delete(targetPart.partKey);
      } else {
        next.add(targetPart.partKey);
      }
      return next;
    });
  };

  // Hide outer bodywork to inspect chassis / cockpit
  const handleHideOuterAero = () => {
    setHiddenPartKeys(new Set(['nose', 'sidepods', 'engineCover', 'sharkFin']));
  };

  // Show all parts
  const handleShowAllParts = () => {
    setHiddenPartKeys(new Set());
    setIsolatedPartId(null);
  };

  // Isolate part
  const handleIsolatePart = (partId: string | null) => {
    if (!partId) {
      setIsolatedPartId(null);
      return;
    }
    const targetPart = granularParts.find((p) => p.id === partId);
    if (targetPart) {
      setIsolatedPartId(targetPart.partKey);
      setSelectedPart(targetPart.partKey);
    }
  };

  // Add Part
  const handleAddPart = (newPart: GranularLegoPart) => {
    setGranularParts((prev) => [newPart, ...prev]);
  };

  // Remove Part
  const handleRemovePart = (partId: string) => {
    setGranularParts((prev) => prev.filter((p) => p.id !== partId));
  };

  // Reset Parts
  const handleResetParts = () => {
    setGranularParts(getGranularLegoParts(currentSet.defaultColors, currentSet));
    setCustomBrickColors({});
    setSelectedInstanceId(null);
    setHiddenPartKeys(new Set());
    setIsolatedPartId(null);
  };

  // Apply chosen color to all aerodynamic bodywork panels
  const handleApplyAllAero = (hex: string) => {
    pushHistorySnapshot();
    setColors((prev) => ({
      ...prev,
      nose: hex,
      sidepods: hex,
      engineCover: hex,
      sharkFin: hex,
      frontWingEndplates: hex,
      rearWingEndplates: hex,
    }));
    setGranularParts((prev) =>
      prev.map((p) => {
        if (
          ['nose', 'sidepods', 'engineCover', 'sharkFin', 'frontWingEndplates', 'rearWingEndplates'].includes(
            p.partKey
          )
        ) {
          return {
            ...p,
            colorHex: hex,
            colorName: findLegoColorName(hex),
            brickLinkColorId: getBrickLinkColorId(hex),
          };
        }
        return p;
      })
    );
  };

  // Apply complete Livery Color Palette across car panels and decals
  const handleApplyLiveryColors = (primary: string, secondary: string, accent: string) => {
    pushHistorySnapshot();
    setColors((prev) => ({
      ...prev,
      nose: primary,
      sidepods: primary,
      engineCover: secondary,
      sharkFin: secondary,
      frontWing: secondary,
      rearWing: secondary,
      halo: accent,
    }));
    handleUpdateDecals({
      liveryColorPrimary: primary,
      liveryColorSecondary: secondary,
      liveryColorAccent: accent,
      accentStripeColor: accent,
    });
  };

  // Reset to original LEGO factory livery
  const handleResetFactory = () => {
    setColors(currentSet.defaultColors);
    setDecals(currentSet.defaultDecals);
    setGranularParts(getGranularLegoParts(currentSet.defaultColors));
    setHiddenPartKeys(new Set());
    setIsolatedPartId(null);
  };

  // Decal modification
  const handleUpdateDecals = (updated: Partial<CarDecals>) => {
    setDecals((prev) => ({ ...prev, ...updated }));
  };

  // Apply AI Livery
  const handleApplyAiLivery = (
    aiColors: CarPartColors,
    aiDecals: CarDecals,
    boxTitle?: string,
    boxSubtitle?: string
  ) => {
    setColors(aiColors);
    setDecals(aiDecals);
    setGranularParts(getGranularLegoParts(aiColors));
    if (boxTitle) setCustomBoxTitle(boxTitle);
    if (boxSubtitle) setCustomBoxSubtitle(boxSubtitle);
    setActiveTab('customize');
  };

  const handleAddCustomPart = (newPart: GranularLegoPart) => {
    setGranularParts((prev) => [...prev, newPart]);
  };

  const handleSwapPartElement = (
    instanceId: string,
    newDesignId: string,
    newElementId: string,
    newPieceName: string,
    category: string
  ) => {
    pushHistorySnapshot();
    setGranularParts((prev) =>
      prev.map((p) =>
        p.id === instanceId
          ? {
              ...p,
              designId: newDesignId,
              elementId: newElementId,
              name: newPieceName,
              category,
            }
          : p
      )
    );
  };

  // Total active piece count calculated from granular parts
  const dynamicPieceCount = granularParts.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* 1. TOP HEADER & BRANDING BAR (Light Theme) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand Mark & Title */}
          <div className="flex items-center gap-3.5">
            {/* Iconic LEGO Red Square */}
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center border-2 border-white shadow-md shadow-red-600/30 rotate-[-2deg] shrink-0">
              <span className="font-black text-white text-sm tracking-tighter italic font-sans">
                LEGO
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black italic tracking-tighter text-slate-950">
                  SPEED <span className="text-amber-500">CHAMPIONS</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  F1 Customizer
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Active Model:</span>
                <button
                  onClick={() => setActiveTab('models')}
                  className="font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                >
                  #{currentSet.articleNumber} {currentSet.name}
                </button>
              </div>
            </div>
          </div>

          {/* Action Tools & Modals */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* History Engine: Undo / Redo / Reset */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Ångra ändring (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Gör om ändring (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetAll}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-white transition-all cursor-pointer"
                title="Återställ alla klossar & färger"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Connect to LEGO Article Button */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="View article details on LEGO.com, BrickLink and export parts BOM"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span>Connect LEGO #{currentSet.articleNumber}</span>
            </button>

            {/* AI Livery Generator Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get AI Ideas</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. PRIMARY VIEW NAVIGATION TABS (Clean White Light Bar) */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === 'customize'
                  ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>3D Livery Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('granular')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === 'granular'
                  ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Klossar & BrickLink BOM</span>
            </button>

            <button
              onClick={() => setActiveTab('models')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === 'models'
                  ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog Article Numbers ({LEGO_F1_SETS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('box')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === 'box'
                  ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Create Collector Box</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Instruction Manual</span>
            </button>
          </div>

          {/* Quick Stats Strip */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="text-slate-800 font-bold">#{currentSet.articleNumber}</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">{dynamicPieceCount} Pieces</span>
            <span>•</span>
            <span className="capitalize">{currentSet.era.replace(/-/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {/* VIEW 1: 3D LIVERY STUDIO (3D 360 Viewer + Colorizer / Decal / Granular Tabs) */}
        {activeTab === 'customize' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: 3D Interactive 360 Model Viewer */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="h-[480px] lg:h-[620px] w-full">
                <Car3DViewer
                  colors={colors}
                  decals={decals}
                  era={currentSet.era}
                  currentSet={currentSet}
                  selectedPart={selectedPart}
                  onSelectPart={setSelectedPart}
                  onCaptureSnapshot={(front, side) => {
                    setSnapshotUrl(front);
                    if (side) setSideSnapshotUrl(side);
                  }}
                  hiddenParts={hiddenPartKeys}
                  isolatedPartId={isolatedPartId}
                  selectedInstanceId={selectedInstanceId}
                  onSelectInstanceId={setSelectedInstanceId}
                  customBrickColors={customBrickColors}
                  onUpdateIndividualBrickColor={handleUpdateGranularPartColor}
                  onAddCustomPart={handleAddCustomPart}
                  onSwapPartElement={handleSwapPartElement}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onResetHistory={handleResetAll}
                />
              </div>

              {/* Viewer Footer Quick Tips */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-2">
                <div className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>360° Raycasting Active: Click any part on the 3D car to paint it</span>
                  {hiddenPartKeys.size > 0 && (
                    <span className="text-rose-600 font-bold ml-2">
                      ({hiddenPartKeys.size} delar dolda)
                    </span>
                  )}
                  {isolatedPartId && (
                    <span className="text-amber-600 font-bold ml-2">
                      (Isolerar {isolatedPartId})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {(hiddenPartKeys.size > 0 || isolatedPartId) && (
                    <button
                      onClick={handleShowAllParts}
                      className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      Återställ visning
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('box')}
                    className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <span>Ready? Preview custom box art →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Piece Colors, Decals, or Granular Manager Subtabs */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Sub Tabs: Pieces (Colors) vs Decals (Stickers) vs Granular Parts */}
              <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 shadow-xs">
                <button
                  onClick={() => setCustomizerSubTab('colors')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    customizerSubTab === 'colors'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  <span>Colors</span>
                </button>

                <button
                  onClick={() => setCustomizerSubTab('decals')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    customizerSubTab === 'decals'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Decals</span>
                </button>

                <button
                  onClick={() => setCustomizerSubTab('granular')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    customizerSubTab === 'granular'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 text-amber-500" />
                  <span>Klossar ({granularParts.length})</span>
                </button>
              </div>

              {/* SubTab Content */}
              {customizerSubTab === 'colors' ? (
                <ColorCustomizer
                  colors={colors}
                  selectedPart={selectedPart}
                  onSelectPart={setSelectedPart}
                  onUpdateColor={handleUpdateColor}
                  onApplyAllAero={handleApplyAllAero}
                  onResetFactoryColors={handleResetFactory}
                />
              ) : customizerSubTab === 'decals' ? (
                <DecalCustomizer
                  decals={decals}
                  currentSet={currentSet}
                  currentColors={colors}
                  onUpdateDecals={handleUpdateDecals}
                  onApplyLiveryColors={handleApplyLiveryColors}
                  selectedPart={selectedPart}
                  onSelectPart={setSelectedPart}
                />
              ) : (
                <GranularPartsManager
                  parts={granularParts}
                  hiddenPartIds={hiddenPartKeys}
                  isolatedPartId={isolatedPartId}
                  selectedInstanceId={selectedInstanceId}
                  onSelectInstanceId={setSelectedInstanceId}
                  onToggleHidePart={handleToggleHidePart}
                  onIsolatePart={handleIsolatePart}
                  onShowAllParts={handleShowAllParts}
                  onHideOuterAero={handleHideOuterAero}
                  onUpdatePartColor={handleUpdateGranularPartColor}
                  onSelectPartKey={setSelectedPart}
                  onAddPart={handleAddPart}
                  onRemovePart={handleRemovePart}
                  onResetParts={handleResetParts}
                />
              )}

              {/* Quick Actions Card (Light Theme) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Generate Instructions</div>
                    <div className="text-[11px] text-slate-500">Step-by-step LEGO building booklet</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('manual')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-800 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  View Manual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEDICATED FULL-WIDTH GRANULAR KLOSS-BYGGARE & BRICKLINK BOM */}
        {activeTab === 'granular' && (
          <div className="space-y-4">
            <GranularPartsManager
              parts={granularParts}
              hiddenPartIds={hiddenPartKeys}
              isolatedPartId={isolatedPartId}
              selectedInstanceId={selectedInstanceId}
              onSelectInstanceId={setSelectedInstanceId}
              onToggleHidePart={handleToggleHidePart}
              onIsolatePart={handleIsolatePart}
              onShowAllParts={handleShowAllParts}
              onHideOuterAero={handleHideOuterAero}
              onUpdatePartColor={handleUpdateGranularPartColor}
              onSelectPartKey={setSelectedPart}
              onAddPart={handleAddPart}
              onRemovePart={handleRemovePart}
              onResetParts={handleResetParts}
            />
          </div>
        )}

        {/* VIEW 3: ARTICLE NUMBERS CATALOG SELECTOR */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <SetSelector
              currentSet={currentSet}
              onSelectSet={handleSelectSet}
              onOpenConnectModal={(set) => {
                setCurrentSet(set);
                setIsConnectModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 4: CREATE THE BOX IN THE END */}
        {activeTab === 'box' && (
          <BoxArtStudio
            set={currentSet}
            colors={colors}
            decals={decals}
            snapshotUrl={snapshotUrl}
            sideSnapshotUrl={sideSnapshotUrl}
            customBoxTitle={customBoxTitle}
            customBoxSubtitle={customBoxSubtitle}
            totalPieceCount={dynamicPieceCount}
          />
        )}

        {/* VIEW 5: INSTRUCTION MANUAL */}
        {activeTab === 'manual' && (
          <InstructionManual
            set={currentSet}
            colors={colors}
            decals={decals}
            snapshotUrl={snapshotUrl}
            parts={granularParts}
          />
        )}
      </main>

      {/* 4. MODALS */}
      <AiLiveryModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentModelName={`LEGO Speed Champions #${currentSet.articleNumber} ${currentSet.name}`}
        onApplyLivery={handleApplyAiLivery}
      />

      <LegoConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        set={currentSet}
        colors={colors}
      />

      {/* 5. FOOTER */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 px-4 text-center text-xs text-slate-500">
        <p>
          LEGO® & Speed Champions™ are trademarks of the LEGO Group. Formula 1® is a trademark of Formula One Licensing B.V.
          Created for Speed Champions builders and custom livery designers.
        </p>
      </footer>
    </div>
  );
}
