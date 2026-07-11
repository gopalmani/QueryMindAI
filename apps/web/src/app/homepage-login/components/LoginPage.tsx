'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Database, Zap, Info } from 'lucide-react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);


interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const MOCK_EMAIL = 'architect@querymind.ai';
const MOCK_PASSWORD = 'Schema#Engine2026';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ defaultValues: { rememberMe: false } });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError('');
    await new Promise((r) => setTimeout(r, 1400));
    // Backend integration point: POST /api/auth/login
    if (data.email === MOCK_EMAIL && data.password === MOCK_PASSWORD) {
      router.push('/dashboard-and-connection');
    } else {
      setAuthError(
        `Invalid credentials. Try: ${MOCK_EMAIL} / ${MOCK_PASSWORD}`
      );
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    await new Promise((r) => setTimeout(r, 1200));
    // Backend integration point: /api/auth/oauth/{provider}
    router.push('/dashboard-and-connection');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main split layout */}
      <div className="flex flex-1 flex-col lg:flex-row min-h-screen">
        {/* LEFT PANEL — Dark brand */}
        <div
          className="relative lg:w-[58%] flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #0a1628 0%, #0f1f3d 40%, #0d1a2e 70%, #080f1e 100%)',
            minHeight: '50vh',
          }}
        >
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(hsl(217 91% 60% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 60% / 0.6) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Logo */}
          <div className="relative z-10 p-8 lg:p-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold text-lg tracking-tight">QueryMindAI</span>
            </div>
          </div>

          {/* Hero content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-8 lg:px-14 pb-8">
            <div className="mb-6">
              <div className="w-12 h-px bg-blue-500/50 mb-8" />
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                Ask questions,{' '}
                <span className="text-blue-400">not SQL.</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md mt-6">
                Open-source natural-language analytics that produces safe, explainable SQL over structured data.
              </p>
            </div>

            {/* 3D Geometric shapes */}
            <div className="relative h-48 mt-8 hidden lg:block">
              <div
                className="absolute bottom-4 right-16 w-20 h-20 rounded-xl opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
                  transform: 'rotate(-15deg) perspective(200px) rotateX(20deg) rotateY(-10deg)',
                  boxShadow: '4px 8px 24px rgba(29, 78, 216, 0.3)',
                }}
              />
              <div
                className="absolute bottom-12 right-40 w-16 h-16 rounded-lg opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                  transform: 'rotate(8deg) perspective(200px) rotateX(-15deg) rotateY(15deg)',
                  boxShadow: '4px 8px 20px rgba(37, 99, 235, 0.4)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              />
              <div
                className="absolute bottom-2 right-64 w-24 h-16 rounded-xl opacity-35"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                  transform: 'rotate(-5deg) perspective(200px) rotateX(10deg) rotateY(5deg)',
                  boxShadow: '4px 8px 28px rgba(30, 58, 138, 0.4)',
                }}
              />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative z-10 px-8 lg:px-14 pb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500 text-xs font-mono tracking-widest uppercase">
                Schema Engine V4.02 // Enterprise
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-slate-600" />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Light form */}
        <div className="lg:w-[42%] bg-gray-50 flex flex-col justify-center px-8 lg:px-14 py-12">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Access your managed data environments and SQL pipelines.
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleOAuth('google')}
                disabled={oauthLoading !== null || isLoading}
                className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {oauthLoading === 'google' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Google
              </button>
              <button
                onClick={() => handleOAuth('github')}
                disabled={oauthLoading !== null || isLoading}
                className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {oauthLoading === 'github' ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <GithubIcon className="w-4 h-4 text-gray-800" />
                )}
                GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 tracking-widest uppercase">Or use email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Auth error */}
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            )}

            {/* Email/password form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 tracking-widest uppercase mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="architect@querymind.ai"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600 tracking-widest uppercase">
                    Password
                  </label>
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="rememberMe"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Keep me signed in for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || oauthLoading !== null}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
                style={{ minHeight: '48px' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In to Workspace'
                )}
              </button>
            </form>

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account yet?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Create architectural profile
              </button>
            </p>

            {/* Demo credentials */}
            <div className="mt-6 p-3.5 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-0.5">Demo Credentials</p>
                <p className="text-xs text-blue-600 font-mono">
                  {MOCK_EMAIL} · {MOCK_PASSWORD}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-8 lg:px-14 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t"
        style={{ background: '#060d1a', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs text-slate-600 font-mono tracking-widest uppercase">
          © 2026 QueryMind AI. Architectural Precision in Data.
        </p>
        <div className="flex items-center gap-6">
          {['Privacy Policy', 'Terms of Service', 'Security Architecture', 'Trust Center'].map((item) => (
            <button key={`footer-${item}`} className="text-xs text-slate-600 hover:text-slate-400 font-mono tracking-wider uppercase transition-colors">
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
