export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  playlists: string[];
  likedSongs: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  audioURL: string;
  coverImageURL?: string;
  genre?: string;
  releaseDate?: Date;
  playCount: number;
  createdAt: Date;
  uploadedBy?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImageURL?: string;
  songs: string[];
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date | { toDate: () => Date } | string;
}

export interface RecentlyPlayed {
  id: string;
  userId: string;
  songId: string;
  playedAt: Date;
}

export interface GlobalChart {
  id: string;
  rank: number;
  songId: string;
  playCount: number;
  weeklyPlays: number;
  updatedAt: Date;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Song[];
  currentIndex: number;
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
}