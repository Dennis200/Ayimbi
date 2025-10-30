
import Link from 'next/link';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/home" className={cn("flex items-center space-x-2", className)}>
      <Music className="h-6 w-6 text-primary" />
      <span className="font-bold text-xl">Ayimbi</span>
    </Link>
  );
}
