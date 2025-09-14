'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlayCircle } from 'react-icons/fa';
import { BsFastForwardCircle, BsSkipBackwardCircle } from 'react-icons/bs';
import { IoCaretForwardCircleOutline, IoCaretBackCircleOutline } from 'react-icons/io5';
import { FaPauseCircle } from 'react-icons/fa';
import { FaRegPauseCircle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStore } from '@/store/playerStore';
import { songService, recentlyPlayedService, chartService } from '@/lib/services';
import { Song } from '@/lib/types';
import AudioVisualizer from '@/components/music/AudioVisualizer';

export default function HomePage() {
  const seekForward = () => {
    if (typeof seekTo === 'function' && typeof currentTime === 'number' && typeof duration === 'number') {
      seekTo(Math.min(currentTime + 10, duration));
    }
  };
  const seekBackward = () => {
    if (typeof seekTo === 'function' && typeof currentTime === 'number') {
      seekTo(Math.max(currentTime - 10, 0));
    }
  };
  const { user } = useAuth();
  const { currentSong, playSong, isPlaying, pauseSong, resumeSong, currentTime, duration, seekTo } = usePlayerStore();

  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [featuredSong, setFeaturedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const releases = await songService.getNewReleases(6);
      setNewReleases(releases);

      if (releases.length > 0) {
        setFeaturedSong(releases[0]);
      }

      if (user) {
        const recent = await recentlyPlayedService.getRecentlyPlayed(user.id, 5);
        setRecentlyPlayed(recent);
      }

      const charts = await chartService.getTopGlobalSongs(10);
      const topChartSongs = charts.map(chart => chart.song);
      setTopSongs(topChartSongs);

    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const playPrevSong = () => {
    if (!currentSong || newReleases.length === 0) return;
    const currentIndex = newReleases.findIndex(song => song.id === currentSong.id);
    const prevIndex = (currentIndex > 0) ? currentIndex - 1 : newReleases.length - 1;
    playSong(newReleases[prevIndex], newReleases);
  };

  const playNextSong = () => {
    if (!currentSong || newReleases.length === 0) return;
    const currentIndex = newReleases.findIndex(song => song.id === currentSong.id);
    const nextIndex = (currentIndex < newReleases.length - 1) ? currentIndex + 1 : 0;
    playSong(newReleases[nextIndex], newReleases);
  };

  const handlePlay = () => {
    if (!currentSong) return;
    if (typeof resumeSong === 'function') {
      resumeSong();
    }
  };

  const handlePause = () => {
    if (!currentSong) return;
    if (typeof pauseSong === 'function') {
      pauseSong();
    }
  };

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleIconClick = () => {
    if (searchTerm.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row-reverse overflow-auto">
      {/* Sidebar */}
      <aside className="flex flex-row md:flex-col items-center justify-between md:justify-center py-2 md:py-8 px-2 border-t md:border-t-0 border-l border-gray-800 md:w-16 w-full md:static fixed bottom-0 left-0 right-0 z-20 bg-[#0C0D0C]" style={{ background: '#0C0D0C' }}>
        <div className="flex flex-row md:flex-col items-center gap-4 md:gap-12 justify-center w-full h-16 md:h-full">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between px-2 md:px-8 py-2 md:py-6 w-full gap-2 md:gap-0">
          <div className="flex items-center mb-2 md:mb-0">
            <img src="/images/beats_music.png" alt="Beats Music" width={40} height={40} className="h-10 md:h-14 w-auto object-contain" />
          </div>
          <div className="flex-1 flex justify-center w-full md:w-auto">
            <form className="relative w-full max-w-xs md:max-w-xl" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search something ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#181818] text-white px-4 py-2 md:px-6 md:py-3 rounded-full border border-black focus:outline-none focus:border-cyan-400 text-base md:text-lg pr-10 md:pr-12"
              />
              <button
                type="button"
                className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2"
                onClick={handleIconClick}
                tabIndex={0}
                aria-label="Search"
              >
                <Image src="/images/icons/music_icon.png" alt="Music Icon" width={24} height={24} className="h-5 md:h-6 w-5 md:w-6" />
              </button>
            </form>
          </div>
          <div className="flex items-center space-x-4 md:space-x-8 mt-2 md:mt-0">
            <Image src="/images/afterpay.png" alt="Afterpay" width={40} height={20} className="h-5 md:h-7 w-auto object-contain" />
            <Image src="/images/zip.png" alt="Zip" width={40} height={20} className="h-5 md:h-7 w-auto object-contain" />
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 px-2 md:px-12 h-full justify-center">
          <div className="flex-1 flex flex-col justify-center gap-2 md:gap-6">
            <h1 className="text-2xl md:text-5xl font-bold leading-tight text-center md:text-left" style={{ fontFamily: 'K2D, sans-serif' }}>
              THE MULTI-UNIVERSAL<br />MUSIC PLAYLIST
            </h1>
            <p className="text-gray-300 text-sm md:text-lg font-semibold max-w-xl text-center md:text-left" style={{ fontFamily: 'K2D, sans-serif' }}>
              Discover the magic of music with us. Our platform is your gateway to a world of melodies, rhythms, and emotions. Whether you&apos;re a passionate listener, a budding artist, or an industry professional, we have something special for you.
            </p>
            <div className="mt-2 md:mt-4 w-full flex justify-center md:justify-start">
              <div className="relative w-full max-w-xs md:max-w-lg">
                <input type="text" placeholder="Search something ..." className="placeholder-white w-full text-white px-3 md:px-6 py-2 md:py-3 rounded-full focus:outline-none text-sm md:text-lg pr-8 md:pr-12" />
                <span className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2">
                  <Image src="/images/icons/music_icon.png" alt="Music Icon" width={20} height={20} className="h-4 md:h-6 w-4 md:w-6" />
                </span>
              </div>
            </div>
          </div>

          {/* Featured Song Card */}
          <div className="flex-1 flex flex-col justify-center items-center gap-2 md:gap-6">
            <div className="p-2 md:p-8 flex flex-col items-center w-full max-w-xs md:max-w-md">
              <h2 className="text-sm md:text-lg mb-1 md:mb-2 text-white text-center" style={{ fontFamily: 'K2D, sans-serif', fontWeight: 800 }}>{currentSong ? `NOW PLAYING: ${currentSong.title}` : 'NEW SONG: ONE OF THE GIRLS'}</h2>
              <p className="text-gray-300 mb-1 md:mb-4 text-center" style={{ fontFamily: 'K2D, sans-serif', fontWeight: 300 }}>{currentSong ? currentSong.artist : 'The Weeknd, JENNIE & Lily Rose Depp'}</p>
              {/* Audio Visualizer */}
              <AudioVisualizer audioUrl={currentSong?.audioURL} isPlaying={!!currentSong} />
              {/* Player Controls */}
              <div className="w-full flex flex-col items-center gap-1 md:gap-4 mt-1 md:mt-4">
                <div className="w-full mb-1 md:mb-2 flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.01}
                    value={currentTime}
                    onChange={e => seekTo(Number(e.target.value))}
                    className="w-full h-1 md:h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #fff ${(currentTime / (duration || 1)) * 100}%, #444 ${(currentTime / (duration || 1)) * 100}%)`,
                      transition: isPlaying ? 'background-size 0.2s linear' : 'none',
                      WebkitAppearance: 'none',
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
                <div className="flex items-center justify-center gap-2 md:gap-8">
                  <button className="bg-transparent p-0 rounded-full" onClick={playPrevSong} aria-label="Previous Song">
                    <BsSkipBackwardCircle className="text-white w-5 h-5 md:w-8 md:h-8" />
                  </button>
                  <button className="bg-transparent p-0 rounded-full" onClick={seekBackward} aria-label="Seek Back 10 Seconds">
                    <IoCaretBackCircleOutline className="text-white w-5 h-5 md:w-8 md:h-8" />
                  </button>
                  {!isPlaying ? (
                    <button className="bg-transparent p-0 rounded-full" onClick={handlePlay} aria-label="Play">
                      <FaPlayCircle className="text-white w-10 h-10 md:w-16 md:h-16" />
                    </button>
                  ) : (
                    <button className="bg-transparent p-0 rounded-full" onClick={handlePause} aria-label="Pause">
                      <FaRegPauseCircle className="text-white w-10 h-10 md:w-16 md:h-16" />
                    </button>
                  )}
                  <button className="bg-transparent p-0 rounded-full" onClick={seekForward} aria-label="Seek Forward 10 Seconds">
                    <IoCaretForwardCircleOutline className="text-white w-5 h-5 md:w-8 md:h-8" />
                  </button>
                  <button className="bg-transparent p-0 rounded-full" onClick={playNextSong} aria-label="Next Song">
                    <BsFastForwardCircle className="text-white w-5 h-5 md:w-8 md:h-8" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New Releases Carousel */}
        <section className="px-2 md:px-12 pb-4 md:pb-8">
          <h2 className="text-base md:text-xl font-bold mb-1 md:mb-4 flex items-center gap-2">New Releases <FaPlayCircle className="text-cyan-400 w-4 h-4 md:w-6 md:h-6" /></h2>
          <div className="flex gap-2 md:gap-6 overflow-x-auto pb-2 items-center">
            {newReleases.map((song: Song) => (
              <div key={song.id} className="min-w-[80px] md:min-w-[120px] max-w-[80px] md:max-w-[120px] flex-shrink-0 relative group">
                <Image src={song.coverImageURL || '/images/music_vibe.png'} alt={song.title} width={80} height={80} className="w-full h-[80px] md:h-[120px] object-cover mb-1 md:mb-2" />
                {currentSong?.id === song.id ? (
                  !isPlaying ? (
                    <button
                      className="absolute top-1 md:top-2 right-1 md:right-2 bg-transparent text-white rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handlePlay}
                      aria-label="Play"
                    >
                      <FaPlayCircle className="text-white w-5 h-5 md:w-8 md:h-8" />
                    </button>
                  ) : (
                    <button
                      className="absolute top-1 md:top-2 right-1 md:right-2 bg-transparent text-white rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handlePause}
                      aria-label="Pause"
                    >
                      <FaPauseCircle className="text-white w-5 h-5 md:w-8 md:h-8" />
                    </button>
                  )
                ) : (
                  <button
                    className="absolute top-1 md:top-2 right-1 md:right-2 bg-transparent text-white rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => playSong(song, newReleases)}
                    aria-label="Play"
                  >
                    <FaPlayCircle className="text-white w-5 h-5 md:w-8 md:h-8" />
                  </button>
                )}
                <div className="font-bold text-xs md:text-base truncate">{song.title}</div>
                <div className="text-gray-400 text-xs md:text-sm truncate">{song.artist}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}