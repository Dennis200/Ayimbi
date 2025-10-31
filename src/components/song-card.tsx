
'use client';

import Image from 'next/image';
import type { Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Play, Heart, MessageCircle, Share2, Download } from 'lucide-react';
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

  const handlePlay = () => {
    if (songs) {
      play(song, songs);
    }
  };

  const isLiked = user && song.likeIds?.includes(user.uid);

  const handleLike = async () => {
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
    <div className={cn('group relative flex flex-col space-y-2', className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
        <Image
          src={song.artworkUrl}
          alt={song.title}
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
        <h3 className="font-semibold leading-none truncate">{song.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {song.artistName}
        </p>
      </div>
      <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
              "flex items-center gap-1.5 px-1 h-auto -ml-1 text-sm font-medium",
              isLiked ? 'text-red-500' : 'text-muted-foreground'
          )}
        >
          <Heart
            className={cn('h-5 w-5', isLiked && 'fill-red-500')}
          />
          <span className="text-sm">{formatCount(song.likes || 0)}</span>
        </Button>
        <div className="flex items-center gap-1.5 text-sm">
          <MessageCircle className="h-4 w-4" />
          <span>{formatCount(song.commentCount || 0)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Download className="h-4 w-4" />
          <span>{formatCount(song.downloadCount || 0)}</span>
        </div>
      </div>
    </div>
  );
}
