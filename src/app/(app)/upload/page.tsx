'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirebaseStorage } from '@/lib/firebase-helpers';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Header } from '@/components/layout/header';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const genres = ["Electronic", "Acoustic", "Rock", "Pop", "Hip-Hop", "Jazz", "Classical"];

const formSchema = z.object({
  songTitle: z.string().min(1, 'Song title is required'),
  albumTitle: z.string().min(1, 'Album title is required'),
  genre: z.string().min(1, 'Genre is required'),
  audioFile: z.instanceof(File).refine((file) => file.size > 0, 'Audio file is required'),
  artworkFile: z.instanceof(File).refine((file) => file.size > 0, 'Artwork file is required'),
});

type UploadFormValues = z.infer<typeof formSchema>;

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const { uploadFile } = useFirebaseStorage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      songTitle: '',
      albumTitle: '',
      genre: '',
    },
  });

  const onSubmit = async (data: UploadFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to upload music.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    try {
      // 1. Upload files to Firebase Storage
      const audioPath = `uploads/music/${user.uid}/${Date.now()}_${data.audioFile.name}`;
      const artworkPath = `uploads/artwork/${user.uid}/${Date.now()}_${data.artworkFile.name}`;

      const audioUrl = await uploadFile(audioPath, data.audioFile);
      const artworkUrl = await uploadFile(artworkPath, data.artworkFile);

      // 2. Create album if it doesn't exist (simple check by title for this example)
      // In a real app, you'd likely want a more robust way to handle this.
      const albumRef = doc(collection(firestore, 'albums'));
      const albumData = {
          id: albumRef.id,
          title: data.albumTitle,
          artistId: user.uid,
          artistName: user.displayName || 'Unknown Artist',
          artworkUrl: artworkUrl,
          releaseDate: new Date().toISOString().split('T')[0], // Today's date
          type: 'album' as const,
      };
      
      const setAlbumDoc = setDoc(albumRef, albumData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: albumRef.path,
            operation: 'create',
            requestResourceData: albumData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });

      // 3. Create song document in Firestore
      const songCollection = collection(firestore, 'songs');
      const songData = {
        title: data.songTitle,
        genre: data.genre,
        duration: 0, // Placeholder, can be extracted from audio metadata
        artistId: user.uid,
        artistName: user.displayName || 'Unknown Artist',
        albumId: albumRef.id,
        albumTitle: data.albumTitle,
        artworkUrl,
        audioUrl,
        likes: 0,
        shares: 0,
        createdAt: serverTimestamp(),
      };

      const addSongDoc = addDoc(songCollection, songData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: songCollection.path,
            operation: 'create',
            requestResourceData: songData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
        
      await Promise.all([setAlbumDoc, addSongDoc]);


      toast({
        title: 'Upload Successful',
        description: `"${data.songTitle}" has been added.`,
      });

      router.push('/home');
    } catch (error: any) {
      console.error('Upload failed:', error);
      if (!(error instanceof FirestorePermissionError)) {
          toast({
            title: 'Upload Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Upload Music" />
      <div className="container max-w-2xl py-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="songTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Song Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Track" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="albumTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Album Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Best Of Me" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genre</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="audioFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Audio File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        onChange(e.target.files ? e.target.files[0] : null);
                      }}
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artworkFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Album Artwork</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        onChange(e.target.files ? e.target.files[0] : null);
                      }}
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Upload Song'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
