'use client'

import { useState, useEffect, Suspense, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Logo } from '@/components/Navbar'
import { Button } from '@/components/ui/button'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { user, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'ORGANIZER') {
        router.replace('/organizer/dashboard')
      } else {
        router.replace(redirect || '/participant/dashboard')
      }
    }
  }, [user, router, redirect])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loggedInUser = await login(email.trim(), password)
      if (loggedInUser.role === 'ORGANIZER') {
        router.push('/organizer/dashboard')
      } else {
        router.push(redirect || '/participant/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 py-12 text-[#20212B]">
      <div className="mb-6">
        <Logo />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-[#E8E6E1] bg-white p-7 shadow-[0_20px_50px_-25px_rgba(32,33,43,0.1)] sm:p-9">
        <div className="mb-8">
          <div className="mb-3 inline-flex rounded-full border border-[#5B4BDB]/20 bg-[#5B4BDB]/10 px-3 py-1 text-xs font-semibold text-[#5B4BDB]">
            WELCOME BACK
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#20212B]">
            Sign in to CampusConnect
          </h1>
          <p className="mt-2 text-sm text-[#71717A]">
            Enter your campus credentials to access your dashboard.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-[#DC4545]/20 bg-rose-50 px-4 py-3 text-sm text-[#DC4545]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#20212B] uppercase tracking-wider">
              Campus Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 text-sm text-[#20212B] outline-none transition focus:border-[#5B4BDB] focus:bg-white focus:ring-2 focus:ring-[#5B4BDB]/20"
              placeholder="student@university.edu"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#20212B] uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative mt-1.5">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 pr-11 text-sm text-[#20212B] outline-none transition focus:border-[#5B4BDB] focus:bg-white focus:ring-2 focus:ring-[#5B4BDB]/20"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#71717A] hover:text-[#20212B] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 rounded-xl bg-[#5B4BDB] font-semibold text-white hover:bg-[#4938C4] transition shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#71717A]">
          New to CampusConnect?{' '}
          <Link href="/signup" className="font-semibold text-[#5B4BDB] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
          <Loader2 className="size-6 animate-spin text-[#5B4BDB]" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
