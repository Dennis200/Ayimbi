'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { User as UserType, Song, Album } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Loader2, Music, Trash2, Edit, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { EditSongDialog } from '@/components/dashboard/edit-song-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);

  const songsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'songs'), where('artistId', '==', user.uid));
  }, [firestore, user]);

  const albumsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'albums'), where('artistId', '==', user.uid));
  }, [firestore, user]);

  const { data: songs, isLoading: songsLoading } = useCollection<Song>(songsQuery);
  const { data: albums, isLoading: albumsLoading } = useCollection<Album>(albumsQuery);

  const handleDeleteSong = async () => {
    if (!songToDelete) return;

    setIsDeleting(true);
    const songRef = doc(firestore, 'songs', songToDelete.id);

    try {
      await deleteDoc(songRef);

      // Optional: Check if the album becomes empty and delete it too
      if (songToDelete.albumId) {
        const albumSongsQuery = query(collection(firestore, 'songs'), where('albumId', '==', songToDelete.albumId));
        const albumSongsSnapshot = await getDocs(albumSongsQuery);
        if (albumSongsSnapshot.empty) {
            const albumRef = doc(firestore, 'albums', songToDelete.albumId);
            await deleteDoc(albumRef);
            toast({ title: 'Album deleted', description: `Album "${songToDelete.albumTitle}" was empty and has been removed.` });
        }
      }


      toast({
        title: 'Song Deleted',
        description: `"${songToDelete.title}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: 'Error',
        description: 'Could not delete the song. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setSongToDelete(null);
    }
  };

  const isLoading = userLoading || songsLoading || albumsLoading;

  if (isLoading) {
    return (
      <div className="container flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container text-center py-10">
        <p>Please log in to see your dashboard.</p>
      </div>
    )
  }
  
  if (user && !songsLoading && !albumsLoading && songs?.length === 0 && albums?.length === 0) {
    return (
       <>
        <Header title="Creator Dashboard" />
         <div className="container text-center py-20">
            <Music className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No music uploaded yet</h3>
            <p className="text-muted-foreground mt-1 text-sm mb-6">Start by uploading your first track.</p>
            <Button asChild>
                <Link href="/upload">
                    <PlusCircle className="mr-2 h-4 w-4" /> Upload Song
                </Link>
            </Button>
        </div>
      </>
    )
  }


  return (
    <>
      <Header title="Creator Dashboard" />
      <div className="container py-6 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Your Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {albums?.map(album => (
                <Card key={album.id}>
                    <CardContent className="p-0">
                        <Image src={album.artworkUrl} alt={album.title} width={300} height={300} className="aspect-square w-full object-cover rounded-t-lg"/>
                    </CardContent>
                    <CardHeader className="p-4">
                        <CardTitle className="text-base truncate">{album.title}</CardTitle>
                    </CardHeader>
                </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Your Songs</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {songs?.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="font-medium">{song.title}</TableCell>
                    <TableCell>{song.albumTitle}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => setSongToEdit(song)}>
                          <Edit className="h-4 w-4" />
                       </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSongToDelete(song)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the song
                              "{song.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteSong}
                              disabled={isDeleting}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </div>
      {songToEdit && albums && (
        <EditSongDialog
            open={!!songToEdit}
            onOpenChange={(isOpen) => !isOpen && setSongToEdit(null)}
            song={songToEdit}
            albums={albums}
        />
      )}
    </>
  );
}
