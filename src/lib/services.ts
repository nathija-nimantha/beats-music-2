import { db } from './firebase';
import { Song, Playlist, RecentlyPlayed } from './types';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot,
  increment,
  getDocsFromCache,
  getDocFromCache
} from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';

const handleFirestoreError = (error: { code?: string }, operation: string) => {
  console.error(`Firestore error in ${operation}:`, error);
  
  if (error.code === 'unavailable' || error.code === 'failed-precondition') {
    throw new Error('Unable to connect to the database. Please check your internet connection.');
  }
  
  if (error.code === 'permission-denied') {
    throw new Error('Permission denied. Please ensure you are logged in.');
  }
  
  throw new Error(`Failed to ${operation}. Please try again.`);
};

import type { Query } from 'firebase/firestore';
const getDocsWithFallback = async (q: Query) => {
  try {
    return await getDocs(q);
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'unavailable' || err.code === 'failed-precondition') {
      console.log('Using cached data due to network unavailability');
      return await getDocsFromCache(q);
    }
    throw error;
  }
};

const getDocWithFallback = async (docRef: DocumentReference) => {
  try {
    return await getDoc(docRef);
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'unavailable' || err.code === 'failed-precondition') {
      console.log('Using cached data due to network unavailability');
      return await getDocFromCache(docRef);
    }
    throw error;
  }
};

export const songService = {
  async getAllSongs(limitCount = 20, lastDoc?: DocumentSnapshot) {
    try {
      let q = query(
        collection(db, 'songs'), 
        orderBy('createdAt', 'desc'), 
        limit(limitCount)
      );
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocsWithFallback(q);
      const songs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() || {})
      })) as Song[];
      return {
        songs,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === limitCount
      };
    } catch (error) {
      console.warn('Failed to get all songs:', error);
      return { 
        songs: [], 
        lastDoc: undefined, 
        hasMore: false 
      };
    }
  },

  async getNewReleases(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'songs'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocsWithFallback(q);
      const songs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() || {})
      })) as Song[];
      return songs;
    } catch (error) {
      console.warn('Failed to get new releases:', error);
      return [];
    }
  },

  async searchSongs(searchTerm: string, limitCount = 20) {
    try {
      const q = query(
        collection(db, 'songs'),
        orderBy('title'),
        limit(limitCount)
      );
      const snapshot = await getDocsWithFallback(q);
      const allSongs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() || {})
      })) as Song[];
      return allSongs.filter(song => 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.album && song.album.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.warn('Search failed:', error);
      return [];
    }
  },

  async getSongById(id: string): Promise<Song | null> {
    try {
      const docRef = doc(db, 'songs', id);
      const snapshot = await getDocWithFallback(docRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...(snapshot.data() || {})
        } as Song;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get song by ID:', error);
      return null;
    }
  },

  async incrementPlayCount(id: string) {
    try {
      const docRef = doc(db, 'songs', id);
      await updateDoc(docRef, {
        playCount: increment(1)
      });
    } catch (error) {
      console.warn('Failed to increment play count:', error);
    }
  }
};

export const userService = {
  async getLikedSongsPlaylist(userId: string): Promise<string> {
    try {
      const q = query(
        collection(db, 'playlists'),
        where('userId', '==', userId),
        where('name', '==', 'Liked Songs'),
        limit(1)
      );
      
      const snapshot = await getDocsWithFallback(q);
      
      if (snapshot.docs.length > 0) {
        return snapshot.docs[0].id;
      }
      
      const likedPlaylistId = await playlistService.createPlaylist({
        name: 'Liked Songs',
        description: 'Your liked songs',
        coverImageURL: '',
        songs: [],
        userId: userId,
        isPublic: false
      });
      
      if (!likedPlaylistId) {
        throw new Error('Failed to create or retrieve liked songs playlist.');
      }
      return likedPlaylistId;
    } catch (error) {
      handleFirestoreError(error as { code?: string }, 'get liked songs playlist');
      throw error;
    }
  },

  async likeSong(userId: string, songId: string) {
    try {
      const likedPlaylistId = await this.getLikedSongsPlaylist(userId);
      await playlistService.addSongToPlaylist(likedPlaylistId, songId);
    } catch (error) {
      handleFirestoreError(error as { code?: string }, 'like song');
    }
  },

  async unlikeSong(userId: string, songId: string) {
    try {
      const likedPlaylistId = await this.getLikedSongsPlaylist(userId);
      await playlistService.removeSongFromPlaylist(likedPlaylistId, songId);
    } catch (error) {
      handleFirestoreError(error as { code?: string }, 'unlike song');
    }
  },

  async isSongLiked(userId: string, songId: string): Promise<boolean> {
    try {
      const likedPlaylistId = await this.getLikedSongsPlaylist(userId);
      const playlist = await playlistService.getPlaylistById(likedPlaylistId);
      return playlist ? playlist.songs.includes(songId) : false;
    } catch (error) {
      console.warn('Failed to check if song is liked:', error);
      return false;
    }
  },

  async getLikedSongs(userId: string): Promise<Song[]> {
    try {
      const likedPlaylistId = await this.getLikedSongsPlaylist(userId);
      const playlist = await playlistService.getPlaylistById(likedPlaylistId);
      
      if (!playlist) return [];
      
      const songs: Song[] = [];
      for (const songId of playlist.songs) {
        const song = await songService.getSongById(songId);
        if (song) {
          songs.push(song);
        }
      }
      
      return songs;
    } catch (error) {
      console.warn('Failed to get liked songs:', error);
      return [];
    }
  }
};

