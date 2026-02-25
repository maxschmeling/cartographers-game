'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type OpponentState = {
  peerId: string;
  name: string;
  selections: Array<{ row: number; column: number; type: string }>;
  coinCount: number;
  boardType: string;
};

type PeerConnection = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  peerId: string;
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export function useMultiplayer() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [opponents, setOpponents] = useState<Map<string, OpponentState>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const peerId = useRef(generateId());
  const peers = useRef(new Map<string, PeerConnection>());
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestamp = useRef(0);
  const currentRoomId = useRef<string | null>(null);
  const myState = useRef<object | null>(null);

  const broadcastState = useCallback((state: object) => {
    myState.current = state;
    const msg = JSON.stringify(state);
    Array.from(peers.current.values()).forEach(peer => {
      if (peer.dc && peer.dc.readyState === 'open') {
        peer.dc.send(msg);
      }
    });
  }, []);

  const handleDataMessage = useCallback((peerId: string, data: string) => {
    try {
      const state = JSON.parse(data) as OpponentState;
      state.peerId = peerId;
      setOpponents(prev => {
        const next = new Map(prev);
        next.set(peerId, state);
        return next;
      });
    } catch { /* ignore */ }
  }, []);

  const setupDataChannel = useCallback((dc: RTCDataChannel, remotePeerId: string) => {
    dc.onopen = () => {
      // Send current state when channel opens
      if (myState.current) dc.send(JSON.stringify(myState.current));
    };
    dc.onmessage = (e) => handleDataMessage(remotePeerId, e.data);
    dc.onclose = () => {
      setOpponents(prev => {
        const next = new Map(prev);
        next.delete(remotePeerId);
        return next;
      });
    };
  }, [handleDataMessage]);

  const createPeerConnection = useCallback(async (remotePeerId: string, isInitiator: boolean, room: string) => {
    if (peers.current.has(remotePeerId)) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const entry: PeerConnection = { pc, dc: null, peerId: remotePeerId };
    peers.current.set(remotePeerId, entry);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        fetch(`/api/signal?room=${room}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signal',
            peerId: peerId.current,
            message: { type: 'ice-candidate', to: remotePeerId, data: e.candidate }
          })
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        peers.current.delete(remotePeerId);
        setOpponents(prev => {
          const next = new Map(prev);
          next.delete(remotePeerId);
          return next;
        });
      }
    };

    if (isInitiator) {
      const dc = pc.createDataChannel('gameState');
      entry.dc = dc;
      setupDataChannel(dc, remotePeerId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch(`/api/signal?room=${room}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signal',
          peerId: peerId.current,
          message: { type: 'offer', to: remotePeerId, data: offer }
        })
      });
    } else {
      pc.ondatachannel = (e) => {
        entry.dc = e.channel;
        setupDataChannel(e.channel, remotePeerId);
      };
    }
  }, [setupDataChannel]);

  const handleSignalMessage = useCallback(async (msg: { from: string; type: string; data: any }, room: string) => {
    if (msg.type === 'join') {
      // New peer joined - initiator is the one with smaller peerId
      if (peerId.current < msg.from) {
        await createPeerConnection(msg.from, true, room);
      }
      return;
    }

    if (msg.type === 'leave') {
      const peer = peers.current.get(msg.from);
      if (peer) {
        peer.pc.close();
        peers.current.delete(msg.from);
        setOpponents(prev => {
          const next = new Map(prev);
          next.delete(msg.from);
          return next;
        });
      }
      return;
    }

    if (msg.type === 'offer') {
      await createPeerConnection(msg.from, false, room);
      const peer = peers.current.get(msg.from);
      if (!peer) return;

      await peer.pc.setRemoteDescription(new RTCSessionDescription(msg.data));
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);

      await fetch(`/api/signal?room=${room}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signal',
          peerId: peerId.current,
          message: { type: 'answer', to: msg.from, data: answer }
        })
      });
    }

    if (msg.type === 'answer') {
      const peer = peers.current.get(msg.from);
      if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(msg.data));
    }

    if (msg.type === 'ice-candidate') {
      const peer = peers.current.get(msg.from);
      if (peer) await peer.pc.addIceCandidate(new RTCIceCandidate(msg.data));
    }
  }, [createPeerConnection]);

  const startPolling = useCallback((room: string) => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    lastTimestamp.current = Date.now() - 5000;

    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/signal?room=${room}&peerId=${peerId.current}&since=${lastTimestamp.current}`
        );
        if (!res.ok) return;
        const data = await res.json();
        lastTimestamp.current = data.timestamp;

        for (const msg of data.messages) {
          await handleSignalMessage(msg, room);
        }
      } catch { /* ignore */ }
    }, 1500);
  }, [handleSignalMessage]);

  const createRoom = useCallback(async () => {
    const code = generateRoomCode();
    try {
      const res = await fetch(`/api/signal?room=${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', peerId: peerId.current })
      });
      if (!res.ok) throw new Error('Failed to create room');
      currentRoomId.current = code;
      setRoomId(code);
      setConnected(true);
      setError(null);
      startPolling(code);
    } catch (e) {
      setError('Failed to create room');
    }
  }, [startPolling]);

  const joinRoom = useCallback(async (code: string) => {
    const room = code.toUpperCase().trim();
    if (room.length !== 6) { setError('Room code must be 6 characters'); return; }
    try {
      const res = await fetch(`/api/signal?room=${room}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', peerId: peerId.current })
      });
      if (!res.ok) throw new Error('Room not found');
      const data = await res.json();
      currentRoomId.current = room;
      setRoomId(room);
      setConnected(true);
      setError(null);
      startPolling(room);

      // Connect to existing peers
      for (const existingPeer of data.peers) {
        if (existingPeer !== peerId.current && peerId.current < existingPeer) {
          await createPeerConnection(existingPeer, true, room);
        }
      }
    } catch {
      setError('Room not found');
    }
  }, [startPolling, createPeerConnection]);

  const leaveRoom = useCallback(async () => {
    if (currentRoomId.current) {
      await fetch(`/api/signal?room=${currentRoomId.current}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', peerId: peerId.current })
      }).catch(() => {});
    }
    if (pollTimer.current) clearInterval(pollTimer.current);
    Array.from(peers.current.values()).forEach(peer => peer.pc.close());
    peers.current.clear();
    currentRoomId.current = null;
    setRoomId(null);
    setConnected(false);
    setOpponents(new Map());
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      Array.from(peers.current.values()).forEach(peer => peer.pc.close());
    };
  }, []);

  return {
    roomId,
    connected,
    opponents: Array.from(opponents.values()),
    error,
    peerId: peerId.current,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastState,
  };
}
