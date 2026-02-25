'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { GameMeta, getGamesList, createGame, migrateOldBoard } from './lib/gameStorage';
import { BoardType } from './game/boardConfigs';

export default function Home() {
  const router = useRouter();
  const [games, setGames] = useState<GameMeta[]>([]);
  const [showNewGame, setShowNewGame] = useState(false);
  const [title, setTitle] = useState('');
  const [cartographer, setCartographer] = useState('');
  const [boardType, setBoardType] = useState<BoardType>('default');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    migrateOldBoard();
    setGames(getGamesList());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  function handleCreate() {
    if (!title.trim()) return;
    const id = createGame(title.trim(), cartographer.trim(), boardType);
    router.push(`/game/${id}`);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.sheet}>
        <h1 className={styles.heading}>Cartographers</h1>
        <p className={styles.subtitle}>A Roll Player Tale</p>

        <button className={styles.newGameBtn} onClick={() => setShowNewGame(true)}>
          + New Game
        </button>

        {showNewGame && (
          <div className={styles.overlay} onClick={() => setShowNewGame(false)}>
            <div className={styles.dialog} onClick={e => e.stopPropagation()}>
              <h2 className={styles.dialogTitle}>New Game</h2>
              <div className={styles.formField}>
                <label>Game Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Spring Campaign"
                  autoFocus
                />
              </div>
              <div className={styles.formField}>
                <label>Cartographer Name</label>
                <input
                  type="text"
                  value={cartographer}
                  onChange={e => setCartographer(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className={styles.formField}>
                <label>Board Type</label>
                <select value={boardType} onChange={e => setBoardType(e.target.value as BoardType)}>
                  <option value="default">Default</option>
                  <option value="chasm">Chasm (B)</option>
                </select>
              </div>
              <div className={styles.dialogActions}>
                <button className={styles.cancelBtn} onClick={() => setShowNewGame(false)}>Cancel</button>
                <button className={styles.createBtn} onClick={handleCreate} disabled={!title.trim()}>
                  Start Game
                </button>
              </div>
            </div>
          </div>
        )}

        {games.length === 0 ? (
          <p className={styles.emptyState}>No games yet. Start your first expedition!</p>
        ) : (
          <div className={styles.gameList}>
            {games.map(game => (
              <div
                key={game.id}
                className={`${styles.gameCard} ${game.status === 'completed' ? styles.completed : ''}`}
                onClick={() => router.push(`/game/${game.id}`)}
              >
                <div className={styles.gameCardMain}>
                  <span className={styles.gameTitle}>{game.title}</span>
                  <span className={styles.gameMeta}>
                    {game.boardType === 'chasm' ? 'Chasm' : 'Default'} Board
                    {game.cartographer && ` · ${game.cartographer}`}
                  </span>
                </div>
                <div className={styles.gameCardRight}>
                  <span className={`${styles.statusBadge} ${game.status === 'completed' ? styles.statusCompleted : styles.statusActive}`}>
                    {game.status === 'completed' ? 'Completed' : 'Active'}
                  </span>
                  <span className={styles.gameDate}>{formatDate(game.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
