
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
  const { play, currentSong, isPlaying } = useMusicPlayer();
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
  
  const isActive = currentSong?.id === song.id;

  return (
    <Card className={cn('group w-full overflow-hidden transition-shadow hover:shadow-lg bg-card', className)}>
      <CardContent className="p-0">
        <div className="relative">
           <div className="aspect-square w-full overflow-hidden">
             <Image
              src={song.artworkUrl}
              alt={song.title}
              width={300}
              height={300}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
             <h3 className="text-lg font-semibold leading-tight truncate text-white">{song.title}</h3>
             <p className="text-sm font-medium text-white/80">{song.artistName}</p>
          </div>
          <Button 
            size="icon" 
            className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleLike}
          >
             <Heart className={cn('h-5 w-5', isLiked && 'fill-red-500 text-red-500')} />
          </Button>
           <Button 
            size="icon" 
            className="absolute bottom-3 right-3 z-10 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePlay}
          >
             {isActive && isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
