
'use client';

import Image from 'next/image';
import type { Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Play, Heart, MessageCircle, Share2, Download, Crown, Music } from 'lucide-react';
import { Button } from './ui/button';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import {
  collection,
  query,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

interface SongCardProps {
  song: Song;
  className?: string;
}

export function SongCard({ song, className }: SongCardProps) {
  const { play } = useMusicPlayer();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const songsQuery = useMemoFirebase(
    () => query(collection(firestore, 'songs')),
    [firestore]
  );
  const { data: songs } = useCollection(songsQuery);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (songs) {
      play(song, songs);
    }
  };

  const isLiked = user && song.likeIds?.includes(user.uid);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'You need to be logged in to like a song.',
        variant: 'destructive',
      });
      return;
    }

    const songRef = doc(firestore, 'songs', song.id);
    const likeData = {
      likeIds: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likes: increment(isLiked ? -1 : 1),
    };

    updateDoc(songRef, likeData).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: songRef.path,
        operation: 'update',
        requestResourceData: likeData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  return (
    <Card className={cn('group w-full overflow-hidden transition-shadow hover:shadow-lg', className)}>
      <CardContent className="p-0">
        <div className="relative">
           {song.isExclusive && (
            <Badge variant="secondary" className="absolute top-3 left-3 z-10 bg-black/70 text-white border-transparent">
              Best Seller
            </Badge>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/70 text-white"
            onClick={handleLike}
          >
            <Heart className={cn('h-5 w-5', isLiked && 'fill-red-500 text-red-500')} />
          </Button>
          <div className="aspect-square w-full overflow-hidden bg-secondary">
             <Image
              src={song.artworkUrl}
              alt={song.title}
              width={300}
              height={300}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="p-4 space-y-3">
            <div>
                 <p className="text-sm font-medium text-muted-foreground">{song.artistName}</p>
                 <h3 className="text-lg font-semibold leading-tight truncate">{song.title}</h3>
            </div>
            <Button className="w-full font-semibold" onClick={handlePlay}>
                <Music className="mr-2 h-4 w-4"/>
                Play
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
