
'use client';

import type { Song, RecentlyPlayed } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, increment, updateDoc } from 'firebase/firestore';

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
  duration: number;
  seek: (time: number) => void;
  recentlyPlayed: RecentlyPlayed[];
};

export const MusicPlayerContext = createContext<
  MusicPlayerContextType | undefined
>(undefined);

const MAX_RECENTLY_PLAYED = 10;

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed[]>([]);
  const hasTrackedPlay = useRef(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const addToRecentlyPlayed = useCallback((song: Song) => {
    setRecentlyPlayed(prev => {
        const newRecentlyPlayed = [{ song, playedAt: new Date() }, ...prev.filter(p => p.song.id !== song.id)];
        return newRecentlyPlayed.slice(0, MAX_RECENTLY_PLAYED);
    });
  }, []);

  const trackPlay = useCallback((songId: string) => {
    const songRef = doc(firestore, 'songs', songId);
    updateDoc(songRef, {
        playCount: increment(1)
    });
  }, [firestore]);


  const play = useCallback((song?: Song, newPlaylist?: Song[]) => {
    if (newPlaylist) {
      setPlaylist(newPlaylist);
    }
    const songToPlay = song || (newPlaylist && newPlaylist[0]) || playlist[0] || null;
    
    if (songToPlay) {
      if (currentSong?.id !== songToPlay.id) {
        setCurrentSong(songToPlay);
        hasTrackedPlay.current = false; // Reset tracking for new song
      }
      setIsPlaying(true);
      addToRecentlyPlayed(songToPlay);
    }
  }, [playlist, addToRecentlyPlayed, currentSong?.id]);

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
       hasTrackedPlay.current = false;
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
       hasTrackedPlay.current = false;
    }
  }, [findCurrentSongIndex, playlist, addToRecentlyPlayed]);

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
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
    if (!audio || !currentSong) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      // Track play after 10 seconds
      if (audio.currentTime > 10 && !hasTrackedPlay.current) {
        trackPlay(currentSong.id);
        hasTrackedPlay.current = true;
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
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
  }, [nextSong, currentSong, trackPlay]);

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
      duration,
      seek,
      recentlyPlayed
    }),
    [playlist, currentSong, isPlaying, play, pause, togglePlay, nextSong, prevSong, progress, duration, recentlyPlayed]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} src={currentSong?.audioUrl} crossOrigin="anonymous" />
    </MusicPlayerContext.Provider>
  );
}
