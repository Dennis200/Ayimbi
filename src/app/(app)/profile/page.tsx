
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Music, MoreHorizontal, Settings, Twitter, Instagram, BadgeCheck } from 'lucide-react';
import { doc, collection, query, where } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import type { User, Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import Image from 'next/image';
import { EditProfileDialog } from '@/components/auth/edit-profile-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-profile";


function CreatorDashboard({ user }: { user: import('firebase/auth').User }) {
  const firestore = useFirestore();
  const { play: playSong } = useMusicPlayer();

  const songsQuery = useMemoFirebase(() => {
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
              <Image src={song.artworkUrl} alt={song.title} width={48} height={48} className="rounded-lg" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.artistName}</p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg mt-6 bg-secondary/50">
          <Music className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No posted audios</h3>
          <p className="text-muted-foreground mt-1 text-sm">Upload your first track to see it here.</p>
        </div>
      )}
    </div>
  );
}


export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<User>(userRef);

  const loading = userLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to see your profile.</p>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">Profile</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
        </Button>
      </header>
      <div className="container pb-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={userProfile?.avatarUrl ?? user.photoURL ?? ''} alt={userProfile?.name ?? ''} />
                <AvatarFallback className="text-3xl">
                {userProfile?.name?.charAt(0) || user.displayName?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold">{userProfile?.name || user.displayName}</h1>
                    {userProfile?.role === 'creator' && <BadgeCheck className="h-6 w-6 text-blue-500" />}
                </div>
                <p className="text-muted-foreground text-sm">@{userProfile?.username || user.uid}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                    Edit Profile
                </Button>
                 <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex gap-6">
                <div className="text-center">
                    <p className="font-bold text-lg">837K</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg">671</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md px-4">
                {userProfile?.bio || 'No bio yet. Click edit to add one!'}
            </p>
             <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Follow me on:</p>
                <div className="flex gap-2">
                    {userProfile?.socials?.twitter && (
                        <Button variant="outline" size="icon" asChild>
                        <a href={userProfile.socials.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 fill-current" /></a>
                        </Button>
                    )}
                    {userProfile?.socials?.instagram && (
                        <Button variant="outline" size="icon" asChild>
                        <a href={userProfile.socials.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5" /></a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
        
        <Tabs defaultValue="posted_audios" className="w-full">
            <TabsList>
                <TabsTrigger value="posted_audios">Posted Audios</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
            <TabsContent value="posted_audios">
                <CreatorDashboard user={user} />
            </TabsContent>
            <TabsContent value="playlists">
                <div className="text-center py-16 border-dashed border-2 rounded-lg mt-6 bg-secondary/50">
                    <Music className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No playlists yet</h3>
                    <p className="text-muted-foreground mt-1 text-sm">Your created playlists will appear here.</p>
                </div>
            </TabsContent>
        </Tabs>
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
