# Aiuto Sudoku

Assistente per risolvere puzzle **Sudoku 9x9** un passo alla volta, con la **spiegazione della strategia** usata a ogni mossa. Funziona **completamente offline**, è **installabile** come app (PWA) e si adatta a PC, tablet e smartphone.

## Funzionalità

- **Griglia interattiva** touch-friendly con selezione, evidenziazione di riga/colonna/blocco e conflitti in rosso.
- **Suggerimenti passo-passo** con spiegazione della tecnica (Single Nudo, Single Nascosto, Coppia Nuda, Puntamento).
- **Modalità Note** (candidati) per annotare le possibilità di ogni cella.
- **Risolvi tutto** con risolutore completo (backtracking).
- **Undo / Redo**, pulizia degli inserimenti, reset.
- **Puzzle di esempio** per difficoltà e **import/export** tramite stringa di 81 caratteri.
- **Tema chiaro/scuro** e scorciatoie da tastiera.
- **PWA**: installabile e offline (manifest + service worker).

## Tecnologie

- [Next.js 14](https://nextjs.org/) (App Router, `output: export`) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix)
- Logica Sudoku in TypeScript puro, senza servizi esterni

## Avvio locale

Requisiti: Node.js 20+.

```bash
npm install
npm run dev
```

Apri http://localhost:9002

In alternativa, su Windows, avvia `Avvia Sudoku.bat` e scegli una modalità dal menu.

## Build di produzione (PWA)

```bash
npm run build      # genera la cartella out/ (sito statico)
node serve-preview.mjs   # anteprima su http://localhost:4173
```

Il service worker si attiva solo nella build di produzione. Per installare la PWA: apri l'anteprima e usa *Installa app* dal menu del browser.

## Struttura

```
src/
  app/            # pagine e layout (Next.js App Router)
  components/     # griglia, number pad, toggle tema, UI (shadcn)
  hooks/          # stato di gioco (use-sudoku-game)
  lib/sudoku.ts   # motore: candidati, strategie, validazione, solver
public/
  manifest.webmanifest, sw.js, icons/
```

## Note

Progetto a scopo didattico/personale. Nessun dato viene inviato in rete.
