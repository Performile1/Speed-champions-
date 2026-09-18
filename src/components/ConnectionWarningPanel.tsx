// src/components/ConnectionWarningPanel.tsx
import React from 'react';
import { ConnectionCheckResult, ConnectorSuggestion } from '../utils/legoConnectivity';
import { LDrawPartInstance } from '../data/ldrawModels';
import { getLegoPartImageUrl } from '../data/partCatalog';
import { AlertTriangle, Plus, ChevronUp, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedPiece: LDrawPartInstance | null;
  connectionStatus: ConnectionCheckResult;
  onAddConnectorPiece: (suggestion: ConnectorSuggestion) => void;
  onClose?: () => void;
}

export const ConnectionWarningPanel: React.FC<Props> = ({
  selectedPiece,
  connectionStatus,
  onAddConnectorPiece,
  onClose,
}) => {
  if (!selectedPiece || connectionStatus.isConnected) {
    return null; // Biten sitter fast som den ska!
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 rounded-2xl bg-zinc-900/95 border border-red-500/50 p-4 shadow-2xl backdrop-blur-md text-white">
      {/* Varningsheader */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div>
            <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Svävande LEGO-del upptäckt
            </h4>
            <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
              #{selectedPiece.designId} ({selectedPiece.pieceName}) saknar fysisk kontakt!
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Glappinformation */}
      <div className="my-3 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 flex items-center justify-between">
        <span>Glapp till underliggande del:</span>
        <span className="font-mono font-bold text-amber-400">
          {connectionStatus.gapY.toFixed(0)} LDU (ca {Math.max(1, Math.round(connectionStatus.gapY / 8))} plattor)
        </span>
      </div>

      {/* Tangentbords-tips */}
      <div className="text-[10px] text-zinc-400 mb-3 bg-zinc-800/40 px-2 py-1 rounded-lg">
        Tips: Använd <kbd className="bg-zinc-700 px-1 py-0.5 rounded text-zinc-200">Shift+Nedåtpil</kbd> eller <kbd className="bg-zinc-700 px-1 py-0.5 rounded text-zinc-200">Q</kbd> för att sänka klossen mot chassit.
      </div>

      {/* Förslag på bryggbitar */}
      {connectionStatus.suggestions.length > 0 && (
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1 mb-2">
            <Plus className="w-3 h-3 text-amber-400" />
            Föreslagna adapterklossar:
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {connectionStatus.suggestions.map((sug) => {
              const imgUrl = getLegoPartImageUrl(sug.designId);
              return (
                <div
                  key={sug.designId}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-2 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-zinc-900 rounded-lg p-1 flex items-center justify-center shrink-0">
                      <img
                        src={imgUrl}
                        alt={sug.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-200">#{sug.designId} {sug.name}</div>
                      <div className="text-[10px] text-zinc-400">{sug.reason}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddConnectorPiece(sug)}
                    className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 transition shrink-0 cursor-pointer shadow-sm"
                  >
                    Koppla in
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
