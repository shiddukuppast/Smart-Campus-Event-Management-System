'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Users,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api, type CampusEvent } from '@/lib/api'
import { Navbar, Logo } from '@/components/Navbar'
import { Button } from '@/components/ui/button'

const CATEGORIES = [
  { name: 'Technology', desc: 'AI, coding, hackathons, robotics', color: 'bg-violet-100 text-violet-700' },
  { name: 'Workshops', desc: 'Hands-on skill building & masterclasses', color: 'bg-blue-100 text-blue-700' },
  { name: 'Cultural', desc: 'Music, theater, art, campus fest', color: 'bg-pink-100 text-pink-700' },
  { name: 'Sports', desc: 'Tournaments, leagues, fitness challenges', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Entrepreneurship', desc: 'Startup pitches, founders talks, VC panels', color: 'bg-amber-100 text-amber-700' },
  { name: 'Competitions', desc: 'Case studies, debate, design sprints', color: 'bg-indigo-100 text-indigo-700' },
]

export default function LandingPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await api.events.getAll({ limit: 6, sort: 'recently-created' })
        setEvents(res.events || [])
      } catch (err) {
        console.error('Failed to load featured events:', err)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  const exploreHref = user
    ? user.role === 'ORGANIZER'
      ? '/organizer/dashboard'
      : '/participant/dashboard'
    : '/participant/dashboard'

  const hostHref = user
    ? user.role === 'ORGANIZER'
      ? '/organizer/dashboard?create=true'
      : '/signup'
    : '/signup'

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#20212B]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5B4BDB]/20 bg-[#5B4BDB]/10 px-3.5 py-1.5 text-xs font-semibold text-[#5B4BDB]">
                <Sparkles className="size-3.5" />
                Smart Campus Event Platform
              </div>

              <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-[#20212B] leading-[1.08]">
                Your Campus. <br />
                <span className="text-[#5B4BDB]">Your Community.</span> <br />
                Your Next Big Moment.
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#71717A]">
                Discover workshops, competitions, conferences, cultural events, and opportunities
                happening across your campus. Find your people, explore your interests, and never miss an
                important event.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={exploreHref}>
                  <Button className="h-12 rounded-xl bg-[#5B4BDB] px-6 text-sm font-semibold text-white shadow-md shadow-[#5B4BDB]/25 hover:bg-[#4938C4] transition">
                    Explore Events
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>

                <Link href={hostHref}>
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-[#E8E6E1] bg-white px-6 text-sm font-semibold text-[#20212B] hover:bg-slate-50 transition"
                  >
                    Host an Event
                  </Button>
                </Link>
              </div>

              {/* Highlights */}
              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-[#E8E6E1] pt-6 text-left">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#20212B]">
                    <CheckCircle2 className="size-4 text-[#16845B]" />
                    <span>Discover</span>
                  </div>
                  <p className="mt-1 text-xs text-[#71717A]">Campus opportunities</p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#20212B]">
                    <Zap className="size-4 text-[#FF795B]" />
                    <span>Instant</span>
                  </div>
                  <p className="mt-1 text-xs text-[#71717A]">Register in seconds</p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#20212B]">
                    <Award className="size-4 text-[#5B4BDB]" />
                    <span>Verified</span>
                  </div>
                  <p className="mt-1 text-xs text-[#71717A]">Official department events</p>
                </div>
              </div>
            </div>

            {/* Right Column / Hero Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1]">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[#20212B]">Live Campus Feed</span>
                  </div>
                  <span className="text-xs text-[#71717A]">Updated in real-time</span>
                </div>

                {/* Sample visual event card */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] p-4 transition hover:border-[#5B4BDB]/40">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-[#5B4BDB]/10 px-2 py-0.5 text-[11px] font-bold text-[#5B4BDB]">
                      TECHNOLOGY
                    </span>
                    <span className="text-[11px] font-semibold text-[#16845B]">Open Registration</span>
                  </div>
                  <h4 className="mt-2 text-base font-bold text-[#20212B]">AI & Innovation Summit 2026</h4>
                  <p className="mt-1 text-xs text-[#71717A]">
                    Keynotes from campus faculty and industry leaders in machine learning.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#71717A]">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-[#5B4BDB]" /> Main Auditorium
                    </span>
                    <span className="font-semibold text-[#20212B]">92% Booked</span>
                  </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] p-4 transition hover:border-[#5B4BDB]/40">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-[#FF795B]/10 px-2 py-0.5 text-[11px] font-bold text-[#FF795B]">
                      WORKSHOP
                    </span>
                    <span className="text-[11px] font-semibold text-[#16845B]">Limited Seats</span>
                  </div>
                  <h4 className="mt-2 text-base font-bold text-[#20212B]">Design Thinking for Founders</h4>
                  <p className="mt-1 text-xs text-[#71717A]">
                    Hands-on prototyping and UX strategy session for student teams.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#71717A]">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5 text-[#5B4BDB]" /> Next Thursday
                    </span>
                    <span className="font-semibold text-[#20212B]">Free for Students</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section id="events" className="border-t border-[#E8E6E1] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#5B4BDB]">Explore Campus</div>
              <h2 className="mt-1 text-3xl font-extrabold text-[#20212B]">Featured Events</h2>
              <p className="mt-1 text-sm text-[#71717A]">
                Upcoming opportunities curated for students and faculty.
              </p>
            </div>
            <Link href="/participant/dashboard" className="mt-4 sm:mt-0">
              <Button variant="outline" size="sm" className="font-semibold text-xs border-[#E8E6E1]">
                View All Events <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E8E6E1] bg-[#FAF9F6] p-12 text-center">
              <CalendarDays className="mx-auto size-12 text-[#71717A]/40" />
              <h3 className="mt-4 text-base font-bold text-[#20212B]">Ready for new campus events</h3>
              <p className="mt-1 text-sm text-[#71717A]">
                Organizers are preparing upcoming events. Sign in to host or register!
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/signup">
                  <Button className="bg-[#5B4BDB] text-white hover:bg-[#4938C4]">Create Account</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const regCount = event.activeRegistrations ?? event.registrationCount ?? 0
                return (
                  <div
                    key={event.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white transition hover:-translate-y-1 hover:border-[#5B4BDB]/40 hover:shadow-lg"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-md bg-[#5B4BDB]/10 px-2.5 py-0.5 text-xs font-bold text-[#5B4BDB]">
                          {event.category}
                        </span>
                        <span className="text-xs font-semibold text-[#71717A]">
                          {regCount} / {event.capacity} seats
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#20212B] group-hover:text-[#5B4BDB] transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="mt-2 text-xs text-[#71717A] line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs text-[#71717A]">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="size-3.5 text-[#5B4BDB]" />
                          <span>{new Date(event.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-[#5B4BDB]" />
                          <span>{event.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#E8E6E1] p-4 bg-[#FAF9F6]">
                      <Link href={`/events/${event.id}`}>
                        <Button className="w-full bg-white hover:bg-slate-50 border border-[#E8E6E1] text-[#20212B] text-xs font-semibold">
                          View Details & Register
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5B4BDB]">Categories</div>
            <h2 className="mt-2 text-3xl font-extrabold text-[#20212B]">Explore by Interest</h2>
            <p className="mt-2 text-sm text-[#71717A]">
              Filter through diverse campus happenings that match your goals and passions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/participant/dashboard`}
                className="group rounded-2xl border border-[#E8E6E1] bg-white p-5 transition hover:border-[#5B4BDB] hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-xl px-3 py-1 text-xs font-bold ${cat.color}`}>
                    {cat.name}
                  </span>
                  <ChevronRight className="size-4 text-[#71717A] group-hover:text-[#5B4BDB] transition-transform group-hover:translate-x-1" />
                </div>
                <h4 className="mt-3 text-base font-bold text-[#20212B]">{cat.name}</h4>
                <p className="mt-1 text-xs text-[#71717A]">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="border-t border-[#E8E6E1] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5B4BDB]">Workflow</div>
            <h2 className="mt-2 text-3xl font-extrabold text-[#20212B]">How CampusConnect Works</h2>
            <p className="mt-2 text-sm text-[#71717A]">
              A seamless, three-step journey from discovery to attendance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-3xl border border-[#E8E6E1] bg-[#FAF9F6] p-6 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#5B4BDB] text-white font-extrabold text-lg shadow-md shadow-[#5B4BDB]/25">
                1
              </div>
              <h3 className="mt-4 text-base font-bold text-[#20212B]">Discover an Event</h3>
              <p className="mt-2 text-xs text-[#71717A] leading-relaxed">
                Browse real-time listings of upcoming workshops, competitions, and seminars published by campus clubs.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E8E6E1] bg-[#FAF9F6] p-6 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#FF795B] text-white font-extrabold text-lg shadow-md shadow-[#FF795B]/25">
                2
              </div>
              <h3 className="mt-4 text-base font-bold text-[#20212B]">Register for Your Place</h3>
              <p className="mt-2 text-xs text-[#71717A] leading-relaxed">
                Reserve your ticket with atomic capacity verification and instant booking confirmation.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E8E6E1] bg-[#FAF9F6] p-6 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#16845B] text-white font-extrabold text-lg shadow-md shadow-[#16845B]/25">
                3
              </div>
              <h3 className="mt-4 text-base font-bold text-[#20212B]">Attend & Participate</h3>
              <p className="mt-2 text-xs text-[#71717A] leading-relaxed">
                Show up at the venue, connect with peers, learn new skills, and level up your university journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Organizer Call to Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#5B4BDB] to-[#4938C4] text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-sm mb-4">
            <ShieldCheck className="size-4" /> For Campus Clubs & Faculty
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Host Something Great on Campus?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-white/80 leading-relaxed">
            Create an organizer account to schedule events, manage capacities, avoid overbooking,
            and monitor attendee lists seamlessly.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button className="h-12 rounded-xl bg-white text-[#5B4BDB] hover:bg-slate-100 font-bold px-6 shadow-lg">
                Start Organizing
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E6E1] bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo />

          <p className="text-xs text-[#71717A]">
            © 2026 CampusConnect. Smart Campus Event Management System.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium text-[#71717A]">
            <Link href="/signin" className="hover:text-[#20212B]">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-[#20212B]">
              Sign Up
            </Link>
            <Link href="/participant/dashboard" className="hover:text-[#20212B]">
              Discover
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
