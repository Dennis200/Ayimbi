'use client';

import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Upload } from 'lucide-react';
import { songs } from '@/lib/data';
import { SongCard } from '@/components/song-card';

export default function ProfilePage() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <>
        <Header title="Profile" />
        <div className="container py-6 flex items-center justify-center">
            <p>Please log in to see your profile.</p>
        </div>
      </>
    );
  }

  const creatorSongs = songs.filter(s => s.artist.name === 'Stellar Waves');

  return (
    <>
      <Header title="Profile" />
      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl">{user.name}</CardTitle>
                <CardDescription>{user.email} - ({user.role})</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             {user.role === 'creator' && (
                <div>
                   <h3 className="text-xl font-semibold mt-6 mb-4">Your Uploads</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {creatorSongs.map((song) => (
                          <SongCard key={song.id} song={song} />
                        ))}
                         <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed hover:border-primary hover:text-primary transition-colors cursor-pointer">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <CardTitle className="mb-2 text-lg">Upload Music</CardTitle>
                            <CardDescription className="text-xs">Upload a new song, EP, or album.</CardDescription>
                        </Card>
                    </div>

                    <h3 className="text-xl font-semibold mt-8 mb-4">Creator Bio</h3>
                    <p className="text-muted-foreground">
                        Electronic duo exploring the cosmos through sound. We create immersive soundscapes that transport you to other worlds.
                    </p>
                    <Button variant="outline" className="mt-4">Edit Bio</Button>
                </div>
            )}
             {user.role === 'user' && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground mb-4">Want to share your music with the world?</p>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Become a Creator</Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
