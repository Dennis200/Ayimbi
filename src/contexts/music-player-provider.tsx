'use client';

import type { Song, RecentlyPlayed } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';

type MusicPlayerContextType = {
  playlist: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  play: (song?: Song, playlist?: Song[]) => void;
  pause: () => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  progress: number;
  volume: number;
  isMuted: boolean;
  duration: number;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  recentlyPlayed: RecentlyPlayed[];
};

export const MusicPlayerContext = createContext<
  MusicPlayerContextType | undefined
>(undefined);

const MAX_RECENTLY_PLAYED = 10;

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const addToRecentlyPlayed = useCallback((song: Song) => {
    setRecentlyPlayed(prev => {
        const newRecentlyPlayed = [{ song, playedAt: new Date() }, ...prev.filter(p => p.song.id !== song.id)];
        return newRecentlyPlayed.slice(0, MAX_RECENTLY_PLAYED);
    });
  }, []);

  const play = useCallback((song?: Song, newPlaylist?: Song[]) => {
    if (newPlaylist) {
      setPlaylist(newPlaylist);
    }
    const songToPlay = song || (newPlaylist && newPlaylist[0]) || playlist[0] || null;
    if (songToPlay) {
      setCurrentSong(songToPlay);
      setIsPlaying(true);
      addToRecentlyPlayed(songToPlay);
    }
  }, [playlist, addToRecentlyPlayed]);

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
    if (currentIndex !== -1) {
       const nextIndex = (currentIndex + 1) % playlist.length;
       const nextSongToPlay = playlist[nextIndex];
       setCurrentSong(nextSongToPlay);
       addToRecentlyPlayed(nextSongToPlay);
       setIsPlaying(true);
    }
  }, [findCurrentSongIndex, playlist, addToRecentlyPlayed]);

  const prevSong = useCallback(() => {
    const currentIndex = findCurrentSongIndex();
    if (currentIndex !== -1) {
       const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
       const prevSongToPlay = playlist[prevIndex];
       setCurrentSong(prevSongToPlay);
       addToRecentlyPlayed(prevSongToPlay);
       setIsPlaying(true);
    }
  }, [findCurrentSongIndex, playlist, addToRecentlyPlayed]);

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(e => console.error("Playback failed", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Auto-extract duration for uploaded songs with placeholder duration
      if (currentSong && currentSong.duration === 0) {
        console.log("Updating song duration in context...");
        // In a real app, you might want to update this in Firestore as well.
      }
    };
    const handleEnded = () => nextSong();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextSong, currentSong]);

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
      audioRef,
      progress,
      volume,
      isMuted,
      duration,
      seek,
      setVolume,
      toggleMute,
      recentlyPlayed
    }),
    [playlist, currentSong, isPlaying, play, pause, togglePlay, nextSong, prevSong, progress, volume, isMuted, duration, recentlyPlayed]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} src={currentSong?.audioUrl} crossOrigin="anonymous" />
    </MusicPlayerContext.Provider>
  );
}
