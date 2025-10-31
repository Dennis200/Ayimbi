'use client';

import React from 'react';
import { SidebarNav } from './sidebar-nav';
import { BottomNav } from './bottom-nav';
import { MusicPlayer } from './music-player';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentSong } = useMusicPlayer();
  const pathname = usePathname();

  // The profile page has its own layout
  if (pathname.startsWith('/profile/')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <main className={cn(
          'lg:pl-64 transition-[padding]',
          currentSong ? 'pb-[150px] lg:pb-[90px]' : 'pb-20 lg:pb-0'
        )}>
        {children}
      </main>
      <BottomNav />
      <MusicPlayer />
    </div>
  );
}
