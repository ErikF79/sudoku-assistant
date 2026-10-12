export type SudokuBoard = number[][];
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CandidateGrid = number[][][];
export type CellRef = { row: number; col: number };

export type StrategyId =
  | 'naked-single'
  | 'hidden-single'
  | 'naked-pair'
  | 'hidden-pair'
  | 'pointing-pair'
  | 'advanced'
  | 'invalid'
  | 'complete';

export interface NextStep {
  strategy: StrategyId;
  strategyLabel: string;
  row: number;
  col: number;
  value: number;
  explanation: string;
  /** Celle coinvolte nella strategia (per highlight). */
  highlights?: CellRef[];
  /** Candidati eliminati (per le strategie di riduzione). */
  eliminations?: { row: number; col: number; values: number[] }[];
}

export const cloneBoard = (board: SudokuBoard): SudokuBoard =>
  board.map((row) => [...row]);

export const createEmptyBoard = (): SudokuBoard =>
  Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

export const isBoardEmpty = (board: SudokuBoard): boolean =>
  board.every((row) => row.every((cell) => cell === 0));

export const isBoardComplete = (board: SudokuBoard): boolean =>
  board.every((row) => row.every((cell) => cell >= 1 && cell <= 9)) &&
  findConflicts(board).size === 0;

/** Restituisce l'insieme di celle (chiave `r-c`) in conflitto. */
export const findConflicts = (board: SudokuBoard): Set<string> => {
  const conflicts = new Set<string>();
  const markDuplicate = (cells: CellRef[]) => {
    const seen = new Map<number, CellRef[]>();
    for (const cell of cells) {
      const value = board[cell.row][cell.col];
      if (value === 0) continue;
      const list = seen.get(value) ?? [];
      list.push(cell);
      seen.set(value, list);
    }
    for (const list of seen.values()) {
      if (list.length > 1) {
        for (const cell of list) conflicts.add(`${cell.row}-${cell.col}`);
      }
    }
  };

  for (let i = 0; i < 9; i++) {
    markDuplicate(Array.from({ length: 9 }, (_, j) => ({ row: i, col: j })));
    markDuplicate(Array.from({ length: 9 }, (_, j) => ({ row: j, col: i })));
  }
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const cells: CellRef[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          cells.push({ row: boxRow + r, col: boxCol + c });
        }
      }
      markDuplicate(cells);
    }
  }
  return conflicts;
};

const usedInUnits = (board: SudokuBoard, row: number, col: number): Set<number> => {
  const used = new Set<number>();
  for (let i = 0; i < 9; i++) {
    used.add(board[row][i]);
    used.add(board[i][col]);
  }
  const sr = row - (row % 3);
  const sc = col - (col % 3);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      used.add(board[sr + r][sc + c]);
    }
  }
  used.delete(0);
  return used;
};

export const getCandidates = (board: SudokuBoard, row: number, col: number): number[] => {
  if (board[row][col] !== 0) return [];
  const used = usedInUnits(board, row, col);
  const result: number[] = [];
  for (let n = 1; n <= 9; n++) if (!used.has(n)) result.push(n);
  return result;
};

export const computeCandidateGrid = (board: SudokuBoard): CandidateGrid => {
  const grid: CandidateGrid = [];
  for (let row = 0; row < 9; row++) {
    const rowArr: number[][] = [];
    for (let col = 0; col < 9; col++) {
      rowArr.push(getCandidates(board, row, col));
    }
    grid.push(rowArr);
  }
  return grid;
};

// ---------- Strategie ----------

const findNakedSingle = (board: SudokuBoard): NextStep | null => {
  const candidates = computeCandidateGrid(board);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;
      const cell = candidates[row][col];
      if (cell.length === 1) {
        return {
          strategy: 'naked-single',
          strategyLabel: 'Single Nudo',
          row,
          col,
          value: cell[0],
          explanation:
            `La cella R${row + 1}C${col + 1} può contenere solo il ${cell[0]}: è l'unico numero ` +
            `assente dalla riga ${row + 1}, dalla colonna ${col + 1} e dal blocco 3x3. Strategia "Single Nudo".`,
          highlights: [{ row, col }],
        };
      }
    }
  }
  return null;
};

