'use client';

import { Eraser, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberPadProps {
  notesMode: boolean;
  onDigit: (value: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
}

export function NumberPad({ notesMode, onDigit, onErase, onToggleNotes }: NumberPadProps) {
  return (
    <div className="w-full space-y-2">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onDigit(n)}
            className={cn(
              'flex h-12 items-center justify-center rounded-lg border border-primary/30 bg-card text-xl font-semibold text-primary shadow-sm transition',
              'hover:bg-primary/10 active:scale-95 sm:h-14 sm:text-2xl'
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={onToggleNotes}
          aria-pressed={notesMode}
          className={cn(
            'flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border text-xs font-medium shadow-sm transition active:scale-95 sm:h-14',
            notesMode
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-primary/30 bg-card text-foreground hover:bg-primary/10'
          )}
        >
          <Pencil className="h-5 w-5" />
          Note
        </button>
      </div>
      <button
        type="button"
        onClick={onErase}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-card text-sm font-medium text-foreground shadow-sm transition hover:bg-primary/10 active:scale-[.99]"
      >
        <Eraser className="h-4 w-4" />
        Cancella cella selezionata
      </button>
    </div>
  );
}
