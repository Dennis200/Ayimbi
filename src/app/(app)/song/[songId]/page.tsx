'use client';

import { useEffect, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import type { Song } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Play, Pause, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function SongPage() {
  const firestore = useFirestore();
  const params = useParams();
  const router = useRouter();
  const songId = params.songId as string;
  const { play: playSong, currentSong, isPlaying, togglePlay } = useMusicPlayer();

  const songRef = useMemoFirebase(() => {
    if (!songId) return null;
    return doc(firestore, 'songs', songId);
  }, [firestore, songId]);

  const { data: song, isLoading: songLoading } = useDoc<Song>(songRef);

  const artistRef = useMemoFirebase(() => {
    if (!song) return null;
    return doc(firestore, 'users', song.artistId);
  }, [firestore, song]);

  const { data: artist, isLoading: artistLoading } = useDoc<any>(artistRef);

  const songsQuery = useMemoFirebase(() => {
    if (!song) return null;
    return query(collection(firestore, 'songs'), where('artistId', '==', song.artistId));
  }, [firestore, song]);

  const { data: artistSongs } = useCollection<Song>(songsQuery);

  useEffect(() => {
    // Autoplay the song when its data is loaded
    // and it's not already the current song.
    if (song && artistSongs && currentSong?.id !== song.id) {
        playSong(song, artistSongs);
    }
  }, [song, artistSongs, playSong, currentSong]);


  const handlePlay = () => {
    if (song) {
        if(currentSong?.id === song.id) {
            togglePlay();
        } else if (artistSongs) {
            playSong(song, artistSongs);
        }
    }
  }

  const isLoading = songLoading || artistLoading;

  if (isLoading) {
    return (
      <div className="container flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="container text-center py-10">
        <h1 className="text-2xl font-bold">Song not found</h1>
        <p className="text-muted-foreground">This song may have been deleted or the link is incorrect.</p>
      </div>
    );
  }
  
  const isActive = currentSong?.id === song.id;


  return (
    <div className="container py-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                 <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 relative">
                         <Image
                            src={song.artworkUrl}
                            alt={song.title}
                            width={500}
                            height={500}
                            className="aspect-square w-full object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                         <div className="absolute bottom-4 left-4 right-4">
                            <h1 className="text-3xl font-bold text-white shadow-lg">{song.title}</h1>
                            <div className="text-lg text-white/80 hover:text-white transition-colors">
                                <Link href={`/profile/${song.artistId}`} className="hover:underline">{song.artistName}</Link>
                                {song.featuredArtists && song.featuredArtists.length > 0 && (
                                    <>
                                        <span className="mx-1">& ft. </span>
                                        {song.featuredArtists.map((fa, index) => (
                                            <span key={index}>
                                                {fa.name}
                                                {index < song.featuredArtists!.length - 1 && ', '}
                                            </span>
                                        ))}
                                    </>
                                )}
                            </div>
                         </div>
                    </div>
                    <div className="md:w-2/3 p-6 flex flex-col">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                {artist && (
                                    <Link href={`/profile/${artist.id}`}>
                                        <Avatar>
                                            <AvatarImage src={artist.avatarUrl} alt={artist.name} />
                                            <AvatarFallback>{artist.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                )}
                                <div>
                                    <p className="font-semibold">{song.artistName}</p>
                                    <p className="text-sm text-muted-foreground">Creator</p>
                                </div>
                            </div>
                            <Button size="lg" onClick={handlePlay}>
                                {isActive && isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                                {isActive && isPlaying ? 'Pause' : 'Play'}
                            </Button>
                        </div>
                        
                        <div className="mt-8 flex-grow">
                            <h3 className="font-semibold text-lg mb-2">Lyrics</h3>
                            {song.lyrics ? (
                                <p className="whitespace-pre-wrap text-muted-foreground font-mono leading-relaxed">
                                    {song.lyrics}
                                </p>
                            ) : (
                                <p className="text-muted-foreground">No lyrics available for this song.</p>
                            )}
                        </div>
                    </div>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}
