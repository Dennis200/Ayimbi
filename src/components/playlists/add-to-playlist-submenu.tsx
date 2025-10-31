
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Playlist } from '@/lib/types';
import { DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Loader2 } from 'lucide-react';

export function AddToPlaylistSubMenu({ songId }: { songId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const playlistsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `users/${user.uid}/playlists`)) : null),
    [firestore, user]
  );
  const { data: playlists, isLoading } = useCollection<Playlist>(playlistsQuery);

  const handleAddToPlaylist = async (playlist: Playlist) => {
    if (!user) return;
    
    if (playlist.songIds.includes(songId)) {
        toast({ title: "Song already in playlist." });
        return;
    }

    const playlistRef = doc(firestore, `users/${user.uid}/playlists`, playlist.id);
    const updateData = { songIds: arrayUnion(songId) };

    await updateDoc(playlistRef, updateData)
        .then(() => {
            toast({
                title: "Added to playlist",
                description: `Song has been added to "${playlist.name}".`,
            });
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: playlistRef.path,
              operation: 'update',
              requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  if (isLoading) {
    return <DropdownMenuItem disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</DropdownMenuItem>;
  }

  if (!playlists || playlists.length === 0) {
    return <DropdownMenuItem disabled>No playlists found.</DropdownMenuItem>;
  }

  return (
    <>
      <DropdownMenuLabel>Your Playlists</DropdownMenuLabel>
      {playlists.map((playlist) => (
        <DropdownMenuItem key={playlist.id} onClick={() => handleAddToPlaylist(playlist)}>
          {playlist.name}
        </DropdownMenuItem>
      ))}
    </>
  );
}
