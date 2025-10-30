'use client';

import type { Song } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useState, useMemo, useCallback } from 'react';

type MusicPlayerContextType = {
  playlist: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  play: (song?: Song, playlist?: Song[]) => void;
  pause: () => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
};

export const MusicPlayerContext = createContext<
  MusicPlayerContextType | undefined
>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((song?: Song, newPlaylist?: Song[]) => {
    if (newPlaylist) {
      setPlaylist(newPlaylist);
    }
    const songToPlay = song || (newPlaylist && newPlaylist[0]) || playlist[0] || null;
    if(songToPlay) {
      setCurrentSong(songToPlay);
      setIsPlaying(true);
    }
  }, [playlist]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong]);

  const findCurrentSongIndex = useCallback(() => {
    if (!currentSong) return -1;
    return playlist.findIndex(s => s.id === currentSong.id);
  }, [currentSong, playlist]);
  
  const nextSong = useCallback(() => {
    const currentIndex = findCurrentSongIndex();
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      setCurrentSong(playlist[currentIndex + 1]);
      setIsPlaying(true);
    }
  }, [findCurrentSongIndex, playlist]);

  const prevSong = useCallback(() => {
    const currentIndex = findCurrentSongIndex();
    if (currentIndex > 0) {
      setCurrentSong(playlist[currentIndex - 1]);
      setIsPlaying(true);
    }
  }, [findCurrentSongIndex, playlist]);

  const value = useMemo(
    () => ({
      playlist,
      currentSong,
      isPlaying,
      play,
      pause,
      togglePlay,
      nextSong,
      prevSong,
    }),
    [playlist, currentSong, isPlaying, play, pause, togglePlay, nextSong, prevSong]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
