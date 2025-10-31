
'use client';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus, Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';
import { CreatePlaylistDialog } from '@/components/playlists/create-playlist-dialog';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Playlist } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

export default function LibraryPage() {
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const playlistsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `users/${user.uid}/playlists`)) : null),
    [firestore, user]
  );
  const { data: playlists, isLoading } = useCollection<Playlist>(playlistsQuery);


  return (
    <>
      <Header title="Your Library" />
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Playlists</h2>
          <Button onClick={() => setIsCreatePlaylistOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Playlist
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists?.map(playlist => (
                 <Link href={`/playlist/${playlist.id}`} key={playlist.id}>
                    <Card className="hover:bg-accent transition-colors">
                         <CardContent className="p-0">
                            <Image 
                                src={playlist.artworkUrl || "https://picsum.photos/seed/1/300/300"} 
                                alt={playlist.name} 
                                width={300} height={300} 
                                className="aspect-square w-full object-cover rounded-t-lg"/>
                        </CardContent>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base truncate">{playlist.name}</CardTitle>
                             <CardDescription className="truncate">{playlist.description}</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
            {playlists && playlists.length === 0 && !isLoading && (
                 <Card className="col-span-full flex flex-col items-center justify-center text-center p-6 border-dashed">
                    <Music className="h-8 w-8 text-muted-foreground mb-2" />
                    <CardTitle className="mb-2 text-lg">No playlists yet</CardTitle>
                    <CardDescription className="mb-4">Create your first playlist to organize your favorite tracks.</CardDescription>
                    <Button variant="outline" onClick={() => setIsCreatePlaylistOpen(true)}>
                        Create Playlist
                    </Button>
                </Card>
            )}
            <Card className="col-span-full flex flex-col items-center justify-center text-center p-6 border-dashed">
                <Wand2 className="h-8 w-8 text-muted-foreground mb-2" />
                <CardTitle className="mb-2 text-lg">Generate a new playlist</CardTitle>
                <CardDescription className="mb-4">Let our AI curate a playlist based on your taste.</CardDescription>
                <Button variant="outline">
                    Generate with AI
                </Button>
            </Card>
        </div>
      </div>
      <CreatePlaylistDialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen} />
    </>
  );
}
