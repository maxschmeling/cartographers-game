'use client';

import styles from './multiplayer.module.css';
import { boardConfigs, BoardType } from './boardConfigs';
import type { OpponentState } from './useMultiplayer';

const TILE_COLORS: Record<string, string> = {
  forest: '#5a7a3d',
  village: '#8b4f4f',
  farm: '#d4a74e',
  water: '#4a7ba7',
  monster: '#6b4a7a',
};

export default function OpponentBoard({ opponent }: { opponent: OpponentState }) {
  const boardType = (opponent.boardType || 'default') as BoardType;
  const config = boardConfigs[boardType] || boardConfigs['default'];

  const cells = [];
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
      const sel = opponent.selections.find(s => s.row === row && s.column === col);
      const isBlocked = config.blockedSpaces.some(b => b[0] === col && b[1] === row);
      const isMountain = config.mountains.some(m => m[0] === col && m[1] === row);

      let bg = '#d4c4a8';
      if (sel) bg = TILE_COLORS[sel.type] || bg;
      else if (isBlocked) bg = 'rgb(80,70,60)';
      else if (isMountain) bg = 'rgb(125,120,120)';

      cells.push(
        <div key={`${row}-${col}`} style={{ background: bg }} className={styles.miniCell} />
      );
    }
  }

  return (
    <div className={styles.opponentCard}>
      <div className={styles.opponentName}>{opponent.name || 'Unknown Cartographer'}</div>
      <div className={styles.miniBoard}>{cells}</div>
      <div className={styles.opponentCoins}>🪙 {opponent.coinCount}</div>
    </div>
  );
}
