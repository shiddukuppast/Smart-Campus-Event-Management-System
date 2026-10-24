'use client'

import { useState, useEffect, Suspense, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, UserCheck, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Logo } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import type { Role } from '@/lib/api'

function SignUpForm() {
  const router = useRouter()
  const { user, register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('PARTICIPANT')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (user.role === 'ORGANIZER') {
        router.replace('/organizer/dashboard')
      } else {
        router.replace('/participant/dashboard')
      }
    }
  }, [user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      const newUser = await register(name.trim(), email.trim(), password, role)
      if (newUser.role === 'ORGANIZER') {
        router.push('/organizer/dashboard')
      } else {
        router.push('/participant/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check your details.'
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

      <div className="w-full max-w-lg rounded-3xl border border-[#E8E6E1] bg-white p-7 shadow-[0_20px_50px_-25px_rgba(32,33,43,0.1)] sm:p-9">
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-full border border-[#16845B]/20 bg-[#16845B]/10 px-3 py-1 text-xs font-semibold text-[#16845B]">
            JOIN CAMPUSCONNECT
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#20212B]">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#71717A]">
            Select your campus role and register to access events and tools.
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
          {/* Role selector */}
          <div>
            <label className="text-xs font-semibold text-[#20212B] uppercase tracking-wider block mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('PARTICIPANT')}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  role === 'PARTICIPANT'
                    ? 'border-[#5B4BDB] bg-[#5B4BDB]/5 ring-2 ring-[#5B4BDB]/20'
                    : 'border-[#E8E6E1] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className={`size-4 ${role === 'PARTICIPANT' ? 'text-[#5B4BDB]' : 'text-[#71717A]'}`} />
                  <span className="font-semibold text-sm text-[#20212B]">Participant</span>
                </div>
                <p className="text-xs text-[#71717A]">
                  Discover events, register seats, and attend campus activities.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('ORGANIZER')}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  role === 'ORGANIZER'
                    ? 'border-[#5B4BDB] bg-[#5B4BDB]/5 ring-2 ring-[#5B4BDB]/20'
                    : 'border-[#E8E6E1] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className={`size-4 ${role === 'ORGANIZER' ? 'text-[#5B4BDB]' : 'text-[#71717A]'}`} />
                  <span className="font-semibold text-sm text-[#20212B]">Organizer</span>
                </div>
                <p className="text-xs text-[#71717A]">
                  Create campus events, manage capacities, and track attendees.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#20212B] uppercase tracking-wider">
              Full Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 text-sm text-[#20212B] outline-none transition focus:border-[#5B4BDB] focus:bg-white focus:ring-2 focus:ring-[#5B4BDB]/20"
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
            />
          </div>

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
              placeholder="you@university.edu"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#20212B] uppercase tracking-wider">
              Password (min 8 characters)
            </label>
            <div className="relative mt-1.5">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 pr-11 text-sm text-[#20212B] outline-none transition focus:border-[#5B4BDB] focus:bg-white focus:ring-2 focus:ring-[#5B4BDB]/20"
                placeholder="At least 8 characters"
                autoComplete="new-password"
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
                Creating account...
              </>
            ) : (
              <>
                Create {role === 'ORGANIZER' ? 'Organizer' : 'Participant'} Account
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#71717A]">
          Already have an account?{' '}
          <Link href="/signin" className="font-semibold text-[#5B4BDB] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
          <Loader2 className="size-6 animate-spin text-[#5B4BDB]" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  )
}
