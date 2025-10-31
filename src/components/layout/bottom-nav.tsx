'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, User, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/upload', label: 'Upload', icon: Plus, isCentral: true },
  { href: '/creators', label: 'Creators', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-20 bg-background/95 backdrop-blur-sm border-t">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map((item) => {
          if (item.isCentral) {
            return (
              <div key={item.label} className="flex justify-center items-center">
                <Button asChild size="lg" className="rounded-full w-14 h-14 bg-purple-600 hover:bg-purple-700 shadow-lg -translate-y-4">
                  <Link href={item.href}>
                    <item.icon className="w-8 h-8" />
                  </Link>
                </Button>
              </div>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-secondary group',
                pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
