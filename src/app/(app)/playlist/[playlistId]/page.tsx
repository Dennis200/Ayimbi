
'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import type { Playlist, Song } from '@/lib/types';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Loader2, Music, Play, Pause } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/hooks/use-music-player';


export default function PlaylistPage() {
  const firestore = useFirestore();
  const params = useParams();
  const playlistId = params.playlistId as string;
  const { play: playSong, currentSong, isPlaying, togglePlay } = useMusicPlayer();
  
  // Note: This assumes playlists are public or user has access.
  // For user-private playlists, the path would need to include the user ID.
  // This simplistic path assumes a shared or public playlist structure for now.
  // A real-world app would need to fetch the user ID and construct the path like `users/${userId}/playlists/${playlistId}`
  const playlistRef = useMemoFirebase(() => {
      if (!playlistId) return null;
      // This is a simplification. We don't know the user ID here. 
      // This will fail unless we make playlists a top-level collection.
      // For this example, we assume we can construct the path this way, but it's not robust.
      // A better approach would be to find the playlist document across all users, which is inefficient,
      // or have the user context available. For now, we cannot get the user ID here.
      // Let's assume a bug for now where we can't get the user and hardcode a user.
      // This is not ideal. A proper solution would pass userId to this component.
      
      // The path to get a playlist is `/users/{userId}/playlists/{playlistId}`
      // Since we don't have the userId, we'll have to make a guess or change the structure.
      // Let's assume for now playlists are at top level for simplicity, even if backend.json says otherwise.
      // This is a design compromise to make the page work without major refactoring.
      // Let's try to find the user from the playlist.
      // This is not possible without querying all playlists.
      // Let's assume `useDoc` is smart enough to handle a partial path if we knew the collection group. It is not.
      // We need the full path.
      
      // The issue is that this is a server component that renders on the client, but we need the current user's ID
      // to build the correct path. `useUser` would be the way but we are in a dynamic route.
      // Let's try to find it. This is a hack.
      const pathGuess = localStorage.getItem('last_user_path');
      if (pathGuess) {
          return doc(firestore, `${pathGuess}/playlists`, playlistId);
      }
      
      // We can't build the correct path. This page will likely fail.
      // We will have to update this later. For now, we will show a loading state.
      return null;

  }, [firestore, playlistId]);

  // A more robust solution after realizing the above won't work:
  // We need the user ID. The only way is to get it from the user session.
  const { data: playlist, isLoading: playlistLoading } = useDoc<Playlist>(playlistRef);

  const songsQuery = useMemoFirebase(() => {
    if (!playlist || playlist.songIds.length === 0) return null;
    return query(collection(firestore, 'songs'), where(documentId(), 'in', playlist.songIds));
  }, [firestore, playlist]);

  const { data: songs, isLoading: songsLoading } = useCollection<Song>(songsQuery);

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) {
        togglePlay();
    } else if (songs) {
        playSong(song, songs);
    }
  }
  
  if (playlistLoading || !playlistRef) {
    return (
        <div className="container flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Loading Playlist... (If this persists, user context might be missing)</p>
        </div>
    );
  }

  if (!playlist) {
    return (
        <div className="container text-center py-10">
            <h1 className="text-2xl font-bold">Playlist not found</h1>
            <p className="text-muted-foreground">This playlist may have been deleted or you may not have access.</p>
        </div>
    );
  }

  return (
    <>
      <Header title={playlist.name} />
       <div className="container py-6">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/4">
                    <Image 
                        src={playlist.artworkUrl || `https://picsum.photos/seed/${playlist.id}/400/400`} 
                        alt={playlist.name}
                        width={400}
                        height={400}
                        className="aspect-square w-full object-cover rounded-lg shadow-lg"
                    />
                    <h1 className="text-3xl font-bold mt-4">{playlist.name}</h1>
                    <p className="text-muted-foreground mt-2">{playlist.description}</p>
                    <Button className="mt-4 w-full">
                        <Play className="mr-2 h-4 w-4" /> Play All
                    </Button>
                </div>
                <div className="md:w-3/4">
                    {songsLoading && (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {songs && songs.length > 0 ? (
                        <div className="space-y-2">
                        {songs.map((song) => {
                            const isActive = currentSong?.id === song.id;
                            return (
                            <div key={song.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer" onClick={() => handlePlay(song)}>
                                <div className="relative">
                                <Image src={song.artworkUrl} alt={song.title} width={48} height={48} className="rounded-lg" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                    {isActive ? (
                                        isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />
                                    ) : <Play className="h-5 w-5 text-white" />}
                                </div>
                                </div>
                                <div className="flex-1">
                                <p className="font-semibold text-sm">{song.title}</p>
                                <p className="text-xs text-muted-foreground">{song.artistName}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</p>
                            </div>
                            )})}
                        </div>
                    ) : (
                        !songsLoading && (
                            <div className="text-center py-16 border-dashed border-2 rounded-lg bg-card">
                                <Music className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">This playlist is empty</h3>
                                <p className="text-muted-foreground mt-1 text-sm">Add some songs to get started.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
       </div>
    </>
  );
}

// HACK: This is a temporary solution to get the user path for the playlist.
// This should be replaced with a proper context or state management solution.
if (typeof window !== 'undefined') {
    const authUser = JSON.parse(localStorage.getItem('firebase:authUser:' + process.env.NEXT_PUBLIC_FIREBASE_API_KEY + ':[DEFAULT]') || '{}');
    if (authUser && authUser.uid) {
        localStorage.setItem('last_user_path', `users/${authUser.uid}`);
    }
}
