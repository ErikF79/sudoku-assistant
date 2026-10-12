'use client';

import type { SudokuBoard } from '@/lib/sudoku';
import { cn } from '@/lib/utils';

interface SudokuGridProps {
  board: SudokuBoard;
  given: boolean[][];
  notes: number[][][];
  selected: { row: number; col: number } | null;
  conflicts: Set<string>;
  hintCells: Map<string, number>;
  eliminatedCells: Map<string, number[]>;
  onSelect: (row: number, col: number) => void;
}

export function SudokuGrid({
  board,
  given,
  notes,
  selected,
  conflicts,
  hintCells,
  eliminatedCells,
  onSelect,
}: SudokuGridProps) {
  return (
    <div
      role="grid"
      aria-label="Griglia Sudoku"
      className="grid grid-cols-9 aspect-square w-full max-w-[min(92vw,560px)] overflow-hidden rounded-xl border-2 border-primary/40 bg-card shadow-xl"
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const key = `${rowIndex}-${colIndex}`;
          const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
          const isGiven = given[rowIndex][colIndex];
          const hasConflict = conflicts.has(key);
          const isHint = hintCells.has(key);
          const isEliminated = eliminatedCells.has(key);
          const cellNotes = notes[rowIndex][colIndex];

          const sameRow = selected?.row === rowIndex;
          const sameCol = selected?.col === colIndex;
          const sameBox =
            selected &&
            Math.floor(selected.row / 3) === Math.floor(rowIndex / 3) &&
            Math.floor(selected.col / 3) === Math.floor(colIndex / 3);

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              onClick={() => onSelect(rowIndex, colIndex)}
              aria-label={`Riga ${rowIndex + 1} colonna ${colIndex + 1}${
                cell ? `, valore ${cell}` : ', vuota'
              }`}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-none border border-foreground/10 transition-colors duration-150 select-none',
                'text-xl font-medium sm:text-2xl md:text-[26px]',
                colIndex % 3 === 2 && colIndex !== 8 && 'border-r-2 border-r-primary/50',
                rowIndex % 3 === 2 && rowIndex !== 8 && 'border-b-2 border-b-primary/50',
                (sameRow || sameCol || sameBox) && !isSelected && 'bg-primary/10',
                isEliminated && 'bg-amber-500/20',
                isHint && 'bg-accent/25',
                isSelected && 'z-10 bg-primary/25 ring-2 ring-primary',
                (isGiven || cell !== 0) &&
                  cn(
                    'font-semibold',
                    isGiven ? 'text-foreground' : 'text-primary',
                    hasConflict && 'text-destructive'
                  ),
                hasConflict && 'bg-destructive/20',
                !isSelected && 'hover:bg-primary/15 active:bg-primary/25'
              )}
            >
              {cell !== 0 ? (
                cell
              ) : cellNotes.length > 0 ? (
                <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-[1px] text-[9px] leading-none text-muted-foreground sm:text-[11px]">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <span key={n} className="flex items-center justify-center">
                      {cellNotes.includes(n) ? n : ''}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  );
}
