import type { Artist, Album, Song, User, ImagePlaceholder } from './types';
import placeholderData from './placeholder-images.json';

export const placeholderImages: ImagePlaceholder[] = placeholderData.placeholderImages;

export const users: User[] = [
  { id: 'user-1', name: 'Melody Maker', email: 'melody@museflow.com', avatarUrl: 'https://i.pravatar.cc/150?u=user1', role: 'creator' },
  { id: 'user-2', name: 'Rhythm Fan', email: 'rhythm@museflow.com', avatarUrl: 'https://i.pravatar.cc/150?u=user2', role: 'user' },
  { id: 'user-3', name: 'Admin User', email: 'admin@museflow.com', avatarUrl: 'https://i.pravatar.cc/150?u=user3', role: 'admin' },
];

export const artists: Artist[] = [
  { id: 'artist-1', name: 'Stellar Waves', avatarUrl: placeholderImages.find(p => p.id === 'artist-1')?.imageUrl!, bio: 'Electronic duo exploring the cosmos through sound.' },
  { id: 'artist-2', name: 'Leo Harmon', avatarUrl: placeholderImages.find(p => p.id === 'artist-2')?.imageUrl!, bio: 'Acoustic storyteller with a soulful voice.' },
  { id: 'artist-3', name: 'Crimson Bloom', avatarUrl: placeholderImages.find(p => p.id === 'artist-3')?.imageUrl!, bio: 'Indie rock band known for their energetic live shows.' },
];

const albumsData: Omit<Album, 'songs'>[] = [
    { id: 'album-1', title: 'Galactic Tides', type: 'album', artist: artists[0], artworkUrl: placeholderImages.find(p => p.id === 'album-1')?.imageUrl!, releaseDate: '2023-10-26' },
    { id: 'album-2', title: 'Fireside Stories', type: 'album', artist: artists[1], artworkUrl: placeholderImages.find(p => p.id === 'album-2')?.imageUrl!, releaseDate: '2023-05-12' },
    { id: 'album-3', title: 'Neon Dusk', type: 'ep', artist: artists[2], artworkUrl: placeholderImages.find(p => p.id === 'album-3')?.imageUrl!, releaseDate: '2023-08-19' },
    { id: 'album-4', title: 'Quantum Echoes', type: 'album', artist: artists[0], artworkUrl: placeholderImages.find(p => p.id === 'album-4')?.imageUrl!, releaseDate: '2022-01-15' },
    { id: 'album-5', title: 'Cobblestone Soul', type: 'ep', artist: artists[1], artworkUrl: placeholderImages.find(p => p.id === 'album-5')?.imageUrl!, releaseDate: '2023-11-30' },
    { id: 'album-6', title: 'Velvet Thunder', type: 'album', artist: artists[2], artworkUrl: placeholderImages.find(p => p.id === 'album-6')?.imageUrl!, releaseDate: '2022-09-01' },
];

export const songs: Song[] = [
  // Album 1: Galactic Tides
  { id: 'song-1', title: 'Nebula Drift', duration: 245, artist: artists[0], album: albumsData[0], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Cyber-War.mp3', likes: 1200, shares: 340 },
  { id: 'song-2', title: 'Starfall', duration: 195, artist: artists[0], album: albumsData[0], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Epic-Chase.mp3', likes: 2500, shares: 500 },
  { id: 'song-3', title: 'Cosmic Rays', duration: 280, artist: artists[0], album: albumsData[0], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Losing-My-Patience.mp3', likes: 950, shares: 150, lyrics: 'Fading light, across the sky...' },

  // Album 2: Fireside Stories
  { id: 'song-4', title: 'Worn Out Boots', duration: 210, artist: artists[1], album: albumsData[1], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Acoustic-Vibes.mp3', likes: 3100, shares: 800 },
  { id: 'song-5', title: 'Amber Glow', duration: 185, artist: artists[1], album: albumsData[1], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Calm-And-Peaceful.mp3', likes: 1800, shares: 420 },
  { id: 'song-6', title: 'Morning Mist', duration: 225, artist: artists[1], album: albumsData[1], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Emotional-Sad-Piano.mp3', likes: 2200, shares: 610 },
  
  // EP 3: Neon Dusk
  { id: 'song-7', title: 'City Lights', duration: 200, artist: artists[2], album: albumsData[2], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Night-Out.mp3', likes: 4200, shares: 1200 },
  { id: 'song-8', title: 'Last Train', duration: 230, artist: artists[2], album: albumsData[2], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/The-Beat-of-Nature.mp3', likes: 3800, shares: 950 },

  // Singles / Other albums
  { id: 'song-9', title: 'Zero Gravity', duration: 215, artist: artists[0], album: albumsData[3], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Through-The-Space.mp3', likes: 1500, shares: 400 },
  { id: 'song-10', title: 'Riverstone', duration: 190, artist: artists[1], album: albumsData[4], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Acoustic-Vibes.mp3', likes: 2800, shares: 750 },
  { id: 'song-11', title: 'Electric Bloom', duration: 250, artist: artists[2], album: albumsData[5], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/The-Beat-of-Nature.mp3', likes: 3300, shares: 890 },
  { id: 'song-12', title: 'Midnight Drive', duration: 222, artist: artists[2], album: albumsData[2], audioUrl: 'https://storage.googleapis.com/studioprod-assets/assets/Night-Out.mp3', likes: 5000, shares: 1500, lyrics: 'Streetlights paint the road...' },
];

export const albums: Album[] = albumsData.map(album => ({
    ...album,
    songs: songs.filter(song => song.album.id === album.id),
}));
