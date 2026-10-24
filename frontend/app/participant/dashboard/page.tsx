'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  MapPin,
  Users,
  Search,
  LogOut,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarCheck,
  Ticket,
  ChevronRight,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api, type CampusEvent, type MyRegistrationRecord } from '@/lib/api'
import { Logo } from '@/components/Navbar'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  'ALL',
  'Technology',
  'Workshop',
  'Cultural',
  'Sports',
  'Entrepreneurship',
  'Competition',
]

export default function ParticipantDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()

  const [events, setEvents] = useState<CampusEvent[]>([])
  const [registrations, setRegistrations] = useState<MyRegistrationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'events' | 'registrations'>('events')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/signin?redirect=/participant/dashboard')
      } else if (user.role !== 'PARTICIPANT') {
        router.replace('/organizer/dashboard')
      }
    }
  }, [user, authLoading, router])

  // Load data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [eventsRes, regsRes] = await Promise.all([
        api.events.getAll({ limit: 100 }),
        api.registrations.getMyRegistrations({ limit: 100 }),
      ])
      setEvents(eventsRes.events || [])
      setRegistrations(regsRes.registrations || [])
    } catch (err: unknown) {
      console.error('Failed to load student dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user && user.role === 'PARTICIPANT') {
      fetchData()
    }
  }, [user, fetchData])

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Map registered event IDs
  const activeRegisteredEventIds = useMemo(() => {
    return new Set(
      registrations
        .filter((r) => r.status === 'REGISTERED')
        .map((r) => (typeof r.event === 'object' && r.event ? r.event._id : String(r.event)))
    )
  }, [registrations])

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        category === 'ALL' || e.category.toLowerCase() === category.toLowerCase()
      return matchesSearch && matchesCategory
    })
  }, [events, search, category])

  // Handlers for register & cancel
  const handleRegister = async (eventId: string, title: string) => {
    setActionBusyId(eventId)
    setFeedback(null)
    try {
      const result = await api.events.register(eventId)
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventId
            ? {
                ...event,
                activeRegistrations: result.capacity.registered,
                availableCapacity: result.capacity.remaining,
              }
            : event,
        ),
      )
      setFeedback({ type: 'success', message: `Successfully registered for "${title}"!` })
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setActionBusyId(null)
    }
  }

  const handleCancel = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${title}"?`)) {
      return
    }
    setActionBusyId(eventId)
    setFeedback(null)
    try {
      const result = await api.events.cancelRegistration(eventId)
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventId
            ? {
                ...event,
                activeRegistrations: result.capacity.registered,
                availableCapacity: result.capacity.remaining,
              }
            : event,
        ),
      )
      setFeedback({ type: 'success', message: `Registration for "${title}" has been cancelled.` })
      await fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed.'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setActionBusyId(null)
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="size-8 animate-spin text-[#5B4BDB]" />
      </div>
    )
  }

  const upcomingCount = events.filter((e) => new Date(e.startDate) > new Date()).length
  const activeRegsCount = activeRegisteredEventIds.size

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#20212B]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E8E6E1] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden h-5 w-px bg-[#E8E6E1] sm:block" />
            <span className="hidden text-sm font-semibold text-[#5B4BDB] sm:inline-block">
              Student Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#20212B]">{user?.name}</p>
              <p className="text-[11px] text-[#71717A]">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="border-[#E8E6E1] text-[#71717A] hover:bg-rose-50 hover:text-[#DC4545]"
            >
              <LogOut className="size-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-sm font-medium shadow-sm transition-all ${
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

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5B4BDB]/20 bg-[#5B4BDB]/10 px-3 py-1 text-xs font-semibold text-[#5B4BDB]">
            <Sparkles className="size-3.5" /> Campus Opportunities
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#20212B]">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-[#71717A]">
            Discover workshops, competitions, and sessions happening across campus.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#71717A]">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Events</span>
              <CalendarDays className="size-5 text-[#5B4BDB]" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[#20212B]">{events.length}</div>
            <p className="mt-1 text-xs text-[#71717A]">Published across all departments</p>
          </div>

          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#71717A]">
              <span className="text-xs font-semibold uppercase tracking-wider">My Registrations</span>
              <Ticket className="size-5 text-[#16845B]" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[#20212B]">{activeRegsCount}</div>
            <p className="mt-1 text-xs text-[#71717A]">Active seats reserved</p>
          </div>

          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#71717A]">
              <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Events</span>
              <Clock className="size-5 text-[#FF795B]" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[#20212B]">{upcomingCount}</div>
            <p className="mt-1 text-xs text-[#71717A]">Scheduled for future dates</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex border-b border-[#E8E6E1]">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'events'
                ? 'border-[#5B4BDB] text-[#5B4BDB]'
                : 'border-transparent text-[#71717A] hover:text-[#20212B]'
            }`}
          >
            <CalendarDays className="size-4" />
            Browse Events ({filteredEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === 'registrations'
                ? 'border-[#5B4BDB] text-[#5B4BDB]'
                : 'border-transparent text-[#71717A] hover:text-[#20212B]'
            }`}
          >
            <CalendarCheck className="size-4" />
            My Registrations ({activeRegsCount})
          </button>
        </div>

        {/* Tab 1: Browse Events */}
        {activeTab === 'events' && (
          <div>
            {/* Search & Filter Bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 size-4 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search events by title, description, or venue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white pl-10 pr-4 text-sm text-[#20212B] outline-none transition focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/20"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      category === cat
                        ? 'bg-[#5B4BDB] text-white shadow-sm'
                        : 'bg-white border border-[#E8E6E1] text-[#71717A] hover:bg-slate-50 hover:text-[#20212B]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Events List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-[#5B4BDB]" />
                <p className="mt-3 text-sm text-[#71717A]">Loading campus events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E8E6E1] bg-white p-12 text-center">
                <CalendarDays className="mx-auto size-12 text-[#71717A]/40" />
                <h3 className="mt-4 text-base font-bold text-[#20212B]">No events found</h3>
                <p className="mt-1 text-sm text-[#71717A]">
                  {search || category !== 'ALL'
                    ? 'Try adjusting your search criteria or category filter.'
                    : 'No campus events are currently published. Check back soon!'}
                </p>
                {(search || category !== 'ALL') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setCategory('ALL')
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => {
                  const isRegistered = activeRegisteredEventIds.has(event.id)
                  const regCount = event.activeRegistrations ?? event.registrationCount ?? 0
                  const isFull = regCount >= event.capacity
                  const deadlinePassed = new Date(event.registrationDeadline) < new Date()
                  const isBusy = actionBusyId === event.id
                  const organizerName =
                    typeof event.organizer === 'object' && event.organizer
                      ? event.organizer.name
                      : 'Campus Organizer'

                  return (
                    <div
                      key={event.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4BDB]/40 hover:shadow-[0_16px_36px_-12px_rgba(32,33,43,0.12)]"
                    >
                      {/* Top banner / image */}
                      <div className="relative h-44 w-full bg-gradient-to-br from-[#5B4BDB]/15 to-[#FF795B]/15 overflow-hidden">
                        {event.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-6 text-center">
                            <span className="text-3xl font-extrabold text-[#5B4BDB]/40 tracking-wider">
                              {event.category.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wider text-[#5B4BDB] shadow-sm backdrop-blur-sm">
                          {event.category}
                        </span>
                        {isRegistered && (
                          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-[#16845B] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                            <CheckCircle2 className="size-3.5" /> Registered
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <p className="text-xs font-semibold text-[#71717A] mb-1">By {organizerName}</p>
                          <h3 className="text-lg font-bold text-[#20212B] line-clamp-1 group-hover:text-[#5B4BDB] transition-colors">
                            {event.title}
                          </h3>
                          <p className="mt-2 text-xs text-[#71717A] line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>

                          <div className="mt-4 space-y-2 text-xs text-[#71717A]">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="size-3.5 text-[#5B4BDB] shrink-0" />
                              <span>{new Date(event.startDate).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3.5 text-[#5B4BDB] shrink-0" />
                              <span className="line-clamp-1">{event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="size-3.5 text-[#5B4BDB] shrink-0" />
                              <span>
                                {regCount} / {event.capacity} seats filled ({Math.max(event.capacity - regCount, 0)} spots left)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card actions */}
                        <div className="mt-5 pt-4 border-t border-[#E8E6E1] flex items-center justify-between gap-2">
                          <Link href={`/events/${event.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#5B4BDB] hover:bg-[#5B4BDB]/10 px-2.5">
                              Details <ArrowRight className="size-3 ml-1" />
                            </Button>
                          </Link>

                          {isRegistered ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleCancel(event.id, event.title)}
                              className="text-xs border-[#DC4545]/30 text-[#DC4545] hover:bg-rose-50 hover:border-[#DC4545]"
                            >
                              {isBusy ? <Loader2 className="size-3 animate-spin mr-1" /> : <XCircle className="size-3 mr-1" />}
                              Cancel Seat
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={isFull || deadlinePassed || isBusy}
                              onClick={() => handleRegister(event.id, event.title)}
                              className={`text-xs font-semibold ${
                                isFull
                                  ? 'bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed'
                                  : deadlinePassed
                                  ? 'bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed'
                                  : 'bg-[#5B4BDB] text-white hover:bg-[#4938C4]'
                              }`}
                            >
                              {isBusy ? (
                                <Loader2 className="size-3 animate-spin mr-1" />
                              ) : isFull ? (
                                'Fully Booked'
                              ) : deadlinePassed ? (
                                'Closed'
                              ) : (
                                'Register Now'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Registrations */}
        {activeTab === 'registrations' && (
          <div>
            {registrations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E8E6E1] bg-white p-12 text-center">
                <Ticket className="mx-auto size-12 text-[#71717A]/40" />
                <h3 className="mt-4 text-base font-bold text-[#20212B]">No registrations yet</h3>
                <p className="mt-1 text-sm text-[#71717A]">
                  You have not registered for any events yet. Explore events to secure your seat!
                </p>
                <Button
                  onClick={() => setActiveTab('events')}
                  className="mt-5 bg-[#5B4BDB] text-white hover:bg-[#4938C4]"
                >
                  Browse Campus Events
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => {
                  const ev = reg.event
                  if (!ev) return null
                  const isCancelled = reg.status === 'CANCELLED'
                  const isBusy = actionBusyId === ev._id

                  return (
                    <div
                      key={reg._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm transition-all hover:border-[#5B4BDB]/30 gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:grid size-12 shrink-0 place-items-center rounded-xl bg-[#5B4BDB]/10 text-[#5B4BDB]">
                          <CalendarCheck className="size-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B4BDB] bg-[#5B4BDB]/10 px-2 py-0.5 rounded">
                              {ev.category}
                            </span>
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                isCancelled
                                  ? 'bg-rose-100 text-[#DC4545]'
                                  : 'bg-emerald-100 text-[#16845B]'
                              }`}
                            >
                              {reg.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#20212B]">{ev.title}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#71717A]">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-3.5 text-[#5B4BDB]" />
                              {new Date(ev.startDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5 text-[#5B4BDB]" />
                              {ev.venue}
                            </span>
                            <span className="text-slate-400">
                              Registered on {new Date(reg.registeredAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <Link href={`/events/${ev._id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Event
                          </Button>
                        </Link>
                        {!isCancelled && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleCancel(ev._id, ev.title)}
                            className="border-[#DC4545]/30 text-[#DC4545] hover:bg-rose-50 hover:border-[#DC4545] text-xs"
                          >
                            {isBusy ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                            Cancel Registration
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
