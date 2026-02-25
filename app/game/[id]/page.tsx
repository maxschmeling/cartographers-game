'use client';

import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
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
  GameMeta, GameState,
  getGameMeta, getGameState, saveGameState, updateGameMeta,
  saveLastCartographerName,
} from '../../lib/gameStorage';
import OpponentsPanel from '../OpponentsPanel';
import { GAME_PIECES, GamePiece, rotatePiece, flipPiece } from '../pieces';

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

  const [brush, setBrush] = useState<TileType>('village');
  const [seasonOneScore, setSeasonOneScore] = useState(0);
  const [seasonTwoScore, setSeasonTwoScore] = useState(0);
  const [seasonThreeScore, setSeasonThreeScore] = useState(0);
  const [seasonFourScore, setSeasonFourScore] = useState(0);

  // Piece selection state
  const [selectedPiece, setSelectedPiece] = useState<GamePiece | null>(null);
  const [currentShape, setCurrentShape] = useState<[number, number][]>([]);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [piecesOpen, setPiecesOpen] = useState(false);

  const handleRotate = useCallback(() => {
    if (currentShape.length > 0) {
      setCurrentShape(prev => rotatePiece(prev));
    }
  }, [currentShape.length]);

  const handleFlip = useCallback(() => {
    if (currentShape.length > 0) {
      setCurrentShape(prev => flipPiece(prev));
    }
  }, [currentShape.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'r' || e.key === 'R') handleRotate();
      if (e.key === 'f' || e.key === 'F') handleFlip();
      if (e.key === 'Escape') { setSelectedPiece(null); setCurrentShape([]); setHoverCell(null); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRotate, handleFlip]);

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

  // Compute preview cells for piece placement
  const previewCells = new Set<string>();
  let previewValid = true;
  if (selectedPiece && hoverCell && currentShape.length > 0) {
    for (const [dr, dc] of currentShape) {
      const r = hoverCell[0] + dr;
      const c = hoverCell[1] + dc;
      if (r < 0 || r >= 11 || c < 0 || c >= 11) { previewValid = false; break; }
      if (config.blockedSpaces.some(b => b[0] === c && b[1] === r) ||
          config.mountains.some(m => m[0] === c && m[1] === r) ||
          gameState.selections.some(s => s.row === r && s.column === c)) { previewValid = false; break; }
      previewCells.add(`${r},${c}`);
    }
    if (!previewValid) previewCells.clear();
  }

  const gameBoard = [];

  for (let row = 0; row < 11; row++) {
    for (let column = 0; column < 11; column++) {
      const key = `${row}x${column}`;
      const type = gameState.selections.find(s => s.row === row && s.column === column)?.type as TileType ?? null;
      const isPreview = previewCells.has(`${row},${column}`);

      if (config.blockedSpaces.some(b => b[0] === column && b[1] === row)) {
        gameBoard.push(<BlockedTile key={key} />);
      } else if (config.ruins.some(r => r[0] === column && r[1] === row)) {
        gameBoard.push(
          <RuinTile key={key} row={row} column={column} type={type}
            onClick={handleTileClick}
            preview={isPreview} previewValid={previewValid}
            onMouseEnter={() => handleTileHover(row, column)}
          />
        );
      } else if (config.mountains.some(m => m[0] === column && m[1] === row)) {
        const hasCoin = config.coinMountains.some(c => c[0] === column && c[1] === row);
        gameBoard.push(<MountainTile key={key} hasCoin={hasCoin} />);
      } else {
        gameBoard.push(
          <StandardTile key={key} row={row} column={column} type={type}
            onClick={handleTileClick}
            preview={isPreview} previewValid={previewValid}
            onMouseEnter={() => handleTileHover(row, column)}
          />
        );
      }
    }
  }

  function handleTileHover(row: number, column: number) {
    if (selectedPiece) {
      setHoverCell([row, column]);
    }
  }

  function handleTileClick(row: number, column: number) {
    if (!gameState) return;

    if (selectedPiece && currentShape.length > 0) {
      if (!previewValid || previewCells.size === 0) return;
      for (const [dr, dc] of currentShape) {
        const r = row + dr;
        const c = column + dc;
        dispatchAction({ type: 'select-tile', row: r, column: c, tileType: brush });
      }
      return;
    }

    const tile = gameState.selections.find(s => s.row === row && s.column === column);
    if (!tile || tile.type !== brush) {
      dispatchAction({ type: 'select-tile', row, column, tileType: brush });
    } else {
      dispatchAction({ type: 'clear-tile', row, column });
    }
  }

  function selectPiece(piece: GamePiece | null) {
    if (piece) {
      setSelectedPiece(piece);
      setCurrentShape([...piece.cells]);
      setPiecesOpen(false);
    } else {
      setSelectedPiece(null);
      setCurrentShape([]);
      setHoverCell(null);
    }
  }

  function toggleStatus() {
    if (!meta) return;
    const newStatus = meta.status === 'active' ? 'completed' : 'active';
    updateGameMeta(id, { status: newStatus });
    setMeta({ ...meta, status: newStatus });
  }

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
                  if (val.trim()) saveLastCartographerName(val.trim());
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
            <div className={styles.field} style={{ marginLeft: 'auto' }}>
              <label>DATE:</label>
              <input
                type="date"
                value={meta.playedAt || ''}
                onChange={e => {
                  const val = e.target.value;
                  updateGameMeta(id, { playedAt: val });
                  setMeta({ ...meta, playedAt: val });
                }}
                style={{ width: 'auto' }}
              />
            </div>
          </div>
        </header>

        {/* Players / Opponents */}
        <OpponentsPanel meta={meta} onMetaChange={setMeta} />

        <main className={styles.mainContent}>
          <div className={styles.boardContainer}>
            <div className={styles.tileBoard} onMouseLeave={() => setHoverCell(null)}>
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
          {/* Pieces section */}
          <div className={styles.piecesSection}>
            <div className={styles.piecesHeader}>
              <button className={styles.piecesToggle} onClick={() => setPiecesOpen(!piecesOpen)}>
                {piecesOpen ? '▾' : '▸'} Pieces
              </button>
              {selectedPiece && (
                <div className={styles.pieceControls}>
                  <span className={styles.pieceLabel}>{selectedPiece.name}</span>
                  <button className={styles.pieceBtn} onClick={handleRotate} title="Rotate (R)">↻</button>
                  <button className={styles.pieceBtn} onClick={handleFlip} title="Flip (F)">↔</button>
                  <button className={styles.pieceBtn} onClick={() => selectPiece(null)} title="Deselect (Esc)">✕</button>
                </div>
              )}
            </div>
            {piecesOpen && (
              <div className={styles.piecesGrid}>
                {GAME_PIECES.map((piece) => {
                  const maxR = Math.max(...piece.cells.map(([r]) => r));
                  const maxC = Math.max(...piece.cells.map(([, c]) => c));
                  const cells = new Set(piece.cells.map(([r, c]) => `${r},${c}`));
                  return (
                    <button
                      key={piece.name}
                      className={`${styles.pieceCard} ${selectedPiece?.name === piece.name ? styles.pieceCardActive : ''}`}
                      onClick={() => selectPiece(piece)}
                      title={piece.name}
                    >
                      <div className={styles.pieceMini} style={{
                        gridTemplateColumns: `repeat(${maxC + 1}, 1fr)`,
                        gridTemplateRows: `repeat(${maxR + 1}, 1fr)`,
                      }}>
                        {Array.from({ length: (maxR + 1) * (maxC + 1) }, (_, i) => {
                          const r = Math.floor(i / (maxC + 1));
                          const c = i % (maxC + 1);
                          return <div key={i} className={`${styles.miniCell} ${cells.has(`${r},${c}`) ? styles.miniCellFilled : ''}`} />;
                        })}
                      </div>
                      <span className={styles.pieceName}>{piece.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
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
