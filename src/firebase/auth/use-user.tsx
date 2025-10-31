
'use client';
import {useEffect, useState, useMemo} from 'react';
import {getAuth, onAuthStateChanged, type User as AuthUser} from 'firebase/auth';
import {useFirebaseApp, useFirestore} from '@/firebase/provider';
import { useDoc } from '../firestore/use-doc';
import type { User as ProfileType } from '@/lib/types';
import { doc } from 'firebase/firestore';


export interface UseUserResult {
    user: (AuthUser & ProfileType) | null;
    loading: boolean;
}

/**
 * `useUser` is a hook that returns the currently authenticated user with their profile data.
 * It listens for changes in the authentication state and fetches the corresponding Firestore profile.
 * It must be used within a `FirebaseProvider` component.
 *
 * @returns An object containing the combined user (auth + profile) and a loading state.
 * @throws An error if used outside of a `FirebaseProvider`.
 */
export function useUser() {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = useFirestore();

  const [authUser, setAuthUser] = useState<AuthUser | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setAuthUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const userProfileRef = useMemo(() => {
    if (!authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<ProfileType>(userProfileRef);

  const user = useMemo(() => {
    if (!authUser || !userProfile) return null;
    return { ...authUser, ...userProfile };
  }, [authUser, userProfile]);

  return {user, loading: loading || (authUser && isProfileLoading) };
}
