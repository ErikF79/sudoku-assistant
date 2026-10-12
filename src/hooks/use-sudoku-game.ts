'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  type NextStep,
  type SudokuBoard,
  calculateNextStep,
  cloneBoard,
  createEmptyBoard,
  findConflicts,
  isBoardComplete,
  solveBoard,
  stringToBoard,
} from '@/lib/sudoku';

interface Snapshot {
  board: SudokuBoard;
  given: boolean[][];
  notes: number[][][];
}

const emptyNotes = (): number[][][] =>
  Array(9)
    .fill(null)
    .map(() => Array(9).fill(null).map(() => [] as number[]));

const emptyFlags = (): boolean[][] =>
  Array(9)
    .fill(null)
    .map(() => Array(9).fill(false));

const cloneNotes = (notes: number[][][]): number[][][] =>
  notes.map((row) => row.map((cell) => [...cell]));

const cloneFlags = (flags: boolean[][]): boolean[][] =>
  flags.map((row) => [...row]);

export interface GameMessage {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  text: string;
}

export function useSudokuGame() {
  const [board, setBoard] = useState<SudokuBoard>(createEmptyBoard);
  const [given, setGiven] = useState<boolean[][]>(emptyFlags);
  const [notes, setNotes] = useState<number[][][]>(emptyNotes);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [lastStep, setLastStep] = useState<NextStep | null>(null);
  const [message, setMessage] = useState<GameMessage | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const conflicts = useMemo(() => findConflicts(board), [board]);
  const hintCells = useMemo(() => {
    const set = new Map<string, number>();
    if (!lastStep) return set;
    for (const cell of lastStep.highlights ?? []) {
      if (cell.row >= 0 && cell.col >= 0) set.set(`${cell.row}-${cell.col}`, 0);
    }
    return set;
  }, [lastStep]);
  const eliminatedCells = useMemo(() => {
    const set = new Map<string, number[]>();
    if (!lastStep?.eliminations) return set;
    for (const e of lastStep.eliminations) set.set(`${e.row}-${e.col}`, e.values);
    return set;
  }, [lastStep]);

  const snapshot = useCallback(
    (): Snapshot => ({ board: cloneBoard(board), given: cloneFlags(given), notes: cloneNotes(notes) }),
    [board, given, notes]
  );

  const pushHistory = useCallback(
    (snap: Snapshot) => {
      setHistory((prev) => [...prev.slice(-199), snap]);
      setFuture([]);
    },
    []
  );

  const applySnapshot = useCallback((snap: Snapshot) => {
    setBoard(cloneBoard(snap.board));
    setGiven(cloneFlags(snap.given));
    setNotes(cloneNotes(snap.notes));
    setLastStep(null);
  }, []);

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const snap = history[history.length - 1];
    setFuture((f) => [...f, snapshot()]);
    applySnapshot(snap);
    setHistory((h) => h.slice(0, -1));
  }, [history, snapshot, applySnapshot]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const snap = future[future.length - 1];
    setHistory((h) => [...h, snapshot()]);
    applySnapshot(snap);
    setFuture((f) => f.slice(0, -1));
  }, [future, snapshot, applySnapshot]);

  const selectCell = useCallback((row: number, col: number) => {
    setSelected({ row, col });
  }, []);

  const moveSelection = useCallback((dRow: number, dCol: number) => {
    setSelected((prev) => {
      const row = prev?.row ?? 0;
      const col = prev?.col ?? 0;
      return {
        row: Math.min(8, Math.max(0, row + dRow)),
        col: Math.min(8, Math.max(0, col + dCol)),
      };
    });
  }, []);

  const enterValue = useCallback(
    (value: number) => {
      if (!selected) return;
      const { row, col } = selected;
      if (given[row][col]) return;

      pushHistory(snapshot());
      const nextBoard = cloneBoard(board);
      const nextNotes = cloneNotes(notes);

      if (notesMode && value !== 0) {
        const cellNotes = nextNotes[row][col];
        nextNotes[row][col] = cellNotes.includes(value)
          ? cellNotes.filter((v) => v !== value)
          : [...cellNotes, value].sort();
      } else {
        nextBoard[row][col] = value;
        nextNotes[row][col] = [];
      }

      setBoard(nextBoard);
      setNotes(nextNotes);
      setLastStep(null);
      setMessage(null);
    },
    [board, given, notes, notesMode, selected, pushHistory, snapshot]
  );

  const eraseSelected = useCallback(() => {
    if (!selected) return;
    const { row, col } = selected;
    if (given[row][col]) return;

    pushHistory(snapshot());
    const nextBoard = cloneBoard(board);
    nextBoard[row][col] = 0;
    const nextNotes = cloneNotes(notes);
    nextNotes[row][col] = [];
    setBoard(nextBoard);
    setNotes(nextNotes);
    setLastStep(null);
    setMessage(null);
  }, [board, given, notes, selected, pushHistory, snapshot]);

  const loadBoard = useCallback(
    (value: SudokuBoard) => {
      pushHistory(snapshot());
      setBoard(cloneBoard(value));
      setGiven(value.map((row) => row.map((cell) => cell !== 0)));
      setNotes(emptyNotes());
      setSelected(null);
      setLastStep(null);
      setMessage({
        type: 'info',
        title: 'Puzzle caricato',
        text: 'Inserisci i numeri mancanti o chiedi il prossimo passo.',
      });
    },
    [pushHistory, snapshot]
  );

  const loadFromString = useCallback(
    (value: string): boolean => {
      const parsed = stringToBoard(value);
      if (!parsed) {
        setMessage({ type: 'error', title: 'Import non valido', text: 'Serve una stringa di 81 caratteri (1-9 o . per le vuote).' });
        return false;
      }
      loadBoard(parsed);
      return true;
    },
    [loadBoard]
  );

  const findNextStep = useCallback(() => {
    const step = calculateNextStep(board);
    setLastStep(step);
    if (!step) return;

    if (step.strategy === 'complete') {
      setMessage({ type: 'success', title: 'Puzzle completato', text: step.explanation });
      return;
    }
    if (step.strategy === 'invalid') {
      setMessage({ type: 'error', title: step.strategyLabel, text: step.explanation });
      return;
    }
    if (step.value === 0) {
      setMessage({ type: 'info', title: step.strategyLabel, text: step.explanation });
      return;
    }

    pushHistory(snapshot());
    const nextBoard = cloneBoard(board);
    nextBoard[step.row][step.col] = step.value;
    const nextNotes = cloneNotes(notes);
    nextNotes[step.row][step.col] = [];
    setBoard(nextBoard);
    setNotes(nextNotes);
    setSelected({ row: step.row, col: step.col });
    setMessage({ type: 'success', title: `${step.strategyLabel}`, text: step.explanation });
  }, [board, notes, pushHistory, snapshot]);

  const solveAll = useCallback(() => {
    const solved = solveBoard(board);
    if (!solved) {
      setMessage({ type: 'error', title: 'Impossibile risolvere', text: 'Il puzzle contiene contraddizioni o non ha soluzione.' });
      return;
    }
    pushHistory(snapshot());
    setBoard(solved);
    setNotes(emptyNotes());
    setLastStep(null);
    setMessage({ type: 'success', title: 'Risolto', text: 'Il puzzle è stato completato automaticamente.' });
  }, [board, pushHistory, snapshot]);

  const reset = useCallback(() => {
    pushHistory(snapshot());
    setBoard(createEmptyBoard());
    setGiven(emptyFlags());
    setNotes(emptyNotes());
    setSelected(null);
    setLastStep(null);
    setMessage(null);
  }, [pushHistory, snapshot]);

  const clearEntries = useCallback(() => {
    pushHistory(snapshot());
    const nextBoard = board.map((row, r) => row.map((cell, c) => (given[r][c] ? cell : 0)));
    setBoard(nextBoard);
    setNotes(emptyNotes());
    setLastStep(null);
    setMessage(null);
  }, [board, given, pushHistory, snapshot]);

  return {
    board,
    given,
    notes,
    selected,
    notesMode,
    lastStep,
    message,
    conflicts,
    hintCells,
    eliminatedCells,
    canUndo,
    canRedo,
    isComplete: isBoardComplete(board),
    setNotesMode,
    selectCell,
    moveSelection,
    enterValue,
    eraseSelected,
    findNextStep,
    solveAll,
    reset,
    clearEntries,
    undo,
    redo,
    loadBoard,
    loadFromString,
  };
}
