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
  VolumeX
} from 'lucide-react';
import { useState } from 'react';

export function MusicPlayer() {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong } = useMusicPlayer();
  const [isMuted, setIsMuted] = useState(false);

  if (!currentSong) {
    return null;
  }
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[90px] w-full border-t bg-background/95 backdrop-blur-sm lg:bottom-0">
      <div className="container grid h-full grid-cols-3 items-center">
        {/* Song Info */}
        <div className="flex items-center gap-3">
          <Image
            src={currentSong.album.artworkUrl}
            alt={currentSong.album.title}
            width={56}
            height={56}
            className="rounded-md"
          />
          <div>
            <p className="font-semibold">{currentSong.title}</p>
            <p className="text-sm text-muted-foreground">{currentSong.artist.name}</p>
          </div>
          <div className="flex gap-2 ml-4">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevSong}>
              <SkipBack />
            </Button>
            <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={nextSong}>
              <SkipForward />
            </Button>
          </div>
          <div className="mt-1 flex w-full max-w-md items-center gap-2">
             <span className="text-xs text-muted-foreground">0:00</span>
             <Slider defaultValue={[0]} max={currentSong.duration} step={1} className="w-full"/>
             <span className="text-xs text-muted-foreground">{formatTime(currentSong.duration)}</span>
          </div>
        </div>

        {/* Volume & Actions */}
        <div className="flex items-center justify-end gap-3">
           <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          <div className="flex items-center w-32 gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMuted(p => !p)}>
              {isMuted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
            </Button>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
