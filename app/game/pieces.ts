import { TileType } from './tiles';

// Each piece is defined as an array of [row, col] offsets from origin (0,0)
// Pieces can be rotated (90°, 180°, 270°) and flipped (mirror)
export interface GamePiece {
  name: string;
  cells: [number, number][];
  terrainOptions: TileType[][]; // Each option is a list of terrain types (one per cell, or one for all)
  time: number;
  coinOnRuin?: boolean; // If placed on a ruin, gain a coin
}

// All 13 explore cards from the base Cartographers game
// Cells are [row, col] offsets where [0,0] is the origin
export const GAME_PIECES: GamePiece[] = [
  // === SINGLE TERRAIN CARDS ===
  {
    name: "Sentinel Wood",
    cells: [[0, 0], [1, 0], [1, 1], [2, 1]],
    terrainOptions: [["forest"]],
    time: 1,
  },
  {
    name: "Forgotten Forest",
    cells: [[0, 0], [0, 1], [0, 2], [0, 3]],
    terrainOptions: [["forest"]],
    time: 1,
  },
  {
    name: "Farmland",
    cells: [[0, 0], [0, 1], [1, 0], [1, 1]],
    terrainOptions: [["farm"]],
    time: 1,
  },
  {
    name: "Hamlet",
    cells: [[0, 0], [0, 1], [0, 2]],
    terrainOptions: [["village"]],
    time: 1,
  },
  {
    name: "Great River",
    cells: [[0, 0], [1, 0], [2, 0]],
    terrainOptions: [["water"]],
    time: 1,
  },
  {
    name: "Marshlands",
    cells: [[0, 0], [1, 0], [1, 1]],
    terrainOptions: [["water"]],
    time: 1,
  },

  // === DUAL TERRAIN CARDS (player picks one shape + one terrain combo) ===
  {
    name: "Treetop Village",
    cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]],
    terrainOptions: [["forest"], ["village"]],
    time: 2,
  },
  {
    name: "Hinterland Stream",
    cells: [[0, 0], [0, 1], [1, 1], [1, 2]],
    terrainOptions: [["farm"], ["water"]],
    time: 2,
  },
  {
    name: "Homestead",
    cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
    terrainOptions: [["farm"], ["village"]],
    time: 2,
  },
  {
    name: "Orchard",
    cells: [[0, 0], [1, 0], [2, 0], [2, 1]],
    terrainOptions: [["forest"], ["farm"]],
    time: 2,
  },
  {
    name: "Fishing Village",
    cells: [[0, 0], [0, 1], [1, 1], [1, 2]],
    terrainOptions: [["village"], ["water"]],
    time: 2,
  },
  {
    name: "Outpost",
    cells: [[0, 0], [0, 1], [1, 0]],
    terrainOptions: [["forest"], ["village"]],
    time: 2,
  },
  {
    name: "Temple",
    cells: [[0, 0], [0, 1], [1, 1], [2, 0], [2, 1]],
    terrainOptions: [["village"], ["farm"]],
    time: 2,
  },

  // === SPECIAL ===
  {
    name: "Riftlands",
    cells: [[0, 0]],
    terrainOptions: [["forest"], ["village"], ["farm"], ["water"], ["monster"]],
    time: 0,
  },
];

// Rotate a piece 90° clockwise
export function rotatePiece(cells: [number, number][]): [number, number][] {
  // [row, col] -> [col, -row] then normalize to non-negative
  const rotated = cells.map(([r, c]): [number, number] => [c, -r]);
  const minRow = Math.min(...rotated.map(([r]) => r));
  const minCol = Math.min(...rotated.map(([, c]) => c));
  return rotated.map(([r, c]): [number, number] => [r - minRow, c - minCol]);
}

// Flip a piece horizontally (mirror)
export function flipPiece(cells: [number, number][]): [number, number][] {
  const maxCol = Math.max(...cells.map(([, c]) => c));
  return cells.map(([r, c]): [number, number] => [r, maxCol - c]);
}

// Get all 8 unique orientations of a piece (4 rotations × 2 flips)
export function getAllOrientations(cells: [number, number][]): [number, number][][] {
  const orientations: [number, number][][] = [];
  const seen = new Set<string>();

  let current = cells;
  for (let flip = 0; flip < 2; flip++) {
    for (let rot = 0; rot < 4; rot++) {
      // Normalize: sort cells to create a canonical form
      const normalized = [...current].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const key = JSON.stringify(normalized);
      if (!seen.has(key)) {
        seen.add(key);
        orientations.push(normalized);
      }
      current = rotatePiece(current);
    }
    current = flipPiece(cells);
  }

  return orientations;
}

// Apply a piece at a given board position, returning absolute cell positions
export function placePiece(
  cells: [number, number][],
  boardRow: number,
  boardCol: number
): [number, number][] {
  return cells.map(([r, c]): [number, number] => [boardRow + r, boardCol + c]);
}

// Check if all cells of a placed piece are within bounds (11x11 board)
export function isValidPlacement(
  cells: [number, number][],
  boardRow: number,
  boardCol: number,
  existingSelections: { row: number; column: number }[],
  blockedSpaces: [number, number][],
  mountains: [number, number][]
): boolean {
  const placed = placePiece(cells, boardRow, boardCol);

  return placed.every(([r, c]) => {
    // Within bounds
    if (r < 0 || r > 10 || c < 0 || c > 10) return false;
    // Not on existing tile
    if (existingSelections.some(s => s.row === r && s.column === c)) return false;
    // Not on blocked space
    if (blockedSpaces.some(b => b[0] === c && b[1] === r)) return false;
    // Not on mountain
    if (mountains.some(m => m[0] === c && m[1] === r)) return false;
    return true;
  });
}
