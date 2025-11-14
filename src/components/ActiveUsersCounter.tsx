'use client';

import { useActiveUsers } from '@/hooks/useActiveUsers';
import type { Theme } from '@/types';

interface ActiveUsersCounterProps {
  theme: Theme;
}

export default function ActiveUsersCounter({ theme }: ActiveUsersCounterProps) {
  const { activeUserCount } = useActiveUsers();

  return (
    <div
      className="fixed top-4 right-18 sm:right-18"
      style={{
        zIndex: 9999,
        background: '#c0c0c0',
        border: '2px outset #c0c0c0',
        padding: '4px 8px',
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#000000',
        boxShadow:
          'inset 1px 1px 0px rgba(255, 255, 255, 0.8), inset -1px -1px 0px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '44px',
      }}
    >
      <span style={{ fontWeight: 'bold' }}>{activeUserCount}</span>
      <span>online</span>
    </div>
  );
}
