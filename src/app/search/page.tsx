"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStore } from '@/store/playerStore';
import { userService } from '@/lib/services';
import { FaCaretDown } from 'react-icons/fa';
import { MdOutlinePlayCircleFilled, MdOutlinePauseCircleFilled } from 'react-icons/md';
import { Heart, MoreHorizontal } from 'lucide-react';
import { IoMdRepeat } from 'react-icons/io';
import { MdOutlineShuffle } from 'react-icons/md';
import { IoIosSkipBackward, IoIosSkipForward } from 'react-icons/io';
import { useState, useEffect } from 'react';
import { songService } from '../../lib/services';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('query') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // Sync searchTerm with query param on navigation
  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [topGlobalSongs, setTopGlobalSongs] = useState<Song[]>([]);
  const { user } = useAuth();
  const { currentSong, playSong, isPlaying, pauseSong, resumeSong, currentTime, duration, seekTo } = usePlayerStore();
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);

  type DbSong = {
    id: string | number;
    title?: string;
    artist?: string;
    duration?: number;
    coverImageURL?: string;
    cover?: string;
  };
  type Song = {
    id: string;
    title: string;
    artist: string;
    duration: number;
    cover: string;
  };


  useEffect(() => {
    async function fetchSongs() {
      try {

        const allResult = await songService.getAllSongs();
        const allMapped = allResult.songs.map((song: DbSong) => ({
          id: typeof song.id === 'string' ? song.id : String(song.id),
          title: song.title || '',
          artist: song.artist || '',
          duration: song.duration || 0,
          cover: song.coverImageURL || song.cover || '/images/music_vibe.png',
        }));
        setAllSongs(allMapped);


        const releases = await songService.getNewReleases(7);
        const releasesMapped = releases.map((song: DbSong) => ({
          id: typeof song.id === 'string' ? song.id : String(song.id),
          title: song.title || '',
          artist: song.artist || '',
          duration: song.duration || 0,
          cover: song.coverImageURL || song.cover || '/images/music_vibe.png',
        }));
        setNewReleases(releasesMapped);


        setTopGlobalSongs(allMapped.slice(0, 7));


        if (user) {
          const likedSongsData = await userService.getLikedSongs(user.id);
          const likedSongIds = new Set(likedSongsData.map(song => String(song.id)));
          setLiked(likedSongIds);
        }
      } catch {
        setAllSongs([]);
        setNewReleases([]);
        setTopGlobalSongs([]);
        setLiked(new Set());
      }
    }
    fetchSongs();
  }, [user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredResults = allSongs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 7);

  const handleLike = async (id: string) => {
    if (!user) return;
    const isLiked = liked.has(id);
    try {
      if (isLiked) {
        await userService.unlikeSong(user.id, id);
        setLiked(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        await userService.likeSong(user.id, id);
        setLiked(prev => new Set([...prev, id]));
      }
    } catch {
      // Error
    }
  };


  const handlePlayPause = () => {
    if (!currentSong) return;
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const playNext = async () => {
    if (!currentSong || allSongs.length === 0) return;
    const currentIndex = allSongs.findIndex(song => song.id === currentSong.id);
    let nextIndex;
    if (isShuffle) {
      do {
        nextIndex = Math.floor(Math.random() * allSongs.length);
      } while (nextIndex === currentIndex && allSongs.length > 1);
    } else {
      nextIndex = (currentIndex < allSongs.length - 1) ? currentIndex + 1 : 0;
    }
    const nextSong = allSongs[nextIndex];
    if (nextSong) {
      const dbSong = await songService.getSongById(nextSong.id);
      if (dbSong) playSong(dbSong, [dbSong]);
    }
  };

  const playPrev = async () => {
    if (!currentSong || allSongs.length === 0) return;
    const currentIndex = allSongs.findIndex(song => song.id === currentSong.id);
    let prevIndex;
    if (isShuffle) {
      do {
        prevIndex = Math.floor(Math.random() * allSongs.length);
      } while (prevIndex === currentIndex && allSongs.length > 1);
    } else {
      prevIndex = (currentIndex > 0) ? currentIndex - 1 : allSongs.length - 1;
    }
    const prevSong = allSongs[prevIndex];
    if (prevSong) {
      const dbSong = await songService.getSongById(prevSong.id);
      if (dbSong) playSong(dbSong, [dbSong]);
    }
  };


  const handlePlaySong = async (song: Song) => {
    const dbSong = await songService.getSongById(song.id);
    if (dbSong) {
      playSong(dbSong, [dbSong]);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col md:flex-row-reverse overflow-auto">
      {/* Sidebar */}
      <aside className="md:flex hidden flex-col items-center justify-center py-8 px-2 border-l border-gray-800 md:w-16 w-full md:static fixed bottom-0 left-0 right-0 z-20 bg-[#0C0D0C]" style={{ background: '#0C0D0C' }}>
        <div className="flex md:flex-col flex-row items-center md:gap-12 gap-6 justify-center md:h-full h-16 w-full">
          <Link href="/home" className="text-gray-400 hover:text-white">
            <Image src="/images/icons/home.png" alt="Home" width={32} height={32} className="w-8 h-8" />
          </Link>
          <Link href="/discover" className="text-gray-400 hover:text-white">
            <Image src="/images/icons/discover.png" alt="Discover" width={32} height={32} className="w-8 h-8" />
          </Link>
          <Link href="/music-library" className="text-gray-400 hover:text-white">
            <Image src="/images/icons/music_library.png" alt="Music Library" width={32} height={32} className="w-8 h-8" />
          </Link>
          <Link href="/music" className="text-gray-400 hover:text-white">
            <Image src="/images/icons/music.png" alt="Music" width={32} height={32} className="w-8 h-8" />
          </Link>
          <Link href="/profile" className="text-gray-400 hover:text-white">
            <Image src="/images/icons/profile.png" alt="Profile" width={32} height={32} className="w-8 h-8" />
          </Link>
          <Link href="/microphone" className="text-gray-400 hover:text-white">
            <Image src="/images/icons/microphone.png" alt="Microphone" width={32} height={32} className="w-8 h-8" />
          </Link>
          <Link href="/radio" className="text-gray-400 hover:text-white">
            <Image src="/images/icons/radio.png" alt="Radio" width={32} height={32} className="w-8 h-8" />
          </Link>
        </div>
      </aside>
      <nav className="md:hidden flex fixed bottom-0 left-0 right-0 z-40 bg-[#0C0D0C] border-t border-gray-800 py-2 px-2 justify-between items-center">
        <Link href="/home" className="text-gray-400 hover:text-white flex-1 flex justify-center">
          <Image src="/images/icons/home.png" alt="Home" width={28} height={28} className="w-7 h-7" />
        </Link>
        <Link href="/discover" className="text-gray-400 hover:text-white flex-1 flex justify-center">
          <Image src="/images/icons/discover.png" alt="Discover" width={28} height={28} className="w-7 h-7" />
        </Link>
        <Link href="/music-library" className="text-gray-400 hover:text-white flex-1 flex justify-center">
          <Image src="/images/icons/music_library.png" alt="Music Library" width={28} height={28} className="w-7 h-7" />
        </Link>
        <Link href="/music" className="text-gray-400 hover:text-white flex-1 flex justify-center">
          <Image src="/images/icons/music.png" alt="Music" width={28} height={28} className="w-7 h-7" />
        </Link>
        <Link href="/profile" className="text-gray-400 hover:text-white flex-1 flex justify-center">
          <Image src="/images/icons/profile.png" alt="Profile" width={28} height={28} className="w-7 h-7" />
        </Link>
      </nav>

      <main className="flex-1 flex flex-col w-full">
        <header className="flex flex-col md:flex-row items-center justify-between px-2 md:px-8 py-3 md:py-6 w-full gap-2 md:gap-0">
          <div className="flex items-center">
            <img src="/images/beats_music.png" alt="Beats Music" width={44} height={44} className="h-8 sm:h-14 w-auto object-contain" />
          </div>
          <div className="flex items-center space-x-4 md:space-x-8">
            <img src="/images/afterpay.png" alt="Afterpay" width={44} height={22} className="h-4 sm:h-7 w-auto object-contain" />
            <img src="/images/zip.png" alt="Zip" width={44} height={22} className="h-4 sm:h-7 w-auto object-contain" />
          </div>
        </header>

        <div className="flex-1 px-1 md:px-6 py-2 flex flex-col md:flex-row gap-2 md:gap-4 h-auto md:h-[calc(100vh-120px-80px)]">
          {/* Search Results */}
          <div className="flex flex-col bg-black rounded-2xl p-4 md:p-8 shadow-lg h-auto md:h-full w-full md:basis-[40%] min-w-[0] mb-2 md:mb-0">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-white">Search Result</h3>
              <div className="flex gap-1 md:gap-2">
                <span className="bg-cyan-400 text-black text-xs px-2 md:px-3 py-1 rounded font-semibold">New</span>
                <span className="bg-gray-700 text-white text-xs px-2 md:px-3 py-1 rounded font-semibold">Global</span>
              </div>
            </div>
            <div className="mb-4 md:mb-6">
              <form className="relative" onSubmit={e => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  router.replace(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
                }
              }}>
                <input
                  type="text"
                  placeholder="Search something ..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-[#181818] text-white px-4 md:px-6 py-2 md:py-3 rounded-full border border-gray-800 focus:outline-none focus:border-cyan-400 text-base md:text-lg pr-10 md:pr-12"
                />
                <button
                  type="submit"
                  className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2"
                  tabIndex={0}
                  aria-label="Search"
                >
                  <Image src="/images/icons/music_icon.png" alt="Music Icon" width={20} height={20} className="h-5 sm:h-6 w-5 sm:w-6" />
                </button>
              </form>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[260px] md:max-h-none">
              {filteredResults.map((song, idx) => (
                <div key={song.id} className="flex items-center py-2 border-b border-gray-800 cursor-pointer group" onClick={() => handlePlaySong(song)}>
                  <span className="text-gray-400 w-6 text-center text-base font-semibold">{idx + 1}</span>
                  <Image src={song.cover} alt={song.title} width={36} height={36} className="rounded-md mx-2" />
                  <div className="flex-1 min-w-[80px] md:min-w-[120px]">
                    <p className="text-white text-sm md:text-base font-semibold truncate">{song.title}</p>
                    <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                  </div>
                  <span className="text-gray-400 text-xs md:text-base mx-2 font-semibold">{formatTime(song.duration)}</span>
                  <button
                    className={`text-gray-400 hover:text-red-500 mx-1 ${liked.has(song.id) ? 'text-red-500' : ''}`}
                    onClick={e => { e.stopPropagation(); handleLike(song.id); }}
                  >
                    <Heart className="w-5 h-5" fill={liked.has(song.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="text-gray-400 hover:text-white mx-1" onClick={e => e.stopPropagation()}>
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Top 100 Global Songs */}
          <div className="flex flex-col bg-black rounded-2xl p-4 md:p-8 shadow-lg h-auto md:h-full w-full md:basis-[40%] min-w-[0] mb-2 md:mb-0">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-white">Top 100 Global Songs</h3>
              <div className="flex gap-1 md:gap-2">
                <span className="bg-cyan-400 text-black text-xs px-2 md:px-3 py-1 rounded font-semibold">New</span>
                <span className="bg-gray-700 text-white text-xs px-2 md:px-3 py-1 rounded font-semibold">Global</span>
              </div>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[260px] md:max-h-none">
              {topGlobalSongs.map((song, idx) => (
                <div key={song.id} className="flex items-center py-2 border-b border-gray-800 cursor-pointer group" onClick={() => handlePlaySong(song)}>
                  <span className="text-gray-400 w-6 text-center text-base font-semibold">{idx + 1}</span>
                  <Image src={song.cover} alt={song.title} width={36} height={36} className="rounded-md mx-2" />
                  <div className="flex-1 min-w-[80px] md:min-w-[120px]">
                    <p className="text-white text-sm md:text-base font-semibold truncate">{song.title}</p>
                    <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                  </div>
                  <span className="text-gray-400 text-xs md:text-base mx-2 font-semibold">{formatTime(song.duration)}</span>
                  <button className={`text-gray-400 hover:text-red-500 mx-1 ${liked.has(song.id) ? 'text-red-500' : ''}`} onClick={e => { e.stopPropagation(); handleLike(song.id); }}>
                    <Heart className="w-5 h-5" fill={liked.has(song.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="text-gray-400 hover:text-white mx-1" onClick={e => e.stopPropagation()}>
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-center">
              <button className="text-gray-400 hover:text-white text-base flex items-center gap-1 font-semibold">
                Expand <FaCaretDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* US/UK Song New Releases */}
          <div className="flex flex-col items-center gap-4 md:gap-8 h-auto md:h-[calc(100vh-120px-80px)] w-full md:basis-[15%] min-w-[0]">
            <div className="relative w-full flex flex-col items-center mt-2 h-auto md:h-full">
              <div className="w-full flex flex-col md:flex-row rounded-2xl py-2 h-auto md:h-full items-stretch">
                <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-1/5 min-w-[0] md:min-w-[80px] h-auto md:h-full pt-2 md:pt-[30px] pb-2 md:pb-[120px]">
                  <button className="text-white text-xs font-semibold tracking-wide md:rotate-[270deg] whitespace-nowrap bg-transparent border-none cursor-pointer">See more</button>
                  <span className="text-white text-xs font-bold tracking-wide md:rotate-[270deg] whitespace-nowrap pb-2 md:pb-[10px]" style={{ letterSpacing: '0.08em' }}>US/UK Song New Releases</span>
                </div>
                <div className="flex flex-row md:flex-col gap-2 md:gap-5 w-full md:w-4/5">
                  {newReleases.slice(0, 6).map((song) => (
                    <div key={song.id} className="flex flex-col items-center w-full">
                      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 mb-1" style={{ borderColor: '#FF9900', background: 'black' }}>
                        <Image src={song.cover} alt={song.title} width={36} height={36} className="rounded-full object-cover" />
                      </div>
                      <span className="text-white font-bold text-xs md:text-base leading-tight text-center">{song.title}</span>
                      <span className="text-gray-400 text-xs mt-0.5 leading-tight text-center">{song.artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-black px-2 md:px-8 pt-2 md:pt-4 pb-2 fixed bottom-0 left-0 right-0 z-30 border-t border-gray-800">
          {/* Progress bar */}
          <div className="flex items-center w-full mb-1 md:mb-2">
            <span className="text-white text-xs font-semibold mr-2" style={{ minWidth: 32, textAlign: 'right' }}>
              {formatTime(currentTime || 0)}
            </span>
            <div className="flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.01}
                value={currentTime}
                onChange={e => seekTo(Number(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #EE4950 ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%)`,
                  transition: isPlaying ? 'background-size 0.2s linear' : 'none',
                  WebkitAppearance: 'none',
                  height: '8px',
                  borderRadius: '9999px',
                  outline: 'none',
                }}
              />
              <style>{`
                input[type='range']::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 0;
                  height: 0;
                  background: transparent;
                  box-shadow: none;
                  border: none;
                }
                input[type='range']::-moz-range-thumb {
                  width: 0;
                  height: 0;
                  background: transparent;
                  box-shadow: none;
                  border: none;
                }
                input[type='range']::-ms-thumb {
                  width: 0;
                  height: 0;
                  background: transparent;
                  box-shadow: none;
                  border: none;
                }
              `}</style>
            </div>
            <span className="text-white text-xs font-semibold ml-2" style={{ minWidth: 32, textAlign: 'left' }}>
              {formatTime(duration || 0)}
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center w-full">
            {/* Song info left */}
            <div className="flex flex-col justify-center items-start min-w-[120px] md:min-w-[220px] mr-2 md:mr-8 pl-2 md:pl-20 mb-2 md:mb-0">
              <span className="font-bold text-white text-base md:text-lg leading-tight" style={{ fontFamily: 'K2D, sans-serif' }}>{currentSong ? currentSong.title : 'No song playing'}</span>
              <span className="text-gray-200 text-sm md:text-base font-semibold leading-tight" style={{ fontFamily: 'K2D, sans-serif' }}>{currentSong ? currentSong.artist : ''}</span>
            </div>
            {/* Player controls center */}
            <div className="flex items-center justify-center gap-2 md:gap-4 flex-1">
              <button
                className={`text-white text-xl md:text-3xl ${isShuffle ? 'text-cyan-400' : ''}`}
                onClick={() => setIsShuffle(s => !s)}
                title="Shuffle"
              >
                <MdOutlineShuffle />
              </button>
              <button className="text-white text-xl md:text-3xl" onClick={playPrev} title="Previous">
                <IoIosSkipBackward />
              </button>
              <button className="text-white text-5xl md:text-8xl rounded-full w-10 md:w-14 h-10 md:h-14 flex items-center justify-center" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <MdOutlinePauseCircleFilled /> : <MdOutlinePlayCircleFilled />}
              </button>
              <button className="text-white text-xl md:text-3xl" onClick={playNext} title="Next">
                <IoIosSkipForward />
              </button>
              <button
                className={`text-white text-xl md:text-3xl ${isLoop ? 'text-cyan-400' : ''}`}
                onClick={() => setIsLoop(l => !l)}
                title="Loop"
              >
                <IoMdRepeat />
              </button>
            </div>
            {/* Right controls */}
            <div className="flex items-center gap-2 md:gap-6 min-w-[120px] md:min-w-[220px] justify-end pr-2 md:pr-20 mt-2 md:mt-0">
              <button className="text-white text-xl md:text-2xl"><MoreHorizontal /></button>
              <button className={`text-white text-xl md:text-2xl ${currentSong && liked.has(currentSong.id) ? 'text-red-500' : ''}`} onClick={() => currentSong && handleLike(currentSong.id)}>
                <Heart className="w-6 h-6" fill={currentSong && liked.has(currentSong.id) ? 'currentColor' : 'none'} />
              </button>
              <button className="bg-cyan-400 text-black px-3 md:px-5 py-1 md:py-2 rounded font-bold ml-2 text-sm md:text-base">Add Playlist</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
