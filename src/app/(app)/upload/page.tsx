
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  writeBatch,
  serverTimestamp,
  doc,
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
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Progress } from '@/components/ui/progress';
import { upload } from '@vercel/blob/client';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const trackSchema = z.object({
  title: z.string().min(1, 'Track title is required'),
  audioFile: z.any().refine((file) => file instanceof File && file.size > 0, 'An audio file is required.'),
});

const formSchema = z.object({
  collectionTitle: z.string().min(1, 'Album/EP title is required'),
  collectionType: z.enum(['album', 'ep'], { required_error: 'You must select a type.' }),
  artworkFile: z.any().refine((file) => file instanceof File && file.size > 0, 'Artwork file is required'),
  tracks: z.array(trackSchema).min(1, 'At least one track is required.'),
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
      collectionTitle: '',
      tracks: [{ title: '', audioFile: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tracks',
  });

  const onSubmit = async (data: UploadFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to upload music.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    try {
      // 1. Upload Artwork
      setProgress(5);
      const artworkBlob = await upload(data.artworkFile.name, data.artworkFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      const artworkUrl = artworkBlob.url;
      setProgress(15);

      // 2. Upload all audio files
      const audioUploadPromises = data.tracks.map((track, index) =>
        upload(track.audioFile.name, track.audioFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          onProgress: (p) => {
            const baseProgress = 15;
            const totalAudioProgress = 80;
            const progressPerFile = totalAudioProgress / data.tracks.length;
            const currentFileProgress = (p / 100) * progressPerFile;
            const uploadedFilesProgress = index * progressPerFile;
            setProgress(baseProgress + uploadedFilesProgress + currentFileProgress);
          },
        })
      );
      const audioBlobs = await Promise.all(audioUploadPromises);
      setProgress(95);

      // 3. Prepare batch write for Firestore
      const batch = writeBatch(firestore);

      // 4. Create album document
      const albumRef = doc(collection(firestore, 'albums'));
      const albumData = {
        id: albumRef.id,
        title: data.collectionTitle,
        artistId: user.uid,
        artistName: user.displayName || 'Unknown Artist',
        artworkUrl: artworkUrl,
        releaseDate: new Date().toISOString().split('T')[0],
        type: data.collectionType,
      };
      batch.set(albumRef, albumData);

      // 5. Create song documents
      audioBlobs.forEach((audioBlob, index) => {
        const trackData = data.tracks[index];
        const songRef = doc(collection(firestore, 'songs'));
        const songData = {
          id: songRef.id,
          title: trackData.title,
          duration: 0, // Placeholder
          artistId: user.uid,
          artistName: user.displayName || 'Unknown Artist',
          albumId: albumRef.id,
          albumTitle: data.collectionTitle,
          artworkUrl,
          audioUrl: audioBlob.url,
          likes: 0,
          playCount: 0,
          shares: 0,
          downloadCount: 0,
          createdAt: serverTimestamp(),
        };
        batch.set(songRef, songData);
      });
      
      // 6. Commit batch
      await batch.commit();
      setProgress(100);

      toast({
        title: 'Upload Successful',
        description: `"${data.collectionTitle}" has been added.`,
      });

      router.push('/dashboard');
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
      setProgress(0);
    }
  };

  return (
    <>
      <Header title="Upload Album / EP" />
      <div className="container max-w-4xl py-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="p-6 space-y-6">
                 <FormField
                  control={form.control}
                  name="collectionTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Album / EP Title</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Collection" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="collectionType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Collection Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a type (Album or EP)" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="album">Album</SelectItem>
                                <SelectItem value="ep">EP</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="artworkFile"
                    render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                        <FormLabel>Artwork</FormLabel>
                        <FormControl>
                            <Input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                            {...rest}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tracks</h3>
              {fields.map((field, index) => (
                <Card key={field.id}>
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <span className="text-lg font-bold text-muted-foreground pt-3">{index + 1}</span>
                            <div className="flex-grow space-y-4">
                                <FormField
                                    control={form.control}
                                    name={`tracks.${index}.title`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Track Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder={`Track ${index + 1} Title`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`tracks.${index}.audioFile`}
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem>
                                        <FormLabel>Audio File</FormLabel>
                                        <FormControl>
                                            <Input type="file" accept="audio/*" onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} {...rest} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                                className="mt-7"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ title: '', audioFile: null })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Track
            </Button>
            
            <Separator />

            {loading && <Progress value={progress} className="w-full" />}
            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload Collection'}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
