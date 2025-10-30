'use client';

import { useUser } from '@/firebase';
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
import { PlusCircle, Upload } from 'lucide-react';
import { songs } from '@/lib/data';
import { SongCard } from '@/components/song-card';

export default function ProfilePage() {
  const { user, loading } = useUser();

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

  const creatorSongs = songs.filter((s) => s.artist.name === 'Stellar Waves');

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
            {/* This is a placeholder for creator/user roles which would be implemented with custom claims */}
            {true && (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">
                  Want to share your music with the world?
                </p>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Become a Creator
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
