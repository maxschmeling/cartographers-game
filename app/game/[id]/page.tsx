'use client';

import { useState, useReducer, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import { TileType } from '../tiles';
import MountainTile from '../tiles/MountainTile';
import RuinTile from '../tiles/RuinTile';
import StandardTile from '../tiles/StandardTile';
import BlockedTile from '../tiles/BlockedTile';
import Coin from '../Coin';
import SeasonScore from '../SeasonScore';
import { BoardType, boardConfigs } from '../boardConfigs';
import {
  GameMeta, GameState, Opponent,
  getGameMeta, getGameState, saveGameState, updateGameMeta,
  getAllOpponentNames,
} from '../../lib/gameStorage';

type SeasonScoreType = {
  edictOne: number;
  edictTwo: number;
  coinCount: number;
  monsterCount: number;
};

type TileSelection = {
  row: number;
  column: number;
  type: TileType;
};

type FullGameState = GameState & {
  boardType: BoardType;
};

type GameBoardAction =
  | { type: 'select-tile'; row: number; column: number; tileType: TileType }
  | { type: 'clear-tile'; row: number; column: number }
  | { type: 'set-season-score'; season: number; score: SeasonScoreType }
  | { type: 'set-coin-count'; coinCount: number };

function findAdjacentMountain(row: number, column: number, boardType: BoardType): [number, number] | null {
  const config = boardConfigs[boardType];
  const adjacentMountains = config.mountains.filter(mountain => {
    const rowDiff = Math.abs(mountain[1] - row);
    const columnDiff = Math.abs(mountain[0] - column);
    return (rowDiff === 0 && columnDiff === 1) || (rowDiff === 1 && columnDiff === 0);
  });
  return adjacentMountains.length ? adjacentMountains[0] : null;
}

function mountainIsSurrounded(selections: TileSelection[], mountain: [number, number]): boolean {
  const adjacentTiles = [
    [mountain[0] - 1, mountain[1]],
    [mountain[0] + 1, mountain[1]],
    [mountain[0], mountain[1] - 1],
    [mountain[0], mountain[1] + 1],
  ];
  return adjacentTiles.every(tile => selections.some(s => s.row === tile[1] && s.column === tile[0]));
}

function createReducer(gameId: string, boardType: BoardType) {
  return function gameReducer(state: GameState | null, action: GameBoardAction): GameState | null {
    if (!state) return null;
    const newState = { ...state };

    switch (action.type) {
      case 'select-tile':
        newState.selections = newState.selections.filter(s => s.row !== action.row || s.column !== action.column);
        newState.selections = [...newState.selections, { row: action.row, column: action.column, type: action.tileType }];
        const selAdj = findAdjacentMountain(action.row, action.column, boardType);
        if (selAdj && mountainIsSurrounded(newState.selections as TileSelection[], selAdj)) {
          newState.coinCount++;
        }
        break;
      case 'clear-tile':
        newState.selections = newState.selections.filter(s => s.row !== action.row || s.column !== action.column);
        const clrAdj = findAdjacentMountain(action.row, action.column, boardType);
        if (clrAdj && mountainIsSurrounded(state.selections as TileSelection[], clrAdj) && !mountainIsSurrounded(newState.selections as TileSelection[], clrAdj)) {
          newState.coinCount--;
        }
        break;
      case 'set-season-score':
        newState.seasonScores = [...newState.seasonScores];
        newState.seasonScores[action.season] = action.score;
        break;
      case 'set-coin-count':
        newState.coinCount = action.coinCount;
        break;
    }

    saveGameState(gameId, newState);
    return newState;
  };
}

export default function GamePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [board, dispatch] = useReducer(
    createReducer(id, 'default'), // placeholder, replaced once loaded
    null
  );

  // Opponent state
  const [newOpponentName, setNewOpponentName] = useState('');
  const [newOpponentPos, setNewOpponentPos] = useState<Opponent['position']>('top');
  const [opponentSuggestions, setOpponentSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [brush, setBrush] = useState<TileType>('village');
  const [seasonOneScore, setSeasonOneScore] = useState(0);
  const [seasonTwoScore, setSeasonTwoScore] = useState(0);
  const [seasonThreeScore, setSeasonThreeScore] = useState(0);
  const [seasonFourScore, setSeasonFourScore] = useState(0);

  // We need to re-create reducer with correct boardType after load.
  // Use a ref + force re-mount approach.
  const [boardType, setBoardType] = useState<BoardType>('default');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const reducerRef = useRef(createReducer(id, 'default'));

  // Actually, let's use a simpler state-based approach since useReducer init is tricky
  const [stateVersion, setStateVersion] = useState(0);

  useEffect(() => {
    const m = getGameMeta(id);
    if (!m) {
      router.push('/');
      return;
    }
    setMeta(m);
    setBoardType(m.boardType);
    const gs = getGameState(id);
    setGameState(gs);
    setLoaded(true);
  }, [id]);

  // Simple state management instead of useReducer for loaded game
  function dispatchAction(action: GameBoardAction) {
    setGameState(prev => {
      if (!prev) return null;
      const newState = { ...prev };
      const bt = meta?.boardType || 'default';

      switch (action.type) {
        case 'select-tile':
          newState.selections = prev.selections.filter(s => s.row !== action.row || s.column !== action.column);
          newState.selections = [...newState.selections, { row: action.row, column: action.column, type: action.tileType }];
          const selAdj = findAdjacentMountain(action.row, action.column, bt);
          if (selAdj && mountainIsSurrounded(newState.selections as TileSelection[], selAdj)) {
            newState.coinCount = prev.coinCount + 1;
          }
          break;
        case 'clear-tile':
          newState.selections = prev.selections.filter(s => s.row !== action.row || s.column !== action.column);
          const clrAdj = findAdjacentMountain(action.row, action.column, bt);
          if (clrAdj && mountainIsSurrounded(prev.selections as TileSelection[], clrAdj) && !mountainIsSurrounded(newState.selections as TileSelection[], clrAdj)) {
            newState.coinCount = prev.coinCount - 1;
          }
          break;
        case 'set-season-score':
          newState.seasonScores = [...prev.seasonScores];
          newState.seasonScores[action.season] = action.score;
          break;
        case 'set-coin-count':
          newState.coinCount = action.coinCount;
          break;
      }

      saveGameState(id, newState);
      return newState;
    });
  }

  if (!loaded || !meta || !gameState) return null;

  const config = boardConfigs[meta.boardType];
  const gameBoard = [];

  for (let row = 0; row < 11; row++) {
    for (let column = 0; column < 11; column++) {
      const key = `${row}x${column}`;
      const type = gameState.selections.find(s => s.row === row && s.column === column)?.type as TileType ?? null;

      if (config.blockedSpaces.some(b => b[0] === column && b[1] === row)) {
        gameBoard.push(<BlockedTile key={key} />);
      } else if (config.ruins.some(r => r[0] === column && r[1] === row)) {
        gameBoard.push(<RuinTile key={key} row={row} column={column} type={type} onClick={toggleTile} />);
      } else if (config.mountains.some(m => m[0] === column && m[1] === row)) {
        const hasCoin = config.coinMountains.some(c => c[0] === column && c[1] === row);
        gameBoard.push(<MountainTile key={key} hasCoin={hasCoin} />);
      } else {
        gameBoard.push(<StandardTile key={key} row={row} column={column} type={type} onClick={toggleTile} />);
      }
    }
  }

  function toggleTile(row: number, column: number) {
    if (!gameState) return;
    const tile = gameState.selections.find(s => s.row === row && s.column === column);
    if (!tile || tile.type !== brush) {
      dispatchAction({ type: 'select-tile', row, column, tileType: brush });
    } else {
      dispatchAction({ type: 'clear-tile', row, column });
    }
  }

  function handleAddOpponent() {
    if (!newOpponentName.trim() || !meta) return;
    const opponents = [...meta.opponents, { name: newOpponentName.trim(), position: newOpponentPos }];
    updateGameMeta(id, { opponents });
    setMeta({ ...meta, opponents });
    setNewOpponentName('');
    setShowSuggestions(false);
  }

  function handleRemoveOpponent(index: number) {
    if (!meta) return;
    const opponents = meta.opponents.filter((_, i) => i !== index);
    updateGameMeta(id, { opponents });
    setMeta({ ...meta, opponents });
  }

  function toggleStatus() {
    if (!meta) return;
    const newStatus = meta.status === 'active' ? 'completed' : 'active';
    updateGameMeta(id, { status: newStatus });
    setMeta({ ...meta, status: newStatus });
  }

  function handleOpponentInput(val: string) {
    setNewOpponentName(val);
    if (val.trim()) {
      const all = getAllOpponentNames();
      const filtered = all.filter(n => n.toLowerCase().includes(val.toLowerCase()));
      setOpponentSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  const positionLabels: Record<Opponent['position'], string> = {
    top: '↑ Top', right: '→ Right', bottom: '↓ Bottom', left: '← Left',
  };

  return (
    <div className={styles.container}>
      <div className={styles.gameSheet}>
        <header className={styles.header}>
          <div className={styles.headerNav}>
            <button className={styles.backBtn} onClick={() => router.push('/')}>← Games</button>
            <button
              className={`${styles.statusToggle} ${meta.status === 'completed' ? styles.statusCompleted : ''}`}
              onClick={toggleStatus}
            >
              {meta.status === 'completed' ? '✓ Completed' : '● Active'}
            </button>
          </div>
          <div className={styles.headerFields}>
            <div className={styles.field}>
              <label>CARTOGRAPHER:</label>
              <input
                type="text"
                value={meta.cartographer}
                onChange={e => {
                  const val = e.target.value;
                  updateGameMeta(id, { cartographer: val });
                  setMeta({ ...meta, cartographer: val });
                }}
              />
            </div>
            <div className={styles.field}>
              <label>TITLE:</label>
              <input
                type="text"
                value={meta.title}
                onChange={e => {
                  const val = e.target.value;
                  updateGameMeta(id, { title: val });
                  setMeta({ ...meta, title: val });
                }}
              />
            </div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.boardLabel}>
              Board: <strong>{meta.boardType === 'chasm' ? 'Chasm (B)' : 'Default'}</strong>
            </div>
          </div>
        </header>

        {/* Opponents */}
        <div className={styles.opponentsSection}>
          <div className={styles.opponentsHeader}>Opponents</div>
          <div className={styles.opponentsList}>
            {meta.opponents.map((opp, i) => (
              <div key={i} className={styles.opponentTag}>
                <span className={styles.opponentPos}>{positionLabels[opp.position]}</span>
                <span>{opp.name}</span>
                <button className={styles.removeOpponent} onClick={() => handleRemoveOpponent(i)}>×</button>
              </div>
            ))}
          </div>
          <div className={styles.addOpponent}>
            <div className={styles.opponentInputWrap}>
              <input
                type="text"
                placeholder="Opponent name"
                value={newOpponentName}
                onChange={e => handleOpponentInput(e.target.value)}
                onFocus={() => {
                  if (newOpponentName.trim()) handleOpponentInput(newOpponentName);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddOpponent(); }}
              />
              {showSuggestions && (
                <div className={styles.suggestions}>
                  {opponentSuggestions.map(s => (
                    <div key={s} className={styles.suggestion} onMouseDown={() => { setNewOpponentName(s); setShowSuggestions(false); }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select value={newOpponentPos} onChange={e => setNewOpponentPos(e.target.value as Opponent['position'])}>
              <option value="top">↑ Top</option>
              <option value="right">→ Right</option>
              <option value="bottom">↓ Bottom</option>
              <option value="left">← Left</option>
            </select>
            <button onClick={handleAddOpponent}>Add</button>
          </div>
        </div>

        <main className={styles.mainContent}>
          <div className={styles.boardContainer}>
            <div className={styles.tileBoard}>
              {gameBoard}
            </div>
          </div>
          <div className={styles.brushes}>
            <button className={styles.forest} onClick={() => setBrush("forest")}>Forest</button>
            <button className={styles.village} onClick={() => setBrush("village")}>Village</button>
            <button className={styles.farm} onClick={() => setBrush("farm")}>Farm</button>
            <button className={styles.water} onClick={() => setBrush("water")}>Water</button>
            <button className={styles.monster} onClick={() => setBrush("monster")}>Monster</button>
          </div>
          <div className={styles.coins}>
            {[...Array(14)].map((_, index) => (
              <Coin key={index} selected={gameState.coinCount > index} onClick={() => {
                if (gameState.coinCount === index + 1) {
                  dispatchAction({ type: "set-coin-count", coinCount: index });
                } else {
                  dispatchAction({ type: "set-coin-count", coinCount: index + 1 });
                }
              }} />
            ))}
          </div>
          <div className={styles.scoreBoard}>
            <div className={styles.seasonScores}>
              <SeasonScore onScoreTotalChange={setSeasonOneScore} />
              <SeasonScore onScoreTotalChange={setSeasonTwoScore} />
              <SeasonScore onScoreTotalChange={setSeasonThreeScore} />
              <SeasonScore onScoreTotalChange={setSeasonFourScore} />
            </div>
            <div className={styles.totalScore}>
              {seasonOneScore + seasonTwoScore + seasonThreeScore + seasonFourScore}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
