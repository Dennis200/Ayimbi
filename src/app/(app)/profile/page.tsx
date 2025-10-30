'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
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
import { PlusCircle, Music, Share2, Twitter, Instagram, Globe } from 'lucide-react';
import { doc, setDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User, Song } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMusicPlayer } from '@/hooks/use-music-player';
import Image from 'next/image';

function CreatorDashboard({ user }: { user: import('firebase/auth').User }) {
  const firestore = useFirestore();
  const { play: playSong, currentSong: activeSong, isPlaying } = useMusicPlayer();

  const songsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'songs'), where('artistId', '==', user.uid));
  }, [firestore, user]);

  const { data: uploadedSongs, loading } = useCollection<Song>(songsQuery);
  
  const handlePlay = (song: Song) => {
    if (uploadedSongs) {
        playSong(song, uploadedSongs);
    }
  }

  if (loading) return <p>Loading your songs...</p>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Your Uploads</h2>
      {uploadedSongs && uploadedSongs.length > 0 ? (
        <div className="space-y-4">
          {uploadedSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary">
              <Image src={song.artworkUrl} alt={song.title} width={48} height={48} className="rounded-md" />
              <div className="flex-1">
                <p className="font-medium">{song.title}</p>
                <p className="text-sm text-muted-foreground">{song.albumTitle}</p>
              </div>
              <p className="text-sm text-muted-foreground">{song.genre}</p>
              <Button variant="ghost" size="icon" onClick={() => handlePlay(song)}>
                <Music className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">You haven't uploaded any music yet.</p>
          <Button variant="link" asChild>
            <a href="/upload">Upload your first track</a>
          </Button>
        </div>
      )}
    </div>
  );
}


function UserDashboard() {
  const { recentlyPlayed, play: playSong } = useMusicPlayer();

  const handlePlay = (song: Song) => {
    playSong(song, recentlyPlayed.map(p => p.song));
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Recently Played</h2>
      {recentlyPlayed && recentlyPlayed.length > 0 ? (
        <div className="space-y-4">
          {recentlyPlayed.map(({ song }) => (
             <div key={song.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary">
             <Image src={song.artworkUrl} alt={song.title} width={48} height={48} className="rounded-md" />
             <div className="flex-1">
               <p className="font-medium">{song.title}</p>
               <p className="text-sm text-muted-foreground">{song.artistName}</p>
             </div>
             <Button variant="ghost" size="icon" onClick={() => handlePlay(song)}>
                <Music className="h-5 w-5" />
              </Button>
           </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No recently played songs.</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<User>(userRef);

  const handleBecomeCreator = () => {
    if (!userRef) return;
    setDoc(userRef, { role: 'creator' }, { merge: true })
      .then(() => {
         toast({
          title: 'Congratulations!',
          description: "You are now a creator. You can start uploading music.",
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { role: 'creator' },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Profile Link Copied!',
      description: 'You can now share your profile with others.',
    });
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
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-28 w-28">
                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
                <AvatarFallback className="text-4xl">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <CardTitle className="text-3xl">{user.displayName}</CardTitle>
                  {userProfile?.role === 'creator' && (
                     <CardDescription className="font-semibold text-primary mt-1 border border-primary px-2 py-0.5 rounded-full text-xs">CREATOR</CardDescription>
                  )}
                </div>
                <CardDescription>@{userProfile?.username || user.uid}</CardDescription>
                
                <p className="mt-2 text-sm text-muted-foreground">{userProfile?.bio || 'No bio yet.'}</p>
                
                <div className="flex justify-center sm:justify-start gap-3 mt-3">
                  {userProfile?.socials?.twitter && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={userProfile.socials.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5" /></a>
                    </Button>
                  )}
                  {userProfile?.socials?.instagram && (
                     <Button variant="ghost" size="icon" asChild>
                      <a href={userProfile.socials.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5" /></a>
                     </Button>
                  )}
                  {userProfile?.socials?.website && (
                     <Button variant="ghost" size="icon" asChild>
                      <a href={userProfile.socials.website} target="_blank" rel="noopener noreferrer"><Globe className="h-5 w-5" /></a>
                     </Button>
                  )}
                   <Button variant="ghost" size="icon" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {userProfile?.role === 'creator' ? (
                <CreatorDashboard user={user} />
            ) : (
              <>
                <UserDashboard />
                <div className="text-center py-10 mt-8 border-t">
                  <p className="text-muted-foreground mb-4">
                    Want to share your music with the world?
                  </p>
                  <Button onClick={handleBecomeCreator}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Become a Creator
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
