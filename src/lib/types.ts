export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'user' | 'creator' | 'admin';
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
  artist: Artist;
  album: AlbumStub;
  audioUrl: string;
  likes: number;
  shares: number;
  lyrics?: string;
};

export type AlbumStub = {
  id: string;
  title: string;
  artworkUrl: string;
};

export type Album = {
  id:string;
  title: string;
  type: 'album' | 'ep';
  artist: Artist;
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
