'use client';

import { useUser, useFirestore } from '@/firebase';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<User>(userRef);

  const handleBecomeCreator = async () => {
    if (!userRef) return;
    try {
      await setDoc(userRef, { role: 'creator' }, { merge: true });
      toast({
        title: 'Congratulations!',
        description: "You are now a creator. You can start uploading music.",
      });
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { role: 'creator' },
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };
  
  const loading = userLoading || profileLoading;

  if (loading) {
    return (
      <>
        <Header title="Profile" />
        <div className="container flex items-center justify-center py-6">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header title="Profile" />
        <div className="container flex items-center justify-center py-6">
          <p>Please log in to see your profile.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Profile" />
      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl">{user.displayName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {userProfile?.role !== 'creator' && (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">
                  Want to share your music with the world?
                </p>
                <Button onClick={handleBecomeCreator}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Become a Creator
                </Button>
              </div>
            )}
             {userProfile?.role === 'creator' && (
                <div className="text-center py-10">
                    <p className="text-lg font-semibold">You are a Creator!</p>
                    <p className="text-muted-foreground mt-2">Start uploading and sharing your music with the world.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
