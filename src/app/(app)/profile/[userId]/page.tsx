
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Music, MoreHorizontal, Settings, Twitter, Instagram, BadgeCheck, Pause, Play } from 'lucide-react';
import { doc, collection, query, where } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import type { User as UserType, Song } from '@/lib/types';
import { useMusicPlayer } from '@/hooks/use-music-player';
import Image from 'next/image';
import { EditProfileDialog } from '@/components/auth/edit-profile-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-profile";
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';


function CreatorDashboard({ profileUser }: { profileUser: UserType }) {
  const firestore = useFirestore();
  const { play: playSong, currentSong, isPlaying, togglePlay } = useMusicPlayer();

  const songsQuery = useMemoFirebase(() => {
    if (!profileUser) return null;
    return query(collection(firestore, 'songs'), where('artistId', '==', profileUser.id));
  }, [firestore, profileUser]);

  const { data: uploadedSongs, isLoading } = useCollection<Song>(songsQuery);
  
  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) {
        togglePlay();
    } else if (uploadedSongs) {
        playSong(song, uploadedSongs);
    }
  }

  if (isLoading) return <p className="text-center p-10">Loading songs...</p>;

  return (
    <div className="mt-6">
      {uploadedSongs && uploadedSongs.length > 0 ? (
        <div className="space-y-2">
          {uploadedSongs.map((song) => {
             const isActive = currentSong?.id === song.id;
            return (
            <div key={song.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer" onClick={() => handlePlay(song)}>
              <div className="relative">
                <Image src={song.artworkUrl} alt={song.title} width={48} height={48} className="rounded-lg" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    {isActive ? (
                        isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />
                    ) : <Play className="h-5 w-5 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{song.title}</p>
                <p className="text-xs text-muted-foreground">{song.artistName}</p>
              </div>
              <p className="text-xs text-muted-foreground">{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</p>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          )})}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg mt-6 bg-card">
          <Music className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No posted audios</h3>
          <p className="text-muted-foreground mt-1 text-sm">This creator hasn't uploaded any tracks yet.</p>
        </div>
      )}
    </div>
  );
}


export default function ProfilePage() {
  const { user: currentUser, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const params = useParams();
  const router = useRouter();

  const userId = params.userId as string;

  const userRef = useMemoFirebase(() => {
    if (!userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserType>(userRef);

  const loading = userLoading || profileLoading;

  const isOwnProfile = currentUser?.uid === userId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>User not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-48 w-full bg-card">
          {userProfile.coverPhotoUrl && (
              <Image src={userProfile.coverPhotoUrl} alt="Cover photo" layout="fill" objectFit="cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute top-4 left-4 z-10">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-background/50 hover:bg-background/80">
                  <ArrowLeft className="h-6 w-6" />
              </Button>
          </div>
          <div className="absolute top-4 right-4 z-10">
            {isOwnProfile && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(true)} className="bg-background/50 hover:bg-background/80">
                    <Settings className="h-6 w-6" />
                </Button>
            )}
          </div>
      </div>
      <div className="container pb-6 space-y-6 -mt-16">
        <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={userProfile?.avatarUrl ?? ''} alt={userProfile?.name ?? ''} />
                <AvatarFallback className="text-3xl">
                {userProfile?.name?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold">{userProfile?.name}</h1>
                    {userProfile?.role === 'creator' && <BadgeCheck className="h-6 w-6 text-primary" />}
                </div>
                <p className="text-muted-foreground text-sm">@{userProfile?.username || userProfile.id}</p>
            </div>
            
            <p className="text-sm text-muted-foreground max-w-md px-4">
                {userProfile?.bio || 'No bio yet.'}
            </p>
             <div className="flex gap-4">
                {userProfile?.socials?.twitter && (
                    <a href={userProfile.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <Twitter className="h-5 w-5" />
                    </a>
                )}
                {userProfile?.socials?.instagram && (
                    <a href={userProfile.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <Instagram className="h-5 w-5" />
                    </a>
                )}
            </div>
             <div className="flex gap-6 pt-2">
                <div className="text-center">
                    <p className="font-bold text-lg">837K</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg">671</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isOwnProfile ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                        Edit Profile
                    </Button>
                ) : (
                    <Button size="sm">Follow</Button>
                )}
                 <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </div>
        </div>
        
        <Tabs defaultValue="posted_audios" className="w-full">
            <TabsList>
                <TabsTrigger value="posted_audios">Posted Audios</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
            <TabsContent value="posted_audios">
                <CreatorDashboard profileUser={userProfile} />
            </TabsContent>
            <TabsContent value="playlists">
                <div className="text-center py-16 border-dashed border-2 rounded-lg mt-6 bg-card">
                    <Music className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No playlists yet</h3>
                    <p className="text-muted-foreground mt-1 text-sm">Created playlists will appear here.</p>
                </div>
            </TabsContent>
        </Tabs>
      </div>
      {isOwnProfile && userProfile && userRef && (
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
