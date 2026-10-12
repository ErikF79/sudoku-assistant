'use client';

import { useEffect, useRef, useState } from 'react';
import { useSudokuGame } from '@/hooks/use-sudoku-game';
import { SudokuGrid } from '@/components/sudoku-grid';
import { NumberPad } from '@/components/number-pad';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  boardToString,
  SAMPLE_PUZZLES,
} from '@/lib/sudoku';
import {
  CheckCheck,
  ClipboardCopy,
  Eraser,
  Lightbulb,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const messageStyles: Record<string, string> = {
  info: 'bg-primary/10 border-primary/30 text-foreground',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-foreground',
  warning: 'bg-amber-500/10 border-amber-500/30 text-foreground',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
};

export default function Home() {
  const game = useSudokuGame();
  const [importValue, setImportValue] = useState('');
  const [copied, setCopied] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        game.enterValue(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        game.eraseSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        game.moveSelection(-1, 0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        game.moveSelection(1, 0);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        game.moveSelection(0, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        game.moveSelection(0, 1);
      } else if (e.key.toLowerCase() === 'n') {
        game.setNotesMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game]);

  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(boardToString(game.board));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleImport = () => {
    if (game.loadFromString(importValue)) setImportValue('');
  };

  return (
    <main className="min-h-screen bg-background font-body">
      <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Aiuto Sudoku
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Inserisci il puzzle e ricevi suggerimenti spiegati, un passo alla volta.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* Colonna griglia + tastierino */}
          <section className="flex flex-col items-center gap-4">
            <SudokuGrid
              board={game.board}
              given={game.given}
              notes={game.notes}
              selected={game.selected}
              conflicts={game.conflicts}
              hintCells={game.hintCells}
              eliminatedCells={game.eliminatedCells}
              onSelect={game.selectCell}
            />
            <div className="w-full max-w-[min(92vw,560px)]">
              <NumberPad
                notesMode={game.notesMode}
                onDigit={game.enterValue}
                onErase={game.eraseSelected}
                onToggleNotes={() => game.setNotesMode((v) => !v)}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Tastiera: frecce per muoverti, 1-9 per inserire, 0/Backspace per cancellare, N per le note.
              </p>
            </div>
          </section>

          {/* Colonna controlli */}
          <section className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Controlli</CardTitle>
                <CardDescription>Chiedi aiuto o gestisci la griglia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={game.findNextStep} className="col-span-2 h-12 text-base">
                    <Lightbulb className="mr-2 h-5 w-5" />
                    Trova il prossimo passo
                  </Button>
                  <Button onClick={game.solveAll} variant="secondary" className="h-11">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Risolvi tutto
                  </Button>
                  <Button onClick={game.clearEntries} variant="secondary" className="h-11">
                    <Eraser className="mr-2 h-4 w-4" />
                    Pulisci
                  </Button>
                  <Button
                    onClick={game.undo}
                    variant="outline"
                    className="h-11"
                    disabled={!game.canUndo}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Annulla
                  </Button>
                  <Button
                    onClick={game.redo}
                    variant="outline"
                    className="h-11"
                    disabled={!game.canRedo}
                  >
                    <Redo2 className="mr-2 h-4 w-4" />
                    Ripeti
                  </Button>
                  <Button onClick={game.reset} variant="outline" className="col-span-2 h-11">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Resetta griglia
                  </Button>
                </div>

                <div
                  aria-live="polite"
                  className={cn(
                    'min-h-[104px] rounded-lg border p-3 text-sm transition',
                    game.message ? messageStyles[game.message.type] : 'border-dashed border-border text-muted-foreground'
                  )}
                >
                  {game.message ? (
                    <div className="animate-in fade-in">
                      <div className="mb-1 flex items-center gap-2 font-semibold">
                        {game.message.type === 'success' && <CheckCheck className="h-4 w-4" />}
                        {game.message.title}
                      </div>
                      <p className="leading-relaxed opacity-90">{game.message.text}</p>
                    </div>
                  ) : (
                    <p className="flex h-full items-center justify-center text-center">
                      {game.isComplete
                        ? 'Puzzle completato! 🎉'
                        : 'Inserisci i numeri del puzzle, poi premi "Trova il prossimo passo".'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Puzzle di esempio</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {SAMPLE_PUZZLES.map((p) => (
                  <Button
                    key={p.name}
                    variant="outline"
                    size="sm"
                    onClick={() => game.loadBoard(p.board)}
                  >
                    {p.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Importa / Esporta</CardTitle>
                <CardDescription>Stringa di 81 caratteri (1-9 o . per le celle vuote).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={importRef}
                    value={importValue}
                    onChange={(e) => setImportValue(e.target.value)}
                    placeholder="53..7....6..195..."
                    onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                  />
                  <Button onClick={handleImport} variant="secondary">
                    Importa
                  </Button>
                </div>
                <Button onClick={handleExport} variant="outline" className="w-full">
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  {copied ? 'Copiato!' : 'Copia stringa corrente'}
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Funziona offline · Installabile come app · Nessun dato inviato in rete
        </footer>
      </div>
    </main>
  );
}
