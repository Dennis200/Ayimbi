'use client';
import { UserNav } from '@/components/auth/user-nav';
import { usePathname } from 'next/navigation';

type HeaderProps = {
    title: string;
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  // Don't render header on profile page as it has its own
  if (pathname.startsWith('/profile/')) {
    return null;
  }
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b">
      <div className="container flex h-14 items-center">
        <div className="flex-1">
          <h1 className="font-bold text-xl">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
