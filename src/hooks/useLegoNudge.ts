// src/hooks/useLegoNudge.ts
import { useEffect } from 'react';
import { LEGO_GRID } from '../utils/legoGrid';

interface UseLegoNudgeProps {
  selectedPieceId: string | null;
  onMovePiece: (id: string, deltaX: number, deltaY: number, deltaZ: number) => void;
  onRotatePiece?: (id: string, axis: 'x' | 'y' | 'z', clockwise?: boolean) => void;
  enabled: boolean;
}

export function useLegoNudge({ selectedPieceId, onMovePiece, onRotatePiece, enabled }: UseLegoNudgeProps) {
  useEffect(() => {
    if (!enabled || !selectedPieceId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Undvik konflikt med formulär/inputs/modaler
      const activeEl = document.activeElement;
      if (
        activeEl &&
        ['input', 'textarea', 'select'].includes(activeEl.tagName.toLowerCase())
      ) {
        return;
      }

      // Roteringslyssnare: R (Y-axeln, horisontell) och Shift+R (X-axeln, vertikal)
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && onRotatePiece) {
        e.preventDefault();
        if (e.shiftKey) {
          onRotatePiece(selectedPieceId, 'x', true);
        } else {
          onRotatePiece(selectedPieceId, 'y', true);
        }
        return;
      }

      let dx = 0;
      let dy = 0;
      let dz = 0;

      switch (e.key) {
        case 'ArrowLeft':
          dx = -LEGO_GRID.STUD_XZ; // -1 knopp (vänster)
          break;
        case 'ArrowRight':
          dx = LEGO_GRID.STUD_XZ;  // +1 knopp (höger)
          break;
        case 'ArrowUp':
          if (e.shiftKey) {
            dy = -LEGO_GRID.PLATE_Y; // Höj med 1 platta (i LDraw är -Y uppåt)
          } else {
            dz = -LEGO_GRID.STUD_XZ; // Flytta framåt längs bilen (-Z)
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) {
            dy = LEGO_GRID.PLATE_Y;  // Sänk med 1 platta (+Y)
          } else {
            dz = LEGO_GRID.STUD_XZ;  // Flytta bakåt längs bilen (+Z)
          }
          break;
        case 'PageUp':
        case 'e':
        case 'E':
          // Shift+E / Shift+PageUp: Höj med 1 hel kloss (24 LDU = 3 plattor)
          // E / PageUp: Höj med 1 platta (8 LDU)
          dy = e.shiftKey ? -LEGO_GRID.BRICK_Y : -LEGO_GRID.PLATE_Y;
          break;
        case 'PageDown':
        case 'q':
        case 'Q':
          // Shift+Q / Shift+PageDown: Sänk med 1 hel kloss (24 LDU)
          // Q / PageDown: Sänk med 1 platta (8 LDU)
          dy = e.shiftKey ? LEGO_GRID.BRICK_Y : LEGO_GRID.PLATE_Y;
          break;
        default:
          return;
      }

      e.preventDefault();
      onMovePiece(selectedPieceId, dx, dy, dz);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPieceId, enabled, onMovePiece, onRotatePiece]);
}
