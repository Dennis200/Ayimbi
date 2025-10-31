
'use client';

import Image from 'next/image';
import type { Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Play, Heart, MessageCircle, Share2, Download, Pause } from 'lucide-react';
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

interface SongCardProps {
  song: Song;
  className?: string;
}

export function SongCard({ song, className }: SongCardProps) {
  const { play, currentSong, isPlaying, togglePlay } = useMusicPlayer();
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
    if (currentSong?.id === song.id) {
        togglePlay();
    } else if (songs) {
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
    <div className={cn("bg-card p-3 rounded-lg flex gap-4 items-center group", className)}>
        <div className="relative shrink-0">
            <Image
                src={song.artworkUrl}
                alt={song.title}
                width={80}
                height={80}
                className="rounded-md w-20 h-20 object-cover"
            />
             <Button 
                size="icon" 
                className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-primary/80 text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handlePlay}
            >
                {isActive && isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </Button>
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{song.title}</p>
            <p className="text-sm text-muted-foreground truncate">{song.artistName}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    <span>{song.playCount ?? 0}</span>
                </div>
                 <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{song.downloadCount ?? 0}</span>
                </div>
            </div>
        </div>
        <div className="flex flex-col items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleLike}
            >
                <Heart className={cn('h-4 w-4', isLiked && 'fill-primary text-primary')} />
            </Button>
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">{song.genre}</Badge>
        </div>
    </div>
  );
}
