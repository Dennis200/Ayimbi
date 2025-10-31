
'use client';

import Image from 'next/image';
import type { Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Play, Heart, MessageCircle, Share2, Download, Crown } from 'lucide-react';
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
    <div className={cn('flex flex-col space-y-3', className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg group">
        <Image
          src={song.artworkUrl}
          alt={song.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
        />
        {song.isExclusive && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground border-transparent">
            <Crown className="h-3 w-3 mr-1.5" />
            Exclusive
          </Badge>
        )}
        <Button
          onClick={handlePlay}
          size="icon"
          className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-primary/90 text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
        >
          <Play className="h-5 w-5 fill-current" />
        </Button>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold leading-tight truncate">{song.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {song.artistName}
        </p>
      </div>
       <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-1">
        <div
          className={cn(
            'flex items-center gap-1.5 cursor-pointer',
            isLiked ? 'text-primary' : 'hover:text-foreground'
          )}
          onClick={handleLike}
        >
          <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
          <span>{formatCount(song.likes || 0)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" />
          <span>{formatCount(song.commentCount || 0)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />
          <span>{formatCount(song.downloadCount || 0)}</span>
        </div>
      </div>
    </div>
  );
}
