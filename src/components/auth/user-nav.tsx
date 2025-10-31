'use client';

import { useState, useMemo } from 'react';
import {
  getAuth,
} from 'firebase/auth';
import { useUser, useFirebaseApp, useFirestore, useDoc } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthDialog } from './auth-dialog';
import Link from 'next/link';
import {
  CreditCard,
  LogOut,
  PlusCircle,
  Settings,
  User as UserIcon,
  Loader2,
  Upload,
  LayoutDashboard
} from 'lucide-react';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';


export function UserNav() {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const userRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<User>(userRef);

  const handleLogout = async () => {
    await auth.signOut();
  };
  
  if (userLoading || profileLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
              <AvatarFallback>
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            {userProfile?.role === 'creator' && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload Music</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
             <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button onClick={() => setIsAuthDialogOpen(true)}>Login</Button>
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </>
  );
}
