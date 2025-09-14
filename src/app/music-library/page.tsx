'use client';
import { Playlist } from '@/lib/types';
import { MdBarChart } from 'react-icons/md';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, SkipBack, SkipForward, Heart, MoreHorizontal } from 'lucide-react';
import { FaCaretDown, FaRegPauseCircle } from 'react-icons/fa';
import { FiPlusCircle } from 'react-icons/fi';
import { IoHome } from 'react-icons/io5';
import { IoMdShuffle, IoMdRepeat } from 'react-icons/io';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStore } from '@/store/playerStore';
import { songService, chartService, userService } from '@/lib/services';
import { playlistService } from '@/lib/services';
import { db } from '@/lib/firebase';
import { Song } from '@/lib/types';
import { useRouter } from 'next/navigation';


export default function MusicLibrary() {
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
    const [isShuffle, setIsShuffle] = useState(false);
    const [isLoop, setIsLoop] = useState(false);
    const getCurrentPlaylist = () => {
        if (playingPlaylistId) {
            const playlist = userPlaylists.find(p => p.id === playingPlaylistId);
            if (playlist && playlist.songs.length > 0) {
                return playlist.songs;
            }
        }
        return newReleases.map(s => s.id);
    };
    const playNext = () => {
        const playlistIds = getCurrentPlaylist();
        if (!currentSong || playlistIds.length === 0) return;
        if (isLoop) {
            playSong(currentSong, playlistIds.map(id => newReleases.find(s => s.id === id) || currentSong));
            return;
        }
        let nextIndex;
        const currentIndex = playlistIds.indexOf(currentSong.id);
        if (isShuffle) {
            do {
                nextIndex = Math.floor(Math.random() * playlistIds.length);
            } while (nextIndex === currentIndex && playlistIds.length > 1);
        } else {
            nextIndex = (currentIndex < playlistIds.length - 1) ? currentIndex + 1 : 0;
        }
        const nextSongId = playlistIds[nextIndex];
        const nextSong = newReleases.find(s => s.id === nextSongId) || currentSong;
        playSongWithRecentlyPlayed(nextSong, newReleases);
    };

    const playPrev = () => {
        const playlistIds = getCurrentPlaylist();
        if (!currentSong || playlistIds.length === 0) return;
        if (isLoop) {
            playSong(currentSong, playlistIds.map(id => newReleases.find(s => s.id === id) || currentSong));
            return;
        }
        let prevIndex;
        const currentIndex = playlistIds.indexOf(currentSong.id);
        if (isShuffle) {
            do {
                prevIndex = Math.floor(Math.random() * playlistIds.length);
            } while (prevIndex === currentIndex && playlistIds.length > 1);
        } else {
            prevIndex = (currentIndex > 0) ? currentIndex - 1 : playlistIds.length - 1;
        }
        const prevSongId = playlistIds[prevIndex];
        const prevSong = newReleases.find(s => s.id === prevSongId) || currentSong;
        playSongWithRecentlyPlayed(prevSong, newReleases);
    };
    const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
    const handlePlayPlaylist = async (playlist: Playlist) => {
        if (!playlist.songs || playlist.songs.length === 0) return;
        const songs: Song[] = [];
        for (const songId of playlist.songs) {
            const song = await songService.getSongById(songId);
            if (song) songs.push(song);
        }
        if (songs.length > 0) {
            playSong(songs[0], songs);
            setPlayingPlaylistId(playlist.id);
        }
    };

    const addToRecentlyPlayed = async (song: Song) => {
        if (!user || !song?.id) return;
        try {
            const { getDocs, collection, query, where, updateDoc, doc, addDoc, serverTimestamp } = await import('firebase/firestore');
            const recentlyPlayedRef = collection(db, 'recentlyPlayed');
            const q = query(recentlyPlayedRef, where('userId', '==', user.id), where('songId', '==', song.id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                const docRef = doc(db, 'recentlyPlayed', docId);
                await updateDoc(docRef, { playedAt: serverTimestamp() });
            } else {
                await addDoc(recentlyPlayedRef, {
                    userId: user.id,
                    songId: song.id,
                    playedAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Failed to add to recently played:', error);
        }
    };
    const { currentSong, playSong, isPlaying, pauseSong, resumeSong, currentTime, duration } = usePlayerStore();
    const [newReleases, setNewReleases] = useState<Song[]>([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
    const [topGlobalSongs, setTopGlobalSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [featuredSong, setFeaturedSong] = useState<Song | null>(null);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const { user } = useAuth();
    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [showSelectPlaylist, setShowSelectPlaylist] = useState(false);
    const [songToAdd, setSongToAdd] = useState<Song | null>(null);
    const [playlistName, setPlaylistName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);

    useEffect(() => {
        const fetchPlaylists = async () => {
            if (!user) return;
            try {
                const playlists = await playlistService.getUserPlaylists(user.id);
                setUserPlaylists(playlists);
            } catch (error) {
                setUserPlaylists([]);
            }
        };
        fetchPlaylists();
    }, [user]);

    const handleAddPlaylistClick = () => {
        if (!user) return;
        if (userPlaylists.length > 0 && currentSong) {
            setSongToAdd(currentSong);
            setShowSelectPlaylist(true);
        } else {
            setShowCreatePlaylist(true);
        }
    };
    const handleSelectPlaylist = async (playlistId: string) => {
        if (!songToAdd) return;
        try {
            await playlistService.addSongToPlaylist(playlistId, songToAdd.id);
            setShowSelectPlaylist(false);
            setSongToAdd(null);
        } catch {
            // handle error
        }
    };

    const handleCreatePlaylist = async () => {
        if (!user || !playlistName.trim()) return;
        try {
            const playlistData = {
                name: playlistName,
                userId: user.id,
                isPublic,
                songs: [],
                description: '',
                coverImageURL: '',
            };
            await playlistService.createPlaylist(playlistData);
            setShowCreatePlaylist(false);
            setPlaylistName('');
            setIsPublic(false);
            const playlists = await playlistService.getUserPlaylists(user.id);
            setUserPlaylists(playlists);
        } catch {
            // handle error
        }
    };

    useEffect(() => {
        loadLibraryData();
    }, [user]);

    const fetchRecentlyPlayedSongs = async (userId: string, limit: number = 10) => {
        try {
            const { getDocs, collection, query, where, orderBy, limit: fbLimit } = await import('firebase/firestore');
            const recentlyPlayedRef = collection(db, 'recentlyPlayed');
            const q = query(
                recentlyPlayedRef,
                where('userId', '==', userId),
                orderBy('playedAt', 'desc'),
                fbLimit(limit)
            );
            const snapshot = await getDocs(q);
            const songIds: string[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.songId) songIds.push(data.songId);
            });
            if (songIds.length > 0) {
                const songs: Song[] = [];
                for (const songId of songIds) {
                    try {
                        const song = await songService.getSongById(songId);
                        if (song) songs.push(song);
                    } catch {
                        // skip missing song
                    }
                }
                setRecentlyPlayed(songs);
            } else {
                setRecentlyPlayed([]);
            }
        } catch (error) {
            console.error('Failed to fetch recently played songs:', error);
            setRecentlyPlayed([]);
        }
    };

    const loadLibraryData = async () => {
        setLoading(true);
        try {
            const releases = await songService.getNewReleases(7);
            setNewReleases(releases);
            if (releases.length > 0) setFeaturedSong(releases[0]);

            if (user) {
                await fetchRecentlyPlayedSongs(user.id, 10);
                await loadLikedSongs();
            }

            const charts = await chartService.getTopGlobalSongs(7);
            setTopGlobalSongs(charts.map(chart => chart.song));
        } catch (error) {
            console.error('Failed to load music library data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLikedSongs = async () => {
        if (!user) return;

        try {
            const likedSongsData = await userService.getLikedSongs(user.id);
            const likedSongIds = new Set(likedSongsData.map(song => song.id));
            setLikedSongs(likedSongIds);
        } catch (error) {
            console.error('Failed to load liked songs:', error);
        }
    };

    const handleHeartClick = async (songId: string) => {
        if (!user) return;

        try {
            const isLiked = likedSongs.has(songId);

            if (isLiked) {
                await userService.unlikeSong(user.id, songId);
                setLikedSongs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(songId);
                    return newSet;
                });
            } else {
                await userService.likeSong(user.id, songId);
                setLikedSongs(prev => new Set([...prev, songId]));
            }
        } catch (error) {
            console.error('Failed to update liked songs:', error);
        }
    };

    const playSongWithRecentlyPlayed = (song: Song, playlist?: Song[]) => {
        playSong(song, playlist);
        addToRecentlyPlayed(song);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#070707] text-white flex flex-col md:flex-row-reverse overflow-auto">
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
                        <img src="/images/beats_music.png" alt="Beats Music" className="h-10 md:h-14 w-auto object-contain" />
                    </div>
                    <div className="flex-1 flex justify-center w-full md:w-auto">
                        <form className="relative w-full max-w-xs md:max-w-xl" onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder="Search something ..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[#181818] text-white px-4 py-2 md:px-6 md:py-3 rounded-full border border-gray-800 focus:outline-none focus:border-cyan-400 text-base md:text-lg pr-10 md:pr-12"
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

                {/* Main Content Grid */}
                <div className="flex-1 px-2 md:px-6 py-3 grid grid-cols-1 xl:grid-cols-4 gap-2 md:gap-4">
                    <div className="xl:col-span-3 space-y-2 md:space-y-4">
                        {/* Featured Song Section */}
                        <div className="relative w-full h-[220px] md:h-[360px] rounded-2xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.14)]">
                            <Image
                                src="/images/player_banner.png"
                                alt="Player Banner"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/100" />
                            <div className="absolute inset-0 flex flex-col md:flex-row h-full w-full">
                                <div className="flex flex-col justify-center pl-3 md:pl-6 w-full md:w-1/2 py-2 md:py-0">
                                    <span className="text-gray-300 text-xs font-bold mb-2 pl-1" style={{ fontFamily: 'K2D, sans-serif' }}>FEATURED SONGS</span>
                                    <h2 className="text-xl md:text-4xl font-extrabold text-white mb-2" style={{ fontFamily: 'K2D, sans-serif' }}>
                                        {currentSong ? currentSong.title : featuredSong?.title || 'No song playing'}
                                    </h2>
                                    <p className="text-gray-200 text-base md:text-2xl font-semibold mb-2 md:mb-4" style={{ fontFamily: 'K2D, sans-serif' }}>
                                        {currentSong ? currentSong.artist : featuredSong?.artist || ''}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <button className="text-gray-400 hover:text-white mr-3">
                                            <MoreHorizontal className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => currentSong && handleHeartClick(currentSong.id)}
                                            className={`transition-colors mr-3 ${currentSong && likedSongs.has(currentSong.id)
                                                ? 'text-red-500'
                                                : 'text-gray-400 hover:text-red-500'
                                                }`}
                                        >
                                            <Heart
                                                className="w-6 h-6"
                                                fill={currentSong && likedSongs.has(currentSong.id) ? 'currentColor' : 'none'}
                                            />
                                        </button>
                                        <button className="bg-cyan-400 text-black font-bold px-2 py-1 md:px-3 md:py-1 rounded-md hover:bg-cyan-500 transition text-xs md:text-sm" onClick={handleAddPlaylistClick}>
                                            Add Playlist
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center w-full md:w-1/2 h-full pr-3 md:pr-6 py-2 md:py-0">
                                    {/* Lyrics Overlay */}
                                    <div className="text-center max-w-xs mb-2 md:mb-6">
                                        <p className="text-white text-xs md:text-sm font-medium leading-tight mb-0.5">Lock me up and throw away the key</p>
                                        <p className="text-red-400 text-xs md:text-sm font-medium leading-tight mb-0.5">He knows how to get the best out of me</p>
                                        <p className="text-white text-xs md:text-sm font-medium leading-tight mb-0.5">I&apos;m no force for the world to see</p>
                                        <p className="text-white text-xs md:text-sm font-medium leading-tight mb-0.5">Trade my whole life just to be</p>
                                        <p className="text-white text-xs md:text-sm font-medium leading-tight">Tell nobody I control you</p>
                                    </div>
                                    <div className="flex flex-col items-center space-y-1 md:space-y-2">
                                        <div className="w-40 md:w-56 flex items-center space-x-2">
                                            <span className="text-white text-xs">{formatTime(currentTime)}</span>
                                            <div className="flex-1 bg-gray-600 rounded-full h-1">
                                                <div
                                                    className="bg-red-500 h-1 rounded-full"
                                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white text-xs">{formatTime(duration)}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 md:space-x-3">
                                            <button
                                                className="text-white hover:text-cyan-400"
                                                onClick={() => setIsShuffle(s => !s)}
                                                title="Shuffle"
                                            >
                                                <IoMdShuffle className="w-5 h-5" style={{ color: isShuffle ? '#22d3ee' : 'white' }} />
                                            </button>
                                            <button className="text-white hover:text-cyan-400" onClick={playPrev}>
                                                <SkipBack className="w-5 md:w-6 h-5 md:h-6" />
                                            </button>
                                            <button
                                                className="bg-white text-black rounded-full p-1 md:p-2 hover:bg-gray-200"
                                                onClick={() => {
                                                    if (isPlaying) {
                                                        pauseSong();
                                                    } else {
                                                        resumeSong();
                                                    }
                                                }}
                                            >
                                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                            </button>
                                            <button className="text-white hover:text-cyan-400" onClick={playNext}>
                                                <SkipForward className="w-5 md:w-6 h-5 md:h-6" />
                                            </button>
                                            <button
                                                className="text-white hover:text-cyan-400"
                                                onClick={() => setIsLoop(l => !l)}
                                                title="Loop"
                                            >
                                                <IoMdRepeat className="w-5 h-5" style={{ color: isLoop ? '#22d3ee' : 'white' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recently Played Card */}
                        <div className="bg-[#000] rounded-2xl p-8 mb-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.14)]">
                            <div className="flex items-center space-x-2 mb-3">
                                <h3 className="text-xl font-bold text-white">Recently Played</h3>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                    <FaRegPauseCircle className="w-8 h-8" style={{ color: '#011D32' }} fill="#011D32" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {recentlyPlayed.slice(0, 3).map((song, index) => {
                                    const isCurrent = currentSong?.id === song.id;
                                    const isLiked = likedSongs.has(song.id);
                                    return (
                                        <div
                                            key={song.id}
                                            className={`flex items-center space-x-2 py-1 rounded-lg transition cursor-pointer ${isCurrent ? 'bg-black/60' : 'hover:bg-gray-900/50'}`}
                                            onClick={() => playSongWithRecentlyPlayed(song, recentlyPlayed)}
                                        >
                                            {isCurrent && isPlaying ? (
                                                <button className="text-cyan-400 w-6 flex items-center justify-center" onClick={e => { e.stopPropagation(); pauseSong(); }}>
                                                    <Pause className="w-6 h-6" />
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 w-6 text-center">{index + 1}</span>
                                            )}
                                            <div className="relative">
                                                <Image
                                                    src={song.coverImageURL || '/images/music_vibe.png'}
                                                    alt={song.title}
                                                    width={58}
                                                    height={58}
                                                    className="rounded-2xl"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium text-sm ${isCurrent && isPlaying ? 'text-cyan-400' : 'text-white'}`}>{song.title}</p>
                                                <p className="text-gray-400 text-xs">{song.artist}</p>
                                            </div>
                                            <span className="text-gray-400 text-xs">{song.album}</span>
                                            <span className="text-gray-400 text-xs">{formatTime(song.duration)}</span>
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleHeartClick(song.id);
                                                    }}
                                                    className={`transition-colors ${isLiked
                                                        ? 'text-red-500'
                                                        : 'text-gray-400 hover:text-red-500'
                                                        }`}
                                                >
                                                    <Heart
                                                        className="w-4 h-4"
                                                        fill={isLiked ? 'currentColor' : 'none'}
                                                    />
                                                </button>
                                                <button className="text-gray-400 hover:text-white">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* US/UK Song New Releases Card */}
                        <div className="rounded-2xl p-8 mb-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.14)]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-bold text-white">US/UK Song New Releases</h3>
                                <button className="text-gray-400 hover:text-white text-sm">See more</button>
                            </div>
                            <div className="flex gap-7 overflow-x-auto pb-2">
                                {newReleases.map((song) => {
                                    const isCurrent = currentSong?.id === song.id;
                                    return (
                                        <div
                                            key={song.id}
                                            className="flex flex-col items-center min-w-[60px] group cursor-pointer"
                                            onClick={() => playSongWithRecentlyPlayed(song, newReleases)}
                                        >
                                            <div className="relative mb-2">
                                                <Image
                                                    src={song.coverImageURL || '/images/music_vibe.png'}
                                                    alt={song.title}
                                                    width={78}
                                                    height={78}
                                                    className="rounded-full mx-auto border-2 border-gray-700 group-hover:blur-sm transition duration-200"
                                                />
                                                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isCurrent && isPlaying ? 'opacity-100' : 'group-hover:opacity-100 opacity-0'}`}>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); playSong(song, newReleases); }}
                                                        className="w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200"
                                                    >
                                                        {isCurrent && isPlaying ? (
                                                            <Pause size={20} className="text-black ml-0.5" />
                                                        ) : (
                                                            <Play size={20} className="text-black ml-0.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="text-white text-base font-medium truncate w-16 text-center">{song.title}</h4>
                                            <p className="text-gray-400 text-sm truncate w-16 text-center">{song.artist}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-1 space-y-6 flex flex-col">
                        {/* Top 100 Global Songs */}
                        <div className="bg-[#000] p-8 shadow-[0_4px_16px_0_rgba(0,0,0,0.14)] mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-white">Top 100 Global Songs</h3>
                                <div className="flex space-x-2">
                                    <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">New</span>
                                    <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded">Global</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                {topGlobalSongs.map((song, idx) => {
                                    const isCurrent = currentSong?.id === song.id;
                                    const isLiked = likedSongs.has(song.id);
                                    return (
                                        <div
                                            key={song.id}
                                            className={`flex items-center space-x-2 py-1 hover:bg-gray-800/50 transition cursor-pointer ${isCurrent ? 'bg-black/60' : ''}`}
                                            onClick={() => playSongWithRecentlyPlayed(song, topGlobalSongs)}
                                        >
                                            <span className="text-gray-400 w-6 text-center text-sm">{idx + 1}</span>
                                            <Image
                                                src={song.coverImageURL || '/images/music_vibe.png'}
                                                alt={song.title}
                                                width={46}
                                                height={46}
                                            />
                                            <div className="flex-1">
                                                <p className="text-white text-xs font-medium truncate">{song.title}</p>
                                                <p className="text-gray-400 text-[10px] truncate">{song.artist}</p>
                                            </div>
                                            <span className="text-gray-400 text-[10px]">{formatTime(song.duration)}</span>
                                            <div className="flex items-center space-x-0.5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleHeartClick(song.id);
                                                    }}
                                                    className={`transition-colors ${isLiked
                                                        ? 'text-red-500'
                                                        : 'text-gray-400 hover:text-red-500'
                                                        }`}
                                                >
                                                    <Heart
                                                        className="w-3 h-3"
                                                        fill={isLiked ? 'currentColor' : 'none'}
                                                    />
                                                </button>
                                                <button className="text-gray-400 hover:text-white">
                                                    <MoreHorizontal className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-2 flex justify-center">
                                <button className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                                    Expand <FaCaretDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Your Playlists */}
                        <div className="bg-[#000] rounded-2xl p-8 shadow-[0_4px_16px_0_rgba(0,0,0,0.14)]">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-white"><IoHome className="w-5 h-5" /></span>
                                    <h3 className="text-lg font-bold text-white">Your Playlists</h3>
                                </div>
                                <button className="text-gray-400 hover:text-white" onClick={handleAddPlaylistClick}>
                                    <FiPlusCircle className="w-5 h-5" onClick={e => { e.stopPropagation(); setShowCreatePlaylist(true); }} />
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                {userPlaylists.map((playlist) => {
                                    const isPlayingThisPlaylist = playingPlaylistId === playlist.id && currentSong && playlist.songs.includes(currentSong.id);
                                    return (
                                        <div
                                            key={playlist.id}
                                            className="flex items-center space-x-2 py-1 hover:bg-gray-800/50 rounded-lg transition cursor-pointer"
                                            onClick={() => handlePlayPlaylist(playlist)}
                                        >
                                            <span className={`text-sm ${isPlayingThisPlaylist ? 'font-bold' : ''}`} style={isPlayingThisPlaylist ? { color: '#F3777D' } : { color: '#D1D5DB' }}>
                                                {playlist.name}
                                            </span>
                                            {isPlayingThisPlaylist && (
                                                <MdBarChart className="w-5 h-5" style={{ color: '#F3777D' }} />
                                            )}
                                            {playlist.isPublic && <span className="text-cyan-400 text-xs ml-2">Public</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {showSelectPlaylist && (
                            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                                <div className="bg-[#181818] rounded-xl p-8 w-full max-w-sm mx-auto flex flex-col gap-4">
                                    <h2 className="text-white text-lg font-bold mb-2">Select Playlist</h2>
                                    <div className="space-y-2">
                                        {userPlaylists.map((playlist) => (
                                            <button
                                                key={playlist.id}
                                                className="w-full bg-[#222] text-white px-4 py-2 rounded-md border border-gray-700 hover:bg-cyan-400 hover:text-black transition"
                                                onClick={() => handleSelectPlaylist(playlist.id)}
                                            >
                                                {playlist.name} {playlist.isPublic && <span className="text-cyan-400 text-xs ml-2">Public</span>}
                                            </button>
                                        ))}
                                    </div>
                                    <button className="bg-gray-700 text-white px-4 py-2 rounded-md mt-4" onClick={() => setShowSelectPlaylist(false)}>Cancel</button>
                                </div>
                            </div>
                        )}
                        {showCreatePlaylist && (
                            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                                <div className="bg-[#181818] rounded-xl p-8 w-full max-w-sm mx-auto flex flex-col gap-4">
                                    <h2 className="text-white text-lg font-bold mb-2">Create Playlist</h2>
                                    <input
                                        type="text"
                                        placeholder="Playlist Name"
                                        value={playlistName}
                                        onChange={e => setPlaylistName(e.target.value)}
                                        className="w-full bg-[#222] text-white px-4 py-2 rounded-md border border-gray-700 focus:outline-none"
                                    />
                                    <label className="flex items-center gap-2 text-white">
                                        <input
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={e => setIsPublic(e.target.checked)}
                                            className="accent-cyan-400"
                                        />
                                        Public
                                    </label>
                                    <div className="flex gap-2 mt-4">
                                        <button className="bg-cyan-400 text-black px-4 py-2 rounded-md font-bold" onClick={handleCreatePlaylist}>Create</button>
                                        <button className="bg-gray-700 text-white px-4 py-2 rounded-md" onClick={() => setShowCreatePlaylist(false)}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}