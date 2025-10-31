'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Song, Album } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ScrollArea } from '../ui/scroll-area';

const featuredArtistSchema = z.object({
    name: z.string().min(1, 'Artist name is required'),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  albumId: z.string().min(1, 'Album is required'),
  lyrics: z.string().optional(),
  featuredArtists: z.array(featuredArtistSchema).optional(),
});

type EditSongFormValues = z.infer<typeof formSchema>;

interface EditSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song;
  albums: Album[];
}

export function EditSongDialog({ open, onOpenChange, song, albums }: EditSongDialogProps) {
  const [loading, setLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<EditSongFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: song.title || '',
      albumId: song.albumId || '',
      lyrics: song.lyrics || '',
      featuredArtists: song.featuredArtists || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'featuredArtists',
  });

  const onSubmit = async (data: EditSongFormValues) => {
    setLoading(true);
    
    const selectedAlbum = albums.find(album => album.id === data.albumId);

    const songData: Partial<Song> = {
        title: data.title,
        albumId: data.albumId,
        albumTitle: selectedAlbum?.title || '',
        lyrics: data.lyrics,
        featuredArtists: data.featuredArtists,
    };

    const songRef = doc(firestore, 'songs', song.id);

    updateDoc(songRef, songData)
      .then(() => {
        toast({
          title: 'Song Updated',
          description: 'Your song has been successfully updated.',
        });
        onOpenChange(false);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: songRef.path,
          operation: 'update',
          requestResourceData: songData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
          <DialogDescription>
            Make changes to your song details below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="title"
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
                name="albumId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Album</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an album" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        {albums.map(album => (
                            <SelectItem key={album.id} value={album.id}>{album.title}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="space-y-2">
                    <FormLabel>Featured Artists (Optional)</FormLabel>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`featuredArtists.${index}.name`}
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
                <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Lyrics</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Enter song lyrics here..." {...field} rows={10} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
