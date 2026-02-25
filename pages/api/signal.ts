import type { NextApiRequest, NextApiResponse } from 'next';

type SignalMessage = {
  from: string;
  to?: string;
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  data: unknown;
  timestamp: number;
};

type Room = {
  peers: Map<string, number>; // peerId -> last seen timestamp
  messages: SignalMessage[];
};

const rooms = new Map<string, Room>();

// Clean up stale rooms/peers every 5 minutes
const PEER_TIMEOUT = 60_000;
const MSG_TTL = 30_000;

function cleanRoom(room: Room) {
  const now = Date.now();
  room.messages = room.messages.filter(m => now - m.timestamp < MSG_TTL);
  Array.from(room.peers.entries()).forEach(([peer, ts]) => {
    if (now - ts > PEER_TIMEOUT) room.peers.delete(peer);
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const roomId = (req.query.room as string || '').toUpperCase();

  if (!roomId) return res.status(400).json({ error: 'room required' });

  if (method === 'POST') {
    const { action, peerId, message } = req.body;

    if (!peerId) return res.status(400).json({ error: 'peerId required' });

    if (action === 'create') {
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { peers: new Map(), messages: [] });
      }
      const room = rooms.get(roomId)!;
      room.peers.set(peerId, Date.now());
      room.messages.push({
        from: peerId, type: 'join', data: null, timestamp: Date.now()
      });
      return res.json({ ok: true, peers: Array.from(room.peers.keys()) });
    }

    if (action === 'join') {
      const room = rooms.get(roomId);
      if (!room) return res.status(404).json({ error: 'room not found' });
      room.peers.set(peerId, Date.now());
      room.messages.push({
        from: peerId, type: 'join', data: null, timestamp: Date.now()
      });
      return res.json({ ok: true, peers: Array.from(room.peers.keys()) });
    }

    if (action === 'signal') {
      const room = rooms.get(roomId);
      if (!room) return res.status(404).json({ error: 'room not found' });
      room.peers.set(peerId, Date.now());
      if (message) {
        room.messages.push({ ...message, from: peerId, timestamp: Date.now() });
      }
      return res.json({ ok: true });
    }

    if (action === 'leave') {
      const room = rooms.get(roomId);
      if (room) {
        room.peers.delete(peerId);
        room.messages.push({
          from: peerId, type: 'leave', data: null, timestamp: Date.now()
        });
        if (room.peers.size === 0) rooms.delete(roomId);
      }
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown action' });
  }

  if (method === 'GET') {
    const peerId = req.query.peerId as string;
    const since = parseInt(req.query.since as string || '0', 10);
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: 'room not found' });

    cleanRoom(room);
    if (peerId) room.peers.set(peerId, Date.now());

    const messages = room.messages.filter(
      m => m.timestamp > since && m.from !== peerId && (!m.to || m.to === peerId)
    );

    return res.json({
      peers: Array.from(room.peers.keys()),
      messages,
      timestamp: Date.now()
    });
  }

  res.status(405).end();
}
