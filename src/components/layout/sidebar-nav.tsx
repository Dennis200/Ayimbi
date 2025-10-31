
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, User, Music, Users, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../logo';
import { Button } from '../ui/button';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/creators', label: 'Creators', icon: Users },
  { href: '/library', label: 'Your Library', icon: Library },
];

const secondaryNavItems = [
    { href: '/playlists', label: 'Playlists', icon: ListMusic },
];

export function SidebarNav() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/profile/')) {
    return null;
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:pt-5 lg:pb-4 lg:bg-background">
      <div className="px-6">
        <Logo />
      </div>
      <div className="mt-6 h-0 flex-1 overflow-y-auto">
        <nav className="space-y-1 px-2">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
          {navItems.map((item) => (
            <Button
              key={item.label}
              asChild
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className="w-full justify-start text-base"
            >
              <Link href={item.href}>
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <nav className="mt-4 space-y-1 px-2">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Library</p>
             {secondaryNavItems.map((item) => (
            <Button
              key={item.label}
              asChild
              variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
              className="w-full justify-start text-base"
            >
              <Link href={item.href}>
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
      <div className="px-2">
        <Button
          asChild
          variant={pathname.startsWith('/profile') ? 'secondary' : 'ghost'}
          className="w-full justify-start text-base"
        >
          <Link href="/profile">
            <User className="mr-3 h-5 w-5" />
            Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}
