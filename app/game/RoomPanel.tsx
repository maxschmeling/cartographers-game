'use client';

import { useState } from 'react';
import styles from './multiplayer.module.css';

type Props = {
  roomId: string | null;
  connected: boolean;
  error: string | null;
  opponentCount: number;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
};

export default function RoomPanel({ roomId, connected, error, opponentCount, onCreateRoom, onJoinRoom, onLeaveRoom }: Props) {
  const [joinCode, setJoinCode] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  if (connected && roomId) {
    return (
      <div className={styles.roomPanel}>
        <div className={styles.roomInfo}>
          <span className={styles.roomLabel}>Room:</span>
          <span className={styles.roomCode}>{roomId}</span>
          <span className={styles.peerCount}>{opponentCount} opponent{opponentCount !== 1 ? 's' : ''}</span>
          <button className={styles.leaveBtn} onClick={onLeaveRoom}>Leave</button>
        </div>
      </div>
    );
  }

  if (!showPanel) {
    return (
      <div className={styles.roomPanel}>
        <button className={styles.multiplayerBtn} onClick={() => setShowPanel(true)}>
          ⚔️ Multiplayer
        </button>
      </div>
    );
  }

  return (
    <div className={styles.roomPanel}>
      <div className={styles.roomActions}>
        <button className={styles.createBtn} onClick={() => { onCreateRoom(); }}>
          Create Game
        </button>
        <div className={styles.joinRow}>
          <input
            type="text"
            maxLength={6}
            placeholder="ROOM CODE"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            className={styles.codeInput}
          />
          <button className={styles.joinBtn} onClick={() => onJoinRoom(joinCode)}>
            Join
          </button>
        </div>
        <button className={styles.cancelBtn} onClick={() => setShowPanel(false)}>Cancel</button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
