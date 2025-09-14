"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const { signIn, signInWithGoogle, signInWithFacebook, signInWithGithub } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please enter both username and password.");
      setLoading(false);
      return;
    }
    if (email.includes("@")) {
      setError("Please use your username, not email, to login.");
      setLoading(false);
      return;
    }
    try {
      await signIn(email, password);
      setSuccess("Login successful!");
      setError("");
      setTimeout(() => router.push("/home"), 1000);
    } catch (err) {
      const errorMsg = typeof err === "object" && err !== null && "message" in err ? (err as { message?: string }).message : String(err);
      if (errorMsg?.toLowerCase().includes("password")) {
        setError("Incorrect password. Please try again.");
      } else if (errorMsg?.toLowerCase().includes("no user")) {
        setError("Account not found. Please check your username/email.");
      } else {
        setError(errorMsg || "Failed to sign in");
      }
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook" | "github") => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (provider === "google") await signInWithGoogle();
      if (provider === "facebook") await signInWithFacebook();
      if (provider === "github") await signInWithGithub();
      setSuccess(`Login with ${provider} successful!`);
      setTimeout(() => router.push("/home"), 1000);
    } catch (err) {
      const errorMsg = typeof err === "object" && err !== null && "message" in err ? (err as { message?: string }).message : String(err);
      setError(errorMsg || `Failed to sign in with ${provider}`);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-8 md:px-12 lg:px-20 py-4 w-full">
        <div className="flex items-center">
          <img src="/images/beats_music.png" alt="Beats Music" className="h-14 w-auto object-contain" />
        </div>
        <div className="flex items-center space-x-8">
          <img src="/images/afterpay.png" alt="Afterpay" className="h-7 w-auto object-contain" />
          <img src="/images/zip.png" alt="Zip" className="h-7 w-auto object-contain" />
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col md:flex-row items-stretch py-4 px-2 sm:px-4 md:px-6 lg:px-12 xl:px-24 gap-4">
        <section className="w-full sm:w-[90%] md:w-[66%] lg:w-[70%] flex flex-col items-start justify-center gap-8 sm:mx-auto" style={{ paddingLeft: '4%', paddingRight: '2%' }}>
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white">
            <span style={{ fontFamily: 'K2D, sans-serif' }}>
              THE MULTI-UNIVERSAL<br />MUSIC PLAYLIST
            </span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-full sm:max-w-xl md:max-w-2xl w-full leading-relaxed font-bold px-1 sm:px-0" style={{ fontFamily: 'K2D, sans-serif' }}>
            Discover the magic of music with us. Our platform is your gateway to a world of melodies, rhythms, and emotions. Whether you&apos;re a passionate listener, a budding artist, or an industry professional, we have something special for you.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
            <div className="relative w-full sm:w-[50%] md:w-[40%] h-[180px] sm:h-[240px] md:h-[330px] rounded-tl-2xl rounded-bl-2xl overflow-hidden shadow-lg flex-shrink-0">
              <img src="/images/coachella 1.png" alt="Coachella" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-3 sm:py-5" style={{ fontFamily: 'K2D, sans-serif' }}>
              <button className="text-black px-8 py-1 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-base shadow mb-1">
                BUY TICKET
              </button>
              <h3 className="text-xl text-bold md:text-2xl font-bold leading-tight text-center mb-2" style={{ color: '#809DC1' }}>
                TAKE YOUR TICKET FOR A<br />WONDERFUL EXPERIENCE
              </h3>
              <div className="flex flex-col items-center gap-2 mb-2">
                <img src="/images/music_vibe.png" alt="Music Vibe" className="h-[60px] w-[80px] sm:h-[40px] sm:w-[120px] md:h-[40px] md:w-[140px] object-contain" />
              </div>
              <p className="text-base uppercase tracking-wide text-center font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#AF96BC' }}>
                JUST PAY FOR THE BEST 2024 COACHELLA<br />PERFORMANCES
              </p>
            </div>
          </div>
        </section>

        <aside className="w-full sm:w-[95%] md:w-[40%] lg:w-[38%] max-w-[480px] min-h-[700px] rounded-xl p-5 sm:p-8 flex-shrink-0 self-center flex flex-col justify-center"
          style={{
            background: 'linear-gradient(120deg, ##60606000 40%, #232b3e 20%)',
            borderRadius: '40px',
            boxShadow: '0 8px 32px 0 rgba(32,32,32,0.45)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 text-white">Welcome Back</h2>
            <p className="text-gray-400 text-sm">Glad you&apos;re back.!</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors text-sm"
                required
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors pr-12 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-white">Remember me</label>
            </div>
            {error && (
              <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg p-2">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="text-center">
              <Link href="/forgot-password" className="text-white hover:text-cyan-400 text-sm transition-colors">Forgot password ?</Link>
            </div>
          </form>
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-3 text-white text-sm mb-4">
              <div className="h-px bg-gray-600 flex-1"></div>
              <span>Or</span>
              <div className="h-px bg-gray-600 flex-1"></div>
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => handleSocialLogin("google")}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 bg-transparent border-none shadow-none"
                aria-label="Login with Google"
              >
                <img src="/images/google.png" alt="Google" className="w-6 h-6 object-contain" />
              </button>
              <button
                onClick={() => handleSocialLogin("facebook")}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 bg-transparent border-none shadow-none"
                aria-label="Login with Facebook"
              >
                <img src="/images/facebook.png" alt="Facebook" className="w-6 h-6 object-contain" />
              </button>
              <button
                onClick={() => handleSocialLogin("github")}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 bg-transparent border-none shadow-none"
                aria-label="Login with GitHub"
              >
                <img src="/images/github.png" alt="GitHub" className="w-6 h-6 object-contain" />
              </button>
            </div>
          </div>
          <div className="mt-6 text-center">
            <span className="text-white text-sm/2">Don&apos;t have an account ? </span>
            <Link href="/signup" className="text-white hover:text-cyan-300 font-semibold transition-colors text-sm/2">Signup</Link>
          </div>
          <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms & Conditions</Link>
            <Link href="/support" className="hover:text-cyan-400 transition-colors">Support</Link>
            <Link href="/customer-care" className="hover:text-cyan-400 transition-colors">Customer Care</Link>
          </div>
        </aside>
      </main>
    </div>
  );
}