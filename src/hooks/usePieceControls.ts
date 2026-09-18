// src/hooks/usePieceControls.ts
import { useEffect, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { LDrawPartInstance } from '../data/ldrawModels';

interface UsePieceControlsProps {
  instances: LDrawPartInstance[];
  setInstances: Dispatch<SetStateAction<LDrawPartInstance[]>>;
  selectedPieceId: string | null;
  setSelectedPieceId: (id: string | null) => void;
  enabled?: boolean;
}

export function usePieceControls({
  instances,
  setInstances,
  selectedPieceId,
  setSelectedPieceId,
  enabled = true,
}: UsePieceControlsProps) {
  const [deletedHistory, setDeletedHistory] = useState<LDrawPartInstance[]>([]);

  // 1. Radera vald bit
  const deleteSelectedPiece = useCallback(
    (targetId?: string) => {
      const id = targetId || selectedPieceId;
      if (!id) return;

      const pieceToDelete = instances.find((p) => p.id === id);
      if (!pieceToDelete) return;

      // Spara i historiken för ångra-funktion
      setDeletedHistory((prev) => [pieceToDelete, ...prev]);

      // Ta bort från aktiva instanser
      setInstances((prev) => prev.filter((p) => p.id !== id));

      if (selectedPieceId === id) {
        setSelectedPieceId(null);
      }
    },
    [instances, selectedPieceId, setInstances, setSelectedPieceId]
  );

  // 2. Ångra senaste raderingen (Ctrl + Z)
  const undoLastDelete = useCallback(() => {
    if (deletedHistory.length === 0) return;

    const [restoredPiece, ...remainingHistory] = deletedHistory;
    setInstances((prev) => [...prev, restoredPiece]);
    setDeletedHistory(remainingHistory);
    setSelectedPieceId(restoredPiece.id);
  }, [deletedHistory, setInstances, setSelectedPieceId]);

  // 3. Tangentbordslyssnare för Delete, Backspace & Undo
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        ['input', 'textarea', 'select'].includes(activeEl.tagName.toLowerCase())
      ) {
        return;
      }

      // Radera vald bit
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPieceId) {
        e.preventDefault();
        deleteSelectedPiece();
      }

      // Ångra radering (Ctrl + Z / Cmd + Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLastDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, selectedPieceId, deleteSelectedPiece, undoLastDelete]);

  return {
    deleteSelectedPiece,
    undoLastDelete,
    hasDeletedItems: deletedHistory.length > 0,
    deletedCount: deletedHistory.length,
  };
}