export const playlistService = {
  async getUserPlaylists(userId: string) {
    try {
      const q = query(
        collection(db, 'playlists'),
        where('userId', '==', userId),
        limit(50)
      );
      
      const snapshot = await getDocsWithFallback(q);
      const playlists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() || {})
      })) as Playlist[];
      
      return playlists.sort((a, b) => {
        type FirestoreTimestamp = { toDate: () => Date };
        const aDate = (typeof a.updatedAt === 'object' && typeof (a.updatedAt as FirestoreTimestamp).toDate === 'function')
          ? (a.updatedAt as FirestoreTimestamp).toDate()
          : new Date(a.updatedAt as Date | string);
        const bDate = (typeof b.updatedAt === 'object' && typeof (b.updatedAt as FirestoreTimestamp).toDate === 'function')
          ? (b.updatedAt as FirestoreTimestamp).toDate()
          : new Date(b.updatedAt as Date | string);
        return bDate.getTime() - aDate.getTime();
      });
    } catch (error) {
      console.warn('Failed to get user playlists:', error);
      return [];
    }
  },

  async getPlaylistById(id: string): Promise<Playlist | null> {
    try {
      const docRef = doc(db, 'playlists', id);
      const snapshot = await getDocWithFallback(docRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...(snapshot.data() || {})
        } as Playlist;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get playlist by ID:', error);
      return null;
    }
  },

  async createPlaylist(playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const newPlaylist = {
        ...playlistData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'playlists'), newPlaylist);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error as { code?: string }, 'create playlist');
    }
  },

  async updatePlaylist(id: string, updates: Partial<Playlist>) {
    try {
      const docRef = doc(db, 'playlists', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      handleFirestoreError(error as { code?: string }, 'update playlist');
    }
  },

  async addSongToPlaylist(playlistId: string, songId: string) {
    try {
      const playlist = await this.getPlaylistById(playlistId);
      if (playlist && !playlist.songs.includes(songId)) {
        const updatedSongs = [...playlist.songs, songId];
        await this.updatePlaylist(playlistId, { songs: updatedSongs });
      }
    } catch (error) {
      handleFirestoreError(error as { code?: string }, 'add song to playlist');
    }
  },

  async removeSongFromPlaylist(playlistId: string, songId: string) {
    try {
      const playlist = await this.getPlaylistById(playlistId);
      if (playlist) {
        const updatedSongs = playlist.songs.filter(id => id !== songId);
        await this.updatePlaylist(playlistId, { songs: updatedSongs });
      }
    } catch (error) {
      handleFirestoreError(error as { code?: string }, 'remove song from playlist');
    }
  },
};

export const recentlyPlayedService = {
  async addToRecentlyPlayed(userId: string, songId: string) {
    try {
      await addDoc(collection(db, 'recentlyPlayed'), {
        userId,
        songId,
        playedAt: new Date()
      });
      
      await songService.incrementPlayCount(songId);
    } catch (error) {
      console.warn('Failed to add to recently played:', error);
    }
  },

  async getRecentlyPlayed(userId: string, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'recentlyPlayed'),
        where('userId', '==', userId),
        limit(limitCount * 2)
      );
      
      const snapshot = await getDocsWithFallback(q);
      const recentlyPlayed = snapshot.docs.map(doc => doc.data()) as RecentlyPlayed[];
      
      const sortedPlayed = recentlyPlayed.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
      const uniqueSongIds = [...new Set(sortedPlayed.map(rp => rp.songId))].slice(0, limitCount);
      
      const songs: Song[] = [];
      for (const songId of uniqueSongIds) {
        const song = await songService.getSongById(songId);
        if (song) {
          songs.push(song);
        }
      }
      
      return songs;
    } catch (error) {
      console.warn('Failed to get recently played:', error);
      return [];
    }
  }
};

export const chartService = {
  async getTopGlobalSongs(limitCount = 100) {
    try {
      const q = query(
        collection(db, 'songs'),
        orderBy('playCount', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocsWithFallback(q);
      return snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        song: {
          id: doc.id,
          ...(doc.data() || {})
        } as Song
      }));
    } catch (error) {
      console.warn('Failed to get global charts:', error);
      return [];
    }
  },
};