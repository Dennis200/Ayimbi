
'use client';

import Image from 'next/image';
import type { Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Play, Heart, MessageCircle, Share2, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, getFirestore, query } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';
import { cn } from '@/lib/utils';

interface SongCardProps {
  song: Song;
  className?: string;
}

export function SongCard({ song, className }: SongCardProps) {
  const { play } = useMusicPlayer();
  const app = useFirebaseApp();
  const firestore = getFirestore(app);
  const songsQuery = useMemoFirebase(
    () => query(collection(firestore, 'songs')),
    [firestore]
  );
  const { data: songs } = useCollection(songsQuery);

  const handlePlay = () => {
    if (songs) {
      play(song, songs);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
  };

  return (
    <div
      className={cn('group relative flex flex-col space-y-2', className)}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md">
        <Image
          src={song.artworkUrl}
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
        <p className="text-xs text-muted-foreground truncate">
          {song.artistName}
        </p>
      </div>
      <div className="flex items-center space-x-3 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span>{formatCount(song.likes || 0)}</span>
        </div>
        <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{formatCount(song.commentCount || 0)}</span>
        </div>
        <div className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            <span>{formatCount(song.shares || 0)}</span>
        </div>
        <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{formatCount(song.downloadCount || 0)}</span>
        </div>
      </div>
    </div>
  );
}
