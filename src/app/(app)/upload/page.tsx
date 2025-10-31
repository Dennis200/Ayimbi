
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
  addDoc,
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
import { Progress } from '@/components/ui/progress';
import { upload } from '@vercel/blob/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const featuredArtistSchema = z.object({
    name: z.string().min(1, 'Artist name is required'),
});

const baseTrackSchema = z.object({
  title: z.string().min(1, 'Track title is required'),
  audioFile: z.any().refine((file) => file instanceof File && file.size > 0, 'An audio file is required.'),
  featuredArtists: z.array(featuredArtistSchema).optional(),
});

const collectionTrackSchema = baseTrackSchema;

const singleTrackSchema = baseTrackSchema.extend({
  artworkFile: z.any().refine((file) => file instanceof File && file.size > 0, 'Artwork file is required'),
  genre: z.string().optional(),
  lyrics: z.string().optional(),
});

const collectionFormSchema = z.object({
  collectionTitle: z.string().min(1, 'Album/EP title is required'),
  collectionType: z.enum(['album', 'ep'], { required_error: 'You must select a type.' }),
  artworkFile: z.any().refine((file) => file instanceof File && file.size > 0, 'Artwork file is required'),
  tracks: z.array(collectionTrackSchema).min(1, 'At least one track is required.'),
});

type CollectionUploadFormValues = z.infer<typeof collectionFormSchema>;
type SingleUploadFormValues = z.infer<typeof singleTrackSchema>;

function CollectionUploadForm() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<CollectionUploadFormValues>({
        resolver: zodResolver(collectionFormSchema),
        defaultValues: {
          collectionTitle: '',
          tracks: [{ title: '', audioFile: null, featuredArtists: [] }],
        },
      });
    
      const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'tracks',
      });

      const onSubmit = async (data: CollectionUploadFormValues) => {
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
              featuredArtists: trackData.featuredArtists || [],
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
          toast({
            title: 'Upload Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
          setProgress(0);
        }
      };

    return (
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
                <TrackFieldArray key={field.id} form={form} parentIndex={index} removeParent={remove} parentFields={fields} />
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ title: '', audioFile: null, featuredArtists: [] })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Track
            </Button>
            
            <Separator />

            {loading && <Progress value={progress} className="w-full" />}
            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload Collection'}
            </Button>
          </form>
        </Form>
    );
}

function SingleSongUploadForm() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<SingleUploadFormValues>({
        resolver: zodResolver(singleTrackSchema),
        defaultValues: {
          title: '',
          audioFile: null,
          artworkFile: null,
          genre: '',
          lyrics: '',
          featuredArtists: [],
        },
    });

    const onSubmit = async (data: SingleUploadFormValues) => {
        if (!user) {
          toast({ title: 'Authentication Error', description: 'You must be logged in to upload music.', variant: 'destructive' });
          return;
        }
        setLoading(true);
    
        try {
            setProgress(10);
            const artworkBlob = await upload(data.artworkFile.name, data.artworkFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
                onProgress: (p) => setProgress(10 + p * 0.4)
            });
            const artworkUrl = artworkBlob.url;
            setProgress(50);
            
            const audioBlob = await upload(data.audioFile.name, data.audioFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
                onProgress: (p) => setProgress(50 + p * 0.45)
            });
            const audioUrl = audioBlob.url;
            setProgress(95);

            const songData = {
              title: data.title,
              duration: 0, // Placeholder
              artistId: user.uid,
              artistName: user.displayName || 'Unknown Artist',
              albumId: 'single', // Special ID for singles
              albumTitle: 'Single',
              artworkUrl,
              audioUrl,
              genre: data.genre,
              lyrics: data.lyrics,
              featuredArtists: data.featuredArtists || [],
              likes: 0,
              playCount: 0,
              shares: 0,
              downloadCount: 0,
              createdAt: serverTimestamp(),
            };

            const songRef = await addDoc(collection(firestore, 'songs'), {});
            await updateDoc(songRef, { ...songData, id: songRef.id });

            setProgress(100);
            toast({
                title: 'Upload Successful',
                description: `"${data.title}" has been added.`,
            });
            router.push('/dashboard');

        } catch (error: any) {
          console.error('Upload failed:', error);
          toast({
            title: 'Upload Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
          setProgress(0);
        }
      };

    return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardContent className="p-6 space-y-6">
                    <FormField
                        control={form.control}
                        name={`title`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Track Title</FormLabel>
                            <FormControl>
                                <Input placeholder={`Track Title`} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name={`artworkFile`}
                            render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                <FormLabel>Artwork</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} {...rest} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`audioFile`}
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
                     <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Genre (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Hip-Hop, Pop, Lofi" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <TrackFieldArray form={form} />
                     <FormField
                        control={form.control}
                        name="lyrics"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lyrics (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter song lyrics here..." {...field} rows={8}/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            
            <Separator />

            {loading && <Progress value={progress} className="w-full" />}
            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload Song'}
            </Button>
          </form>
        </Form>
    );
}

function TrackFieldArray({ form, parentIndex, removeParent, parentFields }: { form: any, parentIndex?: number, removeParent?: any, parentFields?: any[] }) {
    const namePrefix = parentIndex !== undefined ? `tracks.${parentIndex}` : '';
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: `${namePrefix}.featuredArtists`,
    });
  
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {parentIndex !== undefined && <span className="text-lg font-bold text-muted-foreground pt-3">{parentIndex + 1}</span>}
            <div className="flex-grow space-y-4">
              {parentIndex !== undefined ? (
                <>
                  <FormField
                    control={form.control}
                    name={`${namePrefix}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Track Title</FormLabel>
                        <FormControl>
                          <Input placeholder={`Track ${parentIndex + 1} Title`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`${namePrefix}.audioFile`}
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
                </>
              ) : null}
  
              <div className="space-y-2">
                <FormLabel>Featured Artists (Optional)</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`${namePrefix}.featuredArtists.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input placeholder="Artist Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Feature
                </Button>
              </div>
            </div>
            {parentIndex !== undefined && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeParent(parentIndex)}
                disabled={parentFields && parentFields.length <= 1}
                className="mt-7"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
}

export default function UploadPage() {

  return (
    <>
      <Header title="Upload Your Music" />
      <div className="container max-w-4xl py-10">
        <Tabs defaultValue="single">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="single">Single Song</TabsTrigger>
                <TabsTrigger value="collection">Collection (Album/EP)</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
                <SingleSongUploadForm />
            </TabsContent>
            <TabsContent value="collection">
                <CollectionUploadForm />
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

