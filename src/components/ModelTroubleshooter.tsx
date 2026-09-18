// src/components/ModelTroubleshooter.tsx
import React, { useMemo } from 'react';
import { LDrawPartInstance } from '../data/ldrawModels';
import { checkPieceConnection } from '../utils/legoConnectivity';
import { exportInstancesToLdr, saveModelLocally } from '../utils/ldrawExporter';
import { AlertTriangle, CheckCircle2, Download, Save, Trash2, X, Wrench } from 'lucide-react';

interface TroubleshooterProps {
  modelId: string;
  modelName: string;
  instances: LDrawPartInstance[];
  onSelectPiece: (id: string) => void;
  onDeletePiece?: (id: string) => void;
  onModelSaved?: () => void;
  onClose?: () => void;
}

export const ModelTroubleshooter: React.FC<TroubleshooterProps> = ({
  modelId,
  modelName,
  instances,
  onSelectPiece,
  onDeletePiece,
  onModelSaved,
  onClose,
}) => {
  // 1. Diagnos-körning
  const report = useMemo(() => {
    const collisions: { id1: string; id2: string; designId: string; pos: string }[] = [];
    const floating: { id: string; designId: string; name: string; gapY: number }[] = [];

    // Hitta kollisioner (< 0.5 LDU)
    for (let i = 0; i < instances.length; i++) {
      for (let j = i + 1; j < instances.length; j++) {
        const a = instances[i];
        const b = instances[j];
        if (a.designId === 'stud' || b.designId === 'stud') continue;

        const dist = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        if (dist < 0.5) {
          collisions.push({
            id1: a.id,
            id2: b.id,
            designId: `${a.designId} & ${b.designId}`,
            pos: `X:${a.x.toFixed(0)} Y:${a.y.toFixed(0)} Z:${a.z.toFixed(0)}`,
          });
        }
      }
    }

    // Hitta svävande klossar
    instances.forEach((inst) => {
      // Hoppa över bottenplattor vid marken
      if (inst.y >= -8 && (inst.partKey === 'floor' || inst.subAssembly?.toLowerCase().includes('chassis'))) return;
      const status = checkPieceConnection(inst, instances);
      if (!status.isConnected && status.gapY > 8) {
        floating.push({
          id: inst.id,
          designId: inst.designId,
          name: inst.pieceName,
          gapY: status.gapY,
        });
      }
    });

    // Mät dimensioner
    const minZ = instances.length > 0 ? Math.min(...instances.map((p) => p.z)) : 0;
    const maxZ = instances.length > 0 ? Math.max(...instances.map((p) => p.z)) : 0;

    return {
      totalParts: instances.length,
      collisions,
      floating,
      lengthLDU: maxZ - minZ,
      healthy: collisions.length === 0 && floating.length === 0,
    };
  }, [instances]);

  // Exportera och ladda ner fil
  const handleDownloadLdr = () => {
    const ldrText = exportInstancesToLdr(instances, `${modelName} - Verified`);
    const blob = new Blob([ldrText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelId}_verified.ldr`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveVerified = () => {
    saveModelLocally(modelId, instances);
    if (onModelSaved) onModelSaved();
  };

  return (
    <div className="w-84 rounded-2xl bg-zinc-950/95 border border-zinc-800 p-4 text-white shadow-2xl backdrop-blur-md flex flex-col gap-3 font-sans text-xs animate-in fade-in duration-200">
      {/* Header med status-badge */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-zinc-100">{modelName}</div>
            <div className="text-[10px] text-zinc-400 font-mono">Modell-ID: #{modelId}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
              report.healthy
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {report.healthy ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> OK
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" /> {report.collisions.length + report.floating.length} problem
              </>
            )}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mått & statistik */}
      <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80 font-mono text-[11px]">
        <div>
          Bitar: <span className="text-zinc-200 font-bold">{report.totalParts}</span>
        </div>
        <div>
          Längd: <span className="text-zinc-200 font-bold">{report.lengthLDU.toFixed(0)} LDU</span>
        </div>
      </div>

      {/* Problem-sektion: Kollisioner */}
      {report.collisions.length > 0 && (
        <div className="space-y-1.5">
          <div className="font-bold text-red-400 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              Krockande bitar ({report.collisions.length}):
            </span>
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
            {report.collisions.map((c, idx) => (
              <div
                key={idx}
                className="w-full p-1.5 rounded-xl bg-red-950/30 border border-red-900/40 text-[10px] flex items-center justify-between gap-1"
              >
                <button
                  onClick={() => onSelectPiece(c.id1)}
                  className="text-left font-mono truncate hover:text-red-300 transition cursor-pointer flex-1"
                  title="Markera krockande kloss"
                >
                  #{c.designId} ({c.pos})
                </button>
                {onDeletePiece && (
                  <button
                    onClick={() => onDeletePiece(c.id2)}
                    className="px-1.5 py-0.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-0.5 cursor-pointer shrink-0"
                    title="Radera överlappande dubblett"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Rensa</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem-sektion: Svävande bitar */}
      {report.floating.length > 0 && (
        <div className="space-y-1.5">
          <div className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Svävande delar ({report.floating.length}):</span>
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
            {report.floating.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectPiece(f.id)}
                className="w-full text-left p-1.5 rounded-xl bg-amber-950/30 border border-amber-900/40 hover:bg-amber-900/40 text-[10px] flex justify-between items-center cursor-pointer transition"
              >
                <span className="truncate max-w-[150px]">#{f.designId} {f.name}</span>
                <span className="font-mono text-amber-300 font-bold">+{f.gapY.toFixed(0)} LDU</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {report.healthy && (
        <div className="py-3 text-center text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 rounded-xl flex items-center justify-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Inga strukturella fel upptäckta!</span>
        </div>
      )}

      {/* Spara & Exportera knappar */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
        <button
          onClick={handleSaveVerified}
          className="py-2 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-amber-400" />
          <span>Spara Verifierad</span>
        </button>
        <button
          onClick={handleDownloadLdr}
          className="py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ladda ner .LDR</span>
        </button>
      </div>
    </div>
  );
};
