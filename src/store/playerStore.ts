// store/playerStore.ts
import { create } from 'zustand';
import { Howl } from 'howler';
import { Song, PlayerState } from '@/lib/types';

interface PlayerStore extends PlayerState {
  // Audio instance
  howl: Howl | null;
  
  // Actions
  playSong: (song: Song, playlist?: Song[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  togglePlayPause: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setPlaylist: (playlist: Song[], startIndex?: number) => void;
  
  // Internal methods
  updateCurrentTime: () => void;
  cleanup: () => void;
  setIsPlaying: (playing: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },
  // Initial state
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playlist: [],
  currentIndex: 0,
  repeat: 'none',
  shuffle: false,
  howl: null,

  playSong: (song: Song, playlist?: Song[]) => {
    const state = get();
    
    if (state.howl) {
      state.howl.stop();
      state.howl.unload();
    }

    const howl = new Howl({
      src: [song.audioURL],
      format: ['mp3', 'wav'],
      volume: state.volume,
      html5: true,
      preload: true,
      onload: () => {
        console.log('Audio loaded successfully');
        set({ duration: howl.duration() });
      },
      onplay: () => {
        set({ isPlaying: true });
        const updateTime = () => {
          if (howl.playing()) {
            set({ currentTime: howl.seek() || 0 });
            requestAnimationFrame(updateTime);
          }
        };
        updateTime();
      },
      onpause: () => {
        set({ isPlaying: false });
      },
      onend: () => {
        const { repeat, nextSong } = get();
        if (repeat === 'one') {
          howl.seek(0);
          howl.play();
        } else {
          nextSong();
        }
      },
      onloaderror: (id, error) => {
        console.error('Audio load error:', error);
        setTimeout(() => {
          console.log('Retrying audio load...');
          howl.load();
        }, 1000);
      },
      onplayerror: (id, error) => {
        console.error('Audio play error:', error);
        set({ isPlaying: false });
        howl.once('unlock', () => {
          console.log('Audio context unlocked, retrying...');
          howl.play();
        });
      }
    });

    // Update state
    set({
      currentSong: song,
      howl,
      currentTime: 0,
      playlist: playlist || [song],
      currentIndex: playlist ? playlist.findIndex(s => s.id === song.id) : 0
    });

    const attemptPlay = (retries = 3) => {
      try {
        howl.play();
      } catch (error) {
        console.warn('Play failed:', error);
        if (retries > 0) {
          console.log(`Retrying play... (${retries} attempts left)`);
          setTimeout(() => attemptPlay(retries - 1), 500);
        } else {
          console.error('Failed to play after multiple attempts');
          set({ isPlaying: false });
        }
      }
    };

    attemptPlay();
  },

  pauseSong: () => {
    const { howl } = get();
    if (howl) {
      howl.pause();
    }
  },

  resumeSong: () => {
    const { howl } = get();
    if (howl) {
      howl.play();
    }
  },

  togglePlayPause: () => {
    const { isPlaying, howl } = get();
    if (howl) {
      if (isPlaying) {
        howl.pause();
      } else {
        howl.play();
      }
    }
  },

  nextSong: () => {
    const { playlist, currentIndex, shuffle, repeat } = get();
    if (playlist.length === 0) return;

    let nextIndex: number;
    
    if (shuffle) {
      const availableIndices = playlist.map((_, i) => i).filter(i => i !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= playlist.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          return;
        }
      }
    }

    const nextSong = playlist[nextIndex];
    if (nextSong) {
      get().playSong(nextSong, playlist);
    }
  },

  previousSong: () => {
    const { playlist, currentIndex, shuffle } = get();
    if (playlist.length === 0) return;

    let prevIndex: number;
    
    if (shuffle) {
      const availableIndices = playlist.map((_, i) => i).filter(i => i !== currentIndex);
      prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = playlist.length - 1;
      }
    }

    const prevSong = playlist[prevIndex];
    if (prevSong) {
      get().playSong(prevSong, playlist);
    }
  },

  seekTo: (time: number) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
      set({ currentTime: time });
    }
  },

  setVolume: (volume: number) => {
    const { howl } = get();
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (howl) {
      howl.volume(clampedVolume);
    }
    set({ volume: clampedVolume });
  },

  toggleRepeat: () => {
    const { repeat } = get();
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    set({ repeat: nextMode });
  },

  toggleShuffle: () => {
    set(state => ({ shuffle: !state.shuffle }));
  },

  setPlaylist: (playlist: Song[], startIndex = 0) => {
    set({ playlist, currentIndex: startIndex });
  },

  updateCurrentTime: () => {
    const { howl } = get();
    if (howl && howl.playing()) {
      set({ currentTime: howl.seek() || 0 });
    }
  },

  cleanup: () => {
    const { howl } = get();
    if (howl) {
      howl.stop();
      howl.unload();
    }
    set({
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      howl: null
    });
  }
}));