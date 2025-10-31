
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function ProfileRedirectPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to the dynamic profile page for the current user
        router.replace(`/profile/${user.uid}`);
      } else {
        // If not logged in, maybe redirect to home or a login page
        router.replace('/home');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Loading profile...</p>
    </div>
  );
}
