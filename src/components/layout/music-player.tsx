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
  Volume2,
  VolumeX,
  Volume1,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MusicPlayer() {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    nextSong, 
    prevSong,
    progress,
    duration,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    seek,
  } = useMusicPlayer();

  if (!currentSong) {
    return null;
  }
  
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  const handleProgressChange = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[90px] w-full border-t bg-background/95 backdrop-blur-sm lg:bottom-0">
      <div className="container grid h-full grid-cols-3 items-center">
        {/* Song Info */}
        <div className="flex items-center gap-3 overflow-hidden">
          {currentSong.album.artworkUrl && (
            <Image
              src={currentSong.album.artworkUrl}
              alt={currentSong.album.title}
              width={56}
              height={56}
              className="rounded-md object-cover"
            />
          )}
          <div className="truncate">
            <p className="font-semibold truncate">{currentSong.title}</p>
            <p className="text-sm text-muted-foreground truncate">{currentSong.artist.name}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevSong} className="h-9 w-9">
              <SkipBack className="h-5 w-5"/>
            </Button>
            <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={nextSong} className="h-9 w-9">
              <SkipForward className="h-5 w-5"/>
            </Button>
          </div>
          <div className="mt-1 flex w-full max-w-md items-center gap-2 group">
             <span className="text-xs w-10 text-right text-muted-foreground">{formatTime(progress)}</span>
             <Slider 
                value={[progress]} 
                max={duration || 1} 
                step={1} 
                className="w-full"
                onValueChange={handleProgressChange}
             />
             <span className="text-xs w-10 text-left text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Actions */}
        <div className="flex items-center justify-end gap-3">
           <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          <div className="flex items-center w-32 gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              <VolumeIcon className="h-5 w-5"/>
            </Button>
            <Slider 
              value={[isMuted ? 0 : volume * 100]} 
              max={100} 
              step={1} 
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
