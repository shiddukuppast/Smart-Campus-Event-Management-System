'use client'

import { useState, useEffect, useCallback, Suspense, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  BarChart3,
  Clock,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api, type CampusEvent, type OrganizerAnalytics, type ParticipantRecord } from '@/lib/api'
import { Logo } from '@/components/Navbar'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  'Technology',
  'Workshop',
  'Cultural',
  'Sports',
  'Entrepreneurship',
  'Competition',
]

interface EventFormData {
  title: string
  description: string
  category: string
  venue: string
  startDate: string
  endDate: string
  registrationDeadline: string
  capacity: number
  imageUrl: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
}

const defaultFormData: EventFormData = {
  title: '',
  description: '',
  category: 'Technology',
  venue: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  capacity: 50,
  imageUrl: '',
  status: 'PUBLISHED',
}

function OrganizerDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openCreateParam = searchParams.get('create')
  const { user, loading: authLoading, logout } = useAuth()

  const [events, setEvents] = useState<CampusEvent[]>([])
  const [analytics, setAnalytics] = useState<OrganizerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventFormData>(defaultFormData)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Participants modal
  const [participantsModalEvent, setParticipantsModalEvent] = useState<CampusEvent | null>(null)
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)

  // Delete modal
  const [deletingEvent, setDeletingEvent] = useState<CampusEvent | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/signin?redirect=/organizer/dashboard')
      } else if (user.role !== 'ORGANIZER') {
        router.replace('/participant/dashboard')
      }
    }
  }, [user, authLoading, router])

  // Open modal if url param ?create=true
  useEffect(() => {
    if (openCreateParam === 'true') {
      setIsModalOpen(true)
      setEditingEventId(null)
      setFormData(defaultFormData)
    }
  }, [openCreateParam])

  // Clear feedback alert
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Fetch events
  const loadOrganizerEvents = useCallback(async () => {
    try {
      setLoading(true)
      const [eventsRes, analyticsRes] = await Promise.all([
        api.events.getMyEvents(),
        api.analytics.getOrganizer(),
      ])
      setEvents(eventsRes.events || [])
      setAnalytics(analyticsRes)
    } catch (err: unknown) {
      console.error('Failed to load organizer events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user && user.role === 'ORGANIZER') {
      loadOrganizerEvents()
    }
  }, [user, loadOrganizerEvents])

  // Open create modal
  const openCreateModal = () => {
    setEditingEventId(null)
    setFormData(defaultFormData)
    setFormError('')
    setIsModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (event: CampusEvent) => {
    setEditingEventId(event.id)
    setFormError('')
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      venue: event.venue,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      registrationDeadline: new Date(event.registrationDeadline).toISOString().slice(0, 16),
      capacity: event.capacity,
      imageUrl: event.imageUrl || '',
      status: event.status,
    })
    setIsModalOpen(true)
  }

  // Handle create or update submit
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const deadline = new Date(formData.registrationDeadline)

    if (end <= start) {
      setFormError('End date must be later than start date.')
      return
    }
    if (deadline > start) {
      setFormError('Registration deadline must be on or before start date.')
      return
    }
    if (formData.capacity < 1) {
      setFormError('Capacity must be at least 1.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        venue: formData.venue.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        registrationDeadline: deadline.toISOString(),
        capacity: Number(formData.capacity),
        imageUrl: formData.imageUrl.trim() || undefined,
        status: formData.status,
      }

      if (editingEventId) {
        await api.events.update(editingEventId, payload)
        setFeedback({ type: 'success', message: `Event "${payload.title}" updated successfully.` })
      } else {
        await api.events.create(payload)
        setFeedback({ type: 'success', message: `Event "${payload.title}" created successfully!` })
      }

      setIsModalOpen(false)
      await loadOrganizerEvents()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed. Please verify the form inputs.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Open participants modal
  const openParticipantsModal = async (event: CampusEvent) => {
    setParticipantsModalEvent(event)
    setParticipants([])
    setLoadingParticipants(true)
    try {
      const res = await api.events.getParticipants(event.id)
      setParticipants(res.participants || [])
    } catch (err: unknown) {
      console.error('Failed to load participants:', err)
    } finally {
      setLoadingParticipants(false)
    }
  }

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return
    setDeleteBusy(true)
    try {
      await api.events.delete(deletingEvent.id)
      setFeedback({ type: 'success', message: `Event "${deletingEvent.title}" deleted.` })
      setDeletingEvent(null)
      await loadOrganizerEvents()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete event.'
      setFeedback({ type: 'error', message: msg })
    } finally {
      setDeleteBusy(false)
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="size-8 animate-spin text-[#5B4BDB]" />
      </div>
    )
  }

  const totalEvents = analytics?.totalEvents ?? events.length
  const publishedEvents = analytics?.publishedEvents ?? events.filter((e) => e.status === 'PUBLISHED').length
  const totalRegistrations =
    analytics?.totalActiveRegistrations ??
    events.reduce((sum, e) => sum + (e.activeRegistrations ?? e.registrationCount ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#20212B]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E8E6E1] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden h-5 w-px bg-[#E8E6E1] sm:block" />
            <span className="hidden text-sm font-semibold text-[#5B4BDB] sm:inline-block">
              Organizer Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={openCreateModal}
              className="bg-[#5B4BDB] hover:bg-[#4938C4] text-white text-xs sm:text-sm font-semibold rounded-xl"
            >
              <Plus className="size-4 mr-1.5" />
              Create Event
            </Button>
            <div className="text-right hidden sm:block pl-2 border-l border-[#E8E6E1]">
              <p className="text-xs font-bold text-[#20212B]">{user?.name}</p>
              <p className="text-[11px] text-[#71717A]">Organizer</p>
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
        {/* Feedback Alert */}
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B4BDB]/20 bg-[#5B4BDB]/10 px-3 py-1 text-xs font-semibold text-[#5B4BDB]">
              <Sparkles className="size-3.5" /> Event Management
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#20212B]">
              Organizer Workspace
            </h1>
            <p className="mt-1 text-sm text-[#71717A]">
              Oversee campus events, publish schedules, and track registrations.
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="self-start sm:self-auto bg-[#5B4BDB] hover:bg-[#4938C4] text-white font-semibold rounded-xl"
          >
            <Plus className="size-4 mr-2" />
            Host New Event
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#71717A]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
              <Layers className="size-5 text-[#5B4BDB]" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[#20212B]">{totalEvents}</div>
            <p className="mt-1 text-xs text-[#71717A]">Created under your account</p>
          </div>

          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#71717A]">
              <span className="text-xs font-semibold uppercase tracking-wider">Published Events</span>
              <CheckCircle2 className="size-5 text-[#16845B]" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[#20212B]">{publishedEvents}</div>
            <p className="mt-1 text-xs text-[#71717A]">Visible on campus feed</p>
          </div>

          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-[#71717A]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Registrations</span>
              <Users className="size-5 text-[#FF795B]" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-[#20212B]">{totalRegistrations}</div>
            <p className="mt-1 text-xs text-[#71717A]">Students registered across all events</p>
          </div>
        </div>

        {/* My Events Section */}
        <div className="rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#20212B]">My Events</h2>
              <p className="text-xs text-[#71717A]">Manage and monitor all events hosted by you.</p>
            </div>
            <span className="text-xs font-semibold text-[#71717A] bg-[#FAF9F6] px-3 py-1.5 rounded-xl border border-[#E8E6E1]">
              {events.length} {events.length === 1 ? 'Event' : 'Events'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-[#5B4BDB]" />
              <p className="mt-3 text-sm text-[#71717A]">Loading your events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E8E6E1] bg-[#FAF9F6] p-12 text-center">
              <CalendarDays className="mx-auto size-12 text-[#71717A]/40" />
              <h3 className="mt-4 text-base font-bold text-[#20212B]">No events created yet</h3>
              <p className="mt-1 text-sm text-[#71717A]">
                Host your first campus workshop, competition, or seminar today.
              </p>
              <Button
                onClick={openCreateModal}
                className="mt-5 bg-[#5B4BDB] text-white hover:bg-[#4938C4]"
              >
                <Plus className="size-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E6E1] text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                    <th className="pb-3 pr-4">Event</th>
                    <th className="pb-3 px-4">Category</th>
                    <th className="pb-3 px-4">Date & Time</th>
                    <th className="pb-3 px-4">Venue</th>
                    <th className="pb-3 px-4">Registrations</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E1] text-sm">
                  {events.map((event) => {
                    const regCount = event.activeRegistrations ?? event.registrationCount ?? 0
                    const percent = Math.min(100, Math.round((regCount / event.capacity) * 100))

                    return (
                      <tr key={event.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-[#20212B] hover:text-[#5B4BDB]">
                            <Link href={`/events/${event.id}`}>{event.title}</Link>
                          </div>
                          <div className="text-xs text-[#71717A] line-clamp-1 max-w-xs">
                            {event.description}
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="rounded-md bg-[#5B4BDB]/10 px-2 py-0.5 text-xs font-semibold text-[#5B4BDB]">
                            {event.category}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-[#71717A]">
                          <div>{new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div>{new Date(event.startDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>

                        <td className="py-4 px-4 text-xs text-[#71717A] max-w-[140px] truncate">
                          {event.venue}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#20212B]">
                              {regCount} / {event.capacity}
                            </span>
                            <span className="text-[10px] text-[#71717A]">({percent}%)</span>
                          </div>
                          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-[#5B4BDB] rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              event.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-[#16845B]'
                                : event.status === 'DRAFT'
                                ? 'bg-amber-100 text-[#D97706]'
                                : 'bg-rose-100 text-[#DC4545]'
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>

                        <td className="py-4 pl-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openParticipantsModal(event)}
                              className="h-8 px-2 text-xs text-[#71717A] hover:text-[#5B4BDB]"
                              title="View registered participants"
                            >
                              <Users className="size-3.5 mr-1" />
                              Participants
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(event)}
                              className="h-8 px-2 text-xs text-[#71717A] hover:text-[#20212B]"
                              title="Edit event"
                            >
                              <Edit3 className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingEvent(event)}
                              className="h-8 px-2 text-xs border-rose-200 text-[#DC4545] hover:bg-rose-50"
                              title="Delete event"
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CREATE / EDIT EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1]">
              <h3 className="text-xl font-bold text-[#20212B]">
                {editingEventId ? 'Edit Event' : 'Create New Campus Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#71717A] hover:text-[#20212B] p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-[#DC4545]/20 bg-rose-50 p-3 text-sm text-[#DC4545]"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                  Event Title *
                </label>
                <input
                  required
                  type="text"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. NextGen AI Summit 2026"
                  className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 text-sm text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white focus:ring-2 focus:ring-[#5B4BDB]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={5000}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the topics, speakers, prerequisites, and what attendees will learn..."
                  className="mt-1 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] p-3 text-sm text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white focus:ring-2 focus:ring-[#5B4BDB]/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 text-sm text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                    Venue *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={200}
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Auditorium 1 / Innovation Lab"
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 text-sm text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                    Start Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 text-xs text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                    End Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 text-xs text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                    Registration Deadline *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) =>
                      setFormData({ ...formData, registrationDeadline: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 text-xs text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                    Maximum Capacity *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={10000}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 text-sm text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'CANCELLED',
                      })
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 text-sm text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                  >
                    <option value="PUBLISHED">PUBLISHED (Visible to students)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#20212B]">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3.5 text-sm text-[#20212B] outline-none focus:border-[#5B4BDB] focus:bg-white"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#E8E6E1]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#5B4BDB] hover:bg-[#4938C4] text-white font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingEventId ? (
                    'Save Changes'
                  ) : (
                    'Publish Event'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTICIPANTS MODAL */}
      {participantsModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1]">
              <div>
                <h3 className="text-lg font-bold text-[#20212B]">Registered Participants</h3>
                <p className="text-xs text-[#71717A] mt-0.5">{participantsModalEvent.title}</p>
              </div>
              <button
                onClick={() => setParticipantsModalEvent(null)}
                className="text-[#71717A] hover:text-[#20212B] p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto">
              {loadingParticipants ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-[#5B4BDB]" />
                  <p className="mt-2 text-xs text-[#71717A]">Loading attendee list...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#71717A]">
                  No attendees have registered for this event yet.
                </div>
              ) : (
                <div className="divide-y divide-[#E8E6E1]">
                  {participants.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#20212B]">{p.name}</p>
                        <p className="text-xs text-[#71717A]">{p.email}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            p.status === 'REGISTERED'
                              ? 'bg-emerald-100 text-[#16845B]'
                              : 'bg-rose-100 text-[#DC4545]'
                          }`}
                        >
                          {p.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(p.registrationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8E6E1] text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParticipantsModalEvent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-[#DC4545]">
              <div className="grid size-10 place-items-center rounded-xl bg-rose-100">
                <Trash2 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-[#20212B]">Delete Event?</h3>
            </div>
            <p className="mt-3 text-sm text-[#71717A] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#20212B]">{deletingEvent.title}</strong>? All registered participant records for this event will also be removed.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                disabled={deleteBusy}
                onClick={() => setDeletingEvent(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={deleteBusy}
                onClick={handleDeleteConfirm}
                className="bg-[#DC4545] hover:bg-rose-700 text-white font-semibold"
              >
                {deleteBusy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete Event'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrganizerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
          <Loader2 className="size-8 animate-spin text-[#5B4BDB]" />
        </div>
      }
    >
      <OrganizerDashboardContent />
    </Suspense>
  )
}