const findHiddenSingle = (board: SudokuBoard): NextStep | null => {
  const candidates = computeCandidateGrid(board);

  const unitTypes: { label: string; cells: CellRef[]; describe: (n: number) => string }[] = [];
  for (let i = 0; i < 9; i++) {
    unitTypes.push({
      label: 'riga',
      cells: Array.from({ length: 9 }, (_, j) => ({ row: i, col: j })),
      describe: (n) => `Nella riga ${i + 1}`,
    });
  }
  for (let i = 0; i < 9; i++) {
    unitTypes.push({
      label: 'colonna',
      cells: Array.from({ length: 9 }, (_, j) => ({ row: j, col: i })),
      describe: (n) => `Nella colonna ${i + 1}`,
    });
  }
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const cells: CellRef[] = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) cells.push({ row: br + r, col: bc + c });
      unitTypes.push({
        label: 'blocco',
        cells,
        describe: () => `Nel blocco che parte da R${br + 1}C${bc + 1}`,
      });
    }
  }

  for (const unit of unitTypes) {
    const present = new Set<number>();
    for (const cell of unit.cells) if (board[cell.row][cell.col] !== 0) present.add(board[cell.row][cell.col]);
    for (let n = 1; n <= 9; n++) {
      if (present.has(n)) continue;
      const spots = unit.cells.filter((cell) => candidates[cell.row][cell.col].includes(n));
      if (spots.length === 1) {
        const { row, col } = spots[0];
        return {
          strategy: 'hidden-single',
          strategyLabel: 'Single Nascosto',
          row,
          col,
          value: n,
          explanation:
            `${unit.describe(n)}, il numero ${n} può andare solo in R${row + 1}C${col + 1} ` +
            `anche se quella cella aveva altre opzioni. Strategia "Single Nascosto".`,
          highlights: [spots[0]],
        };
      }
    }
  }
  return null;
};

const findNakedPair = (board: SudokuBoard): NextStep | null => {
  const candidates = computeCandidateGrid(board);

  const scanUnit = (cells: CellRef[], unitName: string): NextStep | null => {
    const pairs = cells.filter((cell) => candidates[cell.row][cell.col].length === 2);
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const a = candidates[pairs[i].row][pairs[i].col];
        const b = candidates[pairs[j].row][pairs[j].col];
        if (a[0] !== b[0] || a[1] !== b[1]) continue;
        const pairValues = a;
        const eliminations: NextStep['eliminations'] = [];
        let count = 0;
        for (const cell of cells) {
          if (cell === pairs[i] || cell === pairs[j]) continue;
          const removed = candidates[cell.row][cell.col].filter((v) => pairValues.includes(v));
          if (removed.length) {
            eliminations.push({ row: cell.row, col: cell.col, values: removed });
            count += removed.length;
          }
        }
        if (count > 0) {
          return {
            strategy: 'naked-pair',
            strategyLabel: 'Coppia Nuda',
            row: pairs[i].row,
            col: pairs[i].col,
            value: 0,
            explanation:
              `In ${unitName} le celle R${pairs[i].row + 1}C${pairs[i].col + 1} e ` +
              `R${pairs[j].row + 1}C${pairs[j].col + 1} contengono solo {${pairValues.join(', ')}}: ` +
              `possiamo rimuovere questi candidati dalle altre celle della stessa unità. Strategia "Coppia Nuda".`,
            highlights: [pairs[i], pairs[j]],
            eliminations,
          };
        }
      }
    }
    return null;
  };

  for (let i = 0; i < 9; i++) {
    const rowCells = Array.from({ length: 9 }, (_, j) => ({ row: i, col: j }));
    const found = scanUnit(rowCells, `riga ${i + 1}`);
    if (found) return found;
  }
  for (let i = 0; i < 9; i++) {
    const colCells = Array.from({ length: 9 }, (_, j) => ({ row: j, col: i }));
    const found = scanUnit(colCells, `colonna ${i + 1}`);
    if (found) return found;
  }
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const cells: CellRef[] = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) cells.push({ row: br + r, col: bc + c });
      const found = scanUnit(cells, `blocco R${br + 1}C${bc + 1}`);
      if (found) return found;
    }
  }
  return null;
};

const findPointingPair = (board: SudokuBoard): NextStep | null => {
  const candidates = computeCandidateGrid(board);
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      for (let n = 1; n <= 9; n++) {
        const spots: CellRef[] = [];
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++) {
            const row = br + r;
            const col = bc + c;
            if (board[row][col] === 0 && candidates[row][col].includes(n)) spots.push({ row, col });
          }
        if (spots.length < 2) continue;
        const sameRow = spots.every((s) => s.row === spots[0].row);
        const sameCol = spots.every((s) => s.col === spots[0].col);

        if (sameRow) {
          const row = spots[0].row;
          const eliminations: NextStep['eliminations'] = [];
          for (let col = 0; col < 9; col++) {
            if (col >= bc && col < bc + 3) continue;
            if (candidates[row][col].includes(n))
              eliminations.push({ row, col, values: [n] });
          }
          if (eliminations.length) {
            return {
              strategy: 'pointing-pair',
              strategyLabel: 'Puntamento (Pointing Pair)',
              row,
              col: spots[0].col,
              value: 0,
              explanation:
                `Nel blocco R${br + 1}C${bc + 1} il ${n} può stare solo nella riga ${row + 1}: ` +
                `quindi nelle altre celle della riga ${row + 1} il ${n} va eliminato. Strategia "Puntamento".`,
              highlights: spots,
              eliminations,
            };
          }
        }
        if (sameCol) {
          const col = spots[0].col;
          const eliminations: NextStep['eliminations'] = [];
          for (let row = 0; row < 9; row++) {
            if (row >= br && row < br + 3) continue;
            if (candidates[row][col].includes(n))
              eliminations.push({ row, col, values: [n] });
          }
          if (eliminations.length) {
            return {
              strategy: 'pointing-pair',
              strategyLabel: 'Puntamento (Pointing Pair)',
              row: spots[0].row,
              col,
              value: 0,
              explanation:
                `Nel blocco R${br + 1}C${bc + 1} il ${n} può stare solo nella colonna ${col + 1}: ` +
                `quindi nelle altre celle della colonna ${col + 1} il ${n} va eliminato. Strategia "Puntamento".`,
              highlights: spots,
              eliminations,
            };
          }
        }
      }
    }
  }
  return null;
};

