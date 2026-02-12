/*
Etong ActivityFeed.tsx na to ay para sa activity feed ng user.
Logs ba kumbaga pero sa ngayon di pa sya realtime.
*/

'use client';
import React, { useState } from 'react';
import { useTheme } from '../context/theme-context';

type EventItem = { id: string; text: string; time: string; read?: boolean };

const SAMPLE: EventItem[] = [
  { id: 'e1', text: 'Deployment succeeded for Mercato Launch 01', time: '7m ago' },
  { id: 'e2', text: 'New user invited to workspace: pat@example.com', time: '45m ago' },
  { id: 'e3', text: 'Domain added: shop.mercato.tools', time: '2h ago' },
];

export default function ActivityFeed() {
  const [events, setEvents] = useState<EventItem[]>(SAMPLE);
  const { colors, theme } = useTheme();

  const markAllRead = () => setEvents(events.map(e => ({ ...e, read: true })));

  return (
    <div
      className="rounded-2xl border p-4 transition-colors"
      style={{
        backgroundColor: colors.bg.card,
        borderColor: colors.border.faint
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold" style={{ color: colors.text.primary }}>Workspace activity</div>
        <button
          onClick={markAllRead}
          className="text-sm px-2 py-1 rounded-md border transition-colors hover:opacity-80"
          style={{
            color: colors.text.secondary,
            borderColor: colors.border.default
          }}
        >
          Mark all read
        </button>
      </div>
      <div className="space-y-3 text-sm">
        {events.map(ev => (
          <div key={ev.id} className={`flex items-start justify-between gap-3 ${ev.read ? 'opacity-60' : ''}`}>
            <div>
              <div className="text-sm" style={{ color: colors.text.primary }}>{ev.text}</div>
              <div className="text-xs mt-0.5" style={{ color: colors.text.muted }}>{ev.time}</div>
            </div>
            {!ev.read && <div className="h-2 w-2 rounded-full mt-1" style={{ backgroundColor: colors.status.info }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
