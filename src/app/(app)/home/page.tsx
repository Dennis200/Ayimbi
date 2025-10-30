'use client';
import { Header } from '@/components/layout/header';
import { useCollection, useMemoFirebase } from '@/firebase';
import type { Song, Album } from '@/lib/types';
import { SongCard } from '@/components/song-card';
import { AlbumCard } from '@/components/album-card';
import { collection, getFirestore, limit, query } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';

export default function HomePage() {
  const app = useFirebaseApp();
  const firestore = getFirestore(app);

  const songsQuery = useMemoFirebase(
    () => query(collection(firestore, 'songs'), limit(5)),
    [firestore]
  );
  const { data: trendingSongs, loading: songsLoading } = useCollection<Song>(
    songsQuery
  );

  const albumsQuery = useMemoFirebase(
    () => query(collection(firestore, 'albums'), limit(6)),
    [firestore]
  );
  const { data: newReleases, loading: albumsLoading } = useCollection<Album>(
    albumsQuery
  );

  if (songsLoading || albumsLoading) {
    return (
      <>
        <Header title="Home" />
        <div className="container py-6">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Home" />
      <div className="container py-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Trending Now
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingSongs?.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            New Releases
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {newReleases?.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
