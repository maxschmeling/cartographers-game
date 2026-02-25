import { BoardType } from '../game/boardConfigs';

export type GameStatus = 'active' | 'completed';

export type Opponent = {
  name: string;
  position: 'top' | 'right' | 'bottom' | 'left';
};

export type SeasonScoreData = {
  edictOne: number;
  edictTwo: number;
  coinCount: number;
  monsterCount: number;
};

export type TileSelection = {
  row: number;
  column: number;
  type: string;
};

export type GameMeta = {
  id: string;
  title: string;
  cartographer: string;
  boardType: BoardType;
  status: GameStatus;
  opponents: Opponent[];
  createdAt: string;
  updatedAt: string;
};

export type GameState = {
  selections: TileSelection[];
  coinCount: number;
  seasonScores: SeasonScoreData[];
};

const GAMES_INDEX_KEY = 'cartographers-games';
const GAME_PREFIX = 'cartographers-game-';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getGamesList(): GameMeta[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(GAMES_INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveGamesList(games: GameMeta[]) {
  localStorage.setItem(GAMES_INDEX_KEY, JSON.stringify(games));
}

export function getGameMeta(id: string): GameMeta | null {
  return getGamesList().find(g => g.id === id) ?? null;
}

export function getGameState(id: string): GameState | null {
  const raw = localStorage.getItem(GAME_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveGameState(id: string, state: GameState) {
  localStorage.setItem(GAME_PREFIX + id, JSON.stringify(state));
  // Update updatedAt
  const games = getGamesList();
  const idx = games.findIndex(g => g.id === id);
  if (idx !== -1) {
    games[idx].updatedAt = new Date().toISOString();
    saveGamesList(games);
  }
}

export function updateGameMeta(id: string, updates: Partial<GameMeta>) {
  const games = getGamesList();
  const idx = games.findIndex(g => g.id === id);
  if (idx !== -1) {
    games[idx] = { ...games[idx], ...updates, updatedAt: new Date().toISOString() };
    saveGamesList(games);
  }
}

export function createGame(title: string, cartographer: string, boardType: BoardType): string {
  const id = generateId();
  const now = new Date().toISOString();
  const meta: GameMeta = {
    id,
    title,
    cartographer,
    boardType,
    status: 'active',
    opponents: [],
    createdAt: now,
    updatedAt: now,
  };
  const state: GameState = {
    selections: [],
    coinCount: 0,
    seasonScores: [
      { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
      { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
      { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
      { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
    ],
  };
  const games = getGamesList();
  games.unshift(meta);
  saveGamesList(games);
  saveGameState(id, state);
  return id;
}

export function getAllOpponentNames(): string[] {
  const games = getGamesList();
  const names = new Set<string>();
  games.forEach(g => g.opponents.forEach(o => names.add(o.name)));
  return Array.from(names).sort();
}

// Migrate old 'board' key to new format
export function migrateOldBoard() {
  if (typeof localStorage === 'undefined') return;
  const old = localStorage.getItem('board');
  if (!old) return;
  try {
    const parsed = JSON.parse(old);
    const id = createGame('Untitled Game', '', parsed.boardType || 'default');
    const state: GameState = {
      selections: parsed.selections || [],
      coinCount: parsed.coinCount || 0,
      seasonScores: parsed.seasonScores || [
        { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
        { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
        { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
        { edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
      ],
    };
    saveGameState(id, state);
    localStorage.removeItem('board');
  } catch {
    // ignore migration errors
  }
}
