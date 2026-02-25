'use client';

import { useState, useRef, useEffect } from 'react';
import { GameMeta, OpponentSeat, updateGameMeta, getAllOpponentNames, saveLastCartographerName } from '../lib/gameStorage';
import styles from './opponents.module.css';

interface OpponentsPanelProps {
  meta: GameMeta;
  onMetaChange: (meta: GameMeta) => void;
}

export default function OpponentsPanel({ meta, onMetaChange }: OpponentsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<number | null>(null);
  const [seatInput, setSeatInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const playerCount = meta.playerCount || 2;
  const seats: OpponentSeat[] = meta.seats || [];

  // Build a visual seating order: seat 1 = you, seats 2..N = opponents
  // Position labels around the "table"
  function getSeatLabel(seat: number, total: number): string {
    if (seat === 1) return 'You';
    // For 2 players: "Across"
    // For 3+: numbered positions
    if (total === 2) return 'Opponent';
    return `Seat ${seat}`;
  }

  function getSeatName(seat: number): string {
    if (seat === 1) return meta.cartographer || 'You';
    return seats.find(s => s.position === seat)?.name || '';
  }

  function handlePlayerCountChange(count: number) {
    const clamped = Math.max(2, Math.min(10, count));
    // Remove seats beyond new count
    const newSeats = seats.filter(s => s.position <= clamped);
    updateGameMeta(meta.id, { playerCount: clamped, seats: newSeats });
    onMetaChange({ ...meta, playerCount: clamped, seats: newSeats });
  }

  function startEditing(seat: number) {
    setEditingSeat(seat);
    setSeatInput(getSeatName(seat));
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleInput(val: string) {
    setSeatInput(val);
    if (val.trim()) {
      const all = getAllOpponentNames();
      const filtered = all.filter(n => n.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function saveSeat() {
    if (editingSeat === null) return;

    if (editingSeat === 1) {
      // Editing own name
      updateGameMeta(meta.id, { cartographer: seatInput.trim() });
      if (seatInput.trim()) saveLastCartographerName(seatInput.trim());
      onMetaChange({ ...meta, cartographer: seatInput.trim() });
    } else {
      const newSeats = seats.filter(s => s.position !== editingSeat);
      if (seatInput.trim()) {
        newSeats.push({ name: seatInput.trim(), position: editingSeat });
      }
      newSeats.sort((a, b) => a.position - b.position);
      updateGameMeta(meta.id, { seats: newSeats });
      onMetaChange({ ...meta, seats: newSeats });
    }
    setEditingSeat(null);
    setSeatInput('');
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveSeat();
    if (e.key === 'Escape') {
      setEditingSeat(null);
      setShowSuggestions(false);
    }
  }

  // Summary line for collapsed state
  const opponentNames = seats.filter(s => s.name).map(s => s.name);
  const summaryText = opponentNames.length > 0
    ? `${opponentNames.join(', ')} (${playerCount} players)`
    : `${playerCount} players`;

  return (
    <>
      {/* Collapsed bar */}
      <button className={styles.toggleBar} onClick={() => setIsOpen(!isOpen)}>
        <span className={styles.toggleIcon}>{isOpen ? '▼' : '▶'}</span>
        <span className={styles.toggleLabel}>Players</span>
        <span className={styles.toggleSummary}>{summaryText}</span>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className={styles.panel}>
          {/* Player count */}
          <div className={styles.countRow}>
            <label className={styles.countLabel}>Players:</label>
            <div className={styles.countControls}>
              <button
                className={styles.countBtn}
                onClick={() => handlePlayerCountChange(playerCount - 1)}
                disabled={playerCount <= 2}
              >−</button>
              <span className={styles.countValue}>{playerCount}</span>
              <button
                className={styles.countBtn}
                onClick={() => handlePlayerCountChange(playerCount + 1)}
                disabled={playerCount >= 10}
              >+</button>
            </div>
          </div>

          {/* Seating table */}
          <div className={styles.seatingTable}>
            {Array.from({ length: playerCount }, (_, i) => i + 1).map(seat => {
              const isYou = seat === 1;
              const name = getSeatName(seat);
              const label = getSeatLabel(seat, playerCount);
              const isEditing = editingSeat === seat;

              return (
                <div
                  key={seat}
                  className={`${styles.seat} ${isYou ? styles.seatYou : ''} ${isEditing ? styles.seatEditing : ''}`}
                  onClick={() => !isEditing && startEditing(seat)}
                >
                  <span className={styles.seatNumber}>{label}</span>
                  {isEditing ? (
                    <div className={styles.seatInputWrap}>
                      <input
                        ref={inputRef}
                        type="text"
                        className={styles.seatInput}
                        value={seatInput}
                        onChange={e => handleInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setTimeout(() => { saveSeat(); }, 150)}
                        placeholder={isYou ? 'Your name' : 'Opponent name'}
                      />
                      {showSuggestions && !isYou && (
                        <div className={styles.suggestions}>
                          {suggestions.map(s => (
                            <div
                              key={s}
                              className={styles.suggestion}
                              onMouseDown={() => {
                                setSeatInput(s);
                                setShowSuggestions(false);
                                setTimeout(() => saveSeat(), 50);
                              }}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`${styles.seatName} ${!name ? styles.seatEmpty : ''}`}>
                      {name || (isYou ? 'Tap to set' : 'Tap to add')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile drawer backdrop */}
      {isOpen && <div className={styles.mobileBackdrop} onClick={() => setIsOpen(false)} />}
    </>
  );
}
