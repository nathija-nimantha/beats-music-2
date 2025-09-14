'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { validatePassword, isValidEmail } from '@/lib/utils';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const { signUp, signInWithGoogle, signInWithFacebook, signInWithGithub } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToPolicy) {
      newErrors.policy = 'You must agree to our policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.username);
      setErrors({});
      setTimeout(() => router.push('/home'), 1200);
    } catch (error: unknown) {
      let errorMessage = 'Failed to create account';
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string') {
        errorMessage = (error as { message: string }).message;
      }
      if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ submit: 'Password is too weak or invalid.' });
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ submit: 'Email is invalid or already in use.' });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github') => {
    setLoading(true);
    setErrors({});

    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'facebook':
          await signInWithFacebook();
          break;
        case 'github':
          await signInWithGithub();
          break;
      }
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string'
          ? (error as { message: string }).message
          : `Failed to sign up with ${provider}`;
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-start justify-center px-2 sm:px-0">
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

      <main className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-md shadow-lg p-8 sm:p-10 flex flex-col items-center justify-center transition-all duration-300" style={{
          background: 'linear-gradient(120deg, ##60606000 40%, #232b3e 20%)',
          borderRadius: '40px',
          boxShadow: '0 8px 32px 0 rgba(32,32,32,0.45)',
          position: 'relative',
          overflow: 'hidden',
        }}
        >
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-extrabold text-white text-left w-full font-noto-sans-bold mb-1">Open New Account</h1>
            <p className="text-gray-300 text-sm w-full text-left mb-2 font-noto-sans-light">Enjoy your new spirit world</p>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              className="w-full bg-transparent border border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
              required
            />
            {errors.username && <p className="text-red-400 text-xs mt-1 w-full text-left">{errors.username}</p>}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              className="w-full bg-transparent border border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
              required
            />
            {errors.email && <p className="text-red-400 text-xs mt-1 w-full text-left">{errors.email}</p>}
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className="w-full bg-transparent border border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1 w-full text-left">{errors.password}</p>}
            <div className="relative w-full">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                className="w-full bg-transparent border border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 w-full text-left">{errors.confirmPassword}</p>}
            <div className="flex items-center mb-2 w-full">
              <input
                type="checkbox"
                id="policy"
                checked={agreedToPolicy}
                onChange={e => setAgreedToPolicy(e.target.checked)}
                className="w-4 h-4 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-2 accent-cyan-400"
              />
              <label htmlFor="policy" className="ml-2 text-sm text-white">Argee our policy</label>
            </div>
            {errors.policy && <p className="text-red-400 text-xs mt-1 w-full text-left">{errors.policy}</p>}
            {errors.submit && <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg p-2 mb-2 w-full text-left">{errors.submit}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-2 shadow-lg"
            >
              {loading ? "Creating Account..." : "Create New Account"}
            </button>
            <div className="w-full text-center mb-2">
              <span className="text-white text-sm">Do you have account ? </span>
              <Link href="/" className="text-white hover:text-cyan-400 font-semibold transition-colors text-sm">Login</Link>
            </div>
            <div className="flex items-center justify-center gap-2 my-4 w-full">
              <div className="h-px bg-gray-700 flex-1"></div>
              <span className="text-gray-400 text-base font-semibold">Or</span>
              <div className="h-px bg-gray-700 flex-1"></div>
            </div>
            <div className="flex justify-center gap-4 w-full">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform bg-transparent border-none shadow-none"
              >
                <Image src="/images/google.png" alt="Google" width={24} height={24} />
              </button>
              <button
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform bg-transparent border-none shadow-none"
              >
                <Image src="/images/facebook.png" alt="Facebook" width={24} height={24} />
              </button>
              <button
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-transform bg-transparent border-none shadow-none"
              >
                <Image src="/images/github.png" alt="GitHub" width={24} height={24} />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}