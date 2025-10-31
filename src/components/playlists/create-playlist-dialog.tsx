
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  name: z.string().min(1, 'Playlist name is required.'),
  description: z.string().optional(),
});

type CreatePlaylistFormValues = z.infer<typeof formSchema>;

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaylistDialog({ open, onOpenChange }: CreatePlaylistDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CreatePlaylistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreatePlaylistFormValues) => {
    if (!user) {
      toast({ title: "You must be logged in to create a playlist.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const playlistCollection = collection(firestore, `users/${user.uid}/playlists`);
      const playlistData = {
        name: data.name,
        description: data.description,
        userId: user.uid,
        songIds: [],
      };
      
      await addDoc(playlistCollection, playlistData)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: playlistCollection.path,
              operation: 'create',
              requestResourceData: playlistData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError; // Stop execution
        });

      toast({
        title: 'Playlist Created',
        description: `"${data.name}" has been created.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
        if (!(error instanceof FirestorePermissionError)) {
            toast({
              title: 'Error creating playlist',
              description: error.message || "An unexpected error occurred.",
              variant: 'destructive',
            });
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new playlist</DialogTitle>
          <DialogDescription>
            Give your playlist a name and an optional description.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Mix" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="The perfect soundtrack for..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Playlist
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
