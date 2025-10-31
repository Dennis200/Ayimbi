
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
           <div className="aspect-square w-full overflow-hidden bg-secondary">
             <Image
              src={album.artworkUrl}
              alt={album.title}
              width={300}
              height={300}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="p-4 space-y-3">
            <div>
                 <p className="text-sm font-medium text-muted-foreground">{album.artistName}</p>
                 <h3 className="text-lg font-semibold leading-tight truncate">{album.title}</h3>
            </div>
            <Button className="w-full font-semibold" onClick={handlePlay}>
                <Play className="mr-2 h-4 w-4 fill-current"/>
                Play Album
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
