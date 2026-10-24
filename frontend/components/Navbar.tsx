'use client'

import Link from 'next/link'
import { Sparkles, LogOut, LayoutDashboard, Calendar, PlusCircle, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
      <div className="grid size-9 place-items-center rounded-xl bg-[#5B4BDB] text-white shadow-md shadow-[#5B4BDB]/25">
        <Sparkles className="size-5" />
      </div>
      <span className="text-lg font-bold tracking-tight text-[#20212B]">
        Campus<span className="text-[#5B4BDB]">Connect</span>
      </span>
    </Link>
  )
}

export function Navbar() {
  const { user, logout } = useAuth()

  const dashboardHref = user
    ? user.role === 'ORGANIZER'
      ? '/organizer/dashboard'
      : '/participant/dashboard'
    : '/signin'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E6E1] bg-[#FAF9F6]/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#71717A]">
            <Link href="/#events" className="hover:text-[#20212B] transition-colors">
              Discover Events
            </Link>
            <Link href="/#categories" className="hover:text-[#20212B] transition-colors">
              Categories
            </Link>
            <Link href="/#how-it-works" className="hover:text-[#20212B] transition-colors">
              How It Works
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href={dashboardHref}>
                <Button variant="outline" className="border-[#E8E6E1] hover:bg-white text-xs sm:text-sm font-medium">
                  <LayoutDashboard className="size-4 mr-1.5 text-[#5B4BDB]" />
                  {user.role === 'ORGANIZER' ? 'Organizer Dashboard' : 'Student Dashboard'}
                </Button>
              </Link>
              {user.role === 'ORGANIZER' && (
                <Link href="/organizer/dashboard?create=true" className="hidden sm:inline-flex">
                  <Button className="bg-[#5B4BDB] hover:bg-[#4938C4] text-white text-xs sm:text-sm">
                    <PlusCircle className="size-4 mr-1.5" />
                    Host Event
                  </Button>
                </Link>
              )}
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#E8E6E1]">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-[#20212B]">{user.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#5B4BDB]">
                    {user.role}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-[#71717A] hover:text-[#DC4545] hover:bg-rose-50"
                title="Log out"
              >
                <LogOut className="size-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" className="text-[#20212B] hover:text-[#5B4BDB] font-medium text-sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#5B4BDB] hover:bg-[#4938C4] text-white font-medium text-sm rounded-xl px-4 shadow-sm shadow-[#5B4BDB]/20">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
