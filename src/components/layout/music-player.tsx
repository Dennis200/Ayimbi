
'use client';

import Image from 'next/image';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Share2,
  Download,
  MoreHorizontal,
  Mic2,
  ListMusic,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import {
  arrayRemove,
  arrayUnion,
  doc,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { AddToPlaylistSubMenu } from '../playlists/add-to-playlist-submenu';

export function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    nextSong,
    prevSong,
    progress,
    duration,
    seek,
  } = useMusicPlayer();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  if (!currentSong) {
    return null;
  }

  const isLiked =
    user && currentSong.likeIds?.includes(user.uid);

  const handleLike = async () => {
    if (!user || !currentSong) {
      toast({
        title: 'Not Logged In',
        description: 'You need to be logged in to like a song.',
        variant: 'destructive',
      });
      return;
    }

    const songRef = doc(firestore, 'songs', currentSong.id);
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

  const handleDownload = async () => {
    if (!currentSong) return;

    // Increment download count in Firestore
    const songRef = doc(firestore, 'songs', currentSong.id);
    updateDoc(songRef, {
      downloadCount: increment(1),
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: songRef.path,
        operation: 'update',
        requestResourceData: { downloadCount: 'increment' },
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    // Initiate download
    try {
      const response = await fetch(currentSong.audioUrl);
      if (!response.ok) throw new Error('Network response was not ok.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      // Try to get a nice filename
      const fileName =
        currentSong.audioUrl.split('/').pop() || `${currentSong.title}.mp3`;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Downloading...',
        description: `"${currentSong.title}" has started downloading.`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the song. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!currentSong) return;

    const songRef = doc(firestore, 'songs', currentSong.id);
    updateDoc(songRef, {
      shares: increment(1),
    }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: songRef.path,
        operation: 'update',
        requestResourceData: { shares: 'increment' },
      });
      errorEmitter.emit('permission-error', permissionError);
    });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentSong.title,
          text: `Check out "${currentSong.title}" by ${currentSong.artistName} on Ayimbi!`,
          url: window.location.href, // Or a direct link to the song
        });
        toast({ title: "Song shared!" });
      } catch (error) {
        // Handle navigator.share() error
        toast({ title: "Could not share song", variant: 'destructive'});
      }
    } else {
       // Fallback for browsers that don't support navigator.share
       navigator.clipboard.writeText(window.location.href);
       toast({ title: "Link copied to clipboard!"});
    }
  };


  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleProgressChange = (value: number[]) => {
    seek(value[0]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[90px] w-full border-t bg-background/95 backdrop-blur-sm">
      <div className="container grid h-full grid-cols-12 items-center">
        {/* Song Info */}
        <div className="col-span-3 flex items-center gap-3 overflow-hidden">
          {currentSong.artworkUrl && (
            <Image
              src={currentSong.artworkUrl}
              alt={currentSong.albumTitle}
              width={56}
              height={56}
              className="rounded-md object-cover"
            />
          )}
          <div className="truncate">
            <p className="font-semibold truncate text-sm">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentSong.artistName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 ml-2"
            onClick={handleLike}
          >
            <Heart
              className={cn('h-4 w-4', isLiked && 'fill-red-500 text-red-500')}
            />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="col-span-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSong}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 fill-current" />
              ) : (
                <Play className="h-6 w-6 fill-current ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSong}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-1 flex w-full max-w-xl items-center gap-2 group">
            <span className="text-xs w-12 text-right text-muted-foreground">
              {formatTime(progress)}
            </span>
            <Slider
              value={[progress]}
              max={duration || 1}
              step={1}
              className="w-full"
              onValueChange={handleProgressChange}
            />
            <span className="text-xs w-12 text-left text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Actions */}
        <div className="col-span-3 flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Mic2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ListMusic className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2">
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Add to Playlist</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent sideOffset={5}>
                           <AddToPlaylistSubMenu songId={currentSong.id} />
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