// Risolutore completo (backtracking) usato come fallback e per "risolvi tutto".
export const solveBoard = (input: SudokuBoard): SudokuBoard | null => {
  const board = cloneBoard(input);
  const findEmpty = (): CellRef | null => {
    for (let row = 0; row < 9; row++)
      for (let col = 0; col < 9; col++) if (board[row][col] === 0) return { row, col };
    return null;
  };

  const recurse = (): boolean => {
    const empty = findEmpty();
    if (!empty) return true;
    const { row, col } = empty;
    for (let n = 1; n <= 9; n++) {
      if (getCandidates(board, row, col).includes(n)) {
        board[row][col] = n;
        if (recurse()) return true;
        board[row][col] = 0;
      }
    }
    return false;
  };

  return recurse() ? board : null;
};

const findAdvancedFallback = (board: SudokuBoard): NextStep | null => {
  const solved = solveBoard(board);
  if (!solved) return null;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        return {
          strategy: 'advanced',
          strategyLabel: 'Tecnica avanzata',
          row,
          col,
          value: solved[row][col],
          explanation:
            `Nessuna tecnica di base disponibile. La soluzione completa calcola che R${row + 1}C${col + 1} ` +
            `deve valere ${solved[row][col]}. Suggerimento della soluzione: prova a ragionare con tecniche più avanzate.`,
          highlights: [{ row, col }],
        };
      }
    }
  }
  return null;
};

const findInvalid = (board: SudokuBoard): NextStep | null => {
  const conflicts = findConflicts(board);
  if (conflicts.size > 0) {
    const [first] = [...conflicts];
    const [row, col] = first.split('-').map(Number);
    return {
      strategy: 'invalid',
      strategyLabel: 'Configurazione non valida',
      row,
      col,
      value: 0,
      explanation:
        `Ci sono numeri ripetuti (celle evidenziate in rosso). Controlla righe, colonne e blocchi prima di continuare.`,
      highlights: [...conflicts].map((key) => {
        const [r, c] = key.split('-').map(Number);
        return { row: r, col: c };
      }),
    };
  }
  return null;
};

/**
 * Calcola il prossimo passo logico, dalla tecnica più semplice alla più avanzata.
 * Restituisce anche i casi "invalid" e "complete".
 */
export const calculateNextStep = (board: SudokuBoard): NextStep | null => {
  const invalid = findInvalid(board);
  if (invalid) return invalid;

  if (isBoardComplete(board)) {
    return {
      strategy: 'complete',
      strategyLabel: 'Puzzle completato',
      row: -1,
      col: -1,
      value: 0,
      explanation: 'Complimenti! Il Sudoku è risolto correttamente. 🎉',
    };
  }

  const strategies = [findNakedSingle, findHiddenSingle, findNakedPair, findPointingPair];
  for (const strategy of strategies) {
    const step = strategy(board);
    if (step) return step;
  }

  return findAdvancedFallback(board);
};

// ---------- Import / export ----------

export const boardToString = (board: SudokuBoard): string =>
  board.map((row) => row.map((cell) => (cell === 0 ? '.' : cell)).join('')).join('');

export const stringToBoard = (value: string): SudokuBoard | null => {
  const clean = value.replace(/[^0-9.]/g, '');
  if (clean.length !== 81) return null;
  const board = createEmptyBoard();
  for (let i = 0; i < 81; i++) {
    const ch = clean[i];
    board[Math.floor(i / 9)][i % 9] = ch === '.' || ch === '0' ? 0 : Number(ch);
  }
  return board;
};

export const SAMPLE_PUZZLES: { name: string; difficulty: string; board: SudokuBoard }[] = [
  {
    name: 'Facile',
    difficulty: 'Facile',
    board: stringToBoard(
      '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'
    )!,
  },
  {
    name: 'Medio',
    difficulty: 'Medio',
    board: stringToBoard(
      '000260701680070090190004500820100040004602900050003028009300074040050036703018000'
    )!,
  },
  {
    name: 'Difficile',
    difficulty: 'Difficile',
    board: stringToBoard(
      '8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..'
    )!,
  },
];
