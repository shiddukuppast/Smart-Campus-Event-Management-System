export type Role = 'ORGANIZER' | 'PARTICIPANT'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface CampusEvent {
  id: string
  title: string
  description: string
  category: string
  venue: string
  startDate: string
  endDate: string
  registrationDeadline: string
  capacity: number
  activeRegistrations: number
  registrationCount?: number
  availableCapacity: number
  imageUrl?: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  organizer?: { id: string; name: string } | string
  createdAt?: string
  updatedAt?: string
}

export interface CapacitySnapshot {
  registered: number
  total: number
  remaining: number
}

export interface ParticipantRecord {
  id: string
  name: string
  email: string
  registrationDate: string
  status: 'REGISTERED' | 'CANCELLED'
}

export interface OrganizerAnalytics {
  totalEvents: number
  publishedEvents: number
  cancelledEvents: number
  totalActiveRegistrations: number
  totalAvailableSeats: number
  events: Array<{
    id: string
    title: string
    capacity: number
    registrationCount: number
    capacityUtilization: number
  }>
  upcomingEvents: CampusEvent[]
  recentRegistrations: Array<{
    _id: string
    event: { _id: string; title: string }
    participant: { _id: string; name: string }
    registeredAt: string
  }>
}

export interface MyRegistrationRecord {
  _id: string
  event: {
    _id: string
    title: string
    category: string
    venue: string
    startDate: string
    endDate: string
    imageUrl?: string
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  }
  status: 'REGISTERED' | 'CANCELLED'
  registeredAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    details?: Record<string, string[]>
  }
}

// Configurable API base URL, defaults to relative /api which next.config rewrites to backend
const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : (process.env.BACKEND_URL || 'http://127.0.0.1:3001')

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // essential for sc_auth HTTP-only cookie
    cache: 'no-store',
  })

  let json: ApiResponse<T>
  try {
    json = await response.json()
  } catch {
    throw new Error(`Failed to parse response from server (${response.status})`)
  }

  if (!response.ok || !json.success) {
    const message = json.error?.message || `Request failed with status ${response.status}`
    const details = json.error?.details
    if (details) {
      const fieldErrors = Object.entries(details)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join('; ')
      throw new Error(`${message}: ${fieldErrors}`)
    }
    throw new Error(message)
  }

  return json.data as T
}

export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      return request<{ user: User; authenticated: boolean }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
    },
    register: async (data: { name: string; email: string; password: string; role: Role }) => {
      return request<{ user: User; authenticated: boolean }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    me: async () => {
      return request<{ user: User }>('/api/auth/me', {
        method: 'GET',
      })
    },
    logout: async () => {
      return request<{ authenticated: boolean }>('/api/auth/logout', {
        method: 'POST',
      })
    },
  },

  events: {
    getAll: async (params?: {
      search?: string
      category?: string
      startDate?: string
      endDate?: string
      sort?: 'date' | 'recently-created'
      page?: number
      limit?: number
    }) => {
      const searchParams = new URLSearchParams()
      if (params?.search) searchParams.set('search', params.search)
      if (params?.category && params.category !== 'ALL') searchParams.set('category', params.category)
      if (params?.startDate) searchParams.set('startDate', params.startDate)
      if (params?.endDate) searchParams.set('endDate', params.endDate)
      if (params?.sort) searchParams.set('sort', params.sort)
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))

      const queryString = searchParams.toString()
      return request<{
        events: CampusEvent[]
        pagination: { page: number; limit: number; total: number; pages: number }
      }>(`/api/events${queryString ? `?${queryString}` : ''}`)
    },

    getById: async (id: string) => {
      return request<{
        event: CampusEvent
        registrationCount: number
        availableCapacity: number
      }>(`/api/events/${id}`)
    },

    getMyEvents: async () => {
      return request<{ events: CampusEvent[] }>('/api/events/my-events')
    },

    create: async (data: {
      title: string
      description: string
      category: string
      venue: string
      startDate: string
      endDate: string
      registrationDeadline: string
      capacity: number
      imageUrl?: string
      status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
    }) => {
      return request<{ event: CampusEvent }>('/api/events', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    update: async (
      id: string,
      data: Partial<{
        title: string
        description: string
        category: string
        venue: string
        startDate: string
        endDate: string
        registrationDeadline: string
        capacity: number
        imageUrl?: string
        status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
      }>
    ) => {
      return request<{ event: CampusEvent }>(`/api/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },

    delete: async (id: string) => {
      return request<{ deleted: boolean }>(`/api/events/${id}`, {
        method: 'DELETE',
      })
    },

    getParticipants: async (id: string) => {
      return request<{ participants: ParticipantRecord[] }>(`/api/events/${id}/participants`)
    },

    register: async (id: string) => {
      return request<{
        registration: { id: string; event: string; status: string }
        capacity: CapacitySnapshot
      }>(
        `/api/events/${id}/register`,
        { method: 'POST' }
      )
    },

    cancelRegistration: async (id: string) => {
      return request<{
        registration: { id: string; event: string; status: string }
        capacity: CapacitySnapshot
      }>(
        `/api/events/${id}/register`,
        { method: 'DELETE' }
      )
    },
  },

  registrations: {
    getMyRegistrations: async (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', String(params.page))
      if (params?.limit) searchParams.set('limit', String(params.limit))
      const queryString = searchParams.toString()
      return request<{
        registrations: MyRegistrationRecord[]
        pagination: { page: number; limit: number; total: number; pages: number }
      }>(`/api/registrations/my-registrations${queryString ? `?${queryString}` : ''}`)
    },
  },

  analytics: {
    getOrganizer: async () => {
      return request<OrganizerAnalytics>('/api/analytics/organizer')
    },
  },
}
