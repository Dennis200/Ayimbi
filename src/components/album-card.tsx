
'use client';

import Image from 'next/image';
import type { Album } from '@/lib/types';
import { Play } from 'lucide-react';
import { Button } from './ui/button';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, getFirestore, query, where } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';

interface AlbumCardProps {
  album: Album;
  className?: string;
}

export function AlbumCard({ album, className }: AlbumCardProps) {
  const { play } = useMusicPlayer();
  const app = useFirebaseApp();
  const firestore = getFirestore(app);

  const songsQuery = useMemoFirebase(
    () =>
      query(collection(firestore, 'songs'), where('albumId', '==', album.id)),
    [firestore, album.id]
  );
  const { data: songs } = useCollection(songsQuery);

  const handlePlay = () => {
    if (songs && songs.length > 0) {
      play(songs[0], songs);
    }
  };
  return (
    <div
      className={`group relative flex flex-col items-start space-y-3 ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
        <Image
          src={album.artworkUrl}
          alt={album.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <Button
          onClick={handlePlay}
          size="icon"
          className="absolute right-4 bottom-4 h-12 w-12 rounded-full bg-primary/80 text-primary-foreground opacity-0 shadow-2xl backdrop-blur-sm transition-all group-hover:opacity-100 group-hover:scale-110 group-hover:bg-primary"
        >
          <Play className="h-6 w-6 fill-current" />
        </Button>
      </div>
      <div className="w-full space-y-1 text-base">
        <h3 className="font-semibold leading-none truncate">{album.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {album.artistName}
        </p>
      </div>
    </div>
  );
}
