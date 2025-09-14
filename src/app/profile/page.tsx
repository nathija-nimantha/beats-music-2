'use client';

import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row-reverse overflow-auto">
            {/* Sidebar Navigation */}
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

            <main className="flex-1 flex flex-col w-full">
                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between px-2 md:px-8 py-2 md:py-6 w-full gap-2 md:gap-0">
                    <div className="flex items-center mb-2 md:mb-0">
                        <img src="/images/beats_music.png" alt="Beats Music" width={40} height={40} className="h-10 md:h-14 w-auto object-contain" />
                    </div>
                    <div className="flex items-center space-x-4 md:space-x-8 mt-2 md:mt-0">
                        <img src="/images/afterpay.png" alt="Afterpay" width={40} height={20} className="h-5 md:h-7 w-auto object-contain" />
                        <img src="/images/zip.png" alt="Zip" width={40} height={20} className="h-5 md:h-7 w-auto object-contain" />
                    </div>
                </header>

                {/* Profile Card */}
                <section className="flex flex-1 items-center justify-center w-full px-2 py-4">
                    <div className="w-full max-w-md bg-gradient-to-br from-gray-900/90 to-gray-800/80 rounded-2xl border border-gray-700 shadow-lg p-6 md:p-8 flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <Image src="/images/profile.png" alt="Profile" width={80} height={80} className="rounded-full border-2 border-cyan-400" />
                            <div className="text-xl md:text-2xl font-bold text-white">{user?.username || user?.email || 'User'}</div>
                            <div className="text-gray-400 text-sm md:text-base">{user?.email}</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base mb-2"
                        >
                            Logout
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
