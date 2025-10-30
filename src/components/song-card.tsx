'use client';

import Image from 'next/image';
import type { Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Play } from 'lucide-react';
import { Button } from './ui/button';
import { songs } from '@/lib/data';

interface SongCardProps {
  song: Song;
  className?: string;
}

export function SongCard({ song, className }: SongCardProps) {
  const { play } = useMusicPlayer();

  const handlePlay = () => {
    play(song, songs);
  };

  return (
    <div className={`group relative flex flex-col items-center space-y-3 ${className}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded-md">
        <Image
          src={song.album.artworkUrl}
          alt={song.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
        <Button
          onClick={handlePlay}
          size="icon"
          className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-all group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
        >
          <Play className="h-5 w-5 fill-current" />
        </Button>
      </div>
      <div className="w-full space-y-1 text-sm">
        <h3 className="font-medium leading-none truncate">{song.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{song.artist.name}</p>
      </div>
    </div>
  );
}
