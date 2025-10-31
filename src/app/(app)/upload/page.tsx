'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Progress } from '@/components/ui/progress';
import { upload } from '@vercel/blob/client';
import { Textarea } from '@/components/ui/textarea';

const genres = ["Electronic", "Acoustic", "Rock", "Pop", "Hip-Hop", "Jazz", "Classical"];

const formSchema = z.object({
  songTitle: z.string().min(1, 'Song title is required'),
  albumTitle: z.string().min(1, 'Album title is required'),
  genre: z.string().min(1, 'Genre is required'),
  lyrics: z.string().optional(),
  audioFile: z.any().refine((file) => file instanceof File && file.size > 0, 'Audio file is required').refine(file => file?.type?.startsWith('audio/'), 'File must be an audio type.'),
  artworkFile: z.any().refine((file) => file instanceof File && file.size > 0, 'Artwork file is required').refine(file => file?.type?.startsWith('image/'), 'File must be an image type.'),
});

type UploadFormValues = z.infer<typeof formSchema>;

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
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
      lyrics: '',
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
      // 1. Upload files to Vercel Blob
      const [artworkBlob, audioBlob] = await Promise.all([
        upload(data.artworkFile.name, data.artworkFile, {
            access: 'public',
            handleUploadUrl: '/api/upload',
        }),
        upload(data.audioFile.name, data.audioFile, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            onProgress: (progress) => {
                setProgress(progress);
            }
        })
      ]);

      const artworkUrl = artworkBlob.url;
      const audioUrl = audioBlob.url;
      
      // 2. Create album document in Firestore
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
      
      setDoc(albumRef, albumData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: albumRef.path,
            operation: 'create',
            requestResourceData: albumData,
          });
          errorEmitter.emit('permission-error', permissionError);
          // Re-throw to stop execution but be caught by the outer try-catch
          throw permissionError;
        });

      // 3. Create song document in Firestore
      const songCollection = collection(firestore, 'songs');
      const songData = {
        title: data.songTitle,
        genre: data.genre,
        lyrics: data.lyrics,
        duration: 0, // Placeholder, can be extracted from audio metadata client-side
        artistId: user.uid,
        artistName: user.displayName || 'Unknown Artist',
        albumId: albumRef.id,
        albumTitle: data.albumTitle,
        artworkUrl,
        audioUrl,
        likes: 0,
        shares: 0,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      };

      addDoc(songCollection, songData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: songCollection.path,
            operation: 'create',
            requestResourceData: songData,
          });
          errorEmitter.emit('permission-error', permissionError);
           // Re-throw to stop execution but be caught by the outer try-catch
          throw permissionError;
        });

      toast({
        title: 'Upload Successful',
        description: `"${data.songTitle}" has been added.`,
      });

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Upload failed:', error);
      // Don't show a toast for permission errors, as they are handled by the global listener
      if (!(error instanceof FirestorePermissionError)) {
          toast({
            title: 'Upload Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
      }
    } finally {
      // This will now run even if a FirestorePermissionError is thrown
      setLoading(false);
      setProgress(0);
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
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lyrics (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="You can add song lyrics here..." {...field} />
                  </FormControl>
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
                      accept="image/png, image/jpeg, image/jpg"
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
            {loading && <Progress value={progress} className="w-full" />}
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
