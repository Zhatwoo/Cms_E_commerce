'use client';
import React, { useState } from 'react';

type EventItem = { id: string; text: string; time: string; read?: boolean };

const SAMPLE: EventItem[] = [
  { id: 'e1', text: 'Deployment succeeded for Mercato Launch 01', time: '7m ago' },
  { id: 'e2', text: 'New user invited to workspace: pat@example.com', time: '45m ago' },
  { id: 'e3', text: 'Domain added: shop.mercato.tools', time: '2h ago' },
];

export default function ActivityFeed() {
  const [events, setEvents] = useState<EventItem[]>(SAMPLE);

  const markAllRead = () => setEvents(events.map(e => ({ ...e, read: true })));

  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-[#0f0f10]" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Workspace activity</div>
        <button onClick={markAllRead} className="text-sm px-2 py-1 rounded-md border">Mark all read</button>
      </div>
      <div className="space-y-3 text-sm">
        {events.map(ev => (
          <div key={ev.id} className={`flex items-start justify-between gap-3 ${ev.read ? 'opacity-60' : ''}`}>
            <div>
              <div className="text-sm">{ev.text}</div>
              <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{ev.time}</div>
            </div>
            {!ev.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
