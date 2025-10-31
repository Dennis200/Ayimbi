'use client';
import { Header } from '@/components/layout/header';
import { useCollection, useMemoFirebase } from '@/firebase';
import type { Song, Album } from '@/lib/types';
import { SongCard } from '@/components/song-card';
import { AlbumCard } from '@/components/album-card';
import { collection, getFirestore, limit, query } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const app = useFirebaseApp();
  const firestore = getFirestore(app);

  const songsQuery = useMemoFirebase(
    () => query(collection(firestore, 'songs'), limit(10)),
    [firestore]
  );
  const { data: trendingSongs, isLoading: songsLoading } = useCollection<Song>(
    songsQuery
  );

  const albumsQuery = useMemoFirebase(
    () => query(collection(firestore, 'albums'), limit(4)),
    [firestore]
  );
  const { data: newReleases, isLoading: albumsLoading } = useCollection<Album>(
    albumsQuery
  );

  const loading = songsLoading || albumsLoading;

  return (
    <>
      <Header title="Home" />
      <div className="container py-6">
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Trending Now
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : trendingSongs?.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
          </div>
        </section>

        <section className="mt-10 space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            New Releases
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : newReleases?.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
          </div>
        </section>
      </div>
    </>
  );
}
