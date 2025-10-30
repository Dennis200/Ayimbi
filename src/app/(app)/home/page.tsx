import { Header } from '@/components/layout/header';
import { albums, songs } from '@/lib/data';
import { SongCard } from '@/components/song-card';
import { AlbumCard } from '@/components/album-card';

export default function HomePage() {
  const trendingSongs = songs.slice(0, 5);
  const newReleases = albums.slice(0, 6);

  return (
    <>
      <Header title="Home" />
      <div className="container py-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Trending Now
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            New Releases
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {newReleases.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
