export type User = {
  id: string;
  name: string;
  username?: string;
  bio?: string;
  email: string;
  avatarUrl: string;
  role: 'user' | 'creator' | 'admin';
  socials?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
};

export type Artist = {
  id: string;
  name: string;
  avatarUrl: string;
  bio?: string;
};

export type Song = {
  id: string;
  title: string;
  duration: number; // in seconds
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  artworkUrl: string;
  audioUrl: string;
  likes: number;
  shares: number;
  lyrics?: string;
  genre?: string;
};

export type Album = {
  id:string;
  title: string;
  type: 'album' | 'ep';
  artistId: string;
  artistName: string;
  artworkUrl: string;
  releaseDate: string;
  songs: Song[];
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  owner: User;
};

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export type RecentlyPlayed = {
  song: Song;
  playedAt: Date;
}
