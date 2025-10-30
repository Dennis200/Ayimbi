
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { PlusCircle, Music, Share2, Twitter, Instagram, Globe, Edit, ListMusic } from 'lucide-react';
import { doc, setDoc, collection, query, where } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User, Song } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMusicPlayer } from '@/hooks/use-music-player';
import Image from 'next/image';
import { EditProfileDialog } from '@/components/auth/edit-profile-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CreatorDashboard({ user }: { user: import('firebase/auth').User }) {
  const firestore = useFirestore();
  const { play: playSong } = useMusicPlayer();

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

  if (loading) return <p className="text-center p-10">Loading your songs...</p>;

  return (
    <div className="mt-6">
      {uploadedSongs && uploadedSongs.length > 0 ? (
        <div className="space-y-2">
          {uploadedSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary transition-colors">
              <Image src={song.artworkUrl} alt={song.title} width={40} height={40} className="rounded-sm" />
              <div className="flex-1">
                <p className="font-medium text-sm">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.albumTitle}</p>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">{song.genre}</p>
              <Button variant="ghost" size="icon" onClick={() => handlePlay(song)} className="h-8 w-8">
                <Music className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg mt-6">
          <ListMusic className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No uploads yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">You haven't uploaded any music.</p>
          <Button variant="link" asChild className="mt-2">
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
  
  if (recentlyPlayed.length === 0) {
      return (
        <div className="text-center py-16 border-dashed border-2 rounded-lg mt-6">
            <Music className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No recent activity</h3>
            <p className="text-muted-foreground mt-1 text-sm">Songs you play will appear here.</p>
        </div>
      )
  }

  return (
    <div className="mt-6">
      <div className="space-y-2">
        {recentlyPlayed.map(({ song }) => (
            <div key={song.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary transition-colors">
            <Image src={song.artworkUrl} alt={song.title} width={40} height={40} className="rounded-sm" />
            <div className="flex-1">
                <p className="font-medium text-sm">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.artistName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handlePlay(song)} className="h-8 w-8">
                <Music className="h-4 w-4" />
            </Button>
            </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

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
          <p>Loading profile...</p>
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
      <div className="container py-6 space-y-6">
        <Card className="overflow-hidden">
            <div className="relative h-40 md:h-52 bg-secondary">
                {userProfile?.coverPhotoUrl ? (
                    <Image src={userProfile.coverPhotoUrl} alt="Cover photo" fill className="object-cover" />
                ) : (
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-full w-full"></div>
                )}
            </div>
            <div className="p-6 pt-0 -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shrink-0">
                    <AvatarImage src={userProfile?.avatarUrl ?? user.photoURL ?? ''} alt={userProfile?.name ?? ''} />
                    <AvatarFallback className="text-6xl">
                    {userProfile?.name?.charAt(0) || user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left mt-4 sm:mt-16 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                             <div className="flex items-center justify-center sm:justify-start gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{userProfile?.name || user.displayName}</h1>
                                {userProfile?.role === 'creator' && (
                                    <span className="font-semibold text-primary mt-1 border border-primary px-2 py-0.5 rounded-full text-xs uppercase tracking-wider">CREATOR</span>
                                )}
                            </div>
                            <p className="text-muted-foreground text-sm">@{userProfile?.username || user.uid}</p>
                        </div>
                        <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
                           <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto sm:mx-0">{userProfile?.bio || 'No bio yet. Click edit to add one!'}</p>
                    <div className="flex justify-center sm:justify-start gap-1 mt-3">
                        {userProfile?.socials?.twitter && (
                            <Button variant="ghost" size="sm" asChild>
                            <a href={userProfile.socials.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4 mr-2" /> Twitter</a>
                            </Button>
                        )}
                        {userProfile?.socials?.instagram && (
                            <Button variant="ghost" size="sm" asChild>
                            <a href={userProfile.socials.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4 mr-2" /> Instagram</a>
                            </Button>
                        )}
                        {userProfile?.socials?.website && (
                            <Button variant="ghost" size="sm" asChild>
                            <a href={userProfile.socials.website} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4 mr-2" /> Website</a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
        
        {userProfile?.role === 'creator' ? (
            <Tabs defaultValue="uploads" className="w-full">
                <TabsList>
                    <TabsTrigger value="uploads">Uploads</TabsTrigger>
                    <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="uploads">
                    <Card><CardContent><CreatorDashboard user={user} /></CardContent></Card>
                </TabsContent>
                <TabsContent value="activity">
                    <Card><CardContent><UserDashboard /></CardContent></Card>
                </TabsContent>
            </Tabs>
        ) : (
            <Card>
                <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold tracking-tight mb-2">Recent Activity</h2>
                    <UserDashboard />
                    <div className="text-center py-10 mt-8 border-t">
                        <p className="text-muted-foreground mb-4">
                        Want to share your music with the world?
                        </p>
                        <Button onClick={handleBecomeCreator}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Become a Creator
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

      </div>
      {userProfile && userRef && (
        <EditProfileDialog 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
            userProfile={userProfile}
            userRef={userRef}
        />
      )}
    </>
  );
}
