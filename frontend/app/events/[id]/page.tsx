'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2,
  Ticket,
  Shield,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api, type CampusEvent } from '@/lib/api'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [event, setEvent] = useState<CampusEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchEventData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.events.getById(id)
      setEvent(data.event)

      // If user is a logged-in participant, check if they are registered
      if (user && user.role === 'PARTICIPANT') {
        try {
          const myRegs = await api.registrations.getMyRegistrations()
          const registered = myRegs.registrations.some(
            (r) =>
              r.status === 'REGISTERED' &&
              (typeof r.event === 'object' && r.event ? r.event._id === id : String(r.event) === id)
          )
          setIsRegistered(registered)
        } catch {
          // Non-blocking
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Event not found or unavailable.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    fetchEventData()
  }, [fetchEventData])

  const handleRegister = async () => {
    if (!user) {
      router.push(`/signin?redirect=/events/${id}`)
      return
    }
    if (user.role !== 'PARTICIPANT') {
      setFeedback({ type: 'error', message: 'Only participant accounts can register for campus events.' })
      return
    }

    setActionBusy(true)
    setFeedback(null)
    try {
      const result = await api.events.register(id)
      setIsRegistered(true)
      setEvent((currentEvent) =>
        currentEvent
          ? {
              ...currentEvent,
              activeRegistrations: result.capacity.registered,
              registrationCount: result.capacity.registered,
              availableCapacity: result.capacity.remaining,
            }
          : currentEvent,
      )
      setFeedback({ type: 'success', message: 'Your seat has been reserved successfully!' })
      await fetchEventData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setActionBusy(false)
    }
  }

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return
    setActionBusy(true)
    setFeedback(null)
    try {
      const result = await api.events.cancelRegistration(id)
      setIsRegistered(false)
      setEvent((currentEvent) =>
        currentEvent
          ? {
              ...currentEvent,
              activeRegistrations: result.capacity.registered,
              registrationCount: result.capacity.registered,
              availableCapacity: result.capacity.remaining,
            }
          : currentEvent,
      )
      setFeedback({ type: 'success', message: 'Your registration has been cancelled.' })
      await fetchEventData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed.'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setActionBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <Navbar />
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#5B4BDB]" />
          <p className="mt-3 text-sm text-[#71717A]">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <AlertCircle className="mx-auto size-12 text-[#DC4545]" />
          <h2 className="mt-4 text-xl font-bold text-[#20212B]">Event Not Found</h2>
          <p className="mt-2 text-sm text-[#71717A]">{error || 'This event may have been unlisted or removed.'}</p>
          <Link href="/">
            <Button variant="outline" className="mt-6">
              <ArrowLeft className="mr-2 size-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const regCount = event.activeRegistrations ?? event.registrationCount ?? 0
  const isFull = regCount >= event.capacity
  const deadlinePassed = new Date(event.registrationDeadline) < new Date()
  const percent = Math.min(100, Math.round((regCount / event.capacity) * 100))
  const isOrganizerOwner =
    user &&
    user.role === 'ORGANIZER' &&
    ((typeof event.organizer === 'object' && event.organizer && event.organizer.id === user.id) ||
      (typeof event.organizer === 'string' && event.organizer === user.id))

  const organizerName =
    typeof event.organizer === 'object' && event.organizer
      ? event.organizer.name
      : 'Campus Department'

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#20212B]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#71717A] hover:text-[#20212B] transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-sm font-medium shadow-sm ${
              feedback.type === 'success'
                ? 'border border-[#16845B]/20 bg-emerald-50 text-[#16845B]'
                : 'border border-[#DC4545]/20 bg-rose-50 text-[#DC4545]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="size-5 shrink-0" />
              ) : (
                <AlertCircle className="size-5 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Banner */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-3xl border border-[#E8E6E1] bg-gradient-to-br from-[#5B4BDB]/20 via-[#FAF9F6] to-[#FF795B]/20 shadow-sm">
              {event.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <span className="text-4xl sm:text-5xl font-black text-[#5B4BDB]/30 tracking-widest uppercase">
                    {event.category}
                  </span>
                </div>
              )}
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-lg bg-white/95 px-3 py-1 text-xs font-bold tracking-wider text-[#5B4BDB] shadow-sm backdrop-blur-sm">
                  {event.category}
                </span>
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-sm ${
                    event.status === 'PUBLISHED'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-500/90 text-white'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="rounded-3xl border border-[#E8E6E1] bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#71717A] mb-2">
                <Shield className="size-4 text-[#5B4BDB]" />
                <span>Organized by {organizerName}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20212B] tracking-tight leading-tight">
                {event.title}
              </h1>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-[#E8E6E1] py-5">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#5B4BDB]/10 text-[#5B4BDB] shrink-0">
                    <CalendarDays className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Date & Time</p>
                    <p className="text-sm font-bold text-[#20212B] mt-0.5">
                      {new Date(event.startDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-[#71717A]">
                      {new Date(event.startDate).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(event.endDate).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#5B4BDB]/10 text-[#5B4BDB] shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Location / Venue</p>
                    <p className="text-sm font-bold text-[#20212B] mt-0.5">{event.venue}</p>
                    <p className="text-xs text-[#71717A]">Campus CampusConnect Hub</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-base font-bold text-[#20212B] mb-3">About this Event</h3>
                <p className="text-sm text-[#71717A] leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Action / Registration Card (Right col) */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">Event Access</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16845B]">
                  <CheckCircle2 className="size-3.5" /> Free Campus Event
                </span>
              </div>

              {/* Capacity Progress */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#71717A]">Registration Capacity</span>
                  <span className="text-[#20212B]">
                    {regCount} / {event.capacity} Filled
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-[#5B4BDB] rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#71717A]">
                  {isFull ? (
                    <span className="font-semibold text-[#DC4545]">All seats have been reserved.</span>
                  ) : (
                    <span>{Math.max(event.capacity - regCount, 0)} spots remaining.</span>
                  )}
                </p>
              </div>

              {/* Deadline */}
              <div className="mt-4 rounded-xl bg-[#FAF9F6] p-3 text-xs text-[#71717A] flex items-center gap-2">
                <Clock className="size-4 text-[#FF795B] shrink-0" />
                <span>
                  Register by{' '}
                  <strong className="text-[#20212B]">
                    {new Date(event.registrationDeadline).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
              </div>

              {/* Registration CTA button */}
              <div className="mt-6">
                {isOrganizerOwner ? (
                  <Link href="/organizer/dashboard">
                    <Button className="w-full bg-[#5B4BDB] hover:bg-[#4938C4] text-white font-semibold rounded-xl">
                      Manage in Organizer Dashboard
                    </Button>
                  </Link>
                ) : isRegistered ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-3 text-sm font-bold text-[#16845B]">
                      <CheckCircle2 className="size-4" /> You are registered!
                    </div>
                    <Button
                      variant="outline"
                      disabled={actionBusy}
                      onClick={handleCancelRegistration}
                      className="w-full border-[#DC4545]/30 text-[#DC4545] hover:bg-rose-50 hover:border-[#DC4545] text-xs font-semibold"
                    >
                      {actionBusy ? <Loader2 className="size-3 animate-spin mr-1" /> : <XCircle className="size-3 mr-1" />}
                      Cancel Registration
                    </Button>
                  </div>
                ) : isFull ? (
                  <Button disabled className="w-full bg-slate-200 text-slate-500 cursor-not-allowed rounded-xl font-semibold">
                    Fully Booked
                  </Button>
                ) : deadlinePassed ? (
                  <Button disabled className="w-full bg-slate-200 text-slate-500 cursor-not-allowed rounded-xl font-semibold">
                    Registration Closed
                  </Button>
                ) : (
                  <Button
                    disabled={actionBusy}
                    onClick={handleRegister}
                    className="w-full bg-[#5B4BDB] hover:bg-[#4938C4] text-white font-bold rounded-xl shadow-md shadow-[#5B4BDB]/20"
                  >
                    {actionBusy ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Reserving seat...
                      </>
                    ) : (
                      <>
                        <Ticket className="mr-2 size-4" />
                        {user ? 'Register for Event' : 'Sign in to Register'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
