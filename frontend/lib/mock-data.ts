'use client'

export type User = { id: string; name: string; email: string; role: 'student' }
export type CampusEvent = {
  id: string
  title: string
  category: string
  date: string
  venue: string
  capacity: number
  registeredCount: number
  image: string
  color: string
  icon: string
}
export type Registration = {
  id: string
  eventId: string
  userId: string
  registeredAt: string
  status: 'registered' | 'cancelled'
}

export const currentUser: User = { id: 'user_1', name: 'Divya', email: 'student@reva.edu.in', role: 'student' }

export const seedEvents: CampusEvent[] = [
  { id: 'ai-summit', title: 'AI & Innovation Summit', category: 'TECHNOLOGY', date: 'Oct 26 · 10:00 AM', venue: 'Innovation Hub', capacity: 240, registeredCount: 184, image: '', color: 'from-violet-600 to-indigo-700', icon: 'AI' },
  { id: 'hackathon', title: 'Campus Hackathon 2026', category: 'COMPETITION', date: 'Nov 02 · 9:00 AM', venue: 'Engineering Block', capacity: 350, registeredCount: 296, image: '', color: 'from-fuchsia-600 to-purple-800', icon: 'CH' },
  { id: 'design-workshop', title: 'Design Thinking Workshop', category: 'WORKSHOP', date: 'Nov 08 · 2:00 PM', venue: 'Design Studio 2', capacity: 60, registeredCount: 42, image: '', color: 'from-indigo-600 to-blue-800', icon: 'DT' },
  { id: 'fireside-chat', title: 'Founders Fireside Chat', category: 'ENTREPRENEURSHIP', date: 'Nov 12 · 5:30 PM', venue: 'Main Auditorium', capacity: 180, registeredCount: 128, image: '', color: 'from-amber-500 to-orange-700', icon: 'FC' },
]

const EVENTS_KEY = 'campusconnect-events-v2'
const REGISTRATIONS_KEY = 'campusconnect-registrations-v2'
export const STORE_EVENT = 'campusconnect-store-updated'

export function readStore() {
  if (typeof window === 'undefined') return { events: seedEvents, registrations: [] as Registration[] }
  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || 'null') as CampusEvent[] | null
    const registrations = JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || 'null') as Registration[] | null
    return { events: events?.length ? events : seedEvents, registrations: registrations || [] }
  } catch { return { events: seedEvents, registrations: [] as Registration[] } }
}

function writeStore(events: CampusEvent[], registrations: Registration[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations))
  window.dispatchEvent(new CustomEvent(STORE_EVENT))
}

export function registerForEvent(eventId: string) {
  const store = readStore()
  const event = store.events.find((item) => item.id === eventId)
  const alreadyRegistered = store.registrations.some((item) => item.eventId === eventId && item.userId === currentUser.id && item.status === 'registered')
  if (!event || alreadyRegistered || event.registeredCount >= event.capacity) return { ok: false, reason: alreadyRegistered ? 'duplicate' : 'full' as const }
  const registration: Registration = { id: `registration_${Date.now()}`, eventId, userId: currentUser.id, registeredAt: new Date().toISOString(), status: 'registered' }
  writeStore(store.events.map((item) => item.id === eventId ? { ...item, registeredCount: item.registeredCount + 1 } : item), [...store.registrations, registration])
  return { ok: true, event }
}

export function cancelRegistration(eventId: string) {
  const store = readStore()
  const active = store.registrations.find((item) => item.eventId === eventId && item.userId === currentUser.id && item.status === 'registered')
  if (!active) return false
  writeStore(store.events.map((item) => item.id === eventId ? { ...item, registeredCount: Math.max(0, item.registeredCount - 1) } : item), store.registrations.map((item) => item.id === active.id ? { ...item, status: 'cancelled' } : item))
  return true
}
