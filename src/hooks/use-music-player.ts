'use client';

import { useContext } from 'react';
import { MusicPlayerContext } from '@/contexts/music-player-provider';

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
