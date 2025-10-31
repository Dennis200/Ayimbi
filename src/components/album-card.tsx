
'use client';

import Image from 'next/image';
import type { Album } from '@/lib/types';
import { Play } from 'lucide-react';
import { Button } from './ui/button';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, getFirestore, query, where } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

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
     <Card className={cn('group w-full overflow-hidden transition-shadow hover:shadow-lg', className)}>
      <CardContent className="p-0">
        <div className="relative">
           <div className="aspect-square w-full overflow-hidden">
             <Image
              src={album.artworkUrl}
              alt={album.title}
              width={300}
              height={300}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <Button 
            size="icon" 
            className="absolute bottom-3 right-3 z-10 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePlay}
          >
             <Play className="h-5 w-5 fill-current ml-0.5" />
          </Button>
        </div>
      </CardContent>
      <div className="p-4">
        <h3 className="font-semibold leading-tight truncate">{album.title}</h3>
        <p className="text-sm font-medium text-muted-foreground">{album.artistName}</p>
      </div>
    </Card>
  );
}
